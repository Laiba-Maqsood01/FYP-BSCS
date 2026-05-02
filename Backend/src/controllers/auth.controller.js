// import jwt from "jsonwebtoken";
// import crypto from "crypto";
// import userModel from "../models/user.model.js";
// import sessionModel from "../models/session.model.js";
// import config from "../config/config.js";
// import otpModel from "../models/otp.model.js";

import * as authService from "../services/auth.service.js";

export async function register(req, res) {
    try {
        const user = await authService.registerUser(req.body);

        res.status(201).json({
            message: "User created successfully!",
            user: {
                username: user.username,
                email: user.email,
                verified: user.verified
            }
        })
    } catch (error) {
        return res.status(400).json({
            message: error.message
        })
    }
}

export async function login(req, res) {
    try {
        const { email, password } = req.body;
        const result = await authService.loginUser({
            email,
            password,
            ip: req.ip,
            userAgent: req.headers["user-agent"]
        })

        res.cookie("RefreshToken", result.refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        })

        res.status(200).json({
            message: "User logged in successfully!",
            user: {
                username: result.user.username,
                email: result.user.email
            },
            accessToken: result.accessToken
        })

    } catch (error) {
        return res.status(401).json({
            message: error.message
        })
    }
}

export async function getMe(req, res) {
    res.status(200).json({
        message: "User Profile Fetched Successfully!",
        user: {
            username: req.user.username,
            email: req.user.email
        }
    })
}

export async function refreshToken(req, res) {
    try {
        const RefreshToken = req.cookies.RefreshToken;

        if (!RefreshToken) {
            return res.status(401).json({
                message: "Refresh Token not found!"
            })
        }

        const result = await authService.refreshUserToken(RefreshToken);
        res.cookie("RefreshToken", result.newRefreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7days
        })

        res.status(200).json({
            message: "Token Refreshed successfully!",
            accessToken: result.accessToken
        })

    } catch (error) {
        return res.status(401).json({
            message: error.message
        })
    }
}

export async function logout(req, res) {
    try {
        const RefreshToken = req.cookies.RefreshToken;
        await authService.logoutUser(RefreshToken);

        res.clearCookie("RefreshToken")

        res.status(200).json({
            message: "Logged out successfully!"
        })
    } catch (error) {
        res.status(400).json({
            message: error.message
        })
    }

}

export async function logoutAll(req, res) {
    try {
        const RefreshToken = req.cookies.RefreshToken;
        await authService.logoutAllDevices(RefreshToken);

        res.clearCookie("RefreshToken")
        res.status(200).json({
            message: "Logged Out from All Devices Successfully!"
        })

    } catch (error) {
        res.status(400).json({
            message: error.message
        })
    }
}

// We can use it with registeration, also with login
// Like after registration user is redirected to verify-email page, if user not process it
//  then user tries to login, for login, user will fill form, first we check for verified, as the user is not verified, automatically redirected to verify-email page 
export async function verifyEmail(req, res) {
    try {
        const {otp, email} = req.body;
        const user = await authService.verifyUserEmail(otp, email);

        res.status(200).json({
        message: "Email verified successfully!",
        user: {
            username: user.username,
            email: user.email,
            verified: user.verified
        }
    })
    } catch (error) {
       res.status(400).json({
        message: error.message
       }) 
    }

    
}

export async function resendOTP(req, res) {
    try {
        const { email } = req.body;

        await authService.resendOTP(email);

        res.status(200).json({
            message: "OTP sent successfully!"
        })
    } catch (error) {
        res.status(400).json({
            message: error.message
        })
    }
}

export async function changePassword(req, res) {
    try {
        const { oldPassword, newPassword } = req.body;

        await authService.changePassword(
            req.user._id,
            oldPassword,
            newPassword
        );

        res.status(200).json({
            message: "Password changed successfully. Please login again."
        })
    } catch (error) {
        res.status(400).json({
            message: error.message
        })
    }
}

export async function deleteAccount(req, res) {
    try {
        const userId = req.user._id;
        await authService.deleteAccount(userId)

        res.clearCookie("RefreshToken")

        res.status(200).json({
            message: "Account Deleted successfully!"
        })

    } catch (error) {
        res.status(400).json({
            message: error.message
        })
    }
}

export async function requestEmailChange(req, res) {
    try {
        const { newEmail, password } = req.body;

        await authService.requestEmailChange(
            req.user._id,
            newEmail,
            password
        )

        res.status(200).json({
            message: "OTP sent to new Email"
        })
    } catch (error) {
        res.status(400).json({
            message: error.message
        })
    }
}

export async function confirmEmailChange(req, res) {
    try {
        const { otp } = req.body;

        const user = await authService.confirmEmailChange(
            req.user._id,
            otp
        )

        res.status(200).json({
            message: "Email updated successfully!",
            email: user.email
        })
    } catch (error) {
        res.status(400).json({
            message: error.message
        })
    }
}

export async function cancelEmailChange(req, res) {
    try {
        await authService.cancelEmailChange(req.user._id)
        res.status(200).json({
            message: "Email change request cancelled"
        })

    } catch (error) {
        res.status(400).json({
            message: error.message
        })
    }
}