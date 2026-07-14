import twilio from "twilio";
import config from "../config/config.js";

// Credentials are validated at startup in config.js, so we can create the
// client unconditionally.
const client = twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);

// Convert a local Pakistani number (03XXXXXXXXX) to E.164 (+923XXXXXXXXX).
// Already-E.164 numbers are returned untouched.
export function toE164(mobileNumber) {
  if (!mobileNumber) return null;
  const trimmed = String(mobileNumber).trim();
  if (trimmed.startsWith("+")) return trimmed;
  if (/^03\d{9}$/.test(trimmed)) return `+92${trimmed.slice(1)}`;
  return trimmed; // let Twilio validate anything else
}

// ── Verify (OTP) ────────────────────────────────────────────────────────────
// Twilio generates, stores, expires and checks the code — we never handle it.

export async function sendOtp(mobileNumber) {
  const to = toE164(mobileNumber);
  await client.verify.v2
    .services(config.TWILIO_VERIFY_SERVICE_SID)
    .verifications.create({ to, channel: "sms" });
  return { sent: true };
}

export async function verifyOtp(mobileNumber, code) {
  const to = toE164(mobileNumber);
  try {
    const check = await client.verify.v2
      .services(config.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({ to, code });
    return check.status === "approved";
  } catch (err) {
    // Twilio deletes a verification once it's approved, expired (10 min) or
    // after 5 wrong attempts — checking again then returns a raw 404
    // ("VerificationCheck was not found"). Treat that as an invalid/expired
    // code instead of leaking the Twilio error to the user.
    if (err.status === 404 || err.code === 20404) {
      return false;
    }
    throw err;
  }
}

// ── Plain SMS (reminders) ───────────────────────────────────────────────────
// Fail-soft: a failed reminder must never crash the caller (e.g. a cron job).

export async function sendSms(mobileNumber, message) {
  try {
    const to = toE164(mobileNumber);
    await client.messages.create({
      from: config.TWILIO_PHONE_NUMBER,
      to,
      body: message,
    });
    return { sent: true };
  } catch (err) {
    console.error(`[SMS] Failed to send to ${mobileNumber}:`, err.message);
    return { sent: false };
  }
}
