import listingModel from "./listing.model.js";
import inspectionModel from "../inspection/inspection.model.js";
import brandModel from "../master/models/brand.model.js"
import car_Model from "../master/models/carModel.model.js"
import { ApiError } from "../../utils/apiError.js";

// For creating listing
export async function createListing(data, userId) {

  const existingListing = await listingModel.findOne({
    seller: userId,
    brand: data.brand,
    carModel: data.carModel,
    city: data.city,
    year: data.year,

    // we only wants to block ACTIVE listing
    status: {
      $in: ["PENDING", "ACTIVE"]
    }
  });

  if (existingListing) {
    throw new ApiError(
      409,
      "You already have a listing for this car in this city"
    );
  }

  const listingData = {
    ...data,
    seller: userId,
    status: "PENDING"
  };


  const listing =
    await listingModel.create(listingData);

  return listing;
}

// get me listings
export async function getMyListings(userId) {

  return await listingModel
    .find({ seller: userId })
    .populate("brand", "name")
    .populate("carModel", "name")
    .populate("bodyType", "name")
    .populate("city", "name")
    .populate("registeredIn", "name")
    .sort({ createdAt: -1 });
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


  //SANITIZE INPUT
  const allowedUpdates = [
    "city",
    "registeredIn",

    "year",
    "brand",
    "carModel",
    "bodyType",

    "engineType",
    "engineCapacity",

    "transmission",
    "assembly",

    "exteriorColor",

    "mileage",
    "price",

    "description",

    "images",

    "mobileNumber",
    "secondaryNumber",
    "whatsappAllowed",

    "inspectionAddress",
    "inspectionDate",
    "inspectionTimeSlot"
  ];

  const sanitizedData = {};
  const ignoredFields = [];

  for (const key of Object.keys(data)) {
    if (allowedUpdates.includes(key)) {
      sanitizedData[key] = data[key];
    } else {
      ignoredFields.push(key);
    }
  }

  //SMART DUPLICATE CHECK (ONLY IF NEEDED)
  const keyFields = [
    "brand",
    "carModel",
    "city",
    "year",
    "transmission",
    "engineCapacity"
  ];

  const isChangingKeyFields = keyFields.some((field) =>
    Object.prototype.hasOwnProperty.call(sanitizedData, field)
  );

  if (isChangingKeyFields) {
    const duplicateFilter = {
      _id: { $ne: listingId },
      seller: userId,
      status: { $in: ["PENDING", "ACTIVE"] }
    };

    // build only changed fields (avoid false positives)
    if (sanitizedData.brand || listing.brand) {
      duplicateFilter.brand = sanitizedData.brand ?? listing.brand;
    }

    if (sanitizedData.carModel || listing.carModel) {
      duplicateFilter.carModel = sanitizedData.carModel ?? listing.carModel;
    }

    if (sanitizedData.city || listing.city) {
      duplicateFilter.city = sanitizedData.city ?? listing.city;
    }

    if (sanitizedData.year || listing.year) {
      duplicateFilter.year = sanitizedData.year ?? listing.year;
    }

    if (sanitizedData.transmission || listing.transmission) {
      duplicateFilter.transmission =
        sanitizedData.transmission ?? listing.transmission;
    }

    if (sanitizedData.engineCapacity || listing.engineCapacity) {
      duplicateFilter.engineCapacity =
        sanitizedData.engineCapacity ?? listing.engineCapacity;
    }

    const duplicateListing = await listingModel.findOne(duplicateFilter);

    if (duplicateListing) {
      throw new ApiError(409, "Duplicate listing already exists");
    }
  }

  //APPLY UPDATE
  Object.assign(listing, sanitizedData);

  await listing.save();
  // to tell user that unallowed fields are not updated!
  return {
    listing,
    ignoredFields: ignoredFields.length ? ignoredFields : null,
    message:
      ignoredFields.length
        ? "Listing updated, but some fields were ignored"
        : "Listing updated successfully"
  };
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
    carModel,
    city,
    registeredIn,
    bodyType,

    engineType,
    transmission,
    assembly,

    inspectionStatus,
    saleMode,

    minPrice,
    maxPrice,

    minYear,
    maxYear,

    minMileage,
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

  if (carModel) filters.carModel = carModel;

  if (city) filters.city = city;

  if (registeredIn) filters.registeredIn = registeredIn;

  if (bodyType) filters.bodyType = bodyType;

  if (engineType) filters.engineType = engineType;

  if (transmission) filters.transmission = transmission;

  if (assembly) filters.assembly = assembly;

  // INSPECTED CARS FILTER
  if (inspectionStatus === "INSPECTED") {

    const inspectedIds = await inspectionModel.distinct("listing", {
      status: "COMPLETED"
    });

    filters._id = { $in: inspectedIds };
  }

  if (saleMode) {
    filters.saleMode = saleMode;
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
  if (minYear || maxYear) {

    filters.year = {};

    if (minYear) {
      filters.year.$gte = Number(minYear);
    }

    if (maxYear) {
      filters.year.$lte = Number(maxYear);
    }
  }

  // mileage
  if (minMileage || maxMileage) {

    filters.mileage = {};

    if (minMileage) {
      filters.mileage.$gte = Number(minMileage);
    }

    if (maxMileage) {
      filters.mileage.$lte = Number(maxMileage);
    }
  }

  // search
  if (search) {
    const brands = await brandModel.find({
      name: { $regex: search, $options: "i" }
    }).select("_id");

    const models = await car_Model.find({
      name: { $regex: search, $options: "i" }
    }).select("_id");

    filters.$or = [
      { brand: { $in: brands.map(b => b._id) } },
      { car_Model: { $in: models.map(m => m._id) } },
      { description: { $regex: search, $options: "i" } }
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const sort = {
    isFeatured: -1,
    [sortBy]: sortOrder === "asc" ? 1 : -1
  };

  const listings = await listingModel
    .find(filters)
    .populate("seller", "username")
    .populate("brand", "name")
    .populate("carModel", "name")
    .populate("bodyType", "name")
    .populate("city", "name")
    .populate("registeredIn", "name")
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
    )
    .populate("brand", "name")
    .populate("carModel", "name")
    .populate("bodyType", "name")
    .populate("city", "name")
    .populate("registeredIn", "name");

  if (!listing) {
    throw new ApiError(404, "Listing not found");
  }

  return listing;
}

