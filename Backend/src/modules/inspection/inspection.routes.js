import { Router } from "express";

import * as controller from "./inspection.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { requestInspectionParamsSchema } from "./inspection.validation.js";

const router = Router();

// /api/inspection/:listingId/request
router.post(
    "/:listingId/request",
    authMiddleware,
    validate(requestInspectionParamsSchema, "params"),
    controller.requestInspection
);

export default router;