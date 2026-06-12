import * as favoriteService from "./favorite.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";

// Save
export const saveListing = asyncHandler(async (req, res) => {
    const favorite = await favoriteService.saveListing(
        req.params.listingId,
        req.user._id
      );

    res.status(201).json(
      new ApiResponse(
        201,
        "Listing saved successfully",
        favorite
      )
    );
  });


// Remove
export const removeFavorite = asyncHandler(async (req, res) => {
    await favoriteService.removeFavorite(
      req.params.listingId,
      req.user._id
    );

    res.status(200).json(
      new ApiResponse(
        200,
        "Favorite removed successfully"
      )
    );
  });


// My Favorites
export const getMyFavorites = asyncHandler(async (req, res) => {
    const favorites = await favoriteService.getMyFavorites(
        req.user._id
      );

    res.status(200).json(
      new ApiResponse(
        200,
        "Favorites fetched successfully",
        favorites
      )
    );
  });


// Favorite Status
export const getFavoriteStatus = asyncHandler(async (req, res) => {
    const result = await favoriteService.getFavoriteStatus(
        req.params.listingId,
        req.user._id
      );

    res.status(200).json(
      new ApiResponse(
        200,
        "Favorite status fetched",
        result
      )
    );
  });