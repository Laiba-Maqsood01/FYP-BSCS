import { Router } from "express"
import * as controller from "./payment.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = Router();

// router.post(
//   "/sandbox/success",
//   controller.sandboxSuccess
// );

router.post(
  "/webhook",
  controller.stripeWebhook
);

// GET /api/payment/my-history
router.get(
  "/my-history",
  authMiddleware,
  controller.getMyPayments
);

// GET /api/payment/:paymentId
router.get(
  "/:paymentId",
  authMiddleware,
  controller.getPaymentById
);

export default router;