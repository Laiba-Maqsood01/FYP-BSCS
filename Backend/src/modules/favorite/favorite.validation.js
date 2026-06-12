import { z } from "zod";

export const listingIdParamsSchema = z.object({
  listingId: z
    .string()
    .regex(
      /^[0-9a-fA-F]{24}$/,
      "Invalid listing id"
    )
});