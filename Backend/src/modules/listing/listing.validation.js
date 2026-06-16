import { z } from "zod";
import config from "../../config/config.js";

const objectIdSchema = z
  .string()
  .regex(
    /^[0-9a-fA-F]{24}$/,
    "Invalid ObjectId"
  );

// Each image must be a real Cloudinary URL from our account + a non-empty public_id
const imageSchema = z.object({
  url: z
    .string()
    .url()
    // when integrated with frontend uncomment it
    // .refine(
    //   (url) =>
    //     url.startsWith(
    //       `https://res.cloudinary.com/${config.CLOUDINARY_CLOUD_NAME}/image/upload/`
    //     ),
    //   { message: "Image URL must be a valid Cloudinary URL from this account" }
    // ),
    .refine(
      (url) => {
        const normalized = url.replace(/^http:\/\//, "https://");
        return normalized.startsWith(
          `https://res.cloudinary.com/${config.CLOUDINARY_CLOUD_NAME}/image/upload/`
        );
      },
      { message: "Image URL must be a valid Cloudinary URL from this account" }
    ),
  
    fileId: z.string().min(1, "fileId (public_id) is required"),
});


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

  images: z
    .array(imageSchema)
    .min(1, "At least one image is required")
    .max(10, "Maximum 10 images allowed")
    .optional(),

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