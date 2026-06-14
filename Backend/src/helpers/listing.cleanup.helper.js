import inspectionModel from "../modules/inspection/inspection.model.js";
import featuredModel from "../modules/featured/featured.model.js";
import listingModel from "../modules/listing/listing.model.js";

/**
 * Cancels the active inspection for a listing if one exists.
 * 
 *  - if true, cancels even IN_PROGRESS (admin only)
 *  - reason stored on the inspection record
 */
export async function cancelInspectionForListing( listingId, forceCancel = false, cancelReason = "Listing deleted by owner")
{
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
    return { blocked: false, refundRequired: false };
  }

  // Refund only when buyer paid and inspection not yet delivered
  const refundRequired =
    inspection.inspectionBy === "BUYER" &&
    ["PENDING_COORDINATION", "SCHEDULED"].includes(inspection.status);

  inspection.status = "CANCELLED";
  inspection.cancelReason = cancelReason;
  inspection.refundRequired = refundRequired;
  inspection.refundStatus = refundRequired ? "PENDING" : "NOT_REQUIRED";
  await inspection.save();

  return { blocked: false, refundRequired };
}

/**
 * Full cleanup for a listing before deletion/removal.
 * Cancels inspection + closes featured record.
 *  - admin override for IN_PROGRESS
 */
export async function cleanupListingForDeletion( listingId, forceCancel = false,cancelReason = "Listing deleted by owner")
{
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

  // Step 2 — close active featured record if exists
  const activeFeatured = await featuredModel.findOne({
    listing: listingId,
    status: "ACTIVE",
  });

  if (activeFeatured) {
    activeFeatured.status = "REMOVED";
    await activeFeatured.save();
  }

  // Step 3 — clear isFeatured flag on listing
  await listingModel.findByIdAndUpdate(listingId, { isFeatured: false });

  return { blocked: false, refundRequired };
}