// One-off manual test for the Twilio SMS integration.
// Usage:
//   node src/scripts/test-sms.js send-otp +923001234567
//   node src/scripts/test-sms.js verify-otp +923001234567 123456
//   node src/scripts/test-sms.js sms +923001234567 "Test message from GearTrade"

import { sendOtp, verifyOtp, sendSms } from "../services/sms.service.js";

const [, , action, phone, third] = process.argv;

async function run() {
  if (!action || !phone) {
    console.log("Usage:");
    console.log("  node src/scripts/test-sms.js send-otp <phone>");
    console.log("  node src/scripts/test-sms.js verify-otp <phone> <code>");
    console.log("  node src/scripts/test-sms.js sms <phone> <message>");
    process.exit(1);
  }

  if (action === "send-otp") {
    const res = await sendOtp(phone);
    console.log("OTP send result:", res);
  } else if (action === "verify-otp") {
    if (!third) throw new Error("Missing code argument");
    const ok = await verifyOtp(phone, third);
    console.log("OTP valid:", ok);
  } else if (action === "sms") {
    const res = await sendSms(phone, third || "Test message from GearTrade");
    console.log("SMS send result:", res);
  } else {
    console.log(`Unknown action: ${action}`);
  }
}

run()
  .then(() => process.exit(0))
  .catch(err => {
    console.error("Test failed:", err.message);
    process.exit(1);
  });
