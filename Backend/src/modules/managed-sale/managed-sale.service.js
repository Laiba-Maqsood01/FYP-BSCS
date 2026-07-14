import listingDeletionRequestModel from "./listing-deletion-request.model.js";
import commissionModel from "./commission.model.js";
import listingModel from "../listing/listing.model.js";
import { ApiError } from "../../utils/apiError.js";

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

    // PENDING (owner changed their mind before activation) and ACTIVE
    // managed listings can request deletion; other statuses can't
    if (!["PENDING", "ACTIVE"].includes(listing.status)) {
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

    // Commissions are settled records now (deducted from the sale proceeds by
    // the GearTrade team) — return the latest one for display.
    const commission = await commissionModel
        .findOne({ listing: listingId })
        .sort({ createdAt: -1 })
        .populate({
            path: "listing",
            select: "year images",
            populate: [
                { path: "brand", select: "name" },
                { path: "carModel", select: "name" },
            ],
        });

    if (!commission) {
        throw new ApiError(404, "No commission record found for this listing");
    }

    return commission;
}

