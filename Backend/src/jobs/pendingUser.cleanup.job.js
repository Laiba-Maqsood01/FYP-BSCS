import cron from "node-cron";
import userModel from "../models/user.model.js";
import otpModel from "../models/otp.model.js";

// How long an unverified (PENDING) registration may sit before it's purged.
const MAX_PENDING_AGE_DAYS = 7;

// Deletes registrations that never completed verification, so abandoned
// signups don't permanently squat on a username / email / mobile number.
// Safe to hard-delete: PENDING users can't log in, so they own no sessions,
// listings or payments.
export function startPendingUserCleanupJob() {
  // Every day at 01:00
  cron.schedule("0 1 * * *", async () => {
    try {
      const cutoff = new Date(Date.now() - MAX_PENDING_AGE_DAYS * 24 * 60 * 60 * 1000);

      const staleUsers = await userModel.find(
        {
          accountStatus: "PENDING",
          isDeleted: false,
          createdAt: { $lt: cutoff },
        },
        { _id: 1, email: 1 }
      );

      if (staleUsers.length === 0) return;

      const ids    = staleUsers.map((u) => u._id);
      const emails = staleUsers.map((u) => u.email);

      await otpModel.deleteMany({ $or: [{ user: { $in: ids } }, { email: { $in: emails } }] });
      await userModel.deleteMany({ _id: { $in: ids } });

      console.log(`[Cron] Removed ${staleUsers.length} stale unverified account(s).`);
    } catch (error) {
      console.error("[Cron] Pending-user cleanup job failed:", error.message);
    }
  });

  console.log("[Cron] Pending-user cleanup job scheduled.");
}
