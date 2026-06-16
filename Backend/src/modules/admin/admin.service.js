import userModel from "../../models/user.model.js";
import listingModel from "../listing/listing.model.js";
import inspectionModel from "../inspection/inspection.model.js";
import paymentModel from "../payment/payment.model.js";
import featuredModel from "../featured/featured.model.js";
import favoriteModel from "../favorite/favorite.model.js"
import sessionModel from "../../models/session.model.js"
import { ApiError } from "../../utils/apiError.js";
import { ACCOUNT_STATUS } from "../../utils/constants.js";

import { cleanupListingForDeletion } from "../../helpers/listing.cleanup.helper.js"
import { processStripeRefund } from "../payment/payment.service.js";

import listingDeletionRequestModel from "../managed-sale/listing-deletion-request.model.js";
import commissionModel from "../managed-sale/commission.model.js";



// Dashboard
export async function getDashboard() {
  const [userStats, listingStats, inspectionStats, revenueStats, favoriteStats] = await Promise.all([
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

  // Step 4 — mark all listings as REMOVED
  await listingModel.updateMany(
    { seller: userId },
    { status: "REMOVED" }
  );

  // Step 5 — anonymize and soft delete
  user.isDeleted = true;
  user.deletedAt = new Date();
  user.email = `deleted_${user._id}@deleted.com`;
  user.username = `deleted_${user._id}`;
  user.accountStatus = ACCOUNT_STATUS.BLOCKED;
  user.blockedUntil = null;
  await user.save();

  // Step 6 — revoke all sessions
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
  } = query;

  const matchStage = {};

  if (status) matchStage.status = status;
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
          isFeatured: 1,
          createdAt: 1,
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


export async function updateInspectionStatus(inspectionId, status) {
  const inspection = await inspectionModel.findById(inspectionId);

  if (!inspection) throw new ApiError(404, "Inspection not found");

  if (inspection.status === "CANCELLED") {
    throw new ApiError(400, "Cannot update status of a cancelled inspection");
  }

  if (inspection.status === "COMPLETED") {
    throw new ApiError(400, "Cannot update status of a completed inspection");
  }

  // Guard valid transitions only
  const validTransitions = {
    PENDING: ["PENDING_COORDINATION", "SCHEDULED", "CANCELLED"],
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

  inspection.status = status;
  await inspection.save();

  return { message: "Inspection status updated successfully", inspection };
}


export async function uploadInspectionReport(inspectionId, { url, fileId }) {
  const inspection = await inspectionModel.findById(inspectionId).populate("listing");

  if (!inspection) throw new ApiError(404, "Inspection not found");

  if (inspection.status !== "COMPLETED") {
    throw new ApiError(400, "Report can only be uploaded for completed inspections");
  }

  // Save report on inspection
  inspection.report = { url, fileId };
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
  const inspection = await inspectionModel.findById(inspectionId);

  if (!inspection) throw new ApiError(404, "Inspection not found");
  if (!inspection.refundRequired) throw new ApiError(400, "This inspection does not require a refund");
  if (inspection.refundStatus === "PROCESSED") throw new ApiError(400, "Refund already processed");
  if (inspection.refundStatus === "NOT_REQUIRED") throw new ApiError(400, "Refund not required");

  // Payment logic stays in payment module
  await processStripeRefund(inspectionId);

  // Only update DB after Stripe succeeds
  inspection.refundStatus = "PROCESSED";
  await inspection.save();

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
      .populate("listing", "title saleMode status")
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
  const commissionRate = 0.009;
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
    expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 mins
    initiatedBy: adminId,
  });

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

  // Reset expiry to 30 mins from now
  commission.expiresAt = new Date(Date.now() + 30 * 60 * 1000);
  commission.status = "PENDING";
  await commission.save();

  return {
    message: "Commission reinitiated. Seller has 30 minutes to pay.",
    commission,
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