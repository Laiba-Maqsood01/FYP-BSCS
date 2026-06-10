import { Router } from "express"
import * as controller from "./payment.controller.js";

const router = Router();

// router.post(
//   "/sandbox/success",
//   controller.sandboxSuccess
// );

router.post(
  "/webhook",
  controller.stripeWebhook
);

export default router;