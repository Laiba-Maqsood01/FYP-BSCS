import { Router } from "express";
import * as controller from "./master.controller.js";

const router = Router();

router.get(
  "/brands",
  controller.getBrands
);

router.get(
  "/body-types",
  controller.getBodyTypes
);

router.get(
  "/provinces",
  controller.getProvinces
);

router.get(
  "/cities",
  controller.getCities
);

export default router;