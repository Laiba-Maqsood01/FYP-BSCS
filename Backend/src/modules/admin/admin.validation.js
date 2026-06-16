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
        "PENDING_COORDINATION",
        "SCHEDULED",
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELLED",
    ]),
});

export const uploadReportSchema = z.object({

    url: z.string()
        .url("Invalid report URL"),

    fileId: z.string()
        .min(1, "File ID is required"),
});

export const rejectDeletionRequestSchema = z.object({
    adminNote: z.string().min(5, "Admin note must be at least 5 characters"),
});

export const markSoldSchema = z.object({
    salePrice: z
        .number({ invalid_type_error: "Sale price must be a number" })
        .positive("Sale price must be greater than 0"),
});

export const cancelCommissionSchema = z.object({
    cancelReason: z
        .string()
        .min(10, "Cancel reason must be at least 10 characters"),
});