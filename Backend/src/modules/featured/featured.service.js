import featuredModel from "./featured.model.js";
import listingModel from "../listing/listing.model.js";
import paymentModel from "../payment/payment.model.js";

import { createStripeCheckoutSession } from "../payment/payment.service.js";

import crypto from "crypto";

import { ApiError } from "../../utils/apiError.js";

// export async function requestFeaturedListing({
//     listingId,
//     sellerId,
//     plan
// }) {

//     // 1. Check listing

//     const listing =
//         await listingModel.findById(listingId);

//     if (!listing) {
//         throw new ApiError(
//             404,
//             "Listing not found"
//         );
//     }

//     // 2. Ownership check

//     if (
//         listing.seller.toString() !==
//         sellerId.toString()
//     ) {
//         throw new ApiError(
//             403,
//             "Not your listing"
//         );
//     }

//     // 3. Only ACTIVE listings

//     if (listing.status !== "ACTIVE") {
//         throw new ApiError(
//             400,
//             "Only active listings can be featured"
//         );
//     }

//     // 4. Prevent duplicate active feature

//     const existingFeature =
//         await featuredModel.findOne({
//             listing: listingId,
//             status: {
//                 $in: ["PENDING", "ACTIVE"]
//             }
//         });

//     if (existingFeature) {
//         throw new ApiError(
//             400,
//             "Listing already has feature request"
//         );
//     }

//     // 5. Pricing

//     const pricing = {
//         BASIC: 500,
//         PREMIUM: 1000,
//         TOP: 2000
//     };

//     const amount = pricing[plan];

//     // 6. Create feature request

//     const feature =
//         await featuredModel.create({
//             listing: listingId,
//             seller: sellerId,
//             plan,
//             amount
//         });

//     // 7. Create payment record

//     const transactionId =
//         crypto.randomUUID();

//     const payment =
//         await paymentModel.create({
//             user: sellerId,
//             listing: listingId,
//             featuredRequest: feature._id,
//             amount,
//             transactionId,
//             paymentMethod: "SANDBOX"
//         });

//     // 8. Return sandbox URL

//     const paymentUrl =
//         `http://localhost:5173/sandbox-payment/${transactionId}`;

//     return {
//         feature,
//         payment,
//         paymentUrl
//     };
// }

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

    // const existingFeature = await featuredModel.findOne({
    //     listing: listingId,
    //     status: { $in: ["PENDING", "ACTIVE"] }
    // });

    const existingFeature = await featuredModel.findOne({
        listing: listingId,
        status: "ACTIVE",
        endDate: { $gt: new Date() }
    });

    if (existingFeature) {
        throw new ApiError(400, "Listing already has feature request");
    }

    const pricing = {
        BASIC: 500,
        PREMIUM: 1000,
        TOP: 2000
    };

    const amount = pricing[plan];

    const feature = await featuredModel.create({
        listing: listingId,
        seller: sellerId,
        plan,
        amount,
        status: "PENDING"
    });

    return feature;
}

export async function createFeaturedPayment(featureId, userId) {
    const feature = await featuredModel.findById(featureId);

    if (!feature) throw new ApiError(404, "Feature not found");

    // check existing payment check
    const existingPayment =
        await paymentModel.findOne({
            referenceId: featureId,
            status: "PENDING"
        });

    if (existingPayment) {
        throw new ApiError(
            400,
            "Payment already exists for this featured request"
        );
    }

    const transactionId = crypto.randomUUID();

    const payment = await paymentModel.create({
        user: userId,
        listing: feature.listing,
        purpose: "FEATURED",
        referenceId: feature._id,
        amount: feature.amount,
        transactionId,
        status: "PENDING"
    });

    feature.payment = payment._id;
    await feature.save();

    const session = await createStripeCheckoutSession(payment);

    return {
        payment,
        checkoutUrl: session.url
    };
}