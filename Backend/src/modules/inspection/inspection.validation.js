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

// External inspection — car not listed on GearTrade
export const externalInspectionSchema = z.object({
  year:           z.coerce.number().int().min(1950).max(new Date().getFullYear() + 1),
  brand:          z.string().min(1, "Make is required"),
  carModel:       z.string().min(1, "Model is required"),
  bodyType:       z.string().min(1, "Body type is required"),
  engineType:     z.enum(["petrol", "diesel", "hybrid", "electric"]),
  engineCapacity: z.coerce.number().positive("Valid engine capacity is required"),
  city:           z.string().min(1, "City is required"),

  inspectionAddress: z.string().min(5, "Address is required"),
  scheduledDate:     z.string().min(1, "Date is required"),
  timeSlot:          z.string().optional(),
});
