import { z } from "zod";

export const createListingSchema = z.object({
  title: z
    .string()
    .min(3),

  description: z
    .string()
    .min(10),

  brand: z
    .string(),

  model: z
    .string(),

  year: z
    .number(),

  price: z
    .number()
    .positive(),

  mileage: z
    .number(),

  fuelType: z
    .enum(["petrol", "diesel", "hybrid", "electric"]),

  transmission: z
    .enum(["manual", "automatic"]),

  condition: z
    .enum(["new", "used"])
    .optional(),

  saleMode: z
    .enum(["GENERAL", "MANAGED"])
    .optional()
});

export const updateListingSchema = z.object({
  title: z
    .string()
    .min(3)
    .optional(),

  description: z
    .string()
    .min(10)
    .optional(),

  brand: z
    .string()
    .optional(),

  model: z
    .string()
    .optional(),

  year: z
    .number()
    .optional(),

  price: z
    .number()
    .positive()
    .optional(),

  mileage: z
    .number()
    .optional(),

  fuelType: z
    .enum(["petrol", "diesel", "hybrid", "electric"])
    .optional(),

  transmission: z
    .enum(["manual", "automatic"])
    .optional(),

  saleMode: z
    .enum(["GENERAL", "MANAGED"])
    .optional()
});