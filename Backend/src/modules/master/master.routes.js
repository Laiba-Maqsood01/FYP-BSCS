import { Router } from "express";
import * as controller from "./master.controller.js";

const router = Router();

router.get(
  "/brands", 
  controller.getBrands);

router.get(
  "/models", 
  controller.getModels);

router.get(
  "/years",
   controller.getYears);

router.get(
  "/body-types", 
  controller.getBodyTypes);

router.get(
  "/provinces", 
  controller.getProvinces);

router.get(
  "/cities", 
  controller.getCities);

router.get(
  "/cities-with-count",
  controller.getCitiesWithCount);

router.get(
  "/managed-cities",
  controller.getManagedCities);

export default router;