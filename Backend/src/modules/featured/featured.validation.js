import { z } from "zod";

export const requestFeaturedSchema = z.object({
  listingId: z
    .string()
    .regex(
      /^[0-9a-fA-F]{24}$/,
      "Invalid listing id"
    ),

  plan: z.enum([
    "BASIC",
    "PREMIUM",
    "TOP"
  ])
});