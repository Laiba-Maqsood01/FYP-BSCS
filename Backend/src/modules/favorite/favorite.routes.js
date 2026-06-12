import { Router } from "express";
import * as controller from "./favorite.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { listingIdParamsSchema} from "./favorite.validation.js";

const router = Router();

// Save Listing
router.post(
  "/:listingId",
  authMiddleware,
  validate(listingIdParamsSchema, "params"),
  controller.saveListing
);

// Remove Favorite
router.delete(
  "/:listingId",
  authMiddleware,
  validate( listingIdParamsSchema, "params"),
  controller.removeFavorite
);


// My Favorites
router.get(
  "/",
  authMiddleware,
  controller.getMyFavorites
);


// Check Status
// Has this user already saved this listing?
router.get(
  "/:listingId/status",
  authMiddleware,
  validate( listingIdParamsSchema, "params"),
  controller.getFavoriteStatus
);

export default router;