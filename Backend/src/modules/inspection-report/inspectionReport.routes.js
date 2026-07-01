import { Router } from "express";
import { getPublicReport } from "./inspectionReport.controller.js";

const router = Router();

// GET /api/reports/:verifyToken  — public, no auth
router.get("/:verifyToken", getPublicReport);

export default router;
