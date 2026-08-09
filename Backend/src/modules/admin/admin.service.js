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

import { cleanupListingForDeletion, closeFeaturedForListing } from "../../helpers/listing.cleanup.helper.js"
import { getListingDetails } from "../listing/listing.service.js";
import { processStripeRefund, voidPendingPayments } from "../payment/payment.service.js";
import { sendEmail } from "../../services/email.service.js";
import { sendSms } from "../../services/sms.service.js";

import listingDeletionRequestModel from "../managed-sale/listing-deletion-request.model.js";
import commissionModel from "../managed-sale/commission.model.js";
import agreementBreakChargeModel from "../managed-sale/agreementBreakCharge.model.js";
import { computeAgreementBreakFee, settleBreakCharge } from "../managed-sale/managed-sale.service.js";



// Dashboard
export async function getDashboard() {
  const now        = new Date();
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

  const [userStats, listingStats, inspectionStats, revenueStats, weeklyRevenueStats, weeklyListingStats, favoriteStats, pendingDeletions] = await Promise.all([
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
          // Booked (paid) inspections that still have no inspector assigned
          unassigned: [
            { $match: { assignedInspector: null, status: { $in: ["SCHEDULED", "IN_PROGRESS"] } } },
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
    ]),

    // Deletion requests still awaiting an admin decision
    listingDeletionRequestModel.countDocuments({ status: "PENDING" }),

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
      scheduled: count(inspectionStats, "scheduled"),
      inProgress: count(inspectionStats, "inProgress"),
      completed: count(inspectionStats, "completed"),
      cancelled: count(inspectionStats, "cancelled"),
      pendingRefunds: count(inspectionStats, "pendingRefunds"),
      unassigned: count(inspectionStats, "unassigned"),
    },
    deletionRequests: {
      pending: pendingDeletions ?? 0,
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

  // Step 2 — force cleanup all listings (admin can override IN_PROGRESS)
  for (const listing of listings) {
    await cleanupListingForDeletion(
      listing._id,
      true, // admin force cancel
      "Listing deleted — account deleted by admin"
    );
  }

  // Step 4 — mark all listings as REMOVED. Cloudinary images stay — the
  // 6-month cleanup cron purges them later.
  // (already-removed ones keep their original removedBy attribution)
  await listingModel.updateMany(
    { seller: userId, status: { $ne: "REMOVED" } },
    { status: "REMOVED", removedBy: "ADMIN", removedAt: new Date() }
  );

  // Step 6 — soft delete (keep credentials so they can't re-register with same email)
  user.isDeleted = true;
  user.deletedAt = new Date();
  user.accountStatus = ACCOUNT_STATUS.DELETED;
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

  // NOTE: there is no stored "title" field on the listing document — it's
  // derived from year + brand.name + carModel.name, which only exist after
  // the brand/carModel lookups below. So the search match can't happen here;
  // it's applied later as `searchMatch`, once "title" has been computed.
  let searchMatch = null;
  if (search) {
    const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const words = search.trim().split(/\s+/).filter(Boolean).map(escapeRegex);
    if (words.length) {
      searchMatch = {
        $and: words.map((word) => ({
          title: { $regex: word, $options: "i" },
        })),
      };
    }
  }

  const skip = (Number(page) - 1) * Number(limit);

  const pipeline = [
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

    // Derive the display/search title now that brand.name and carModel.name
    // are actually available.
    {
      $addFields: {
        title: {
          $concat: [{ $toString: "$year" }, " ", "$brand.name", " ", "$carModel.name"],
        },
      },
    },
  ];

  if (searchMatch) pipeline.push({ $match: searchMatch });

  pipeline.push(
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

    // Filtering now depends on the joined brand/carModel data, so the total
    // count has to come from this same pipeline rather than a separate
    // listingModel.countDocuments(matchStage) call — that would ignore search.
    {
      $facet: {
        data: [
          { $skip: skip },
          { $limit: Number(limit) },
          {
            $project: {
              _id: 1,
              title: 1,
              price: 1,
              year: 1,
              status: 1,
              removedBy: 1,
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
        ],
        totalCount: [{ $count: "count" }],
      },
    }
  );

  const [result] = await listingModel.aggregate(pipeline);
  const listings = result?.data ?? [];
  const total = result?.totalCount?.[0]?.count ?? 0;

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


// Admin can open a listing's detail page in any status (PENDING, REJECTED, …).
// Reuses the public detail service with the status filter disabled.
export async function getListingDetail(listingId) {
  return getListingDetails(listingId, true);
}

// Email the seller whenever an admin changes their listing's status.
// Failures are swallowed by sendEmail — a broken mailbox must never block
// the admin action itself.
async function notifyListingStatusChange(listing, { subject, heading, message, accent = "#0f172a" }) {
  const [seller, populated] = await Promise.all([
    userModel.findById(listing.seller).select("username email"),
    listingModel
      .findById(listing._id)
      .populate("brand", "name")
      .populate("carModel", "name")
      .select("year brand carModel"),
  ]);

  if (!seller?.email) return;

  const carLabel =
    [populated?.year, populated?.brand?.name, populated?.carModel?.name]
      .filter(Boolean)
      .join(" ") || "your listing";

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0">
      <h2 style="font-size:20px;font-weight:700;color:${accent};margin:0 0 8px">${heading}</h2>
      <p style="font-size:14px;color:#64748b;margin:0 0 16px">Hi ${seller.username},</p>
      <p style="font-size:14px;color:#334155;margin:0 0 24px">${message.replace("{car}", `<strong>${carLabel}</strong>`)}</p>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0" />
      <p style="font-size:12px;color:#94a3b8;margin:0">GearTrade.app — Pakistan's trusted car marketplace</p>
    </div>
  `;

  await sendEmail(seller.email, subject, message.replace("{car}", carLabel), html);
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

  await notifyListingStatusChange(listing, {
    subject: "Your Listing Is Now Live — GearTrade",
    heading: "Listing Approved",
    message: "Good news — your listing {car} has been approved by our team and is now live on GearTrade. Buyers can now find and contact you about it.",
    accent: "#16a34a",
  });

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

  // Managed listings can only be rejected AFTER the seller has paid the
  // onboarding inspection fee (SCHEDULED is set only by the payment webhook).
  // Before payment there is nothing to refund, and a reject could race the
  // seller's open Stripe checkout page.
  if (listing.saleMode === "MANAGED") {
    const paidStatuses = ["SCHEDULED"];
    if (!inspection || !paidStatuses.includes(inspection.status)) {
      throw new ApiError(
        400,
        "A managed listing can only be rejected after the seller has paid the inspection fee."
      );
    }
  }

  // Cancel the not-yet-started inspection. Inspection fees are
  // non-refundable (see Terms of Service) — the GearTrade team contacts the
  // seller to fix and resubmit the listing instead; the paid fee carries
  // over, so no refund is queued.
  if (inspection) {
    inspection.status = "CANCELLED";
    inspection.cancelReason = "Listing rejected by admin";
    inspection.refundRequired = false;
    inspection.refundStatus = "NOT_REQUIRED";
    await inspection.save();

    // Kill unpaid payment attempts so the user can't "Complete Payment"
    // for an inspection that no longer exists.
    await voidPendingPayments(inspection._id);
  }

  // Images are intentionally kept — a rejected listing can be edited and
  // resubmitted, and deleting the Cloudinary files would leave broken image
  // URLs on resubmission. Images are cleaned up on removal/deletion instead.
  listing.status = "REJECTED";
  listing.rejectionReason = reason;
  await listing.save();

  await notifyListingStatusChange(listing, {
    subject: "Your Listing Was Not Approved — GearTrade",
    heading: "Listing Rejected",
    message: `Your listing {car} was not approved. Reason: ${reason}. You can fix the issue and edit the listing to resubmit it for review${listing.saleMode === "MANAGED" ? " within 2–3 working days — your inspection fee carries over, so no new payment is needed" : ""}.`,
    accent: "#dc2626",
  });

  return { message: "Listing rejected successfully", listing };
}


export async function removeListing(listingId) {
  const listing = await listingModel.findById(listingId);

  if (!listing) throw new ApiError(404, "Listing not found");
  if (listing.status === "REMOVED") {
    throw new ApiError(400, "Listing is already removed");
  }

  // A pending managed listing whose inspection fee hasn't been paid can't be
  // removed either — the seller may be mid-checkout and there would be
  // nothing to refund. Same rule as rejectListing.
  if (listing.saleMode === "MANAGED" && listing.status === "PENDING") {
    const paidInspection = await inspectionModel.exists({
      listing: listingId,
      status: { $in: ["SCHEDULED", "IN_PROGRESS", "COMPLETED"] },
    });
    if (!paidInspection) {
      throw new ApiError(
        400,
        "A managed listing can only be removed after the seller has paid the inspection fee."
      );
    }
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

  // Images stay on Cloudinary — the 6-month cleanup cron purges them later
  listing.status = "REMOVED";
  listing.removedBy = "ADMIN";
  listing.removedAt = new Date();
  await listing.save();

  await notifyListingStatusChange(listing, {
    subject: "Your Listing Has Been Removed — GearTrade",
    heading: "Listing Removed",
    message: "Your listing {car} has been removed from GearTrade by our team. If you believe this was a mistake, please contact our support team.",
    accent: "#dc2626",
  });

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

  const pipeline = [
    { $match: matchStage },

    // Join listing (external inspections have none — keep them in)
    {
      $lookup: {
        from: "listings",
        localField: "listing",
        foreignField: "_id",
        as: "listing",
      },
    },
    { $unwind: { path: "$listing", preserveNullAndEmptyArrays: true } },

    // Join brand + carModel (for the listing name in the admin table)
    {
      $lookup: {
        from: "brands",
        localField: "listing.brand",
        foreignField: "_id",
        as: "listing.brand",
      },
    },
    { $unwind: { path: "$listing.brand", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "car_models",
        localField: "listing.carModel",
        foreignField: "_id",
        as: "listing.carModel",
      },
    },
    { $unwind: { path: "$listing.carModel", preserveNullAndEmptyArrays: true } },

    // Type shown/filtered on must reflect the listing's CURRENT saleMode.
    // The inspection's own `type` field holds INSPECTION/RE_INSPECTION
    // (the inspection's purpose) — it never holds GENERAL/MANAGED, so it
    // must not be used as a fallback here. External inspections have no
    // listing at all, so there's no sale mode to report for them.
    {
      $addFields: {
        resolvedType: { $ifNull: ["$listing.saleMode", "EXTERNAL"] },
      },
    },
  ];

  if (type) pipeline.push({ $match: { resolvedType: type } });

  pipeline.push(
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

    // Join the PUBLISHED inspection report (if any) for the Report column
    {
      $lookup: {
        from: "inspection_reports",
        let: { inspId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$inspection", "$$inspId"] }, status: "PUBLISHED" } },
          { $project: { verifyToken: 1 } },
        ],
        as: "publishedReport",
      },
    },

    { $sort: { createdAt: -1 } },

    // Filtering now depends on the joined listing.saleMode, so the total
    // count has to come from this same pipeline instead of a separate
    // inspectionModel.countDocuments(matchStage) call — that would ignore
    // the type filter entirely.
    {
      $facet: {
        data: [
          { $skip: skip },
          { $limit: Number(limit) },
          {
            $project: {
              _id: 1,
              type: "$resolvedType",
              inspectionBy: 1,
              status: 1,
              cancelReason: 1,
              externalCar: 1,
              assignedInspector: 1,
              refundRequired: 1,
              refundStatus: 1,
              inspectionAddress: 1,
              scheduledDate: 1,
              timeSlot: 1,
              reportToken: { $arrayElemAt: ["$publishedReport.verifyToken", 0] },
              createdAt: 1,
              "listing._id": 1,
              "listing.year": 1,
              "listing.saleMode": 1,
              "listing.status": 1,
              "listing.brand.name": 1,
              "listing.carModel.name": 1,
              "requestedBy._id": 1,
              "requestedBy.username": 1,
              "requestedBy.email": 1,
            },
          },
        ],
        totalCount: [{ $count: "count" }],
      },
    }
  );

  const [result] = await inspectionModel.aggregate(pipeline);
  const inspections = result?.data ?? [];
  const total = result?.totalCount?.[0]?.count ?? 0;

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

  // Inspection fees are non-refundable (see Terms of Service) — an admin
  // cancellation is caused by a buyer/seller issue, so no refund is queued.
  if (status === "CANCELLED" && cancelReason) {
    inspection.cancelReason = cancelReason;
  }

  await inspection.save();

  return { message: "Inspection status updated successfully", inspection };
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

      // Join the SUCCESS payment only — pending/failed attempts are not
      // refundable money and must not surface an amount here.
      {
        $lookup: {
          from: "payments",
          let: { inspectionId: "$_id" },
          pipeline: [
            {
              $match: {
                status: "SUCCESS",
                $expr: { $eq: ["$referenceId", "$$inspectionId"] },
              },
            },
          ],
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

  // Refunds are only possible for money that actually arrived. Entries queued
  // for a payment that never completed (legacy rows) are auto-cleared here.
  const payment = await paymentModel.findOne({ referenceId: inspectionId, status: "SUCCESS" });
  if (!payment) {
    inspection.refundRequired = false;
    inspection.refundStatus = "NOT_REQUIRED";
    await inspection.save();
    return {
      message: "No completed payment exists for this inspection — refund marked as not required.",
      inspection,
    };
  }
  const amount = payment.amount;

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
      .limit(Number(limit))
      .lean(),
    listingDeletionRequestModel.countDocuments(filter),
  ]);

  // Attach the break charge (accepted requests) and a live fee quote
  // (pending requests) so the admin sees the amount before accepting.
  const charges = await agreementBreakChargeModel
    .find({ deletionRequest: { $in: requests.map(r => r._id) } })
    .lean();
  const chargeByRequest = new Map(charges.map(c => [c.deletionRequest.toString(), c]));

  for (const r of requests) {
    r.breakCharge = chargeByRequest.get(r._id.toString()) ?? null;
    if (r.status === "PENDING" && r.listing?._id) {
      try {
        r.feeQuote = await computeAgreementBreakFee(r.listing._id);
      } catch {
        r.feeQuote = null; // e.g. no active featured plans configured
      }
    }
  }

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

// Admin accepted the owner's request at the office: create the agreement
// break charge (bracket fee from featured plans, admin may override the
// amount). OFFLINE = cash received now → settle immediately (listing
// removed). ONLINE = open a payment slot and wait for the owner to pay.
export async function acceptDeletionRequest(requestId, adminId, { amount, paymentMode }) {
  const request = await listingDeletionRequestModel
    .findById(requestId)
    .populate("listing");

  if (!request) throw new ApiError(404, "Deletion request not found");

  if (request.status !== "PENDING") {
    throw new ApiError(400, `Request is already ${request.status}`);
  }

  const { daysHeld, amount: computedAmount } =
    await computeAgreementBreakFee(request.listing._id);

  const finalAmount = amount != null && Number(amount) > 0
    ? Math.round(Number(amount))
    : computedAmount;

  const charge = await agreementBreakChargeModel.create({
    listing: request.listing._id,
    seller: request.listing.seller,
    deletionRequest: request._id,
    daysHeld,
    computedAmount,
    amount: finalAmount,
    paymentMode,
    acceptedBy: adminId,
  });

  request.status = "ACCEPTED";
  await request.save();

  if (paymentMode === "OFFLINE") {
    await settleBreakCharge(charge);
    return { message: "Fee received offline — listing removed", charge };
  }

  // ONLINE — tell the owner the amount and where to pay
  const seller = await userModel.findById(request.listing.seller).select("username email");
  if (seller?.email) {
    await sendEmail(
      seller.email,
      "Agreement Break Fee — GearTrade",
      `Hi ${seller.username}, your deletion request has been accepted. Pay the agreement break fee of PKR ${finalAmount.toLocaleString()} from your GearTrade dashboard (My Listings → Managed → Deletion Requests) to complete the withdrawal.`,
      `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0">
        <h2 style="font-size:20px;font-weight:700;color:#0f172a;margin:0 0 8px">Agreement Break Fee</h2>
        <p style="font-size:14px;color:#64748b;margin:0 0 16px">Hi ${seller.username},</p>
        <p style="font-size:14px;color:#334155;margin:0 0 16px">Your request to withdraw your managed listing has been accepted. As per the sale agreement, an agreement break fee applies:</p>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin-bottom:20px">
          <table style="width:100%;font-size:13px;border-collapse:collapse">
            <tr><td style="color:#64748b;padding:4px 0">Days on GearTrade</td><td style="color:#0f172a;font-weight:600;text-align:right">${daysHeld || "—"}</td></tr>
            <tr><td style="color:#0f172a;padding:8px 0 4px;font-weight:700;border-top:1px solid #e2e8f0">Fee to pay</td><td style="color:#b45309;font-weight:700;text-align:right;padding:8px 0 4px;border-top:1px solid #e2e8f0">PKR ${finalAmount.toLocaleString()}</td></tr>
          </table>
        </div>
        <p style="font-size:14px;color:#334155;margin:0 0 24px">Pay online from your dashboard: <strong>My Listings → Managed → Deletion Requests → Pay Now</strong>. Your listing is removed as soon as the payment completes.</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0" />
        <p style="font-size:12px;color:#94a3b8;margin:0">GearTrade.app — Pakistan's trusted car marketplace</p>
      </div>
      `
    );
  }

  return { message: "Request accepted — awaiting online payment", charge };
}

// Owner paid at the office after an ONLINE slot was opened (or any late
// offline settlement) — admin marks the charge as received.
export async function markBreakChargePaid(requestId) {
  const charge = await agreementBreakChargeModel.findOne({ deletionRequest: requestId });

  if (!charge) throw new ApiError(404, "No break charge found for this request");
  if (charge.status === "PAID") throw new ApiError(400, "Charge is already paid");

  await settleBreakCharge(charge);

  return { message: "Charge marked as paid — listing removed", charge };
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
  const netAmount = Math.round((salePrice - commissionAmount) * 100) / 100;

  // The buyer paid GearTrade in full — the sale is done. The commission is
  // recorded as already settled (deducted from the proceeds) and the seller
  // receives the remaining amount offline (e.g. cheque).
  listing.status = "SOLD";
  await listing.save();

  // A sold listing no longer needs promotion — end its featured record
  await closeFeaturedForListing(listingId);

  const commission = await commissionModel.create({
    listing: listingId,
    seller: listing.seller,
    salePrice,
    commissionRate,
    commissionAmount,
    status: "PAID",
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
              <td style="color:#0f172a;font-weight:600;text-align:right">− PKR ${commissionAmount.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="color:#0f172a;padding:8px 0 4px;font-weight:700;border-top:1px solid #e2e8f0">You receive</td>
              <td style="color:#15803d;font-weight:700;text-align:right;padding:8px 0 4px;border-top:1px solid #e2e8f0">PKR ${netAmount.toLocaleString()}</td>
            </tr>
          </table>
        </div>

        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px 20px;margin-bottom:24px">
          <p style="font-size:13px;color:#15803d;margin:0;font-weight:600">No action needed</p>
          <p style="font-size:13px;color:#166534;margin:6px 0 0">GearTrade has deducted its commission from the sale amount. Our team will deliver your remaining proceeds shortly (e.g. by cheque).</p>
        </div>

        <p style="font-size:13px;color:#64748b;margin:0">If you have any questions, contact our support team.</p>

        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0" />
        <p style="font-size:12px;color:#94a3b8;margin:0">GearTrade.app — Pakistan's trusted car marketplace</p>
      </div>
    `;
    await sendEmail(
      seller.email,
      "Your Car Has Been Sold — GearTrade",
      `Congratulations! Your listing sold for PKR ${salePrice.toLocaleString()}. After the PKR ${commissionAmount.toLocaleString()} commission, you receive PKR ${netAmount.toLocaleString()}. Our team will deliver your proceeds shortly.`,
      html
    );
  }

  return {
    message: "Listing marked as sold. Commission recorded as settled.",
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
      .populate({
        path: "listing",
        select: "year saleMode status",
        populate: [
          { path: "brand", select: "name" },
          { path: "carModel", select: "name" },
        ],
      })
      .populate("seller", "username email")
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

// Admin will schedule inspection after adding address, time and date. It can be for buyer and owner both
export async function scheduleInspection(inspectionId, { inspectionAddress, scheduledDate, timeSlot }) {

  const inspection = await inspectionModel
    .findById(inspectionId)
    .populate("requestedBy", "mobileNumber")
    .populate({ path: "listing", populate: { path: "seller", select: "mobileNumber" } });

  if (!inspection)
    throw new ApiError(404, "Inspection not found");

  // Admin can set/update these fields for scheduled inspections only
  if (inspection.status !== "SCHEDULED")
    throw new ApiError(400, `Cannot schedule an inspection with status ${inspection.status}. Only SCHEDULED inspections can be rescheduled.`);

  if (!inspectionAddress || !scheduledDate || !timeSlot)
    throw new ApiError(400, "inspectionAddress, scheduledDate and timeSlot are all required");

  inspection.inspectionAddress = inspectionAddress;
  inspection.scheduledDate = new Date(scheduledDate);
  inspection.timeSlot = timeSlot;

  await inspection.save();

  // Notify by SMS — both on first scheduling and on reschedule.
  // Requester always gets it; seller also gets it only when they're a different
  // person (i.e. inspectionBy === "BUYER").
  const dateStr = inspection.scheduledDate.toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
  // Users book the schedule themselves at request time, so an admin change is always a reschedule
  const action = "rescheduled";

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
