import inspectionModel from "../modules/inspection/inspection.model.js";
import featuredModel from "../modules/featured/featured.model.js";
import listingModel from "../modules/listing/listing.model.js";
import { voidPendingPayments } from "../modules/payment/payment.service.js";

import { ApiError } from "../utils/apiError.js";

import listingDeletionRequestModel from "../modules/managed-sale/listing-deletion-request.model.js";


/**
 * Cancels the active inspection for a listing if one exists.
 * 
 *  - if true, cancels even IN_PROGRESS (admin only)
 *  - reason stored on the inspection record
 */
export async function cancelInspectionForListing(listingId, forceCancel = false, cancelReason = "Listing deleted by owner") {
  // Find active inspection — any status except CANCELLED and COMPLETED
  const inspection = await inspectionModel.findOne({
    listing: listingId,
    status: {
      $nin: ["CANCELLED", "COMPLETED"],
    },
  });

  // No active inspection — nothing to cancel
  if (!inspection) {
    return { blocked: false, refundRequired: false };
  }

  // IN_PROGRESS — team is on site
  if (inspection.status === "IN_PROGRESS") {
    if (!forceCancel) {
      // User trying to delete — block them
      return { blocked: true, refundRequired: false };
    }
    // Admin force cancelling — no refund, service already started
    inspection.status = "CANCELLED";
    inspection.cancelReason = cancelReason;
    inspection.refundRequired = false;
    inspection.refundStatus = "NOT_REQUIRED";
    await inspection.save();
    await voidPendingPayments(inspection._id);
    return { blocked: false, refundRequired: false };
  }

  // Inspection fees are non-refundable (see Terms of Service) — a cancelled
  // inspection never queues a refund, regardless of who paid.
  inspection.status = "CANCELLED";
  inspection.cancelReason = cancelReason;
  inspection.refundRequired = false;
  inspection.refundStatus = "NOT_REQUIRED";
  await inspection.save();
  await voidPendingPayments(inspection._id);

  return { blocked: false, refundRequired: false };
}

/**
 * Closes any featured record for a listing that no longer needs promotion
 * (sold or removed). ACTIVE features are ended, abandoned PENDING ones are
 * closed and their unpaid payments voided so the seller can't pay to feature
 * a dead listing.
 */
export async function closeFeaturedForListing(listingId) {
  const features = await featuredModel.find({
    listing: listingId,
    status: { $in: ["ACTIVE", "PENDING"] },
  });

  for (const feature of features) {
    feature.status = "REMOVED";
    await feature.save();
    await voidPendingPayments(feature._id);
  }

  await listingModel.findByIdAndUpdate(listingId, { isFeatured: false });
}

/**
 * Full cleanup for a listing before deletion/removal.
 * Cancels inspection + closes featured record.
 *  - admin override for IN_PROGRESS
 */
export async function cleanupListingForDeletion(listingId, forceCancel = false, cancelReason = "Listing deleted by owner") {

  const listing = await listingModel.findById(listingId);

  if (!listing) 
    throw new ApiError(404, "Listing not found");

  // --- Managed listing guards ---
  if (listing.saleMode === "MANAGED") {

    if (listing.status === "ACTIVE" && !forceCancel) {
      // Check if there's already a pending deletion request
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

      throw new ApiError(
        400,
        "This managed listing is currently being handled by our team. Please submit a deletion request."
      );
    }
  }


  // Step 1 — handle inspection
  const { blocked, refundRequired } = await cancelInspectionForListing(
    listingId,
    forceCancel,
    cancelReason
  );

  // If blocked, stop here — don't touch featured
  if (blocked) {
    return { blocked: true, refundRequired: false };
  }

  // Step 2 — close featured records + clear isFeatured flag
  await closeFeaturedForListing(listingId);

  return { blocked: false, refundRequired };
}



