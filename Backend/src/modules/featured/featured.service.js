import featuredModel from "./featured.model.js";
import listingModel from "../listing/listing.model.js";
import paymentModel from "../payment/payment.model.js";

import crypto from "crypto";

import { ApiError } from "../../utils/apiError.js";

export async function requestFeaturedListing({
    listingId,
    sellerId,
    plan
}) {

    // 1. Check listing

    const listing =
        await listingModel.findById(listingId);

    if (!listing) {
        throw new ApiError(
            404,
            "Listing not found"
        );
    }

    // 2. Ownership check

    if (
        listing.seller.toString() !==
        sellerId.toString()
    ) {
        throw new ApiError(
            403,
            "Not your listing"
        );
    }

    // 3. Only ACTIVE listings

    if (listing.status !== "ACTIVE") {
        throw new ApiError(
            400,
            "Only active listings can be featured"
        );
    }

    // 4. Prevent duplicate active feature

    const existingFeature =
        await featuredModel.findOne({
            listing: listingId,
            status: {
                $in: ["PENDING", "ACTIVE"]
            }
        });

    if (existingFeature) {
        throw new ApiError(
            400,
            "Listing already has feature request"
        );
    }

    // 5. Pricing

    const pricing = {
        BASIC: 500,
        PREMIUM: 1000,
        TOP: 2000
    };

    const amount = pricing[plan];

    // 6. Create feature request

    const feature =
        await featuredModel.create({
            listing: listingId,
            seller: sellerId,
            plan,
            amount
        });

    // 7. Create payment record

    const transactionId =
        crypto.randomUUID();

    const payment =
        await paymentModel.create({
            user: sellerId,
            listing: listingId,
            featuredRequest: feature._id,
            amount,
            transactionId,
            paymentMethod: "SANDBOX"
        });

    // 8. Return sandbox URL

    const paymentUrl =
        `http://localhost:5173/sandbox-payment/${transactionId}`;

    return {
        feature,
        payment,
        paymentUrl
    };
}