import crypto from "crypto";
import featuredModel from "../featured/featured.model.js";
import paymentModel from "./payment.model.js";

import listingModel from "../listing/listing.model.js";

export async function createSandboxPayment({
    userId,
    listingId,
    featureId,
    amount
}) {

    const transactionId =
        crypto.randomUUID();

    const payment =
        await paymentModel.create({
            user: userId,
            listing: listingId,
            featuredRequest: featureId,
            amount,
            transactionId
        });

    return {
        payment,
        paymentUrl:
            `http://localhost:5173/sandbox-payment/${transactionId}`
    };
}

export async function markSandboxSuccess(
    transactionId
) {

    const payment =
        await paymentModel.findOne({
            transactionId
        });

    if (!payment) {
        throw new ApiError(
            404,
            "Payment not found"
        );
    }

    payment.status = "SUCCESS";

    await payment.save();

    // ACTIVATE FEATURE

    const feature =
        await featuredModel.findById(
            payment.featuredRequest
        );

    feature.status = "ACTIVE";

    const listing = await listingModel.findById(
        payment.listing
    );

    listing.isFeatured = true;

    await listing.save();

    feature.startDate = new Date();

    feature.endDate = new Date(
        Date.now() +
        7 * 24 * 60 * 60 * 1000
    );

    await feature.save();

    return payment;
}