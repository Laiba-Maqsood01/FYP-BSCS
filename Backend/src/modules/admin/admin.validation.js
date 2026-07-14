import { z } from "zod";

export const blockUserSchema = z.object({
    days: z
        .number({ invalid_type_error: "days must be a number" })
        .int()
        .min(1, "Minimum block duration is 1 day")
        .max(365, "Maximum block duration is 365 days")
        .optional(),
}).optional().default({});

export const rejectListingSchema = z.object({
    reason: z.string().min(5, "Rejection reason must be at least 5 characters"),
});

export const assignInspectorSchema = z.object({
    assignedInspector: z
        .string()
        .min(3, "Inspector name must be at least 3 characters"),
});

export const updateInspectionStatusSchema = z.object({
    status: z.enum([
        "PENDING",
        "SCHEDULED",
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELLED",
    ]),
    cancelReason: z.string().min(5, "Cancel reason must be at least 5 characters").optional(),
}).refine(
    data => data.status !== "CANCELLED" || !!data.cancelReason,
    { message: "Cancel reason is required when cancelling an inspection", path: ["cancelReason"] }
);

export const rejectDeletionRequestSchema = z.object({
    adminNote: z.string().min(5, "Admin note must be at least 5 characters"),
});

export const markSoldSchema = z.object({
    salePrice: z
        .number({ invalid_type_error: "Sale price must be a number" })
        .positive("Sale price must be greater than 0"),
});

export const createFeaturedPlanSchema = z.object({
    name: z.string().min(1).toUpperCase().trim(),
    label: z.string().min(1).trim(),
    amount: z.number({ invalid_type_error: "Amount must be a number" }).positive(),
    durationDays: z.number({ invalid_type_error: "Duration must be a number" }).int().positive(),
});

export const updateFeaturedPlanSchema = z.object({
    label: z.string().min(1).trim().optional(),
    amount: z.number({ invalid_type_error: "Amount must be a number" }).positive().optional(),
    durationDays: z.number({ invalid_type_error: "Duration must be a number" }).int().positive().optional(),
    isActive: z.boolean().optional(),
});

export const updateSiteSettingsSchema = z.object({
  companyPhone: z.string().min(1).optional(),
  commissionPercentage: z.coerce.number().positive().max(100).optional(),
  inspectionFees: z.object({
    standard:     z.coerce.number().positive().optional(),
    managed:      z.coerce.number().positive().optional(),
    premium:      z.coerce.number().positive().optional(),
  }).optional(),
});

const availableDaysSchema = z
  .array(z.number().int().min(0).max(6))
  .min(1, "At least one day must be selected")
  .refine(days => new Set(days).size === days.length, "Days must be unique");

export const addSlotSchema = z.object({
  label: z.string().min(1, "Label is required").trim(),
  availableDays: availableDaysSchema.optional(),
});

export const updateSlotSchema = z.object({
  label: z.string().min(1).trim().optional(),
  availableDays: availableDaysSchema.optional(),
  isActive: z.boolean().optional(),
}).refine(
  data => Object.keys(data).length > 0,
  { message: "At least one field must be provided" }
);
