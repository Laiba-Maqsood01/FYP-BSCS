import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import * as uploadController from "./upload.controller.js";

const router = Router();

// POST /api/upload/sign
router.post(
  "/sign",
  authMiddleware,
  uploadController.getUploadSignature
);

export default router;