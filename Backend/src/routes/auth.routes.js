import { registerSchema, loginSchema, verifyEmailSchema } from "../validations/auth.validation.js";
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
GET /api/auth/logout 
 */
authRouter.get(
    "/logout",
    authController.logout)

/*
GET /api/auth/logout-all 
*/
authRouter.get(
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
    authController.changePassword)

/**
 * DELETE /api/auth/delete-account
  */  
 authRouter.delete(
    "/delete-account",
    authMiddleware,
    authController.deleteAccount)

/**
 * POST /api/auth/request-email-change
  */  
 authRouter.post(
    "/request-email-change",
    authMiddleware,
    authController.requestEmailChange)

/**
 * POST /api/auth/confirm-email-change
  */  
 authRouter.post(
    "/confirm-email-change",
    authMiddleware,
    authController.confirmEmailChange)

 /**
 * POST /api/auth/cancel-email-change
  */  
 authRouter.post(
    "/cancel-email-change",
    authMiddleware,
    authController.cancelEmailChange)   

export default authRouter