import { Router } from "express";
import * as controller from "./listing.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authorizeRoles } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { contactOtpLimiter } from "../../middlewares/rateLimit.middleware.js";
import { createListingSchema, updateListingSchema, verifyContactOtpSchema } from "./listing.validation.js";


const router = Router();

// POST /api/listings/  (admins manage the platform — they can't post ads)
router.post(
  "/",
  authMiddleware,
  authorizeRoles("user"),
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

// GET /api/listings/:id/my-detail (owner fetches own listing, any status)
router.get(
  "/:id/my-detail",
  authMiddleware,
  controller.getMyListingDetail
);

// PATCH /api/listings/:id/mark-sold (user marks own GENERAL listing as SOLD)
router.patch(
  "/:id/mark-sold",
  authMiddleware,
  controller.markListingSoldByUser
);

// POST /api/listings/:id/contact/request-otp (send OTP to buyer before reveal)
router.post(
  "/:id/contact/request-otp",
  authMiddleware,
  contactOtpLimiter,
  controller.requestContactOtp
);

// POST /api/listings/:id/contact/verify-otp (verify OTP, reveal seller number)
router.post(
  "/:id/contact/verify-otp",
  authMiddleware,
  validate(verifyContactOtpSchema),
  controller.verifyContactOtp
);

// GET /api/listings/:id (for public)
router.get(
  "/:id",
  controller.getListingDetails
);

export default router;