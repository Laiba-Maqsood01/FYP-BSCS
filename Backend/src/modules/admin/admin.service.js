import mongoose from "mongoose";
import userModel from "../../models/user.model.js";
import { getSettings, updateSettings } from "../../models/siteSettings.model.js";
import listingModel from "../listing/listing.model.js";
import inspectionModel from "../inspection/inspection.model.js";
import paymentModel from "../payment/payment.model.js";
import featuredModel from "../featured/featured.model.js";
import featuredPlanModel from "../featured/featured-plan.model.js";
import favoriteModel from "../favorite/favorite.model.js"
import sessionModel from "../../models/session.model.js"
import { ApiError } from "../../utils/apiError.js";
import { ACCOUNT_STATUS } from "../../utils/constants.js";

import { cleanupListingForDeletion } from "../../helpers/listing.cleanup.helper.js"
import { processStripeRefund } from "../payment/payment.service.js";
import { deleteImages, deleteFiles } from "../upload/upload.service.js";
import { sendEmail } from "../../services/email.service.js";
import { sendSms } from "../../services/sms.service.js";

import listingDeletionRequestModel from "../managed-sale/listing-deletion-request.model.js";
import commissionModel from "../managed-sale/commission.model.js";



// Dashboard
export async function getDashboard() {
  const now        = new Date();
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

  const [userStats, listingStats, inspectionStats, revenueStats, weeklyRevenueStats, weeklyListingStats, favoriteStats] = await Promise.all([
    // User stats
    userModel.aggregate([
      {
        $facet: {
          total: [{ $count: "count" }],
          active: [
            { $match: { accountStatus: ACCOUNT_STATUS.ACTIVE } },
            { $count: "count" },
          ],
          blocked: [
            { $match: { accountStatus: ACCOUNT_STATUS.BLOCKED } },
            { $count: "count" },
          ],
          deleted: [
            { $match: { isDeleted: true } },
            { $count: "count" },
          ],
        },
      },
    ]),

    // Listing stats
    listingModel.aggregate([
      {
        $facet: {
          total: [{ $count: "count" }],
          pending: [
            { $match: { status: "PENDING" } },
            { $count: "count" },
          ],
          active: [
            { $match: { status: "ACTIVE" } },
            { $count: "count" },
          ],
          sold: [
            { $match: { status: "SOLD" } },
            { $count: "count" },
          ],
          rejected: [
            { $match: { status: "REJECTED" } },
            { $count: "count" },
          ],
          removed: [
            { $match: { status: "REMOVED" } },
            { $count: "count" },
          ],
        },
      },
    ]),

    // Inspection stats
    inspectionModel.aggregate([
      {
        $facet: {
          total: [{ $count: "count" }],
          pending: [
            { $match: { status: "PENDING" } },
            { $count: "count" },
          ],
          pending_coordination: [
            { $match: { status: "PENDING_COORDINATION" } },
            { $count: "count" },
          ],
          scheduled: [
            { $match: { status: "SCHEDULED" } },
            { $count: "count" },
          ],
          inProgress: [
            { $match: { status: "IN_PROGRESS" } },
            { $count: "count" },
          ],
          completed: [
            { $match: { status: "COMPLETED" } },
            { $count: "count" },
          ],
          cancelled: [
            { $match: { status: "CANCELLED" } },
            { $count: "count" },
          ],
          pendingRefunds: [
            { $match: { refundRequired: true, refundStatus: "PENDING" } },
            { $count: "count" },
          ],
        },
      },
    ]),

    // Revenue stats — only SUCCESS payments
    paymentModel.aggregate([
      { $match: { status: "SUCCESS" } },
      {
        $facet: {
          total: [
            {
              $group: {
                _id: null,
                amount: { $sum: "$amount" },
              },
            },
          ],
          byPurpose: [
            {
              $group: {
                _id: "$purpose",
                amount: { $sum: "$amount" },
              },
            },
          ],
        },
      },
    ]),

    // Weekly revenue — last 7 days grouped by day
    paymentModel.aggregate([
      {
        $match: {
          status: "SUCCESS",
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            year:  { $year:  "$createdAt" },
            month: { $month: "$createdAt" },
            day:   { $dayOfMonth: "$createdAt" },
          },
          revenue: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]),

    // Weekly listings — last 7 days grouped by day + saleMode
    listingModel.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            year:     { $year:  "$createdAt" },
            month:    { $month: "$createdAt" },
            day:      { $dayOfMonth: "$createdAt" },
            saleMode: "$saleMode",
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]),

    // Favorite stats - users save as favorite
    favoriteModel.aggregate([
      {
        $facet: {
          totalFavorites: [
            { $count: "count" }
          ],

          usersWhoFavorited: [
            {
              $group: {
                _id: "$user"
              }
            },
            {
              $count: "count"
            }
          ],

          listingsFavorited: [
            {
              $group: {
                _id: "$listing"
              }
            },
            {
              $count: "count"
            }
          ]
        }
      }
    ])

  ]);

  // Helper to safely extract count from $facet result
  const count = (facetResult, key) =>
    facetResult?.[0]?.[key]?.[0]?.count ?? 0;

  const totalRevenue = revenueStats?.[0]?.total?.[0]?.amount ?? 0;

  const revenueByPurpose = (revenueStats?.[0]?.byPurpose ?? []).reduce(
    (acc, item) => {
      acc[item._id] = item.amount;
      return acc;
    },
    {}
  );

  // Build a day-label → revenue map for the past 7 days
  const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weeklyRevenueMap = {};
  for (const entry of (weeklyRevenueStats ?? [])) {
    const d   = new Date(entry._id.year, entry._id.month - 1, entry._id.day);
    const key = DAY_NAMES[d.getDay()];
    weeklyRevenueMap[key] = (weeklyRevenueMap[key] ?? 0) + entry.revenue;
  }

  // Build the 7-day labels starting from 7 days ago
  const weeklyRevenue = [];
  for (let i = 6; i >= 0; i--) {
    const d   = new Date(now - i * 24 * 60 * 60 * 1000);
    const key = DAY_NAMES[d.getDay()];
    weeklyRevenue.push({ day: key, revenue: weeklyRevenueMap[key] ?? 0 });
  }

  // Build weekly listings map: key = "Mon" → { GENERAL: n, MANAGED: n }
  const weeklyListingsMap = {};
  for (const entry of (weeklyListingStats ?? [])) {
    const d   = new Date(entry._id.year, entry._id.month - 1, entry._id.day);
    const key = DAY_NAMES[d.getDay()];
    if (!weeklyListingsMap[key]) weeklyListingsMap[key] = { GENERAL: 0, MANAGED: 0 };
    weeklyListingsMap[key][entry._id.saleMode] = (weeklyListingsMap[key][entry._id.saleMode] ?? 0) + entry.count;
  }

  const weeklyListings = [];
  for (let i = 6; i >= 0; i--) {
    const d   = new Date(now - i * 24 * 60 * 60 * 1000);
    const key = DAY_NAMES[d.getDay()];
    weeklyListings.push({
      day:     key,
      General: weeklyListingsMap[key]?.GENERAL ?? 0,
      Managed: weeklyListingsMap[key]?.MANAGED ?? 0,
    });
  }

  return {
    users: {
      total: count(userStats, "total"),
      active: count(userStats, "active"),
      blocked: count(userStats, "blocked"),
      deleted: count(userStats, "deleted"),
    },
    listings: {
      total: count(listingStats, "total"),
      pending: count(listingStats, "pending"),
      active: count(listingStats, "active"),
      sold: count(listingStats, "sold"),
      rejected: count(listingStats, "rejected"),
      removed: count(listingStats, "removed"),
    },
    inspections: {
      total: count(inspectionStats, "total"),
      pending: count(inspectionStats, "pending"),
      pending_coordination: count(inspectionStats, "pending_coordination"),
      scheduled: count(inspectionStats, "scheduled"),
      inProgress: count(inspectionStats, "inProgress"),
      completed: count(inspectionStats, "completed"),
      cancelled: count(inspectionStats, "cancelled"),
      pendingRefunds: count(inspectionStats, "pendingRefunds"),
    },
    favorite: {
      totalFavorites: count(favoriteStats, "totalFavorites"),
      usersWhoFavorited: count(favoriteStats, "usersWhoFavorited"),
      listingsFavorited: count(favoriteStats, "listingsFavorited"),
    },
    revenue: {
      total: totalRevenue,
      byPurpose: revenueByPurpose,
    },
    weeklyRevenue,
    weeklyListings,
  };
}

// Users management
export async function getUsers(query) {
  const {
    page = 1,
    limit = 10,
    accountStatus,
    isDeleted,
    search,
  } = query;

  const filter = {};

  // Filter by account status if provided
  if (accountStatus) {
    filter.accountStatus = accountStatus;
  }

  // Filter deleted users
  // if isDeleted=true show only deleted, if false show only non-deleted
  // if not provided, show all users
  if (isDeleted !== undefined) {
    filter.isDeleted = isDeleted === "true";
  }

  // Search by username or email or mobile
  if (search) {
    filter.$or = [
      { username: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { mobileNumber: { $regex: search, $options: "i" } }
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [users, total] = await Promise.all([
    userModel.find(filter)
      .select("-password -__v")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    userModel.countDocuments(filter),
  ]);

  return {
    users,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
}


export async function getUserDetail(userId) {
  const user = await userModel.findById(userId).select("-password -__v");

  if (!user) throw new ApiError(404, "User not found");

  // Fetch their listings and inspection counts in parallel
  const [listingCount, inspectionCount] = await Promise.all([
    listingModel.countDocuments({ seller: userId }),
    inspectionModel.countDocuments({ requestedBy: userId })
  ]);

  return {
    user,
    stats: {
      listings: listingCount,
      inspections: inspectionCount,
    },
  };
}


export async function toggleBlockUser(userId, days) {
  const user = await userModel.findById(userId);

  if (!user)
    throw new ApiError(404, "User not found");

  if (user.role === "admin")
    throw new ApiError(403, "Cannot block an admin");

  if (user.isDeleted)
    throw new ApiError(400, "User is already deleted");

  // admin manually unblocked user, like earlier,  automatic unblock is in auth.middleware
  const isCurrentlyBlocked = user.accountStatus === ACCOUNT_STATUS.BLOCKED &&
    user.blockedUntil && new Date() < user.blockedUntil;

  if (isCurrentlyBlocked) {
    // Unblock
    user.accountStatus = ACCOUNT_STATUS.ACTIVE;
    user.blockedUntil = null;
    await user.save();

    return { message: "User unblocked successfully", user };

  } else {
    // Block
    if (!days) throw new ApiError(400, "days is required to block a user");

    const blockedUntil = new Date();
    blockedUntil.setDate(blockedUntil.getDate() + Number(days));

    user.accountStatus = ACCOUNT_STATUS.BLOCKED;
    user.blockedUntil = blockedUntil;
    await user.save();

    return {
      message: `User blocked for ${days} day(s) until ${blockedUntil.toDateString()}`,
      user,
    };
  }
}


export async function deleteUser(userId) {
  const user = await userModel.findById(userId);

  if (!user) throw new ApiError(404, "User not found");
  if (user.role === "admin") throw new ApiError(403, "Cannot delete an admin");
  if (user.isDeleted) throw new ApiError(400, "User is already deleted");

  // Step 1 — get all listings owned by this user
  const listings = await listingModel.find(
    { seller: userId },
    { _id: 1, status: 1, saleMode: 1 }
  );

  // Step 2 — cancel any PENDING commissions first
  for (const listing of listings) {
    if (listing.status === "PENDING_COMMISSION") {
      const commission = await commissionModel.findOne({
        listing: listing._id,
        status: { $in: ["PENDING", "EXPIRED"] },
      });

      if (commission) {
        commission.status = "CANCELLED";
        commission.cancelReason = "Account deleted by admin";
        await commission.save();

        // Cancel related pending payment if exists
        if (commission.payment) {
          await paymentModel.findByIdAndUpdate(commission.payment, {
            status: "FAILED",
          });
        }
      }
      //  reset listing status so cleanup helper doesn't block it
      await listingModel.findByIdAndUpdate(listing._id, {
        status: "ACTIVE",
      });
    }
  }


  // Step 3 — force cleanup all listings (admin can override IN_PROGRESS)
  for (const listing of listings) {
    await cleanupListingForDeletion(
      listing._id,
      true, // admin force cancel
      "Listing deleted — account deleted by admin"
    );
  }

  // Step 4 — delete all Cloudinary assets for each listing
  for (const listing of listings) {
    const fullListing = await listingModel.findById(listing._id, { images: 1 });

    // Delete images
    const imageFileIds = (fullListing.images || [])
      .map((img) => img.fileId)
      .filter(Boolean);

    await deleteImages(imageFileIds);

    // Delete inspection report PDFs if any
    const inspections = await inspectionModel.find(
      { listing: listing._id },
      { report: 1 }
    );

    const reportFileIds = inspections
      .map((insp) => insp.report?.fileId)
      .filter(Boolean);

    await deleteFiles(reportFileIds, "raw");
  }

  // Step 5 — mark all listings as REMOVED  ← renumber this and below
  await listingModel.updateMany(
    { seller: userId },
    { status: "REMOVED" }
  );

  // Step 6 — soft delete (keep credentials so they can't re-register with same email)
  user.isDeleted = true;
  user.deletedAt = new Date();
  user.accountStatus = ACCOUNT_STATUS.BLOCKED;
  user.blockedUntil = null;
  await user.save();

  // Step 7 — revoke all sessions
  await sessionModel.updateMany({ user: userId }, { revoked: true });

  return { message: "User deleted successfully" };
}

// Listings management
export async function getListings(query) {
  const {
    page = 1,
    limit = 10,
    status,
    search,
    isFeatured,
    seller,
  } = query;

  const matchStage = {};

  if (status)    matchStage.status = status;
  if (seller)    matchStage.seller = new mongoose.Types.ObjectId(seller);
  if (isFeatured !== undefined) matchStage.isFeatured = isFeatured === "true";

  // Search by title
  if (search) {
    matchStage.title = { $regex: search, $options: "i" };
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [listings, total] = await Promise.all([
    listingModel.aggregate([
      { $match: matchStage },

      // Join seller info
      {
        $lookup: {
          from: "users",
          localField: "seller",
          foreignField: "_id",
          as: "seller",
        },
      },
      { $unwind: "$seller" },

      // Join brand
      {
        $lookup: {
          from: "brands",
          localField: "brand",
          foreignField: "_id",
          as: "brand",
        },
      },
      { $unwind: "$brand" },

      // Join carModel
      {
        $lookup: {
          from: "car_models",
          localField: "carModel",
          foreignField: "_id",
          as: "carModel",
        },
      },
      { $unwind: "$carModel" },

      // Latest non-cancelled inspection — the UI uses this to hide Reject
      // once the inspection is IN_PROGRESS or COMPLETED.
      {
        $lookup: {
          from: "inspections",
          let: { listingId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$listing", "$$listingId"] },
                status: { $ne: "CANCELLED" },
              },
            },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
            { $project: { status: 1 } },
          ],
          as: "activeInspection",
        },
      },

      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: Number(limit) },

      {
        $project: {
          _id: 1,
          title: 1,
          price: 1,
          year: 1,
          status: 1,
          saleMode: 1,
          isFeatured: 1,
          createdAt: 1,
          inspectionStatus: { $arrayElemAt: ["$activeInspection.status", 0] },
          "seller._id": 1,
          "seller.username": 1,
          "seller.email": 1,
          "brand._id": 1,
          "brand.name": 1,
          "carModel._id": 1,
          "carModel.name": 1,
        },
      },
    ]),

    listingModel.countDocuments(matchStage),
  ]);

  return {
    listings,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
}


export async function approveListing(listingId) {
  const listing = await listingModel.findById(listingId);

  if (!listing)
    throw new ApiError(404, "Listing not found");

  if (listing.saleMode === "MANAGED") {
    throw new ApiError(
      400,
      "Managed listings cannot be approved manually. They are activated automatically when the inspection report is uploaded."
    );
  }

  if (listing.status !== "PENDING") {
    throw new ApiError(400, `Cannot approve a listing with status ${listing.status}`);
  }

  listing.status = "ACTIVE";
  await listing.save();

  return { message: "Listing approved successfully", listing };
}


export async function rejectListing(listingId, reason) {
  const listing = await listingModel.findById(listingId);

  if (!listing)
    throw new ApiError(404, "Listing not found");

  if (listing.status !== "PENDING") {
    throw new ApiError(400, `Cannot reject a listing with status ${listing.status}`);
  }

  // Rejection is only allowed BEFORE the inspection starts. Once the
  // inspector is on site (IN_PROGRESS) or done (COMPLETED), the admin must
  // use Remove instead — the frontend hides Reject in those states, and this
  // guard enforces it server-side.
  const inspection = await inspectionModel.findOne({
    listing: listingId,
    status: { $ne: "CANCELLED" },
  });

  if (inspection && ["IN_PROGRESS", "COMPLETED"].includes(inspection.status)) {
    throw new ApiError(
      400,
      `Cannot reject: this listing's inspection is ${inspection.status.replace("_", " ").toLowerCase()}. Use Remove instead.`
    );
  }

  // Cancel the not-yet-started inspection. If the requester already paid,
  // queue a refund in the ManageRefunds queue — the admin is rejecting the
  // listing, so the paid service will never be delivered.
  if (inspection) {
    const refundRequired = !!inspection.payment;

    inspection.status = "CANCELLED";
    inspection.cancelReason = "Listing rejected by admin";
    inspection.refundRequired = refundRequired;
    inspection.refundStatus = refundRequired ? "PENDING" : "NOT_REQUIRED";
    await inspection.save();
  }

  // Images are intentionally kept — a rejected listing can be edited and
  // resubmitted, and deleting the Cloudinary files would leave broken image
  // URLs on resubmission. Images are cleaned up on removal/deletion instead.
  listing.status = "REJECTED";
  listing.rejectionReason = reason;
  await listing.save();

  return { message: "Listing rejected successfully", listing };
}


export async function removeListing(listingId) {
  const listing = await listingModel.findById(listingId);

  if (!listing) throw new ApiError(404, "Listing not found");
  if (listing.status === "REMOVED") {
    throw new ApiError(400, "Listing is already removed");
  }

  // Force cancel any inspection including IN_PROGRESS (admin override)
  const { blocked } = await cleanupListingForDeletion(
    listingId,
    true, // forceCancel
    "Listing removed by admin"
  );

  // blocked will never be true here since forceCancel = true
  // but guard it just in case
  if (blocked) {
    throw new ApiError(400, "Could not remove listing");
  }

  // Delete images from 
  const imageFileIds = (listing.images || [])
    .map((img) => img.fileId)
    .filter(Boolean);

  await deleteImages(imageFileIds);

  // Delete pdf inspection reports
  const inspections = await inspectionModel.find({ listing: listingId });

  const reportFileIds = inspections
    .map((insp) => insp.report?.fileId)
    .filter(Boolean);

  await deleteFiles(reportFileIds, "raw");

  listing.status = "REMOVED";
  await listing.save();

  return { message: "Listing removed successfully", listing };
}

// Inspection management
export async function getInspections(query) {
  const {
    page = 1,
    limit = 10,
    status,
    type,
    inspectionBy,
    refundRequired,
    refundStatus,
    assignedInspector,
  } = query;

  const matchStage = {};

  if (status) matchStage.status = status;
  if (type) matchStage.type = type;
  if (inspectionBy) matchStage.inspectionBy = inspectionBy;
  if (refundStatus) matchStage.refundStatus = refundStatus;
  if (refundRequired !== undefined) {
    matchStage.refundRequired = refundRequired === "true";
  }
  // filter unassigned inspections if assignedInspector=false
  if (assignedInspector === "false") {
    matchStage.assignedInspector = null;
  } else if (assignedInspector === "true") {
    matchStage.assignedInspector = { $ne: null };
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [inspections, total] = await Promise.all([
    inspectionModel.aggregate([
      { $match: matchStage },

      // Join listing
      {
        $lookup: {
          from: "listings",
          localField: "listing",
          foreignField: "_id",
          as: "listing",
        },
      },
      { $unwind: "$listing" },

      // Join requestedBy user
      {
        $lookup: {
          from: "users",
          localField: "requestedBy",
          foreignField: "_id",
          as: "requestedBy",
        },
      },
      { $unwind: "$requestedBy" },

      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: Number(limit) },

      {
        $project: {
          _id: 1,
          type: 1,
          inspectionBy: 1,
          status: 1,
          assignedInspector: 1,
          refundRequired: 1,
          refundStatus: 1,
          inspectionAddress: 1,
          scheduledDate: 1,
          timeSlot: 1,
          report: 1,
          createdAt: 1,
          "listing._id": 1,
          "listing.title": 1,
          "listing.saleMode": 1,
          "listing.status": 1,
          "requestedBy._id": 1,
          "requestedBy.username": 1,
          "requestedBy.email": 1,
        },
      },
    ]),

    inspectionModel.countDocuments(matchStage),
  ]);

  return {
    inspections,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
}


export async function assignInspector(inspectionId, assignedInspector) {
  const inspection = await inspectionModel.findById(inspectionId);

  if (!inspection) throw new ApiError(404, "Inspection not found");

  if (["COMPLETED", "CANCELLED"].includes(inspection.status)) {
    throw new ApiError(
      400,
      `Cannot assign inspector to a ${inspection.status} inspection`
    );
  }

  inspection.assignedInspector = assignedInspector;
  await inspection.save();

  return { message: "Inspector assigned successfully", inspection };
}


export async function updateInspectionStatus(inspectionId, status, cancelReason) {
  const inspection = await inspectionModel.findById(inspectionId);

  if (!inspection) throw new ApiError(404, "Inspection not found");

  if (inspection.status === "CANCELLED") {
    throw new ApiError(400, "Cannot update status of a cancelled inspection");
  }

  if (inspection.status === "COMPLETED") {
    throw new ApiError(400, "Cannot update status of a completed inspection");
  }

  if (inspection.status === "PENDING") {
    throw new ApiError(400, "Cannot update status of an unpaid inspection");
  }

  // Guard valid transitions only
  const validTransitions = {
    PENDING_COORDINATION: ["SCHEDULED", "CANCELLED"],
    SCHEDULED: ["IN_PROGRESS", "CANCELLED"],
    IN_PROGRESS: ["COMPLETED"],
  };

  const allowed = validTransitions[inspection.status] || [];

  if (!allowed.includes(status)) {
    throw new ApiError(
      400,
      `Cannot transition from ${inspection.status} to ${status}. Allowed: ${allowed.join(", ")}`
    );
  }

  // Capture the previous status before mutating, needed for refund eligibility check.
  const previousStatus = inspection.status;
  inspection.status = status;

  // When admin cancels a buyer inspection that was already paid for,
  // mark it for refund so it appears in the ManageRefunds queue.
  if (status === "CANCELLED") {
    if (cancelReason) inspection.cancelReason = cancelReason;

    const refundableStatuses = ["PENDING", "PENDING_COORDINATION", "SCHEDULED"];
    if (
      inspection.inspectionBy === "BUYER" &&
      refundableStatuses.includes(previousStatus) &&
      inspection.payment
    ) {
      inspection.refundRequired = true;
      inspection.refundStatus = "PENDING";
    }
  }

  await inspection.save();

  return { message: "Inspection status updated successfully", inspection };
}


export async function uploadInspectionReport(inspectionId, { url, fileId, inspectorNotes}) {
  const inspection = await inspectionModel.findById(inspectionId).populate("listing");

  if (!inspection) throw new ApiError(404, "Inspection not found");

  if (inspection.status !== "COMPLETED") {
    throw new ApiError(400, "Report can only be uploaded for completed inspections");
  }

  // Save report on inspection
  inspection.report = { url, fileId };
  await inspection.save();

  if (inspectorNotes) {
    inspection.inspectorNotes = inspectorNotes;
  }

  await inspection.save();


  // If this is a managed listing — activate it now
  const listing = inspection.listing;
  if (listing && listing.saleMode === "MANAGED" && listing.status === "PENDING") {
    listing.status = "ACTIVE";
    await listing.save();
  }

  return {
    message: "Report uploaded successfully",
    inspection,
  };
}

// Featured
export async function getFeatured(query) {
  const {
    page = 1,
    limit = 10,
    status,
    plan,
    dateFrom,
    dateTo,
  } = query;

  const matchStage = {};

  if (status) matchStage.status = status;
  if (plan) matchStage.plan = plan;

  // Date range filter on createdAt
  if (dateFrom || dateTo) {
    matchStage.createdAt = {};
    if (dateFrom) matchStage.createdAt.$gte = new Date(dateFrom);
    if (dateTo) matchStage.createdAt.$lte = new Date(dateTo);
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [featured, total] = await Promise.all([
    featuredModel.aggregate([
      { $match: matchStage },

      // Join listing
      {
        $lookup: {
          from: "listings",
          localField: "listing",
          foreignField: "_id",
          as: "listing",
        },
      },
      { $unwind: "$listing" },

      // Join seller from listing
      {
        $lookup: {
          from: "users",
          localField: "listing.seller",
          foreignField: "_id",
          as: "seller",
        },
      },
      { $unwind: "$seller" },

      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: Number(limit) },

      {
        $project: {
          _id: 1,
          plan: 1,
          status: 1,
          amount: 1,
          startDate: 1,
          endDate: 1,
          durationDays: 1,
          createdAt: 1,
          "listing._id": 1,
          "listing.title": 1,
          "listing.price": 1,
          "listing.saleMode": 1,
          "listing.status": 1,
          "seller._id": 1,
          "seller.username": 1,
          "seller.email": 1,
        },
      },
    ]),

    featuredModel.countDocuments(matchStage),
  ]);

  return {
    featured,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
}

// Refund
// export async function getRefunds() { }
export async function getRefunds(query) {
  const {
    page = 1,
    limit = 10,
    refundStatus,
    inspectionBy,
    type,
  } = query;

  // Base filter — only inspections that require refund
  const matchStage = { refundRequired: true };

  if (refundStatus) matchStage.refundStatus = refundStatus;
  if (inspectionBy) matchStage.inspectionBy = inspectionBy;
  if (type) matchStage.type = type;

  const skip = (Number(page) - 1) * Number(limit);

  const [refunds, total] = await Promise.all([
    inspectionModel.aggregate([
      { $match: matchStage },

      // Join listing
      {
        $lookup: {
          from: "listings",
          localField: "listing",
          foreignField: "_id",
          as: "listing",
        },
      },
      { $unwind: "$listing" },

      // Join requestedBy user
      {
        $lookup: {
          from: "users",
          localField: "requestedBy",
          foreignField: "_id",
          as: "requestedBy",
        },
      },
      { $unwind: "$requestedBy" },

      // Join payment to get amount + paymentIntentId
      {
        $lookup: {
          from: "payments",
          localField: "_id",
          foreignField: "referenceId",
          as: "payment",
        },
      },
      { $unwind: { path: "$payment", preserveNullAndEmptyArrays: true } },

      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: Number(limit) },

      {
        $project: {
          _id: 1,
          type: 1,
          inspectionBy: 1,
          status: 1,
          refundRequired: 1,
          refundStatus: 1,
          cancelReason: 1,
          createdAt: 1,
          "listing._id": 1,
          "listing.title": 1,
          "requestedBy._id": 1,
          "requestedBy.username": 1,
          "requestedBy.email": 1,
          "payment._id": 1,
          "payment.amount": 1,
          "payment.method": 1,
          "payment.stripePaymentIntentId": 1,
        },
      },
    ]),

    inspectionModel.countDocuments(matchStage),
  ]);

  return {
    refunds,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
}


// Approve refund
export async function approveRefund(inspectionId) {
  const inspection = await inspectionModel
    .findById(inspectionId)
    .populate("requestedBy", "username email")
    .populate("payment", "amount");

  if (!inspection) throw new ApiError(404, "Inspection not found");
  if (!inspection.refundRequired) throw new ApiError(400, "This inspection does not require a refund");
  if (inspection.refundStatus === "PROCESSED") throw new ApiError(400, "Refund already processed");
  if (inspection.refundStatus === "NOT_REQUIRED") throw new ApiError(400, "Refund not required");

  // Get payment amount before processing
  const payment = await paymentModel.findOne({ referenceId: inspectionId });
  const amount = payment?.amount;

  // Payment logic stays in payment module
  await processStripeRefund(inspectionId);

  // Only update DB after Stripe succeeds
  inspection.refundStatus = "PROCESSED";
  await inspection.save();

  // Notify user by email
  const user = inspection.requestedBy;
  if (user?.email) {
    const amountStr = amount ? `PKR ${amount.toLocaleString()}` : "your inspection fee";
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0">
        <h2 style="font-size:20px;font-weight:700;color:#0f172a;margin:0 0 8px">Refund Processed</h2>
        <p style="font-size:14px;color:#64748b;margin:0 0 24px">Hi ${user.username}, your refund has been approved and processed.</p>

        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;margin-bottom:24px">
          <p style="font-size:13px;color:#166534;margin:0 0 4px;font-weight:600">Amount refunded</p>
          <p style="font-size:24px;font-weight:700;color:#15803d;margin:0">${amountStr}</p>
        </div>

        <p style="font-size:13px;color:#64748b;margin:0 0 8px">The refund has been sent back to your original payment method. Depending on your bank, it may take <strong>3–7 business days</strong> to appear in your account.</p>

        <p style="font-size:13px;color:#64748b;margin:24px 0 0">If you have any questions, please contact our support team.</p>

        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0" />
        <p style="font-size:12px;color:#94a3b8;margin:0">GearTrade.app — Pakistan's trusted car marketplace</p>
      </div>
    `;
    await sendEmail(user.email, "Your Refund Has Been Processed — GearTrade", `Your refund of ${amountStr} has been processed.`, html);
  }

  return { message: "Refund processed successfully", inspection };
}


// DELETION REQUESTS
export async function getDeletionRequests(query) {
  const { page = 1, limit = 10, status } = query;

  const filter = {};
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [requests, total] = await Promise.all([
    listingDeletionRequestModel
      .find(filter)
      .populate({ path: "listing", select: "year saleMode status", populate: [{ path: "brand", select: "name" }, { path: "carModel", select: "name" }] })
      .populate("requestedBy", "username email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    listingDeletionRequestModel.countDocuments(filter),
  ]);

  return {
    requests,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
}

export async function approveDeletionRequest(requestId) {
  const request = await listingDeletionRequestModel
    .findById(requestId)
    .populate("listing");

  if (!request) throw new ApiError(404, "Deletion request not found");

  if (request.status !== "PENDING") {
    throw new ApiError(400, `Request is already ${request.status}`);
  }

  // Force cleanup the listing (admin override)
  await cleanupListingForDeletion(
    request.listing._id,
    true, // forceCancel
    "Listing deleted — deletion request approved by admin"
  );

  // Mark listing as REMOVED
  await listingModel.findByIdAndUpdate(request.listing._id, {
    status: "REMOVED",
  });

  // Approve the request
  request.status = "APPROVED";
  await request.save();

  return { message: "Deletion request approved, listing removed", request };
}

export async function rejectDeletionRequest(requestId, adminNote) {
  const request = await listingDeletionRequestModel.findById(requestId);

  if (!request) throw new ApiError(404, "Deletion request not found");

  if (request.status !== "PENDING") {
    throw new ApiError(400, `Request is already ${request.status}`);
  }

  request.status = "REJECTED";
  request.adminNote = adminNote;
  await request.save();

  return { message: "Deletion request rejected", request };
}


// COMMISSION
export async function markListingSold(listingId, salePrice, adminId) {
  const listing = await listingModel.findById(listingId);

  if (!listing) throw new ApiError(404, "Listing not found");

  if (listing.saleMode !== "MANAGED") {
    throw new ApiError(400, "Only managed listings can be marked as sold");
  }

  if (listing.status !== "ACTIVE") {
    throw new ApiError(
      400,
      `Cannot mark listing as sold. Current status: ${listing.status}`
    );
  }

  // Calculate commission
  const settings = await getSettings();
  const commissionRate = settings.commissionPercentage / 100;
  const commissionAmount = Math.round(salePrice * commissionRate * 100) / 100;

  // Set listing to PENDING_COMMISSION
  listing.status = "PENDING_COMMISSION";
  await listing.save();

  // Create commission record
  const commission = await commissionModel.create({
    listing: listingId,
    seller: listing.seller,
    salePrice,
    commissionRate,
    commissionAmount,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 mins (change back to 30 for production)
    initiatedBy: adminId,
  });

  // Notify seller by email
  const seller = await userModel.findById(listing.seller).select("username email");
  if (seller?.email) {
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0">
        <h2 style="font-size:20px;font-weight:700;color:#0f172a;margin:0 0 8px">Your Car Has Been Sold!</h2>
        <p style="font-size:14px;color:#64748b;margin:0 0 24px">Hi ${seller.username}, congratulations — GearTrade has successfully sold your managed listing.</p>

        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin-bottom:20px">
          <table style="width:100%;font-size:13px;border-collapse:collapse">
            <tr>
              <td style="color:#64748b;padding:4px 0">Sale price</td>
              <td style="color:#0f172a;font-weight:600;text-align:right">PKR ${salePrice.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="color:#64748b;padding:4px 0">Commission (${settings.commissionPercentage}%)</td>
              <td style="color:#0f172a;font-weight:600;text-align:right">PKR ${commissionAmount.toLocaleString()}</td>
            </tr>
          </table>
        </div>

        <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:14px 20px;margin-bottom:24px">
          <p style="font-size:13px;color:#c2410c;margin:0;font-weight:600">⏰ Action required within 30 minutes</p>
          <p style="font-size:13px;color:#9a3412;margin:6px 0 0">Please log in to your GearTrade dashboard and complete the commission payment to finalise the sale.</p>
        </div>

        <p style="font-size:13px;color:#64748b;margin:0">If you have any questions, contact our support team.</p>

        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0" />
        <p style="font-size:12px;color:#94a3b8;margin:0">GearTrade.app — Pakistan's trusted car marketplace</p>
      </div>
    `;
    await sendEmail(
      seller.email,
      "Your Car Has Been Sold — Commission Payment Required",
      `Congratulations! Your listing has been sold for PKR ${salePrice.toLocaleString()}. Commission due: PKR ${commissionAmount.toLocaleString()}. Please pay within 30 minutes.`,
      html
    );
  }

  return {
    message: "Listing marked as sold. Commission payment required from seller.",
    commission,
    commissionAmount,
    salePrice,
  };
}

export async function getCommissions(query) {
  const { page = 1, limit = 10, status } = query;

  const filter = {};
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [commissions, total] = await Promise.all([
    commissionModel
      .find(filter)
      .populate("listing", "title saleMode status")
      .populate("seller", "username email")
      .populate("payment", "amount status")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    commissionModel.countDocuments(filter),
  ]);

  return {
    commissions,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
}

export async function reinitiateCommission(commissionId) {
  const commission = await commissionModel.findById(commissionId);

  if (!commission) throw new ApiError(404, "Commission not found");

  if (commission.status === "PAID") {
    throw new ApiError(400, "Commission has already been paid");
  }

  if (commission.status === "CANCELLED") {
    throw new ApiError(400, "Cannot reinitiate a cancelled commission");
  }

  // Reset expiry to 5 mins from now (change back to 30 for production)
  commission.expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  commission.status = "PENDING";
  await commission.save();

  // Fire email without awaiting — don't block the response on mail delivery.
  userModel.findById(commission.seller).select("username email").then(seller => {
    if (!seller?.email) return;
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0">
        <h2 style="font-size:20px;font-weight:700;color:#0f172a;margin:0 0 8px">Commission Payment Reminder</h2>
        <p style="font-size:14px;color:#64748b;margin:0 0 24px">Hi ${seller.username}, your commission payment window has been reset by an admin.</p>

        <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:14px 20px;margin-bottom:20px">
          <p style="font-size:13px;color:#c2410c;margin:0;font-weight:600">⏰ New 30-minute window started</p>
          <p style="font-size:13px;color:#9a3412;margin:6px 0 0">Please log in to your GearTrade dashboard and complete the commission payment of <strong>PKR ${commission.commissionAmount.toLocaleString()}</strong> immediately.</p>
        </div>

        <p style="font-size:13px;color:#64748b;margin:0">If you have any questions, contact our support team.</p>

        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0" />
        <p style="font-size:12px;color:#94a3b8;margin:0">GearTrade.app — Pakistan's trusted car marketplace</p>
      </div>
    `;
    sendEmail(
      seller.email,
      "Commission Payment Reminder — GearTrade",
      `Your commission payment of PKR ${commission.commissionAmount.toLocaleString()} is due. You have 30 minutes to pay.`,
      html
    ).catch(() => {});
  }).catch(() => {});

  return {
    message: "Commission reinitiated. Seller has 30 minutes to pay.",
    // Only return what the frontend needs to patch the row — not the full unpopulated doc.
    commission: { _id: commission._id, status: commission.status, expiresAt: commission.expiresAt },
  };
}

export async function cancelCommission(commissionId, cancelReason) {
  const commission = await commissionModel
    .findById(commissionId)
    .populate("listing");

  if (!commission) throw new ApiError(404, "Commission not found");

  if (commission.status === "PAID") {
    throw new ApiError(400, "Cannot cancel a paid commission");
  }

  if (commission.status === "CANCELLED") {
    throw new ApiError(400, "Commission is already cancelled");
  }

  // Cancel commission
  commission.status = "CANCELLED";
  commission.cancelReason = cancelReason;
  await commission.save();

  // Cancel related pending payment if exists
  if (commission.payment) {
    await paymentModel.findByIdAndUpdate(commission.payment, {
      status: "FAILED",
    });
  }

  // Put listing back to ACTIVE — deal fell through
  await listingModel.findByIdAndUpdate(commission.listing._id, {
    status: "ACTIVE",
  });

  return {
    message: "Commission cancelled. Listing restored to ACTIVE.",
    commission,
  };
}

// Admin will schedule inspection after adding address, time and date. It can be for buyer and owner both
export async function scheduleInspection(inspectionId, { inspectionAddress, scheduledDate, timeSlot }) {

  const inspection = await inspectionModel
    .findById(inspectionId)
    .populate("requestedBy", "mobileNumber")
    .populate({ path: "listing", populate: { path: "seller", select: "mobileNumber" } });

  if (!inspection)
    throw new ApiError(404, "Inspection not found");

  // Admin can set/update these fields in these statuses only
  const allowedStatuses = ["PENDING_COORDINATION", "SCHEDULED"];
  if (!allowedStatuses.includes(inspection.status))
    throw new ApiError(400, `Cannot schedule an inspection with status ${inspection.status}. Allowed statuses: ${allowedStatuses.join(", ")}`);

  if (!inspectionAddress || !scheduledDate || !timeSlot)
    throw new ApiError(400, "inspectionAddress, scheduledDate and timeSlot are all required");

  const wasAlreadyScheduled = inspection.status === "SCHEDULED";

  inspection.inspectionAddress = inspectionAddress;
  inspection.scheduledDate = new Date(scheduledDate);
  inspection.timeSlot = timeSlot;

  // Only transition status if still in coordination — rescheduling keeps it SCHEDULED
  if (inspection.status === "PENDING_COORDINATION") {
    inspection.status = "SCHEDULED";
  }

  await inspection.save();

  // Notify by SMS — both on first scheduling and on reschedule.
  // Requester always gets it; seller also gets it only when they're a different
  // person (i.e. inspectionBy === "BUYER").
  const dateStr = inspection.scheduledDate.toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
  const action = wasAlreadyScheduled ? "rescheduled" : "scheduled";

  const requesterPhone = inspection.requestedBy?.mobileNumber;
  if (requesterPhone) {
    sendSms(
      requesterPhone,
      `GearTrade: Your inspection has been ${action} for ${dateStr} at ${timeSlot}, ${inspectionAddress}.`
    );
  }

  if (inspection.inspectionBy === "BUYER") {
    const sellerPhone = inspection.listing?.seller?.mobileNumber;
    if (sellerPhone) {
      sendSms(
        sellerPhone,
        `GearTrade: An inspection for your car listing has been ${action} for ${dateStr} at ${timeSlot}. Please have the car available at ${inspectionAddress}.`
      );
    }
  }

  return { message: "Inspection scheduled successfully", inspection };
}
// ── Featured Plans ────────────────────────────────────────────────────────────

export async function getFeaturedPlans() {
  return featuredPlanModel.find().sort({ amount: 1 });
}

export async function createFeaturedPlan({ name, label, amount, durationDays }) {
  const existing = await featuredPlanModel.findOne({ name });
  if (existing) throw new ApiError(409, `A plan named "${name}" already exists`);
  return featuredPlanModel.create({ name, label, amount, durationDays });
}

export async function updateFeaturedPlan(planId, updates) {
  const plan = await featuredPlanModel.findById(planId);
  if (!plan) throw new ApiError(404, "Plan not found");
  Object.assign(plan, updates);
  await plan.save();
  return plan;
}


// Site Settings
export async function getSiteSettings() {
  return getSettings();
}

export async function updateSiteSettings(fields) {
  const allowed = {};
  if (fields.companyPhone !== undefined) allowed.companyPhone = fields.companyPhone;
  if (fields.commissionPercentage !== undefined) allowed.commissionPercentage = fields.commissionPercentage;
  if (fields.inspectionFees !== undefined) {
    const f = fields.inspectionFees;
    if (f.standard     !== undefined) allowed["inspectionFees.standard"]     = f.standard;
    if (f.managed      !== undefined) allowed["inspectionFees.managed"]      = f.managed;
    if (f.premium      !== undefined) allowed["inspectionFees.premium"]      = f.premium;
    if (f.reinspection !== undefined) allowed["inspectionFees.reinspection"] = f.reinspection;
  }
  return updateSettings(allowed);
}

// Inspection Slots
export async function getInspectionSlots() {
  const settings = await getSettings();
  return settings.inspectionSlots;
}

export async function addInspectionSlot({ label, availableDays }) {
  const settings = await getSettings();
  settings.inspectionSlots.push({
    label,
    availableDays: availableDays ?? [0, 1, 2, 3, 4, 5, 6],
    isActive: true,
    isDefault: false,
  });
  await settings.save();
  return settings.inspectionSlots;
}

export async function updateInspectionSlot(slotId, { label, availableDays, isActive }) {
  const settings = await getSettings();
  const slot = settings.inspectionSlots.id(slotId);
  if (!slot) throw new ApiError(404, "Slot not found");

  if (label !== undefined) {
    if (slot.isDefault) throw new ApiError(400, "Cannot change the label of a default slot");
    slot.label = label;
  }
  if (availableDays !== undefined) slot.availableDays = availableDays;
  if (isActive !== undefined) slot.isActive = isActive;

  await settings.save();
  return settings.inspectionSlots;
}
