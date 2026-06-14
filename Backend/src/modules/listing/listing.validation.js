import { z } from "zod";

const objectIdSchema = z
  .string()
  .regex(
    /^[0-9a-fA-F]{24}$/,
    "Invalid ObjectId"
  );

export const createListingSchema = z.object({
  saleMode: z.enum([
    "GENERAL",
    "MANAGED"
  ]),

  city: objectIdSchema,

  registeredIn: objectIdSchema,

  brand: objectIdSchema,

  carModel: objectIdSchema,

  bodyType: objectIdSchema,

  year: z.number().min(1950),

  engineType: z.enum([
    "petrol",
    "diesel",
    "hybrid",
    "electric"
  ]),

  engineCapacity: z.number().positive(),

  transmission: z.enum([
    "manual",
    "automatic"
  ]),

  assembly: z.enum([
    "local",
    "imported"
  ]),

  exteriorColor: z.string(),

  mileage: z.number().min(0),

  price: z.number().positive(),

  description: z.string().min(10),

  images: z.array(
    z.object({
      url: z.string(),
      fileId: z.string()
    })
  ).optional(),

  mobileNumber: z.string(),

  secondaryNumber: z.string().optional(),

  whatsappAllowed: z.boolean().optional(),

  inspectionAddress: z.string().optional(),

  inspectionDate: z
    .string()
    .datetime()
    .optional(),

  inspectionTimeSlot: z
    .string()
    .optional(),
});

export const updateListingSchema =
  createListingSchema.partial();