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
import { deleteImages, deleteFiles } from "../modules/upload/upload.service.js";
import inspectionModel from "../modules/inspection/inspection.model.js";

export async function registerUser({ username, email, mobileNumber, password }) {
    const isAlreadyExist = await userModel.findOne({
        $or: [
            { username },
            { email },
            { mobileNumber }
        ]
    })

    if (isAlreadyExist) {
        if (!isAlreadyExist.verified) {
            throw new ApiError(400, "User exists but not verified. Please verify your email");
        }
        throw new ApiError(409, "Username or email already exists");
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

    if (user.accountStatus === ACCOUNT_STATUS.PENDING) {
        throw new ApiError(403, "Please verify your email first.");
    }

    if (user.accountStatus === ACCOUNT_STATUS.SUSPENDED) {
        throw new ApiError(403, "Your account is temporarily suspended. Contact support.");
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

    const user = await userModel.findByIdAndUpdate(otpDoc.user,
        {
            verified: true,
            accountStatus: ACCOUNT_STATUS.ACTIVE
        },
        {
            new: true
        })

    await otpModel.deleteMany({
        user: otpDoc.user
    })

    return user;
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

    const listings = await listingModel.find(
        { seller: userId },
        { _id: 1, saleMode: 1, status: 1 }
    );

    // --- Managed listing account deletion guards ---
    for (const listing of listings) {
        if (listing.saleMode === "MANAGED") {

            if (listing.status === "PENDING_COMMISSION") {
                throw new ApiError(
                    400,
                    "Cannot delete account. You have a pending commission payment. Please pay the commission first."
                );
            }

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

    // Delete all Cloudinary assets for each listing
    for (const listing of listings) {
        const fullListing = await listingModel.findById(listing._id, { images: 1 });

        // Delete images
        const imageFileIds = (fullListing.images || [])
            .map((img) => img.fileId)
            .filter(Boolean);

        await deleteImages(imageFileIds);

        // Delete inspection report PDFs if any
        const inspections = await inspectionModel.find(
            { listing: listing._id },
            { report: 1 }
        );

        const reportFileIds = inspections
            .map((insp) => insp.report?.fileId)
            .filter(Boolean);

        await deleteFiles(reportFileIds, "raw");
    }

    // Mark all listings REMOVED
    await listingModel.updateMany({ seller: userId }, { status: "REMOVED" });

    // Anonymize and soft delete
    user.isDeleted = true;
    user.deletedAt = new Date();
    user.email = `deleted_${user._id}@deleted.com`;
    user.username = `deleted_${user._id}`;
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

