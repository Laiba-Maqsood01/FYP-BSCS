import crypto from "crypto";
import Stripe from "stripe";
import featuredModel from "../featured/featured.model.js";
import paymentModel from "./payment.model.js";

import listingModel from "../listing/listing.model.js";

import inspectionModel from "../inspection/inspection.model.js";

import { ApiError } from "../../utils/apiError.js"

import config from "../../config/config.js"

const stripe = new Stripe(config.STRIPE_SECRET_KEY);


// Void any still-PENDING payment attempts for a reference (e.g. when its
// inspection is cancelled, or an agreement-break fee is settled offline).
// Expiring the live Stripe checkout session closes any tab the user left
// open, so the abandoned page can no longer be paid after the fact.
export async function voidPendingPayments(referenceId) {
  const pending = await paymentModel.find(
    { referenceId, status: "PENDING" },
    { stripeSessionId: 1 }
  );

  for (const p of pending) {
    if (!p.stripeSessionId) continue;
    try {
      const session = await stripe.checkout.sessions.retrieve(p.stripeSessionId);
      if (session.status === "open") {
        await stripe.checkout.sessions.expire(p.stripeSessionId);
      }
    } catch {
      // Session not retrievable (already gone / wrong env) — nothing to close
    }
  }

  await paymentModel.updateMany(
    { referenceId, status: "PENDING" },
    { $set: { status: "FAILED" } }
  );
}

export async function createStripeCheckoutSession(payment, options = {}) {

  const amountInPaisa = Math.round(payment.amount * 100);

  // ── Reuse-if-open: at most ONE live checkout per payment record ────────────
  // Retrying from the Payments page or the listing page must land the user on
  // the SAME Stripe page instead of minting parallel sessions that could each
  // charge the card once.
  if (payment.stripeSessionId) {
    try {
      const existing = await stripe.checkout.sessions.retrieve(payment.stripeSessionId);

      if (existing.status === "open") {
        // Same amount → hand back the live session
        if (existing.amount_total === amountInPaisa) {
          return existing;
        }
        // Amount changed since the session was created (e.g. the user picked a
        // different featured plan) — kill the stale-price session before
        // creating a fresh one so the old tab can't charge the old amount.
        await stripe.checkout.sessions.expire(payment.stripeSessionId);
      }
      // expired / complete → fall through and create a new session
    } catch {
      // Session not retrievable (deleted, wrong env keys, …) — create fresh
    }
  }

  const sessionParams = {
    payment_method_types: ["card"],

    mode: "payment",

    line_items: [
      {
        price_data: {
          currency: "pkr",

          product_data: {
            name: payment.purpose
          },

          unit_amount: amountInPaisa
        },

        quantity: 1
      }
    ],

    metadata: {
      paymentId: payment._id.toString()
    },

    // Checkout links shouldn't live for Stripe's default 24h — 30 minutes
    // (Stripe's minimum) is plenty and shrinks the stale-tab window.
    // Stripe fires checkout.session.expired when it lapses.
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,

    success_url:
      options.successUrl || `${config.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,

    cancel_url:
      options.cancelUrl || `${config.CLIENT_URL}/payment-cancel`
  };

  // Pass customer email so Stripe sends payment receipt + refund notification emails automatically
  if (payment.payerSnapshot?.email) {
    sessionParams.customer_email = payment.payerSnapshot.email;
  }

  const session = await stripe.checkout.sessions.create(sessionParams);

  payment.stripeSessionId = session.id;
  payment.paymentMethod = "STRIPE";

  await payment.save();

  return session;
}

export function constructWebhookEvent(body, signature) {

  return stripe.webhooks.constructEvent(
    body,
    signature,
    config.STRIPE_WEBHOOK_SECRET
  );
}

export async function handleStripeWebhook(event) {

  switch (event.type) {

    case "checkout.session.completed":

      await handleCheckoutSessionCompleted(
        event.data.object
      );

      break;

    case "checkout.session.expired":

      await handleCheckoutSessionExpired(
        event.data.object
      );

      break;

    default:
      console.log(`Ignoring event type: ${event.type}`);
  }
}

// A checkout attempt lapsed (30-min expires_at). The payment record stays
// PENDING — the user still owes and can retry, which will mint a fresh
// session. We only detach the dead session id.
async function handleCheckoutSessionExpired(session) {
  const payment = await paymentModel.findOne({
    stripeSessionId: session.id
  });

  if (!payment || payment.status !== "PENDING") return;

  payment.stripeSessionId = null;
  await payment.save();
}

async function handleCheckoutSessionCompleted(session) {
  const payment = await paymentModel.findOne({
    stripeSessionId: session.id
  });

  if (!payment) {
    console.log("Payment not found for session:", session.id);
    return;
  }

  // Already paid — if this completion came through a DIFFERENT session (two
  // checkout tabs open in a race), the card was charged twice. Refund the
  // duplicate charge automatically instead of silently keeping it.
  if (payment.status === "SUCCESS" || payment.status === "REFUNDED") {
    if (
      session.payment_intent &&
      session.payment_intent !== payment.stripePaymentIntentId
    ) {
      try {
        await stripe.refunds.create({ payment_intent: session.payment_intent });
        console.log(`[Stripe] Refunded duplicate charge for payment ${payment._id}`);
      } catch (err) {
        console.error(`[Stripe] Failed to refund duplicate charge for payment ${payment._id}:`, err.message);
      }
    }
    return;
  }

  payment.status = "SUCCESS";
  payment.stripePaymentIntentId = session.payment_intent;

  await payment.save();

  // Void any other PENDING payments for the same reference (stale retry attempts)
  if (payment.referenceId) {
    await paymentModel.updateMany(
      { referenceId: payment.referenceId, status: "PENDING", _id: { $ne: payment._id } },
      { $set: { status: "FAILED" } }
    );
  }

  // FEATURED FLOW
  if (payment.purpose === "FEATURED") {
    const feature = await featuredModel.findById(payment.referenceId);
    if (!feature) return;

    // The listing may have been sold/removed while the user was on the
    // Stripe page (e.g. admin marked a managed listing sold). Never feature
    // a dead listing — refund the charge instead.
    const featureListing = await listingModel.findById(payment.listing).select("status");
    if (
      feature.status === "REMOVED" ||
      ["SOLD", "REMOVED"].includes(featureListing?.status)
    ) {
      feature.status = "REMOVED";
      await feature.save();
      try {
        await stripe.refunds.create({ payment_intent: session.payment_intent });
        payment.status = "REFUNDED";
        await payment.save();
        console.log(`[Stripe] Refunded featured payment ${payment._id} — listing no longer active`);
      } catch (err) {
        console.error(`[Stripe] Failed to refund featured payment ${payment._id}:`, err.message);
      }
      return;
    }

    feature.status = "ACTIVE";
    feature.startDate = new Date();
    feature.endDate = new Date(
      Date.now() + feature.durationDays * 24 * 60 * 60 * 1000
    );

    await feature.save();

    const listing = await listingModel.findById(payment.listing);
    if (listing) {
      listing.isFeatured = true;
      await listing.save();
    }
  }

  // AGREEMENT BREAK FLOW — owner paid the fee for withdrawing a managed car.
  // (Dynamic import: managed-sale.service statically imports this module.)
  if (payment.purpose === "AGREEMENT_BREAK") {
    const { default: agreementBreakChargeModel } =
      await import("../managed-sale/agreementBreakCharge.model.js");
    const { settleBreakCharge } =
      await import("../managed-sale/managed-sale.service.js");

    const charge = await agreementBreakChargeModel.findById(payment.referenceId);
    if (!charge) return;

    await settleBreakCharge(charge, { paymentId: payment._id });
  }

  // INSPECTION FLOW
  if (
    payment.purpose === "INSPECTION" ||
    payment.purpose === "RE_INSPECTION"
  ) {
    const inspection = await inspectionModel.findById(payment.referenceId);
    if (!inspection) return;

    // The inspection may have been cancelled while the user was on the
    // Stripe page (e.g. admin rejected the listing). Never resurrect it.
    // Inspection fees are non-refundable (see Terms of Service), so the
    // payment stays recorded and no refund is queued.
    if (inspection.status === "CANCELLED") {
      return;
    }

    // Both owner and buyer book the schedule themselves at request time,
    // so a successful payment always moves the inspection to SCHEDULED.
    inspection.status = "SCHEDULED";

    await inspection.save();
  }

}


export async function getMyPayments(
  userId,
  filters = {}
) {
  const query = { user: userId };

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.purpose) {
    query.purpose = filters.purpose;
  }

  return await paymentModel
    .find(query)
    .select(
      "purpose amount currency status transactionId paymentMethod createdAt referenceId listing"
    )
    .populate({
      path: "listing",
      select: "year images",
      populate: [
        { path: "brand", select: "name" },
        { path: "carModel", select: "name" },
      ],
    })
    .sort({ createdAt: -1 });
}

export async function getPaymentById(
  paymentId,
  userId
) {
  const payment = await paymentModel
    .findOne({
      _id: paymentId,
      user: userId
    })
    .populate({
      path: "listing",
      select:
        "brand carModel year price status city images"
    })
    .populate({
      path: "referenceId"
    });

  if (!payment) {
    throw new ApiError(
      404,
      "Payment not found"
    );
  }

  return payment;
}

export async function processStripeRefund(inspectionId) {
  const payment = await paymentModel.findOne({
    referenceId: inspectionId,
    status: "SUCCESS",
  });

  if (!payment) {
    throw new ApiError(404, "No successful payment found for this inspection");
  }

  if (!payment.stripePaymentIntentId) {
    throw new ApiError(400, "No Stripe payment intent found — cannot process refund");
  }

  await stripe.refunds.create({
    payment_intent: payment.stripePaymentIntentId,
  });

  return payment;
}