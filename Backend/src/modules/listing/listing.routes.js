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

export default router;