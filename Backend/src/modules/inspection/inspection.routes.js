import { Router } from "express";

import * as controller from "./inspection.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { requestInspectionParamsSchema, inspectionRequestSchema, externalInspectionSchema } from "./inspection.validation.js";
import { authorizeRoles } from "../../middlewares/role.middleware.js";

const router = Router();

// GET /api/inspection/my-inspections
router.get(
  "/my-inspections",
  authMiddleware,
  controller.getMyInspections
);

// GET /api/inspection/available-slots?date=YYYY-MM-DD
router.get(
  "/available-slots",
  controller.getAvailableSlots
);

// GET /api/inspection/external/fee — fee quote for an unlisted car
router.get(
  "/external/fee",
  authMiddleware,
  controller.getExternalFeeQuote
);

// POST /api/inspection/external/request — inspection for a car not on GearTrade
router.post(
  "/external/request",
  authMiddleware,
  authorizeRoles("user"),
  validate(externalInspectionSchema),
  controller.requestExternalInspection
);

// GET /api/inspection/:listingId/fee  — fee quote for the booking form
router.get(
  "/:listingId/fee",
  authMiddleware,
  controller.getInspectionFeeQuote
);

// GET /api/inspection/listing/:listingId  — latest non-cancelled inspection for a listing (public)
router.get(
  "/listing/:listingId",
  controller.getListingInspectionStatus
);

//POST /api/inspection/:listingId/request
router.post(
    "/:listingId/request",
    authMiddleware,
    validate(requestInspectionParamsSchema, "params"),
    validate(inspectionRequestSchema),
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