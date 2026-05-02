import crypto from "crypto"

export function generateOTP() {
  // generates number from 100000 to 999999 (inclusive-safe range)
  const otp = crypto.randomInt(100000, 1000000);
  return otp.toString();
}

export function getOtpHtml(otp) {
  return `
  <div style="font-family: Arial, sans-serif; background:#f4f4f4; padding:20px;">
    <div style="max-width:500px; margin:auto; background:white; padding:20px; border-radius:10px;">
      
      <h2 style="text-align:center; color:#333;">Verification Code</h2>
      
      <p style="font-size:16px; color:#555;">
        Use the following OTP to complete your verification:
      </p>

      <div style="
        font-size:28px;
        letter-spacing:5px;
        text-align:center;
        font-weight:bold;
        padding:15px;
        background:#f0f0f0;
        border-radius:8px;
        margin:20px 0;
      ">
        ${otp}
      </div>

      <p style="font-size:12px; color:#999; text-align:center;">
        This OTP is valid for a short period. Do not share it with anyone.
      </p>

    </div>
  </div>
  `;
}
