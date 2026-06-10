import crypto from "crypto";
import Stripe from "stripe";
import featuredModel from "../featured/featured.model.js";
import paymentModel from "./payment.model.js";

import listingModel from "../listing/listing.model.js";

import inspectionModel from "../inspection/inspection.model.js";

import { ApiError } from "../../utils/apiError.js"

import config from "../../config/config.js"

const stripe = new Stripe(config.STRIPE_SECRET_KEY);

export async function markSandboxSuccess(transactionId) {
  const payment = await paymentModel.findOne({ transactionId });

  if (!payment) {
    throw new ApiError(404, "Payment not found");
  }

  // prevents duplicate success processing
  if (payment.status === "SUCCESS") {
    return payment;
  }

  payment.status = "SUCCESS";
  await payment.save();


  // FEATURED PAYMENT
  if (payment.purpose === "FEATURED") {
    const feature = await featuredModel.findById(payment.referenceId);
    if (!feature) throw new ApiError(404, "Feature not found");

    feature.status = "ACTIVE";
    feature.startDate = new Date();
    feature.endDate = new Date(Date.now() + feature.durationDays * 24 * 60 * 60 * 1000);

    await feature.save();

    const listing = await listingModel.findById(payment.listing);
    listing.isFeatured = true;
    await listing.save();
  }

  // INSPECTION PAYMENT
  if (payment.purpose === "INSPECTION" || payment.purpose === "RE_INSPECTION") {
    const inspection = await inspectionModel.findById(payment.referenceId);
    if (!inspection) throw new ApiError(404, "Inspection not found");

    if (inspection.inspectionBy === "OWNER") {
      inspection.status = "SCHEDULED";
    } else {
      inspection.status = "PENDING_COORDINATION";
    }
    await inspection.save();

    // const listing = await listingModel.findById(payment.listing);
    // listing.inspectionStatus = "PENDING";
    // await listing.save();
  }

  return payment;
}

export async function createStripeCheckoutSession(payment) {

  const stripe = new Stripe(config.STRIPE_SECRET_KEY);

  const session =
    await stripe.checkout.sessions.create({

      payment_method_types: ["card"],

      mode: "payment",

      line_items: [
        {
          price_data: {
            currency: "pkr",

            product_data: {
              name: payment.purpose
            },

            unit_amount: payment.amount * 100
          },

          quantity: 1
        }
      ],

      metadata: {
        paymentId: payment._id.toString()
      },

      success_url:
        `${config.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,

      cancel_url:
        `${config.CLIENT_URL}/payment-cancel`
    });

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

    inspection.status =
      inspection.inspectionBy === "OWNER"
        ? "SCHEDULED"
        : "PENDING_COORDINATION";

    await inspection.save();
  }
}

