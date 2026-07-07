import listingModel from "./listing.model.js";
import inspectionModel from "../inspection/inspection.model.js";
import featuredModel from "../featured/featured.model.js"
import brandModel from "../master/models/brand.model.js"
import car_Model from "../master/models/carModel.model.js"
import cityModel from "../master/models/city.model.js"
import userModel from "../../models/user.model.js";
import contactRevealModel from "./contactReveal.model.js";
import { ApiError } from "../../utils/apiError.js";
import { deleteImages, deleteFiles } from "../upload/upload.service.js";
import { voidPendingPayments } from "../payment/payment.service.js";
import { MANAGED_SALE_CITY_NAMES, isManagedSaleCity } from "../../config/constants.js";
import { sendOtp, verifyOtp } from "../../services/sms.service.js";

// Mask a phone number for public display: keep first 4 + last 2, star the rest.
// 03001234567 -> 0300*****67
export function maskPhone(num) {
  if (!num) return null;
  const s = String(num).trim();
  if (s.length <= 6) return s;
  return `${s.slice(0, 4)}${"*".repeat(s.length - 6)}${s.slice(-2)}`;
}

// For creating listing
export async function createListing(data, userId) {

  // MANAGED sale is only available in specific cities
  if (data.saleMode === "MANAGED") {
    const cityDoc = await cityModel.findById(data.city).select("name");
    if (!cityDoc) throw new ApiError(404, "City not found");
    const isAllowed = isManagedSaleCity(cityDoc.name);
    if (!isAllowed) {
      throw new ApiError(
        400,
        `Managed Sale is only available in: ${MANAGED_SALE_CITY_NAMES.join(", ")}`
      );
    }
  }

  // Unregistered cars have no registeredIn province
  if (data.isRegistered === false) {
    data.registeredIn = null;
  }

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

  // re-edited after rejection → send back for admin review
  if (listing.status === "REJECTED") {
    listing.status = "PENDING";
    listing.rejectionReason = undefined;
  }

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

  // BLOCK IF INSPECTION IS IN PROGRESS
  const inProgressInspection = await inspectionModel.findOne({
    listing: listingId,
    status: "IN_PROGRESS"
  });

  if (inProgressInspection) {
    throw new ApiError(
      400,
      "Listing cannot be removed while inspection is in progress"
    );
  }

  // FETCH INSPECTIONS THAT MUST BE CANCELLED
  const inspections = await inspectionModel.find({
    listing: listingId,
    status: {
      $in: [
        "PENDING",
        "SCHEDULED"
      ]
    }
  });

  for (const Inspection of inspections) {

    let refundRequired = false;

    // SCHEDULED BUYER INSPECTION (buyer already paid, service not delivered)
    if (Inspection.status === "SCHEDULED" && Inspection.inspectionBy === "BUYER") {
      refundRequired = true;
    }

    Inspection.status = "CANCELLED";

    Inspection.cancelReason = "Listing removed by seller";

    Inspection.refundRequired = refundRequired;

    Inspection.refundStatus = refundRequired ? "PENDING" : "NOT_REQUIRED";

    await Inspection.save();

    await voidPendingPayments(Inspection._id);
  }

  // FEATURED CLEANUP
  await featuredModel.updateMany(
    {
      listing: listingId,
      status: {
        $in: ["PENDING", "ACTIVE"]
      }
    },
    {
      $set: {
        status: "REMOVED"
      }
    }
  );

  // Delete listing images from Cloudinary
  const imageFileIds = (listing.images || [])
    .map((img) => img.fileId)
    .filter(Boolean);

  await deleteImages(imageFileIds);

  // Delete inspection report PDFs from Cloudinary (if any exist for this listing)
  const Inspections = await inspectionModel.find({ listing: listingId });

  const reportFileIds = Inspections
    .map((insp) => insp.report?.fileId)
    .filter(Boolean);

  await deleteFiles(reportFileIds, "raw");

  listing.isFeatured = false;
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

    engineType,
    transmission,
    assembly,

    inspectionStatus,
    saleMode,
    featuredStatus,

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

  // featured filter — only show listings where isFeatured is true
  if (featuredStatus === "ACTIVE") {
    filters.isFeatured = true;
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
      { carModel: { $in: models.map(m => m._id) } },
      { description: { $regex: search, $options: "i" } }
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  // Default view (Newest First) pins featured listings on top for their paid
  // visibility boost. Once the user explicitly sorts (price/year/mileage/oldest),
  // the chosen field applies globally and featured listings are sorted in with
  // the rest — the buyer's intent wins.
  const isDefaultView = sortBy === "createdAt" && sortOrder === "desc";
  const sort = {};
  if (isDefaultView) sort.isFeatured = -1;
  sort[sortBy] = sortOrder === "asc" ? 1 : -1;

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

  // Find which of these listings have a completed inspection with a report uploaded
  const listingIds = listings.map(l => l._id);
  const inspectedIds = await inspectionModel.distinct("listing", {
    listing: { $in: listingIds },
    status: "COMPLETED",
    "report.url": { $exists: true, $ne: null },
  });
  const inspectedSet = new Set(inspectedIds.map(id => id.toString()));

  const listingsWithInspection = listings.map(l => {
    const obj = l.toObject();
    obj.isInspected = inspectedSet.has(l._id.toString());
    // Don't leak raw seller numbers in the public grid
    obj.mobileNumber    = maskPhone(obj.mobileNumber);
    obj.secondaryNumber = maskPhone(obj.secondaryNumber);
    return obj;
  });

  return {
    listings: listingsWithInspection,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / limit)
    }
  };
}

// Owner fetches own listing regardless of status (used for inspection booking)
export async function getMyListingDetail(listingId, userId) {
  const listing = await listingModel
    .findOne({ _id: listingId, seller: userId })
    .populate("seller", "username")
    .populate("brand", "name")
    .populate("carModel", "name")
    .populate("city", "name");

  if (!listing) throw new ApiError(404, "Listing not found");
  return listing;
}

// Get details of single listing.
// Public callers only see ACTIVE listings. The admin panel reaches this with
// anyStatus=true (via GET /api/admin/listings/:id, guarded by role middleware)
// to review PENDING / REJECTED listings.
export async function getListingDetails(listingId, anyStatus = false) {

  const filter = { _id: listingId };
  if (!anyStatus) filter.status = "ACTIVE";

  const listing = await listingModel
    .findOne(filter)
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

  // Never expose raw seller contact numbers in the public payload — they are
  // revealed only through the OTP-gated reveal endpoint.
  const obj = listing.toObject();
  obj.mobileNumber    = maskPhone(obj.mobileNumber);
  obj.secondaryNumber = maskPhone(obj.secondaryNumber);

  return obj;
}

// ── Seller contact reveal (OTP-gated) ─────────────────────────────────────────

// Step 1: send an OTP to the requesting buyer's own registered number.
// Owner (viewing own listing) and admins skip OTP entirely.
export async function requestContactOtp(listingId, user) {
  const listing = await listingModel.findOne({ _id: listingId, status: "ACTIVE" });
  if (!listing) throw new ApiError(404, "Listing not found");

  const isOwner = listing.seller.toString() === user._id.toString();
  if (isOwner || user.role === "admin") {
    return { otpRequired: false };
  }

  if (!user.mobileNumber) {
    throw new ApiError(400, "Your account has no mobile number to send the code to");
  }

  await sendOtp(user.mobileNumber);
  return { otpRequired: true, sentTo: maskPhone(user.mobileNumber) };
}

// Step 2: verify the OTP, log the reveal, and return the real seller number(s).
export async function verifyContactOtp(listingId, user, code, ip) {
  const listing = await listingModel.findById(listingId);
  if (!listing || listing.status !== "ACTIVE") throw new ApiError(404, "Listing not found");

  const isOwner = listing.seller.toString() === user._id.toString();
  const privileged = isOwner || user.role === "admin";

  if (!privileged) {
    if (!code) throw new ApiError(400, "Verification code is required");
    const ok = await verifyOtp(user.mobileNumber, code);
    if (!ok) throw new ApiError(400, "Invalid or expired code");
  }

  // Audit every reveal by a non-owner buyer (skip owner viewing own listing).
  if (!isOwner) {
    await contactRevealModel.create({
      listing: listing._id,
      seller:  listing.seller,
      viewer:  user._id,
      ip:      ip || null,
    });
  }

  return {
    mobileNumber:    listing.mobileNumber,
    secondaryNumber: listing.secondaryNumber || null,
    whatsappAllowed: listing.whatsappAllowed,
  };
}
// User marks their own GENERAL listing as SOLD
export async function markListingSoldByUser(listingId, userId) {
  const listing = await listingModel.findById(listingId);
  if (!listing) throw new ApiError(404, "Listing not found");
  if (listing.seller.toString() !== userId.toString()) throw new ApiError(403, "Not allowed");
  if (listing.saleMode !== "GENERAL") throw new ApiError(400, "Only GENERAL listings can be marked as sold by the seller");
  if (listing.status === "SOLD") throw new ApiError(400, "Listing is already marked as sold");
  if (!["ACTIVE", "PENDING"].includes(listing.status)) throw new ApiError(400, "Only active listings can be marked as sold");

  listing.status = "SOLD";
  await listing.save();
  return listing;
}
