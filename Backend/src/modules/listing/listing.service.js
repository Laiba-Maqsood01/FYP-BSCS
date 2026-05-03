import listingModel from "./listing.model.js";
import { ApiError } from "../../utils/apiError.js";

// For creating listing
export async function createListing(data, userId) {

  const listing = await listingModel.create({
    ...data,
    seller: userId
  });

  return listing;
}

// get me listings
export async function getMyListings(userId) {
  return await listingModel.find({ seller: userId });
}

// update any listing
export async function updateListing(listingId, userId, data) {

  const listing = await listingModel.findById(listingId);

  if (!listing) {
    throw new ApiError(404, "Listing not found");
  }

  if (listing.seller.toString() !== userId.toString()) {
    throw new ApiError(403, "Not allowed");
  }

  if (["REMOVED", "SOLD"].includes(listing.status)) {
    throw new ApiError(
      400,
      `Cannot update a ${listing.status.toLowerCase()} listing`
    );
  }

  const allowedUpdates = [
    "title",
    "description",
    "brand",
    "model",
    "year",
    "price",
    "mileage",
    "fuelType",
    "transmission",
    "saleMode"
  ];

  Object.keys(data).forEach((key) => {
    if (!allowedUpdates.includes(key)) {
      delete data[key];
    }
  });

  Object.assign(listing, data);

  await listing.save();

  return listing;
}

// make status "REMOVED", delete listing
export async function deleteListing(listingId, userId) {

  const listing = await listingModel.findById(listingId);

  if (!listing) {
    throw new ApiError(404, "Listing not found");
  }

  if (listing.seller.toString() !== userId.toString()) {
    throw new ApiError(403, "Not allowed");
  }

  if (listing.status === "REMOVED") {
    throw new ApiError(400, "Listing already removed");
  }

  if (listing.status === "SOLD") {
    throw new ApiError(400, "Sold listing cannot be removed");
  }

  listing.status = "REMOVED";
  await listing.save();

  return true;
}

