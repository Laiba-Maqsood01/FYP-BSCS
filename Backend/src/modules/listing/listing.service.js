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

// Listings for public
export async function getPublicListings(query) {

  const {
    page = 1,
    limit = 10,

    brand,
    fuelType,
    transmission,
    inspectionStatus,

    minPrice,
    maxPrice,

    minYear,

    maxMileage,

    search,

    sortBy = "createdAt",
    sortOrder = "desc"
  } = query;

  const filters = {
    status: "ACTIVE"
  };

  // exact filters
  if (brand) filters.brand = brand;

  if (fuelType) filters.fuelType = fuelType;

  if (transmission) filters.transmission = transmission;

  if (inspectionStatus) {
    filters.inspectionStatus = inspectionStatus;
  }

  // price range
  if (minPrice || maxPrice) {
    filters.price = {};

    if (minPrice) {
      filters.price.$gte = Number(minPrice);
    }

    if (maxPrice) {
      filters.price.$lte = Number(maxPrice);
    }
  }

  // year
  if (minYear) {
    filters.year = {
      $gte: Number(minYear)
    };
  }

  // mileage
  if (maxMileage) {
    filters.mileage = {
      $lte: Number(maxMileage)
    };
  }

  // search
  if (search) {
    filters.$or = [
      {
        title: {
          $regex: search,
          $options: "i"
        }
      },
      {
        brand: {
          $regex: search,
          $options: "i"
        }
      },
      {
        model: {
          $regex: search,
          $options: "i"
        }
      }
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const sort = {
    [sortBy]: sortOrder === "asc" ? 1 : -1
  };

  const listings = await listingModel
    .find(filters)
    .populate("seller", "username")
    .sort(sort)
    .skip(skip)
    .limit(Number(limit));

  const total = await listingModel.countDocuments(filters);

  return {
    listings,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / limit)
    }
  };
}

// Get details of single listing
export async function getListingDetails(listingId) {

    const listing = await listingModel
        .findOne({
            _id: listingId,
            status: "ACTIVE"
        })
        .populate(
            "seller",
            "username createdAt"
        );

    if (!listing) {
        throw new ApiError(404, "Listing not found");
    }

    return listing;
}

