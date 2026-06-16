import express from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authorizeRoles } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import * as adminController from "./admin.controller.js";

import { blockUserSchema, assignInspectorSchema, updateInspectionStatusSchema, uploadReportSchema, rejectListingSchema, rejectDeletionRequestSchema, markSoldSchema, cancelCommissionSchema, } from "./admin.validation.js";

const adminRouter = express.Router();

// All admin routes require auth + admin role
adminRouter.use(authMiddleware);
adminRouter.use(authorizeRoles("admin"));

// ---------- Dashboard ----------

// GET /api/admin/dashboard
adminRouter.get(
    "/dashboard",
    adminController.getDashboard);


// ---------- User Management ----------

// GET /api/admin/users
adminRouter.get(
    "/users",
    adminController.getUsers);

// GET /api/admin/users/:id
adminRouter.get(
    "/users/:id",
    adminController.getUserDetail);

// PATCH /api/admin/users/:id/block-toggle
adminRouter.patch(
    "/users/:id/block-toggle",
    validate(blockUserSchema),
    adminController.toggleBlockUser);

// PATCH /api/admin/users/:id/delete
adminRouter.patch(
    "/users/:id/delete",
    adminController.deleteUser);

// ---------- Listing Management ----------

// GET /api/admin/listings
adminRouter.get(
    "/listings",
    adminController.getListings);


// PATCH /api/admin/listings/:id/approve
adminRouter.patch(
    "/listings/:id/approve",
    adminController.approveListing);


// PATCH /api/admin/listings/:id/reject
adminRouter.patch(
    "/listings/:id/reject",
    validate(rejectListingSchema),
    adminController.rejectListing
);


// DELETE /api/admin/listings/:id/remove
adminRouter.patch(
    "/listings/:id/remove",
    adminController.removeListing);



// ---------- Inspection Management ----------

// GET /api/admin/inspections
adminRouter.get(
    "/inspections",
    adminController.getInspections);


// PATCH /api/admin/inspections/:id/assign
adminRouter.patch(
    "/inspections/:id/assign",
    validate(assignInspectorSchema),
    adminController.assignInspector
);


// PATCH /api/admin/inspections/:id/status
adminRouter.patch(
    "/inspections/:id/status",
    validate(updateInspectionStatusSchema),
    adminController.updateInspectionStatus
);


// POST /api/admin/inspections/:id/report
adminRouter.post(
    "/inspections/:id/report",
    validate(uploadReportSchema),
    adminController.uploadInspectionReport
);

// ---------- Featured Management ----------


// GET /api/admin/featured
adminRouter.get(
    "/featured",
    adminController.getFeatured);


// ---------- Refund Management ----------


// GET /api/admin/refunds
adminRouter.get(
    "/refunds",
    adminController.getRefunds);


// PATCH /api/admin/refunds/:id/approve
adminRouter.patch(
    "/refunds/:id/approve",
    adminController.approveRefund);


// ---------- Deletion Requests ----------
// GET /api/admin/deletion-requests
adminRouter.get(
    "/deletion-requests",
    adminController.getDeletionRequests);


// PATCH /api/admin/deletion-requests/:id/approve
adminRouter.patch(
    "/deletion-requests/:id/approve",
    adminController.approveDeletionRequest
);


//PATCH /api/admin/deletion-requests/:id/reject
adminRouter.patch(
    "/deletion-requests/:id/reject",
    validate(rejectDeletionRequestSchema),
    adminController.rejectDeletionRequest
);


// ---------- Commission ----------
// PATCH /api/admin/listings/:id/mark-sold
adminRouter.patch(
    "/listings/:id/mark-sold",
    validate(markSoldSchema),
    adminController.markListingSold
);


// GET /api/admin/commissions
adminRouter.get(
    "/commissions",
    adminController.getCommissions);


// PATCH /api/admin/commissions/:id/reinitiate 
adminRouter.patch(
    "/commissions/:id/reinitiate",
    adminController.reinitiateCommission
);


// PATCH /api/admin/commissions/:id/cancel 
adminRouter.patch(
    "/commissions/:id/cancel",
    validate(cancelCommissionSchema),
    adminController.cancelCommission
);


export default adminRouter;