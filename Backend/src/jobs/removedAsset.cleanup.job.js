import cron from "node-cron";
import listingModel from "../modules/listing/listing.model.js";
import InspectionReport from "../modules/inspection-report/inspectionReport.model.js";
import { deleteImages } from "../modules/upload/upload.service.js";

// Removed listings keep their Cloudinary assets for this long (so downloaded
// reports keep working visually and accidental removals stay recoverable),
// then the images are purged for good.
const RETENTION_MONTHS = 6;

// Collect every Cloudinary fileId referenced by an inspection report:
// car snapshot gallery, per-item checklist photos, damage-marker photos
// and the report photo gallery.
function collectReportFileIds(report) {
  const ids = [];

  for (const img of report.carSnapshot?.images ?? []) {
    if (img.fileId) ids.push(img.fileId);
  }

  for (const key of Object.keys(report.sections?.toObject?.() ?? report.sections ?? {})) {
    for (const item of report.sections[key]?.items ?? []) {
      for (const photo of item.photos ?? []) {
        if (photo.fileId) ids.push(photo.fileId);
      }
    }
  }

  for (const marker of report.exteriorDamage ?? []) {
    if (marker.fileId) ids.push(marker.fileId);
  }

  for (const photo of report.reportPhotos ?? []) {
    if (photo.fileId) ids.push(photo.fileId);
  }

  return ids;
}

export function startRemovedAssetCleanupJob() {
  // Every day at 02:00
  cron.schedule("0 2 * * *", async () => {
    try {
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - RETENTION_MONTHS);

      const staleListings = await listingModel.find({
        status: "REMOVED",
        removedAt: { $ne: null, $lte: cutoff },
        imagesPurgedAt: null,
      });

      if (staleListings.length === 0) return;

      let purged = 0;

      for (const listing of staleListings) {
        const fileIds = (listing.images || [])
          .map((img) => img.fileId)
          .filter(Boolean);

        // Reports of the removed listing lose their images at the same time
        const reports = await InspectionReport.find({ listing: listing._id });
        for (const report of reports) {
          fileIds.push(...collectReportFileIds(report));
        }

        await deleteImages(fileIds);

        listing.imagesPurgedAt = new Date();
        await listing.save();
        purged++;
      }

      console.log(`[Cron] Purged Cloudinary assets for ${purged} removed listing(s).`);
    } catch (error) {
      console.error("[Cron] Removed-asset cleanup job failed:", error.message);
    }
  });

  console.log("[Cron] Removed-asset cleanup job scheduled.");
}
