import { Router } from "express";
import * as controller from "./listing.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { createListingSchema, updateListingSchema } from "./listing.validation.js";


const router = Router();

// POST /api/listings/
router.post(
  "/",
  authMiddleware,
  validate(createListingSchema),
  controller.createListing
);

// GET /api/listings/my-listings
router.get(
  "/my-listings",
  authMiddleware,
  controller.getMyListings
);

// GET /api/listings
// GET /api/listings?brand=Toyota&fuelType=petrol
// GET /api/listings?search=civic
// GET /api/listings?sortBy=price&sortOrder=asc
// GET /api/listings?sortBy=price&sortOrder=desc
// GET /api/listings?page=2&limit=5
router.get(
  "/",
  controller.getPublicListings
);


// PUT /api/listings/:id
router.put(
  "/:id",
  authMiddleware,
  validate(updateListingSchema),
  controller.updateListing
);

// DELETE /api/listings/:id
router.delete(
  "/:id",
  authMiddleware,
  controller.deleteListing
);

// GET /api/listings/:id (for public)
router.get(
  "/:id",
  controller.getListingDetails
);

export default router;