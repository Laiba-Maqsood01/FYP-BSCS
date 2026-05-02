import { z } from "zod";


export const loginSchema = z.object({
 email: z.
  string()
  .email("Invalid email format"),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password must be at most 100 characters")
});

export const registerSchema = loginSchema.extend({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20)
});

export const verifyEmailSchema = z.object({
  email: z.
  string()
  .email("Invalid email format"),

  otp: z
  .string()
  .length(6, "OTP must be 6 digits")
});
