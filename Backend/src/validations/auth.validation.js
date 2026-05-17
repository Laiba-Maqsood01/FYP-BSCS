import { z } from "zod";


export const loginSchema = z.object({
  email: z
    .string()
    .email("Invalid email format"),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
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

  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password must be at most 100 characters"),

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