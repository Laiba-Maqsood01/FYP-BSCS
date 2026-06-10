import { Router } from "express";

import * as controller from "./inspection.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { requestInspectionParamsSchema, inspectionRequestSchema } from "./inspection.validation.js";

const router = Router();

//POST /api/inspection/:listingId/request
router.post(
    "/:listingId/request",
    authMiddleware,
    validate(requestInspectionParamsSchema, "params"),
    controller.requestInspection
);

// POST /api/inspection/:listingId/reinspection  (Seller requesting for re-inspection)
router.post(
    "/:listingId/reinspection",
    authMiddleware,
    validate(requestInspectionParamsSchema, "params"),
    validate(inspectionRequestSchema),
    controller.requestSellerReInspection
);

// /api/inspection/:listingId/managed   (managed inspection)
router.post(
    "/:listingId/managed",
    authMiddleware,
    validate(inspectionRequestSchema),
    controller.requestManagedInspection
);

//POST /api/inspection/:inspectionId/payment
router.post(
    "/:inspectionId/payment",
    authMiddleware,
    controller.createInspectionPayment
);

export default router;