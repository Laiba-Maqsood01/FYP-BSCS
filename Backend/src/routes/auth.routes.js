import { registerSchema, loginSchema, verifyEmailSchema, forgotPasswordSchema,resetPasswordSchema, changePasswordSchema, requestEmailChangeSchema,confirmEmailChangeSchema } from "../validations/auth.validation.js";
import { validate } from "../middlewares/validate.middleware.js";
import { authLimiter } from "../middlewares/rateLimit.middleware.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
const authRouter = Router()

/**
 POST /api/auth/register
 */
authRouter.post(
    "/register",
    authLimiter,
    validate(registerSchema),
    authController.register)

/**
 POST /api/auth/login
 */
authRouter.post(
    "/login",
    authLimiter,
    validate(loginSchema), //validation using zod
    authController.login)

/** 
 GET /api/auth/get-me 
 */
authRouter.get(
    "/get-me",
    authMiddleware,
    authController.getMe)

/* 
GET /api/auth/refresh-token
 */
authRouter.get(
    "/refresh-token",
    authController.refreshToken)

/*
POST /api/auth/logout 
 */
authRouter.post(
    "/logout",
    authController.logout)

/*
POST /api/auth/logout-all 
*/
authRouter.post(
    "/logout-all",
    authController.logoutAll)

/** 
POST /api/auth/verify-email 
*/
authRouter.post(
    "/verify-email",
    authLimiter,
    validate(verifyEmailSchema),
    authController.verifyEmail)

/**
POST  /api/auth/resend-otp 
 */
authRouter.post(
    "/resend-otp",
    authLimiter,
    authController.resendOTP)

/** for it we have to give oldPassword, newPassword, and also authorization: access token
 * POST /api/auth/change-password
  */
authRouter.post(
    "/change-password",
    authMiddleware,
    validate(changePasswordSchema),
    authController.changePassword)

/*
POST /api/auth/forgot-password
*/
authRouter.post(
    "/forgot-password",
    authLimiter,
    validate(forgotPasswordSchema),
    authController.forgotPassword
);

/*
POST /api/auth/reset-password
*/
authRouter.post(
    "/reset-password",
    authLimiter,
    validate(resetPasswordSchema),
    authController.resetPassword
);

/**
 * PATCH /api/auth/delete-account
  */
authRouter.patch(
    "/delete-account",
    authMiddleware,
    authController.deleteAccount)

/**
 * POST /api/auth/request-email-change
  */
authRouter.post(
    "/request-email-change",
    authMiddleware,
    validate(requestEmailChangeSchema),
    authController.requestEmailChange)

/**
 * POST /api/auth/confirm-email-change
  */
authRouter.post(
    "/confirm-email-change",
    authMiddleware,
    validate(confirmEmailChangeSchema),
    authController.confirmEmailChange)

/**
* POST /api/auth/cancel-email-change
 */
authRouter.post(
    "/cancel-email-change",
    authMiddleware,
    authController.cancelEmailChange)

export default authRouter