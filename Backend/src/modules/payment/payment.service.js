import crypto from "crypto";
import Stripe from "stripe";
import featuredModel from "../featured/featured.model.js";
import paymentModel from "./payment.model.js";

import listingModel from "../listing/listing.model.js";

import inspectionModel from "../inspection/inspection.model.js";

import commissionModel from "../managed-sale/commission.model.js";

import { ApiError } from "../../utils/apiError.js"

import config from "../../config/config.js"

const stripe = new Stripe(config.STRIPE_SECRET_KEY);


// Void any still-PENDING payment attempts for a reference (e.g. when its
// inspection is cancelled) so the user's payments page stops offering retry.
// Money that still lands through an already-open Stripe session is caught by
// the webhook, which sees the cancelled inspection and queues a refund.
export async function voidPendingPayments(referenceId) {
  await paymentModel.updateMany(
    { referenceId, status: "PENDING" },
    { $set: { status: "FAILED" } }
  );
}

export async function createStripeCheckoutSession(payment, options = {}) {

  const stripe = new Stripe(config.STRIPE_SECRET_KEY);

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

          unit_amount: Math.round(payment.amount * 100)
        },

        quantity: 1
      }
    ],

    metadata: {
      paymentId: payment._id.toString()
    },

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

    default:
      console.log(`Ignoring event type: ${event.type}`);
  }
}

async function handleCheckoutSessionCompleted(session) {
  const payment = await paymentModel.findOne({
    stripeSessionId: session.id
  });

  if (!payment) {
    console.log("Payment not found for session:", session.id);
    return;
  }

  // prevent duplicate processing
  if (payment.status === "SUCCESS") return;

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

  // INSPECTION FLOW
  if (
    payment.purpose === "INSPECTION" ||
    payment.purpose === "RE_INSPECTION"
  ) {
    const inspection = await inspectionModel.findById(payment.referenceId);
    if (!inspection) return;

    // The inspection may have been cancelled while the user was on the
    // Stripe page (e.g. admin rejected the listing). Never resurrect it —
    // the money landed for a dead inspection, so queue a refund instead.
    if (inspection.status === "CANCELLED") {
      inspection.refundRequired = true;
      inspection.refundStatus = "PENDING";
      await inspection.save();
      return;
    }

    // Both owner and buyer book the schedule themselves at request time,
    // so a successful payment always moves the inspection to SCHEDULED.
    inspection.status = "SCHEDULED";

    await inspection.save();
  }

  // COMMISSION FLOW
  if (payment.purpose === "COMMISSION") {
    const commission = await commissionModel.findById(payment.referenceId);
    if (!commission) return;

    // Mark commission as paid
    commission.status = "PAID";
    commission.payment = payment._id;
    await commission.save();

    // Mark listing as SOLD
    const listing = await listingModel.findById(payment.listing);
    if (listing) {
      listing.status = "SOLD";
      await listing.save();
    }
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