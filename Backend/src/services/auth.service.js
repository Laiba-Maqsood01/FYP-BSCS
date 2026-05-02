import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import userModel from "../models/user.model.js";
import sessionModel from "../models/session.model.js";
import config from "../config/config.js";
import otpModel from "../models/otp.model.js";
import { generateOTP, getOtpHtml } from "../utlis/utils.js";
import { sendEmail } from "../services/email.service.js";
import { generateAccessToken, generateRefreshToken } from "../utlis/token.utils.js";

export async function registerUser({ username, email, password }) {

    const isAlreadyExist = await userModel.findOne({
        $or: [
            { username },
            { email }
        ]
    })

    if (isAlreadyExist) {
        if (!isAlreadyExist.verified) {
            throw new Error("User already exist but not verified. Please verify your email");
        }
        throw new Error("Username or email already exist!");
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    //    Create user
    const user = await userModel.create({
        username,
        email,
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

export async function loginUser({ email, password, ip, userAgent }) {

    const user = await userModel.findOne({ email })
    if (!user) {
        throw new Error("Invalid Email!");
    }

    if (user.accountStatus === "PENDING") {
        throw new Error("Please verify your email first.");
    }

    if (user.accountStatus === "SUSPENDED") {
        throw new Error("Your account is temporarily suspended. Contact support.");
    }

    if (user.accountStatus === "BLOCKED") {
        throw new Error("Your account has been permanently blocked.");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
        throw new Error("Invalid Password!");
    }

    //   Refresh and Access tokens for auth 
    const refreshToken = generateRefreshToken(user._id)

    const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex")

    // Session create
    const session = await sessionModel.create({
        user: user._id,
        refreshTokenHash,
        ip,
        userAgent
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
        throw new Error("Refresh token reuse detected. All sessions revoked.");
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
        return res.status(400).json({
            message: "Refresh Token not found!"
        })
    }

    const refreshTokenHash = crypto.createHash("sha256").update(RefreshToken).digest("hex")

    const session = await sessionModel.findOne({
        refreshTokenHash,
        revoked: false
    })

    if (!session) {
        return res.status(400).json({
            message: "Invalid Refresh Token!"
        })
    }

    session.revoked = true;
    await session.save();

}

export async function logoutAllDevices(RefreshToken) {
    if (!RefreshToken) {
        return res.status(400).json({
            message: "Refresh Token not found!"
        })
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

    // console.log("ExpiresAt", otpDoc.expiresAt)
    // console.log("Now", new Date())

    if (!otpDoc) {
        return res.status(400).json({
            message: "Invalid OTP"
        })
    }

    // Check for expiry
    if (otpDoc.expiresAt < new Date()) {
        return res.status(400).json({
            message: "OTP expired"
        })
    }

    const user = await userModel.findByIdAndUpdate(otpDoc.user,
        {
            verified: true,
            accountStatus: "ACTIVE"
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
            throw new Error("Please wait before requesting another OTP")
        }
    }

    // delete all old otps
    await otpModel.deleteMany({ email })

    const user = await userModel.findOne({ email })
    if (!user) {
        throw new Error("User not found")
    }

    // In case user is already verified
    if (user.verified) {
        throw new Error("User already Verified");
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
    const user = await userModel.findById(userId);

    if (!user) {
        throw new Error("User not found")
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
        throw new Error("Old Password is incorrect");
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

export async function deleteAccount(userId) {
    await userModel.findByIdAndDelete(userId);

    // remove all sessions
    await sessionModel.deleteMany({ user: userId })

    // remove otp
    await otpModel.deleteMany({ user: userId })
}

export async function requestEmailChange(userId, newEmail, password) {
    const user = await userModel.findById(userId)

    if (!user) {
        throw new Error("User not found!")
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
        throw new Error("Invalid Password");
    }

    const existing = await userModel.findOne(
        {
            email: newEmail
        })
    if (existing) {
        throw new Error("Email already in use");
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

export async function confirmEmailChange(userId, otp){
    const user = await userModel.findById(userId)

    if(!user || !user.pendingEmail){
        throw new Error("No email change request found");
    }

    const otpHash = crypto.createHash("sha256").update(otp).digest("hex")

    const otpDoc = await otpModel.findOne({
        email: user.pendingEmail,
        otpHash
    })

    if(!otpDoc){
        throw new Error("Invalid OTP")
    }

    if(otpDoc.expiresAt < new Date()){
        throw new Error("OTP expired")
    }

    // finally update email
    user.email = user.pendingEmail;
    user.pendingEmail = null;

    await user.save();

    await otpModel.deleteMany({user: userId})

    return user
}

export async function cancelEmailChange(userId){
    const user = await userModel.findById(userId)

    if(!user || !user.pendingEmail){
        throw new Error("No Email change request found")
    }

    user.pendingEmail = null;
    await user.save();

    // delete all otps, so the hacker's otp will not be found also not the pendingEmail
    await otpModel.deleteMany({user: userId})
}

