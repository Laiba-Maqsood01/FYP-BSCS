import { Router } from "express";

import * as controller from "./featured.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { requestFeaturedSchema } from "./featured.validation.js";

const router = Router();

// GET /api/featured/plans  — public, returns active plans only
router.get("/plans", controller.getActivePlans);

// POST /api/featured/request
router.post(
  "/request",
  authMiddleware,
  validate(requestFeaturedSchema),
  controller.requestFeatured
);

// POST /api/featured/:featureId/payment
router.post(
  "/:featureId/payment",
  authMiddleware,
  controller.createFeaturedPayment
);

// GET /api/featured/listing/:listingId
router.get(
  "/listing/:listingId",
  authMiddleware,
  controller.getFeaturedByListing
);

export default router;