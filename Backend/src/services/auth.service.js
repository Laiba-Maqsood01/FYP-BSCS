import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import userModel from "../models/user.model.js";
import sessionModel from "../models/session.model.js";
import listingModel from "../modules/listing/listing.model.js";
import config from "../config/config.js";
import otpModel from "../models/otp.model.js";
import { generateOTP, getOtpHtml } from "../utils/utils.js";
import { ApiError } from "../utils/apiError.js"
import { sendEmail } from "../services/email.service.js";
import { generateAccessToken, generateRefreshToken } from "../utils/token.utils.js";
import { ACCOUNT_STATUS } from "../utils/constants.js";

import { cleanupListingForDeletion } from "../helpers/listing.cleanup.helper.js";
import listingDeletionRequestModel from "../modules/managed-sale/listing-deletion-request.model.js"

import { checkAndAutoUnblock } from "../helpers/user.helper.js";
import { sendOtp, verifyOtp } from "./sms.service.js";
import { maskPhone } from "../modules/listing/listing.service.js";

export async function registerUser({ username, email, mobileNumber, password }) {

    // Check each field individually to give a specific error message
    
    const existingUsername = await userModel.findOne({ username });
    if (existingUsername) {
        if (!existingUsername.verified) {
            throw new ApiError(400, "User exists but not verified. Please verify your email");
        }
        throw new ApiError(409, "Username already exists");
    }

    const existingEmail = await userModel.findOne({ email });
    if (existingEmail) {
        if (!existingEmail.verified) {
            throw new ApiError(400, "User exists but not verified. Please verify your email");
        }
        throw new ApiError(409, "Email already exists");
    }

    const existingMobile = await userModel.findOne({ mobileNumber });
    if (existingMobile) {
        if (!existingMobile.verified) {
            throw new ApiError(400, "User exists but not verified. Please verify your email");
        }
        throw new ApiError(409, "Mobile number already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    //    Create user
    const user = await userModel.create({
        username,
        email,
        mobileNumber,
        password: hashedPassword
    })

    // delete old OTPs
    await otpModel.deleteMany({ email })

    // generate new OTP
    const otp = generateOTP();
    const html = getOtpHtml(otp);

    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    // expire after 5 mins
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

    await otpModel.create({
        email,
        user: user._id,
        otpHash,
        expiresAt
    })

    await sendEmail(email, "OTP Verification", `Your OTP code ${otp}`, html)

    return user;
}


export async function loginUser({ email, password, rememberMe, ip, userAgent }) {

    const user = await userModel.findOne({ email }).select("+password")
    if (!user) {
        throw new ApiError(401, "Invalid credentials");
    }

    // Soft delete check
    if (user.isDeleted) {
        throw new ApiError(403, "Account deleted");
    }

    // Account stays PENDING until BOTH email and phone are verified.
    // Structured data tells the frontend which verification step to resume.
    if (user.accountStatus === ACCOUNT_STATUS.PENDING) {
        const message = !user.verified
            ? "Please verify your email first."
            : "Please verify your mobile number first.";
        throw new ApiError(403, message, {
            code: "VERIFICATION_REQUIRED",
            emailVerified: !!user.verified,
            phoneVerified: !!user.phoneVerified,
        });
    }

    // User whose block expired tries to log in fresh
    await checkAndAutoUnblock(user);

    if (user.accountStatus === ACCOUNT_STATUS.BLOCKED) {
        const message = user.blockedUntil
            ? `Your account is blocked until ${user.blockedUntil.toDateString()}`
            : `Your account has been permanently blocked. Contact support.`;
        throw new ApiError(403, message);
    }


    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid Password!");
    }

    const refreshExpiry = rememberMe
        ? 7 * 24 * 60 * 60 * 1000
        : 24 * 60 * 60 * 1000;

    //   Refresh and Access tokens for auth 
    const refreshToken = generateRefreshToken(user._id)

    const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex")

    // Session create
    const session = await sessionModel.create({
        user: user._id,
        refreshTokenHash,
        ip,
        userAgent,
        expiresAt: new Date(
            Date.now() + refreshExpiry
        )
    })

    //  Access tokens for auth 
    const accessToken = generateAccessToken(user._id, session._id)

    return {
        user,
        accessToken,
        refreshToken
    }

}

export async function refreshUserToken(oldRefreshToken) {

    // Now we will check for session, if session not exist it means either logged out or Refresh token is theft
    const refreshTokenHash = crypto.createHash("sha256").update(oldRefreshToken).digest("hex")

    // Now check session
    const session = await sessionModel.findOne({
        refreshTokenHash,
        revoked: false
    })

    // revoke detection and protection
    if (!session) {
        // Token reuse detected --> then revoke All sessions
        const decoded = jwt.decode(oldRefreshToken);

        if (decoded?.id) {
            await sessionModel.updateMany({
                user: decoded.id
            },
                {
                    revoked: true
                })
        }
        throw new ApiError(401, "Refresh token reuse detected. All sessions revoked.");
    }

    // Now we will verify
    const decoded = jwt.verify(oldRefreshToken, config.JWT_SECRET)

    // and then generate new one
    const newRefreshToken = generateRefreshToken(decoded.id)

    // now we will create hash of newRefreshToken and then save in session
    const newRefreshTokenHash = crypto.createHash("sha256").update(newRefreshToken).digest("hex")

    // Save in session
    session.refreshTokenHash = newRefreshTokenHash;
    // track last use
    session.lastUsedAt = new Date();
    await session.save();

    const accessToken = generateAccessToken(decoded.id, session._id)

    return {
        accessToken,
        newRefreshToken
    }
}

export async function logoutUser(RefreshToken) {
    if (!RefreshToken) {
        throw new ApiError(400, "Refresh Token not found!")
    }

    const refreshTokenHash = crypto.createHash("sha256").update(RefreshToken).digest("hex")

    const session = await sessionModel.findOne({
        refreshTokenHash,
        revoked: false
    })

    if (!session) {
        throw new ApiError(400, "Invalid Refresh Token!")
    }

    session.revoked = true;
    await session.save();

}

export async function logoutAllDevices(RefreshToken) {
    if (!RefreshToken) {
        throw new ApiError(400, "Refresh Token not found!")
    }

    const decoded = jwt.verify(RefreshToken, config.JWT_SECRET)

    await sessionModel.updateMany({
        user: decoded.id,
        revoked: false
    }, {
        revoked: true
    })
}

export async function verifyUserEmail(otp, email) {
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    const otpDoc = await otpModel.findOne({
        email,
        otpHash
    })


    if (!otpDoc) {
        throw new ApiError(400, "Invalid OTP")
    }

    // Check for expiry
    if (otpDoc.expiresAt < new Date()) {
        throw new ApiError(400, "OTP expired")
    }

    // Email verified — but the account only becomes ACTIVE once the mobile
    // number is verified too (next step in the registration flow).
    const existing = await userModel.findById(otpDoc.user);
    if (!existing) throw new ApiError(404, "User not found");

    const update = { verified: true };
    if (existing.phoneVerified) {
        update.accountStatus = ACCOUNT_STATUS.ACTIVE;
    }

    const user = await userModel.findByIdAndUpdate(otpDoc.user, update, { new: true });

    await otpModel.deleteMany({
        user: otpDoc.user
    })

    return user;
}

// ── Phone (mobile number) verification ────────────────────────────────────────
// Step 2 of registration: after the email is verified, an SMS OTP (Twilio
// Verify) is sent to the registered mobile number. The account becomes ACTIVE
// only when both email and phone are verified.

async function getPendingPhoneVerificationUser(email) {
    const user = await userModel.findOne({ email });
    if (!user) throw new ApiError(404, "User not found");
    if (user.isDeleted) throw new ApiError(403, "Account deleted");
    if (user.accountStatus !== ACCOUNT_STATUS.PENDING) {
        throw new ApiError(400, "Account is already active");
    }
    if (user.phoneVerified) throw new ApiError(400, "Mobile number already verified");
    if (!user.verified) throw new ApiError(400, "Please verify your email first");
    return user;
}

export async function sendPhoneOtp(email) {
    const user = await getPendingPhoneVerificationUser(email);

    await sendOtp(user.mobileNumber);

    return { sentTo: maskPhone(user.mobileNumber) };
}

export async function verifyPhone(email, code) {
    const user = await getPendingPhoneVerificationUser(email);

    const ok = await verifyOtp(user.mobileNumber, code);
    if (!ok) throw new ApiError(400, "Invalid or expired code");

    user.phoneVerified = true;
    // Email is already verified (guard above), so the account activates now
    user.accountStatus = ACCOUNT_STATUS.ACTIVE;
    await user.save();

    return user;
}

// Fix a mistyped number before it's verified — otherwise the account is stuck
// forever. Only possible while the phone is still unverified.
export async function changeVerificationNumber(email, newNumber) {
    const user = await getPendingPhoneVerificationUser(email);

    const existingMobile = await userModel.findOne({
        mobileNumber: newNumber,
        _id: { $ne: user._id },
    });
    if (existingMobile) throw new ApiError(409, "Mobile number already in use");

    user.mobileNumber = newNumber;
    await user.save();

    // Send the code to the new number right away
    await sendOtp(newNumber);

    return { sentTo: maskPhone(newNumber) };
}

export async function resendOTP(email) {
    const existingOtp = await otpModel.findOne({ email })

    // we will use a technique "CoolDOwn" which means the user can't request for another OTP until the given time limit is not crossed like 60 sec (probably)
    if (existingOtp) {
        const diff = Date.now() - existingOtp.createdAt.getTime()
        if (diff < 60 * 1000) {
            throw new ApiError(429, "Too many requests. Please wait before requesting another OTP");
        }
    }

    // delete all old otps
    await otpModel.deleteMany({ email })

    const user = await userModel.findOne({ email })
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // In case user is already verified
    if (user.verified) {
        throw new ApiError(400, "User already verified");
    }

    const otp = generateOTP();
    const html = getOtpHtml(otp);

    const otpHash = crypto.createHash("sha256").update(otp).digest("hex")
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000)

    await otpModel.create({
        email,
        user: user._id,
        otpHash,
        expiresAt
    })

    await sendEmail(email, "Resend OTP", `Your OTP code ${otp}`, html)

    return true;
}

export async function changePassword(userId, oldPassword, newPassword) {
    const user = await userModel.findById(userId).select("+password");

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
        throw new ApiError(401, "Invalid credentials");
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    user.password = newPasswordHash;
    await user.save();

    // now we have to revoke all sessions so that if the original user change password, if anyone else had the same password the session should be expired/revoked
    await sessionModel.updateMany({
        user: userId
    },
        {
            revoked: true
        })

}

export async function forgotPassword(email) {
    const user = await userModel.findOne({ email });

    // we don't have to reveal whether user exists
    if (!user) {
        return true;
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);

    await user.save();

    const resetUrl =
        `${config.FRONTEND_URL}/reset-password?token=${resetToken}`;

    await sendEmail(
        user.email,
        "Password Reset",
        `Reset your password using this link: ${resetUrl}`,
        `
        <h2>Password Reset</h2>
        <p>Click below to reset password:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        `
    );

    return true;
}

export async function resetPassword(token, newPassword) {

    const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

    const user = await userModel.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: new Date() }
    }).select("+password");

    if (!user) {
        throw new ApiError(400, "Invalid or expired reset token");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;

    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    // revoke all sessions
    await sessionModel.updateMany(
        { user: user._id },
        { revoked: true }
    );

    return true;
}

export async function deleteAccount(userId) {
    const user = await userModel.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    if (user.role === "admin") {
        throw new ApiError(403, "Admin accounts cannot be deleted");
    }

    const listings = await listingModel.find(
        { seller: userId },
        { _id: 1, saleMode: 1, status: 1 }
    );

    // --- Managed listing account deletion guards ---
    for (const listing of listings) {
        if (listing.saleMode === "MANAGED") {

            if (listing.status === "ACTIVE") {
                throw new ApiError(
                    400,
                    "Cannot delete account. You have an active managed listing being handled by our team. Please contact support."
                );
            }

            // Check for pending deletion request
            const pendingRequest = await listingDeletionRequestModel.findOne({
                listing: listing._id,
                status: "PENDING",
            });

            if (pendingRequest) {
                throw new ApiError(
                    400,
                    "Cannot delete account. You have a pending managed listing deletion request awaiting admin approval."
                );
            }
        }
    }

    // --- Per listing cleanup ---
    for (const listing of listings) {
        const { blocked } = await cleanupListingForDeletion(
            listing._id,
            false,
            "Listing deleted — owner deleted account"
        );

        if (blocked) {
            throw new ApiError(
                400,
                "Cannot delete account. One or more listings have an inspection currently in progress. Please wait for the inspection to complete."
            );
        }
    }

    // Mark all listings REMOVED (already-removed ones keep their attribution).
    // Cloudinary images stay — the 6-month cleanup cron purges them later.
    await listingModel.updateMany(
        { seller: userId, status: { $ne: "REMOVED" } },
        { status: "REMOVED", removedBy: "OWNER", removedAt: new Date() }
    );

    // Anonymize and soft delete
    user.isDeleted = true;
    user.deletedAt = new Date();
    user.accountStatus = ACCOUNT_STATUS.DELETED;
    await user.save();

    // Revoke all sessions
    await sessionModel.updateMany({ user: userId }, { revoked: true });

    return true;
}

export async function requestEmailChange(userId, newEmail, password) {
    const user = await userModel.findById(userId).select("+password")

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
        throw new ApiError(401, "Invalid credentials");
    }

    const existing = await userModel.findOne(
        {
            email: newEmail
        })
    if (existing) {
        throw new ApiError(409, "Email already in use");
    }

    // We will save new email in pending email, if the real user is not requesting for email change user can change it
    user.pendingEmail = newEmail;
    await user.save()

    // remove otps
    await otpModel.deleteMany({ email: newEmail })

    // generate new otp
    const otp = generateOTP();
    const html = getOtpHtml(otp);

    // generate hash for creating otpmodel
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex")

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

    await otpModel.create({
        email: newEmail,
        user: user._id,
        otpHash,
        expiresAt
    })

    // send otp to new Email
    await sendEmail(newEmail, "Verify your new Email", `OTP: ${otp}`, html)

    // Send alert to old email
    await sendEmail(
        user.email,
        "Email change requested",
        "If this was not you, you can cancel this request from your account."
    )
}

export async function confirmEmailChange(userId, otp) {
    const user = await userModel.findById(userId)

    if (!user || !user.pendingEmail) {
        throw new ApiError(400, "No email change request found");
    }

    const otpHash = crypto.createHash("sha256").update(otp).digest("hex")

    const otpDoc = await otpModel.findOne({
        email: user.pendingEmail,
        otpHash
    })

    if (!otpDoc) {
        throw new ApiError(400, "Invalid OTP");
    }

    if (otpDoc.expiresAt < new Date()) {
        throw new ApiError(400, "OTP expired");
    }

    // finally update email
    user.email = user.pendingEmail;
    user.pendingEmail = null;

    await user.save();

    await otpModel.deleteMany({ user: userId })

    return user
}


export async function cancelEmailChange(userId) {
    const user = await userModel.findById(userId)

    if (!user || !user.pendingEmail) {
        throw new ApiError(400, "No email change request found");
    }

    user.pendingEmail = null;
    await user.save();

    // delete all otps, so the hacker's otp will not be found also not the pendingEmail
    await otpModel.deleteMany({ user: userId })
}

// ── Profile mobile number change ──────────────────────────────────────────────
// Mirrors the email-change pattern: password confirm → SMS OTP to the NEW
// number (Twilio Verify) → on success the account number is swapped and the
// user's open listings are re-pinned to it.

export async function requestNumberChange(userId, newNumber, password) {
    const user = await userModel.findById(userId).select("+password");
    if (!user) throw new ApiError(404, "User not found");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new ApiError(401, "Invalid credentials");

    if (newNumber === user.mobileNumber) {
        throw new ApiError(400, "This is already your current number");
    }

    const existing = await userModel.findOne({
        mobileNumber: newNumber,
        _id: { $ne: userId },
    });
    if (existing) throw new ApiError(409, "Mobile number already in use");

    user.pendingMobileNumber = newNumber;
    await user.save();

    await sendOtp(newNumber);

    // Alert the account email — if this wasn't the owner, they can cancel
    await sendEmail(
        user.email,
        "Mobile number change requested",
        "A request was made to change the mobile number on your GearTrade account. If this was not you, cancel the request from your account settings and change your password."
    );

    return { sentTo: maskPhone(newNumber) };
}

export async function confirmNumberChange(userId, code) {
    const user = await userModel.findById(userId);

    if (!user || !user.pendingMobileNumber) {
        throw new ApiError(400, "No number change request found");
    }

    const ok = await verifyOtp(user.pendingMobileNumber, code);
    if (!ok) throw new ApiError(400, "Invalid or expired code");

    // Re-check uniqueness — another account may have claimed it meanwhile
    const taken = await userModel.findOne({
        mobileNumber: user.pendingMobileNumber,
        _id: { $ne: userId },
    });
    if (taken) {
        user.pendingMobileNumber = null;
        await user.save();
        throw new ApiError(409, "Mobile number already in use");
    }

    const newNumber = user.pendingMobileNumber;
    user.mobileNumber = newNumber;
    user.pendingMobileNumber = null;
    user.phoneVerified = true; // verified via the SMS code above
    await user.save();

    // Listings publish the account number — keep open ones in sync so buyers
    // don't keep calling the old number.
    await listingModel.updateMany(
        {
            seller: userId,
            status: { $in: ["PENDING", "ACTIVE", "REJECTED"] },
        },
        { $set: { mobileNumber: newNumber } }
    );

    return user;
}

export async function cancelNumberChange(userId) {
    const user = await userModel.findById(userId);

    if (!user || !user.pendingMobileNumber) {
        throw new ApiError(400, "No number change request found");
    }

    user.pendingMobileNumber = null;
    await user.save();
}

