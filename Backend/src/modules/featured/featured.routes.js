import { Router } from "express";

import * as controller from "./featured.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { requestFeaturedSchema } from "./featured.validation.js";

const router = Router();

router.post(
  "/request",
  authMiddleware,
  validate(requestFeaturedSchema),
  controller.requestFeatured
);

export default router;