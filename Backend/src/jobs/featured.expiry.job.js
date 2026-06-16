import cron from "node-cron";
import featuredModel from "../modules/featured/featured.model.js";
import listingModel from "../modules/listing/listing.model.js";

import commissionModel from "../modules/managed-sale/commission.model.js";
import paymentModel from "../modules/payment/payment.model.js";

export function startExpiryJobs() {
  // Runs every day at midnight — featured listings
  cron.schedule("0 0 * * *", async () => {
    console.log("[Cron] Running featured expiry job...");

    try {
      // Find all active featured records where endDate has passed
      const expiredFeatured = await featuredModel.find({
        status: "ACTIVE",
        endDate: { $lt: new Date() },
      });

      if (expiredFeatured.length === 0) {
        console.log("[Cron] No expired featured listings found.");
        return;
      }

      const listingIds = expiredFeatured.map((f) => f.listing);

      // Expire all featured records
      await featuredModel.updateMany(
        { _id: { $in: expiredFeatured.map((f) => f._id) } },
        { status: "EXPIRED" }
      );

      // Clear isFeatured on all affected listings
      await listingModel.updateMany(
        { _id: { $in: listingIds } },
        { isFeatured: false }
      );

      console.log(`[Cron] Expired ${expiredFeatured.length} featured listing(s).`);
    } catch (error) {
      console.error("[Cron] Featured expiry job failed:", error.message);
    }
  });

  console.log("[Cron] Featured expiry job scheduled.");

  // Runs every 5 minutes — commission payments
  cron.schedule("*/5 * * * *", async () => {
    try {
      const expiredCommissions = await commissionModel.find({
        status: "PENDING",
        expiresAt: { $lt: new Date() },
      });

      if (expiredCommissions.length === 0) return;

      for (const commission of expiredCommissions) {
        commission.status = "EXPIRED";
        await commission.save();

        if (commission.payment) {
          await paymentModel.findByIdAndUpdate(commission.payment, {
            status: "FAILED",
          });
        }

        console.log(`[Cron] Commission ${commission._id} expired.`);
      }
    } catch (error) {
      console.error("[Cron] Commission expiry job failed:", error.message);
    }
  });

  console.log("[Cron] Commission expiry job scheduled.");
}