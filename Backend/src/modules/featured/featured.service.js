import featuredModel from "./featured.model.js";
import featuredPlanModel from "./featured-plan.model.js";
import listingModel from "../listing/listing.model.js";
import paymentModel from "../payment/payment.model.js";

import userModel from "../../models/user.model.js";


import { createStripeCheckoutSession } from "../payment/payment.service.js";
import config from "../../config/config.js";

import crypto from "crypto";

import { ApiError } from "../../utils/apiError.js";

export async function requestFeaturedListing({
    listingId,
    sellerId,
    plan
}) {
    const listing = await listingModel.findById(listingId);

    if (!listing) throw new ApiError(404, "Listing not found");

    if (listing.seller.toString() !== sellerId.toString()) {
        throw new ApiError(403, "Not your listing");
    }

    if (listing.status !== "ACTIVE") {
        throw new ApiError(400, "Only active listings can be featured");
    }

    const planDoc = await featuredPlanModel.findOne({ name: plan, isActive: true });
    if (!planDoc) throw new ApiError(400, "Invalid or unavailable featured plan");

    const { amount, durationDays } = planDoc;

    // Block if listing is already actively featured
    const activeFeature = await featuredModel.findOne({
        listing: listingId,
        status: "ACTIVE",
        endDate: { $gt: new Date() }
    });

    if (activeFeature) {
        throw new ApiError(400, "This listing is already featured.");
    }

    // Reuse an existing PENDING featured doc (user abandoned a previous payment attempt).
    // If the user picked a different plan this time, update the doc and any pending payment.
    const pendingFeature = await featuredModel.findOne({
        listing: listingId,
        status: "PENDING"
    });

    if (pendingFeature) {
        if (pendingFeature.plan !== plan) {
            pendingFeature.plan         = plan;
            pendingFeature.amount       = amount;
            pendingFeature.durationDays = durationDays;
            await pendingFeature.save();

            // Keep the existing pending payment amount in sync so the Stripe session is correct
            await paymentModel.updateOne(
                { referenceId: pendingFeature._id, status: "PENDING" },
                { $set: { amount } }
            );
        }
        return pendingFeature;
    }

    // No pending doc — create a fresh one
    const feature = await featuredModel.create({
        listing: listingId,
        seller: sellerId,
        plan,
        amount,
        durationDays,
        status: "PENDING"
    });

    return feature;
}

export async function createFeaturedPayment(featureId, userId) {
    const feature = await featuredModel.findById(featureId);

    if (!feature) throw new ApiError(404, "Feature not found");

    const successUrl = `${config.CLIENT_URL}/payment/success?purpose=FEATURED&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl  = `${config.CLIENT_URL}/payment/failed?purpose=FEATURED`;

    // If the feature is already active, this listing is already paid — block retry
    if (feature.status === "ACTIVE") {
        throw new ApiError(400, "This listing is already featured.");
    }

    // If a pending payment already exists, reuse it — just create a new Stripe session
    const existingPayment = await paymentModel.findOne({
        referenceId: featureId,
        status: "PENDING"
    });

    if (existingPayment) {
        const session = await createStripeCheckoutSession(existingPayment, { successUrl, cancelUrl });
        return { payment: existingPayment, checkoutUrl: session.url };
    }

    // First-time payment — create the document
    const user = await userModel.findById(userId).select("username email");
    if (!user) throw new ApiError(404, "User not found");

    const transactionId = crypto.randomUUID();

    const payment = await paymentModel.create({
        user: userId,
        listing: feature.listing,
        purpose: "FEATURED",
        referenceId: feature._id,
        amount: feature.amount,
        transactionId,
        status: "PENDING",
        payerSnapshot: {
            userId: user._id,
            username: user.username,
            email: user.email
        }
    });

    feature.payment = payment._id;
    await feature.save();

    const session = await createStripeCheckoutSession(payment, { successUrl, cancelUrl });

    return {
        payment,
        checkoutUrl: session.url
    };
}
export async function getFeaturedByListing(listingId, sellerId) {
    const feature = await featuredModel
        .findOne({ listing: listingId, seller: sellerId })
        .populate("payment", "amount status createdAt");

    if (!feature) {
        const { ApiError } = await import("../../utils/apiError.js");
        throw new ApiError(404, "No featured record found for this listing");
    }

    return feature;
}
