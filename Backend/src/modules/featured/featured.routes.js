import { Router } from "express";

import * as controller from "./featured.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { requestFeaturedSchema } from "./featured.validation.js";

const router = Router();

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

export default router;