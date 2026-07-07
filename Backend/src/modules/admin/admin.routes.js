import express from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authorizeRoles } from "../../middlewares/role.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import * as adminController from "./admin.controller.js";
import * as reportController from "../inspection-report/inspectionReport.controller.js";

import { blockUserSchema, assignInspectorSchema, updateInspectionStatusSchema, uploadReportSchema, rejectListingSchema, rejectDeletionRequestSchema, markSoldSchema, cancelCommissionSchema, createFeaturedPlanSchema, updateFeaturedPlanSchema, addSlotSchema, updateSlotSchema, updateSiteSettingsSchema } from "./admin.validation.js";

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

// GET /api/admin/listings/:id (detail — any status)
adminRouter.get(
    "/listings/:id",
    adminController.getListingDetail);


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


// ---------- Featured Management ----------

// GET /api/admin/featured
adminRouter.get(
    "/featured",
    adminController.getFeatured);

// GET /api/admin/featured-plans
adminRouter.get(
    "/featured-plans",
    adminController.getFeaturedPlans);

// POST /api/admin/featured-plans
adminRouter.post(
    "/featured-plans",
    validate(createFeaturedPlanSchema),
    adminController.createFeaturedPlan);

// PATCH /api/admin/featured-plans/:id
adminRouter.patch(
    "/featured-plans/:id",
    validate(updateFeaturedPlanSchema),
    adminController.updateFeaturedPlan);


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


// PATCH /api/admin/inspections/:id/schedule
adminRouter.patch(
  "/inspections/:id/schedule",
  adminController.scheduleInspection
);

// ---------- Site Settings ----------
// GET /api/admin/settings
adminRouter.get("/settings", adminController.getSiteSettings);
// PATCH /api/admin/settings
adminRouter.patch("/settings", validate(updateSiteSettingsSchema), adminController.updateSiteSettings);

// ---------- Inspection Slots ----------
// GET /api/admin/settings/slots
adminRouter.get("/settings/slots", adminController.getInspectionSlots);
// POST /api/admin/settings/slots
adminRouter.post("/settings/slots", validate(addSlotSchema), adminController.addInspectionSlot);
// PATCH /api/admin/settings/slots/:slotId
adminRouter.patch("/settings/slots/:slotId", validate(updateSlotSchema), adminController.updateInspectionSlot);

// ---------- Inspection Report Builder ----------
// POST   /api/admin/inspections/:inspectionId/report  — init (create or return existing)
adminRouter.post("/inspections/:inspectionId/report", reportController.initReport);

// GET    /api/admin/inspections/:inspectionId/report  — check existence
adminRouter.get("/inspections/:inspectionId/report", reportController.getReportByInspection);

// GET    /api/admin/inspection-reports/meta  — checklist definition (must be before /:reportId)
adminRouter.get("/inspection-reports/meta", reportController.getChecklistMeta);

// GET    /api/admin/inspection-reports/:reportId
adminRouter.get("/inspection-reports/:reportId", reportController.getReport);

// PATCH  /api/admin/inspection-reports/:reportId
adminRouter.patch("/inspection-reports/:reportId", reportController.updateReport);

// POST   /api/admin/inspection-reports/:reportId/publish
adminRouter.post("/inspection-reports/:reportId/publish", reportController.publishReport);

export default adminRouter;