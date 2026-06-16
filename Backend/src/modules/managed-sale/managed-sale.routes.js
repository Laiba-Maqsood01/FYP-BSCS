import express from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authorizeRoles } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import * as managedSaleController from "./managed-sale.controller.js";
import { deletionRequestSchema} from "./managed-sale.validation.js";

const managedSaleRouter = express.Router();

// All routes require auth
managedSaleRouter.use(authMiddleware);

// ---------- Deletion Requests (User) ----------
// POST /api/managed-sale/deletion-request/:listingId
managedSaleRouter.post(
    "/deletion-request/:listingId",
    validate(deletionRequestSchema),
    managedSaleController.submitDeletionRequest
);

// GET /api/managed-sale/deletion-requests
managedSaleRouter.get(
    "/deletion-requests",
    managedSaleController.getMyDeletionRequests
);

// ---------- Commission (User) ----------
// GET /api/managed-sale/commission/:listingId
managedSaleRouter.get(
    "/commission/:listingId",
    managedSaleController.getCommissionDetails
);

// POST /api/managed-sale/commission/:commissionId/pay
managedSaleRouter.post(
    "/commission/:commissionId/pay",
    managedSaleController.initiateCommissionPayment
);

export default managedSaleRouter;