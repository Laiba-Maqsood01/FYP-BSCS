import listingDeletionRequestModel from "./listing-deletion-request.model.js";
import commissionModel from "./commission.model.js";
import listingModel from "../listing/listing.model.js";
import paymentModel from "../payment/payment.model.js";
import { ApiError } from "../../utils/apiError.js";
import { createStripeCheckoutSession } from "../payment/payment.service.js";
import config from "../../config/config.js";
import crypto from "crypto";

// DELETION REQUESTS

export async function submitDeletionRequest(listingId, userId, reason) {
    const listing = await listingModel.findById(listingId);

    if (!listing) throw new ApiError(404, "Listing not found");

    // Only managed listings need deletion requests
    if (listing.saleMode !== "MANAGED") {
        throw new ApiError(
            400,
            "Deletion requests are only for managed listings. You can delete general listings directly."
        );
    }

    // Only owner can submit
    if (listing.seller.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not the owner of this listing");
    }

    // Only ACTIVE managed listings need a deletion request
    if (listing.status !== "ACTIVE") {
        throw new ApiError(
            400,
            `Cannot submit deletion request for a listing with status ${listing.status}`
        );
    }

    // Check if a pending request already exists
    const existingRequest = await listingDeletionRequestModel.findOne({
        listing: listingId,
        status: "PENDING",
    });

    if (existingRequest) {
        throw new ApiError(
            400,
            "A deletion request for this listing is already pending admin approval."
        );
    }

    const request = await listingDeletionRequestModel.create({
        listing: listingId,
        requestedBy: userId,
        reason,
    });

    return request;
}

export async function getMyDeletionRequests(userId) {
    const requests = await listingDeletionRequestModel
        .find({ requestedBy: userId })
        .populate("listing", "title saleMode status")
        .sort({ createdAt: -1 });

    return requests;
}

// COMMISSION

export async function getCommissionDetails(listingId, userId) {
    const listing = await listingModel.findById(listingId);

    if (!listing) throw new ApiError(404, "Listing not found");

    // Only owner can view commission
    if (listing.seller.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not the owner of this listing");
    }

    if (listing.saleMode !== "MANAGED") {
        throw new ApiError(400, "Commission only applies to managed listings");
    }

    const commission = await commissionModel
        .findOne({ listing: listingId, status: { $in: ["PENDING", "EXPIRED"] } })
        .populate("payment", "amount status stripePaymentIntentId");

    if (!commission) {
        throw new ApiError(404, "No pending commission found for this listing");
    }

    return commission;
}

export async function initiateCommissionPayment(commissionId, userId) {
    const commission = await commissionModel
        .findById(commissionId)
        .populate("listing");

    if (!commission) throw new ApiError(404, "Commission not found");

    // Only the seller can pay
    if (commission.seller.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not authorized to pay this commission");
    }

    if (commission.status === "PAID") {
        throw new ApiError(400, "Commission has already been paid");
    }

    if (commission.status === "CANCELLED") {
        throw new ApiError(400, "This commission has been cancelled");
    }

    // Prevents owner from initiating commission
    if (commission.status === "EXPIRED") {
        throw new ApiError(
            400,
            "Commission payment window has expired. Please contact support to reinitiate."
        );
    }

    // Also we have to guard against expiry even if cron hasn't run yet
    if (new Date() > commission.expiresAt) {
        throw new ApiError(
            400,
            "Commission payment window has expired. Please contact support to reinitiate."
        );
    }

    // Create new payment record, Only reaches here if status is PENDING and within time window
    const transactionId = crypto.randomUUID();

    const payment = await paymentModel.create({
        user: userId,
        listing: commission.listing._id,
        purpose: "COMMISSION",
        referenceId: commission._id,
        amount: commission.commissionAmount,
        transactionId,
        status: "PENDING",
        payerSnapshot: {
            userId: commission.seller,
            username: commission.listing?.seller?.username,
            email: commission.listing?.seller?.email,
        },
    });

    // Link payment to commission
    commission.payment = payment._id;
    await commission.save();

    const successUrl = `${config.CLIENT_URL}/payment/success?purpose=COMMISSION&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl  = `${config.CLIENT_URL}/payment/failed?purpose=COMMISSION`;

    const session = await createStripeCheckoutSession(payment, { successUrl, cancelUrl });

    return {
        commission,
        checkoutUrl: session.url,
    };
}