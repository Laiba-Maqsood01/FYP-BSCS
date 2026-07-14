import { z } from "zod";

// Strong password policy for new passwords (register). Must contain at least
// one uppercase letter, one lowercase letter, one number and one special
// character, and be 8–100 characters long.
export const strongPassword = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password must be at most 100 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");


export const loginSchema = z.object({
  email: z
    .string()
    .email("Invalid email format"),

  password: z
    .string()
    .min(6, "Password must be at least 8 characters")
    .max(100, "Password must be at most 100 characters"),

  rememberMe: z
    .boolean()
    .optional()
});

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20),

  email: z.
    string()
    .email("Invalid email format"),

  password: strongPassword,

  mobileNumber: z
    .string()
    .regex(
      /^03[0-9]{9}$/,
      "Invalid Pakistani mobile number"
    ),

  confirmPassword: z
    .string(),

  agreeToTerms: z
    .literal(true, {
      errorMap: () => ({
        message:
          "You must agree to Terms of Service and Privacy Policy"
      })
    })
})
  .refine(
    (data) => data.password === data.confirmPassword,
    {
      message: "Passwords do not match",
      path: ["confirmPassword"]
    }
  );

export const verifyEmailSchema = z.object({
  email: z.
    string()
    .email("Invalid email format"),

  otp: z
    .string()
    .length(6, "OTP must be 6 digits")
});

export const sendPhoneOtpSchema = z.object({
  email: z
    .string()
    .email("Invalid email format")
});

export const verifyPhoneSchema = z.object({
  email: z
    .string()
    .email("Invalid email format"),

  code: z
    .string()
    .min(4, "Invalid code")
    .max(8, "Invalid code")
});

export const changeVerificationNumberSchema = z.object({
  email: z
    .string()
    .email("Invalid email format"),

  newNumber: z
    .string()
    .regex(
      /^03[0-9]{9}$/,
      "Invalid Pakistani mobile number"
    )
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email()
});

export const resetPasswordSchema = z.object({
  token: z
    .string(),

  newPassword: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password must be at most 100 characters")
});

export const changePasswordSchema = z.object({
  oldPassword: z
    .string()
    .min(6, "Old password is required"),

  newPassword: z
    .string()
    .min(6, "New password must be at least 6 characters")
    .max(100, "New password must be at most 100 characters")
});

export const requestEmailChangeSchema = z.object({
  newEmail: z
    .string()
    .email("Invalid email format"),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
});

export const confirmEmailChangeSchema = z.object({
  otp: z
    .string()
    .length(6, "OTP must be 6 digits")
});

export const requestNumberChangeSchema = z.object({
  newNumber: z
    .string()
    .regex(
      /^03[0-9]{9}$/,
      "Invalid Pakistani mobile number"
    ),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
});

export const confirmNumberChangeSchema = z.object({
  code: z
    .string()
    .min(4, "Invalid code")
    .max(8, "Invalid code")
});