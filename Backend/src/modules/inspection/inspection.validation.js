import { z } from "zod";

export const requestInspectionParamsSchema  = z.object({
  listingId: z
    .string()
    .regex(
      /^[0-9a-fA-F]{24}$/,
      "Invalid listing id"
    )
});