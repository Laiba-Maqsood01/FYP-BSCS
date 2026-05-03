import * as listingService from "./listing.service.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

// createListing
export const createListing = asyncHandler(async (req, res) => {

  const listing = await listingService.createListing(
    req.body,
    req.user._id
  );

  res.status(201).json(
    new ApiResponse(201, "Listing created", listing)
  );
});

// get my listings
export const getMyListings = asyncHandler(async (req, res) => {

  const listings = await listingService.getMyListings(req.user._id);

  res.status(200).json(
    new ApiResponse(200, "My listings", listings)
  );
});

// update listing
export const updateListing = asyncHandler(async (req, res) => {

  const updated = await listingService.updateListing(
    req.params.id,
    req.user._id,
    req.body
  );

  res.status(200).json(
    new ApiResponse(200, "Listing updated", updated)
  );
});

// delete listing 
export const deleteListing = asyncHandler(async (req, res) => {

  await listingService.deleteListing(
    req.params.id,
    req.user._id
  );

  res.status(200).json(
    new ApiResponse(200, "Listing removed")
  );
});



