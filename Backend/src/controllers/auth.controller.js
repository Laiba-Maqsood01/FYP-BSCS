import * as authService from "../services/auth.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";

export const register = asyncHandler(async (req, res) => {
    const user = await authService.registerUser(req.body);

    res.status(201).json(
        new ApiResponse(201, "User created successfully!", {
            username: user.username,
            email: user.email,
            verified: user.verified
        })
    )
})

export const login = asyncHandler(async (req, res) => {
    const { email, password, rememberMe } = req.body;
    const result = await authService.loginUser({
        email,
        password,
        rememberMe,
        ip: req.ip,
        userAgent: req.headers["user-agent"]
    })


    // only in production
    res.cookie("RefreshToken", result.refreshToken, {
        httpOnly: true,
        secure: true,
        // sameSite: "strict",
        sameSite: "none",
        maxAge: rememberMe
            ? 7 * 24 * 60 * 60 * 1000 //7 days in case of rememberMe
            : 24 * 60 * 60 * 1000 // 24hrs in case of unchecked
    })

    // only for localhost
    // res.cookie("RefreshToken", result.refreshToken, {
    //     httpOnly: true,
    //     secure: false, // true only in production (https)
    //     sameSite: "lax",
    // });

    res.status(200).json(
        new ApiResponse(200, "User logged in successfully!", {
            user: {
                _id: result.user._id,
                username: result.user.username,
                email: result.user.email,
                role: result.user.role,
                verified: result.user.verified
            },
            accessToken: result.accessToken
        })
    )
})

export const getMe = asyncHandler(async (req, res) => {
    res.status(200).json(
        new ApiResponse(200, "User Profile Fetched Successfully!", {
            username: req.user.username,
            email: req.user.email,
            role: req.user.role,
            verified: req.user.verified,
            accountStatus: req.user.accountStatus,
            pendingEmail: req.user.pendingEmail,
        })
    )
})

export const refreshToken = asyncHandler(async (req, res) => {
    const RefreshToken = req.cookies.RefreshToken;
    if (!RefreshToken) {
        throw new ApiError(401, "Refresh Token not found!")
    }

    const result = await authService.refreshUserToken(RefreshToken);
    res.cookie("RefreshToken", result.newRefreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7days
    })

    res.status(200).json(
        new ApiResponse(200, "Token Refreshed successfully!", {
            accessToken: result.accessToken
        })
    )
})

export const logout = asyncHandler(async (req, res) => {
    const RefreshToken = req.cookies.RefreshToken;
    await authService.logoutUser(RefreshToken);

    res.clearCookie("RefreshToken")

    res.status(200).json(
        new ApiResponse(200, "Logged out successfully!")
    )
})

export const logoutAll = asyncHandler(async (req, res) => {
    const RefreshToken = req.cookies.RefreshToken;
    await authService.logoutAllDevices(RefreshToken);

    res.clearCookie("RefreshToken")
    res.status(200).json(
        new ApiResponse(200, "Logged Out from All Devices Successfully!")
    )
})

// We can use it with registeration, also with login
// Like after registration user is redirected to verify-email page, if user not process it
//  then user tries to login, for login, user will fill form, first we check for verified, as the user is not verified, automatically redirected to verify-email page 
export const verifyEmail = asyncHandler(async (req, res) => {
    const { otp, email } = req.body;
    const user = await authService.verifyUserEmail(otp, email);

    res.status(200).json(
        new ApiResponse(200, "Email verified successfully!", {
            username: user.username,
            email: user.email,
            verified: user.verified
        })
    )

})

export const resendOTP = asyncHandler(async (req, res) => {
    const { email } = req.body;
    await authService.resendOTP(email);

    res.status(200).json(
        new ApiResponse(200, "OTP sent successfully!")
    )
})

export const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    await authService.changePassword(
        req.user._id,
        oldPassword,
        newPassword
    );

    res.status(200).json(
        new ApiResponse(200, "Password changed successfully. Please login again.")
    )
})

export const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    await authService.forgotPassword(email);

    res.status(200).json(
        new ApiResponse(
            200,
            "If account exists, reset email sent"
        )
    );
})

export const resetPassword = asyncHandler(async (req, res) => {

    const { token, newPassword } = req.body;

    await authService.resetPassword(token, newPassword);

    res.status(200).json(
        new ApiResponse(
            200,
            "Password reset successful"
        )
    );
})

export const deleteAccount = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    await authService.deleteAccount(userId)

    res.clearCookie("RefreshToken")
    res.status(200).json(
        new ApiResponse(200, "Account Deleted successfully!")
    )
})


export const requestEmailChange = asyncHandler(async (req, res) => {
    const { newEmail, password } = req.body;

    await authService.requestEmailChange(
        req.user._id,
        newEmail,
        password
    )

    res.status(200).json(
        new ApiResponse(200, "OTP sent to new Email")
    )
})

export const confirmEmailChange = asyncHandler(async (req, res) => {
    const { otp } = req.body;

    const user = await authService.confirmEmailChange(
        req.user._id,
        otp
    )

    res.status(200).json(
        new ApiResponse(200, "Email updated successfully!", {
            email: user.email
        })
    )
})

export const cancelEmailChange = asyncHandler(async (req, res) => {
    await authService.cancelEmailChange(req.user._id)
    res.status(200).json(
        new ApiResponse(200, "Email change request cancelled")
    )
})