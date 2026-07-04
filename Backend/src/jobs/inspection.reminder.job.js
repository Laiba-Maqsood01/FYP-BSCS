import cron from "node-cron";
import inspectionModel from "../modules/inspection/inspection.model.js";
import { sendSms } from "../services/sms.service.js";

// Start/end of the day that is `daysAhead` days from now (local server time).
function dayWindow(daysAhead) {
  const start = new Date();
  start.setDate(start.getDate() + daysAhead);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

async function sendTomorrowReminders() {
  const { start, end } = dayWindow(1); // tomorrow

  // SCHEDULED inspections happening tomorrow that haven't been reminded for
  // this exact slot yet (reschedules change scheduledDate → they re-qualify).
  const inspections = await inspectionModel
    .find({
      status: "SCHEDULED",
      scheduledDate: { $gte: start, $lte: end },
    })
    .populate("requestedBy", "mobileNumber")
    .populate({ path: "listing", populate: { path: "seller", select: "mobileNumber" } });

  let sent = 0;
  for (const insp of inspections) {
    // Skip if we already reminded for this same scheduledDate
    if (
      insp.reminderSentFor &&
      new Date(insp.reminderSentFor).getTime() === new Date(insp.scheduledDate).getTime()
    ) {
      continue;
    }

    const dateStr = new Date(insp.scheduledDate).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const slot = insp.timeSlot ? ` at ${insp.timeSlot}` : "";
    const where = insp.inspectionAddress ? ` (${insp.inspectionAddress})` : "";

    // Requester always gets a reminder.
    const requesterPhone = insp.requestedBy?.mobileNumber;
    if (requesterPhone) {
      const res = await sendSms(
        requesterPhone,
        `GearTrade: Reminder — your car inspection is scheduled for tomorrow, ${dateStr}${slot}${where}. To reschedule, contact our team.`
      );
      if (res.sent) sent++;
    }

    // Seller also gets a reminder, but only if they're not the requester
    // themselves (i.e. this was a buyer-requested inspection).
    if (insp.inspectionBy === "BUYER") {
      const sellerPhone = insp.listing?.seller?.mobileNumber;
      if (sellerPhone) {
        const res = await sendSms(
          sellerPhone,
          `GearTrade: Reminder — an inspection for your car listing is scheduled for tomorrow, ${dateStr}${slot}. Please have the car available${where}.`
        );
        if (res.sent) sent++;
      }
    }

    // Mark this slot as reminded regardless of individual send outcomes —
    // the "tomorrow" window only occurs once per scheduledDate, so there's
    // no meaningful retry opportunity anyway.
    insp.reminderSentFor = insp.scheduledDate;
    await insp.save();
  }

  return { total: inspections.length, sent };
}

export function startInspectionReminderJob() {
  // Runs every day at 9:00 AM
  cron.schedule("0 9 * * *", async () => {
    console.log("[Cron] Running inspection reminder job...");
    try {
      const { total, sent } = await sendTomorrowReminders();
      console.log(`[Cron] Inspection reminders: ${sent}/${total} sent for tomorrow.`);
    } catch (error) {
      console.error("[Cron] Inspection reminder job failed:", error.message);
    }
  });

  console.log("[Cron] Inspection reminder job scheduled.");
}
