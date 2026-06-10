import { z } from "zod";

export const requestInspectionParamsSchema = z.object({
  listingId: z
  .string()
  .regex(
    /^[0-9a-fA-F]{24}$/,
      "Invalid listing id"
    )
  });
  
export const inspectionRequestSchema = z.object({

  inspectionAddress: z
    .string()
    .min(5)
    .optional(),

  scheduledDate: z
    .string()
    .optional(),

  timeSlot: z
    .string()
    .optional()

});
