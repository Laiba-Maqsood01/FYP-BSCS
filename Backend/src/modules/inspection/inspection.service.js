import inspectionModel from "./inspection.model.js";
import listingModel from "../listing/listing.model.js";
import { ApiError } from "../../utils/apiError.js";

export async function requestInspection(
    listingId,
    userId
) {

    // listing exists?
    const listing = await listingModel.findById(listingId);

    if (!listing) {
        throw new ApiError(404, "Listing not found");
    }

    // only ACTIVE
    if (listing.status !== "ACTIVE") {
        throw new ApiError(
            400,
            "Inspection only allowed for active listings"
        );
    }

    // only GENERAL sale
    if (listing.saleMode !== "GENERAL") {
        throw new ApiError(
            400,
            "Inspection only available for general sale listings"
        );
    }

    // already requested?
    const existingInspection = await inspectionModel.findOne({
        listing: listingId
    });

    if (existingInspection) {
        throw new ApiError(
            400,
            "Inspection already requested"
        );
    }

    const inspection = await inspectionModel.create({
        listing: listingId,
        requestedBy: userId
    });

    // update listing inspection status
    listing.inspectionStatus = "PENDING";

    await listing.save();

    return inspection;
}