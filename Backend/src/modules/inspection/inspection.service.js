import inspectionModel from "./inspection.model.js";
import listingModel from "../listing/listing.model.js";
import paymentModel from "../payment/payment.model.js";
import { ApiError } from "../../utils/apiError.js";

import userModel from "../../models/user.model.js";

import { calculateInspectionFee } from "./inspectionPricing.js";
import { getSettings } from "../../models/siteSettings.model.js";

import { createStripeCheckoutSession } from "../payment/payment.service.js";
import config from "../../config/config.js";

import cityModel from "../master/models/city.model.js";
import { MANAGED_SALE_CITY_NAMES, isManagedSaleCity } from "../../config/constants.js";

import crypto from "crypto";
import InspectionReport from "../inspection-report/inspectionReport.model.js";

export async function requestInspection(listingId, userId, payload = {}) {
    const { inspectionAddress, scheduledDate, timeSlot } = payload;

    // 1. Fetch listing
    const listing = await listingModel.findById(listingId);

    if (!listing) {
        throw new ApiError(404, "Listing not found");
    }

    const isReInspection = await inspectionModel.exists({
        listing: listingId,
        status: "COMPLETED"
    });

    const inspectionType = isReInspection ? "RE_INSPECTION" : "INSPECTION";

    // 2. Only ACTIVE listings allowed
    if (listing.status !== "ACTIVE") {
        throw new ApiError(
            400,
            "Inspection only allowed for active listings"
        );
    }

    // 3. Inspection services only operate in managed cities
    const cityDoc = await cityModel.findById(listing.city).select("name");
    if (!cityDoc || !isManagedSaleCity(cityDoc.name)) {
        throw new ApiError(
            400,
            `Inspection services are only available in: ${MANAGED_SALE_CITY_NAMES.join(", ")}`
        );
    }

    // 4. Detect ownership
    const isOwner = listing.seller.toString() === userId.toString();

    const inspectionBy = isOwner ? "OWNER" : "BUYER";

    // 5. Prevent duplicate active inspections
    const existingInspection = await inspectionModel.findOne({
        listing: listingId,
        status: {
            $in: ["PENDING", "SCHEDULED", "IN_PROGRESS"]
        }
    });

    if (existingInspection) {
        throw new ApiError(
            400,
            "Inspection already in progress"
        );
    }

    // 6. Both owner and buyer book the inspection themselves — the buyer
    // coordinates day/time/place with the seller directly, so address and
    // date are always required. timeSlot may be null ("can't find my slot"
    // → our team coordinates the exact time).
    if (!inspectionAddress || !scheduledDate) {
        throw new ApiError(
            400,
            "Inspection address and date are required"
        );
    }

    // 7. Date validation
    const selectedDate = new Date(scheduledDate);
    selectedDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
        throw new ApiError(
            400,
            "Date cannot be in the past"
        );
    }

    // 8. Time slot checking (only when a slot is provided)
    if (timeSlot) {
        const slotMap = {
            "10:00 AM": 10,
            "12:00 PM": 12,
            "2:00 PM":  14,
            "4:00 PM":  16,
            "6:00 PM":  18,
        };

        const isToday =
            selectedDate.toDateString() === new Date().toDateString();

        if (isToday) {
            const slotHour = slotMap[timeSlot];
            if (slotHour !== undefined && slotHour <= new Date().getHours()) {
                throw new ApiError(400, "Time slot has already passed");
            }
        }
    }

    // 9. Slot collision check (only when a slot is provided)
    if (timeSlot) {
        const slotStart = new Date(selectedDate); slotStart.setHours(0, 0, 0, 0);
        const slotEnd   = new Date(selectedDate); slotEnd.setHours(23, 59, 59, 999);
        const slotTaken = await inspectionModel.exists({
            scheduledDate: { $gte: slotStart, $lte: slotEnd },
            timeSlot,
            status: { $in: ["PENDING", "SCHEDULED", "IN_PROGRESS"] },
        });
        if (slotTaken) {
            throw new ApiError(400, "This time slot is already booked. Please choose another.");
        }
    }

    // 10. Create inspection
    const inspection = await inspectionModel.create({
        listing: listingId,
        requestedBy: userId,

        type: inspectionType,
        inspectionBy,
        status: "PENDING",

        inspectionAddress,
        scheduledDate,
        timeSlot: timeSlot || null
    });

    return inspection;
}

export async function requestManagedInspection(listingId, userId, payload) {
    const { inspectionAddress, scheduledDate, timeSlot } = payload;

    const listing = await listingModel.findById(listingId);

    if (!listing) {
        throw new ApiError(404, "Listing not found");
    }

    if (listing.saleMode !== "MANAGED") {
        throw new ApiError(400, "Only managed listings require onboarding inspection");
    }

    if (listing.seller.toString() !== userId.toString()) {
        throw new ApiError(403, "Not your listing");
    }

    // prevent duplicate inspection
    const existing = await inspectionModel.findOne({
        listing: listingId,
        type: "INSPECTION",
        status: { $in: ["PENDING", "SCHEDULED", "IN_PROGRESS"] }
    });

    if (existing) {
        throw new ApiError(400, "Inspection already exists");
    }

    // validate required fields (OWNER flow) — timeSlot is optional (null = admin will coordinate)
    if (!inspectionAddress || !scheduledDate) {
        throw new ApiError(
            400,
            "Inspection address and date are required"
        );
    }

    // 6. Date validation
    const selectedDate = new Date(scheduledDate);
    selectedDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
        throw new ApiError(
            400,
            "Date cannot be in the past"
        );
    }

    // 7. Time slot checking (only when a slot is provided)
    if (timeSlot) {
        const slotMap = {
            "10:00 AM": 10,
            "12:00 PM": 12,
            "2:00 PM":  14,
            "4:00 PM":  16,
            "6:00 PM":  18,
        };

        const isToday =
            selectedDate.toDateString() === new Date().toDateString();

        if (isToday) {
            const slotHour = slotMap[timeSlot];
            if (slotHour !== undefined && slotHour <= new Date().getHours()) {
                throw new ApiError(400, "Time slot has already passed");
            }
        }
    }

    // 8. Slot collision check (only when a slot is provided)
    if (timeSlot) {
        const slotStart = new Date(selectedDate); slotStart.setHours(0, 0, 0, 0);
        const slotEnd   = new Date(selectedDate); slotEnd.setHours(23, 59, 59, 999);
        const slotTaken = await inspectionModel.exists({
            scheduledDate: { $gte: slotStart, $lte: slotEnd },
            timeSlot,
            status: { $in: ["PENDING", "SCHEDULED", "IN_PROGRESS"] },
        });
        if (slotTaken) {
            throw new ApiError(400, "This time slot is already booked. Please choose another.");
        }
    }

    const inspection = await inspectionModel.create({
        listing: listingId,
        requestedBy: userId,

        type: "INSPECTION",
        inspectionBy: "OWNER",

        status: "PENDING",

        inspectionAddress,
        scheduledDate,
        timeSlot: timeSlot || null,
    });

    return inspection;
}

export async function createInspectionPayment(inspectionId, userId) {
    const inspection = await inspectionModel.findById(inspectionId).populate("listing");

    if (!inspection) {
        throw new ApiError(404, "Inspection not found");
    }

    // A stale "pay now" (old tab, dashboard entry) must not fund a dead or
    // finished inspection — book a new one instead.
    if (["CANCELLED", "COMPLETED"].includes(inspection.status)) {
        throw new ApiError(
            400,
            `This inspection is ${inspection.status.toLowerCase()} and can no longer be paid for. Please book a new inspection.`
        );
    }

    // Nor an inspection whose listing is no longer sellable (e.g. rejected
    // by admin while the user was checking out).
    const listingStatus = inspection.listing?.status;
    if (["REJECTED", "REMOVED", "SOLD"].includes(listingStatus)) {
        throw new ApiError(
            400,
            `This listing has been ${listingStatus.toLowerCase()} — payment is no longer possible.`
        );
    }

    const purposeParam = inspection.type === "RE_INSPECTION" ? "RE_INSPECTION" : "INSPECTION";
    const successUrl = `${config.CLIENT_URL}/payment/success?purpose=${purposeParam}&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl  = `${config.CLIENT_URL}/payment/failed?purpose=${purposeParam}`;

    // If a pending payment already exists, reuse it — just create a new Stripe session
    const existingPayment = await paymentModel.findOne({
        referenceId: inspectionId,
        status: "PENDING"
    });

    if (existingPayment) {
        const session = await createStripeCheckoutSession(existingPayment, { successUrl, cancelUrl });
        return { payment: existingPayment, checkoutUrl: session.url };
    }

    // First-time payment — create the document
    const user = await userModel.findById(userId).select("username email");
    if (!user) throw new ApiError(404, "User not found");

    const settings = await getSettings();
    const isReinspection = inspection.type === "RE_INSPECTION";
    const amount = isReinspection
      ? settings.inspectionFees.reinspection
      : calculateInspectionFee(inspection.listing, settings.inspectionFees);

    const transactionId = crypto.randomUUID();

    const payment = await paymentModel.create({
        user: userId,
        listing: inspection.listing._id,
        purpose: inspection.type,
        referenceId: inspection._id,
        amount,
        transactionId,
        status: "PENDING",
        payerSnapshot: {
            userId: user._id,
            username: user.username,
            email: user.email
        }
    });

    inspection.payment = payment._id;
    await inspection.save();

    const session = await createStripeCheckoutSession(payment, { successUrl, cancelUrl });

    // return {
    //     payment,
    //     paymentUrl: `http://localhost:5173/sandbox-payment/${transactionId}`
    // };

    return {
        payment,
        checkoutUrl: session.url
    };
}

export async function getListingInspectionStatus(listingId) {
    let inspection = await inspectionModel
        .findOne({
            listing: listingId,
            status: { $ne: "CANCELLED" },
        })
        .sort({ createdAt: -1 })
        .select("status type inspectionBy report _id");

    // No live/completed inspection — fall back to the latest cancelled one so
    // the UI can show that state (e.g. admin reviewing a managed listing whose
    // onboarding inspection was cancelled).
    if (!inspection) {
        inspection = await inspectionModel
            .findOne({ listing: listingId, status: "CANCELLED" })
            .sort({ createdAt: -1 })
            .select("status type inspectionBy cancelReason _id");
    }

    if (!inspection) return null;

    // Attach verifyToken from the published inspection report (if any)
    const report = await InspectionReport
        .findOne({ inspection: inspection._id, status: "PUBLISHED" })
        .select("verifyToken")
        .lean();

    const result = inspection.toObject();
    result.reportToken = report?.verifyToken ?? null;
    return result;
}

export async function getAvailableSlots(dateStr, excludeInspectionId) {
  const date = new Date(dateStr);
  const dayOfWeek = date.getDay(); // 0=Sun … 6=Sat

  const settings = await getSettings();
  const activeSlots = settings.inspectionSlots.filter(
    s => s.isActive && s.availableDays.includes(dayOfWeek)
  );

  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const bookedFilter = {
    scheduledDate: { $gte: start, $lte: end },
    status: { $in: ["PENDING", "SCHEDULED", "IN_PROGRESS"] },
  };
  // When rescheduling, don't count the inspection's own current slot as taken
  if (excludeInspectionId) {
    bookedFilter._id = { $ne: excludeInspectionId };
  }

  const bookedSlots = await inspectionModel.find(bookedFilter).distinct("timeSlot");

  return { slots: activeSlots, bookedSlots };
}

export async function getMyInspections(userId, filters = {}) {

    const matchStage = {};

    // optional filters
    if (filters.status) {
        matchStage.status = filters.status;
    }

    if (filters.type) {
        matchStage.type = filters.type;
    }

    if (filters.inspectionBy) {
        matchStage.inspectionBy = filters.inspectionBy;
    }

    if (filters.refundRequired !== undefined) {
        matchStage.refundRequired =
            filters.refundRequired === "true";
    }

    if (filters.refundStatus) {
        matchStage.refundStatus = filters.refundStatus;
    }

    const inspections = await inspectionModel.aggregate([

        // 1. apply filters on inspection fields
        {
            $match: matchStage
        },

        // 2. join listing collection
        {
            // replaces listing ID with full listing object
            $lookup: {
                from: "listings",
                localField: "listing",
                foreignField: "_id",
                as: "listing"
            }
        },
        // converts array into object, Because $lookup returns an array 
        {
            $unwind: "$listing"
        },

        // 3. join users (requestedBy)
        {
            // replaces user ID with full user object
            $lookup: {
                from: "users",
                localField: "requestedBy",
                foreignField: "_id",
                as: "requestedBy"
            }
        },

        {
            $unwind: "$requestedBy"
        },

        // 4. filter by ownership (IMPORTANT PART)
        // requestedBy is now an unwound object, so compare against ._id not the field itself
        {
            $match: {
                $or: [
                    { "requestedBy._id": userId },
                    { "listing.seller": userId }
                ]
            }
        },

        // 5. populate brand + carModel
        {
            // replaces brand ID 
            $lookup: {
                from: "brands",
                localField: "listing.brand",
                foreignField: "_id",
                as: "listing.brand"
            }
        },
        {
            $unwind: "$listing.brand"
        },

        {
            // // replaces car_models ID 
            $lookup: {
                from: "car_models",
                localField: "listing.carModel",
                foreignField: "_id",
                as: "listing.carModel"
            }
        },
        {
            $unwind: "$listing.carModel"
        },

        // 6. sort latest first
        {
            $sort: {
                createdAt: -1
            }
        },

        // 7. final shape (clean response)
        {
            $project: {
                _id: 1,
                type: 1,
                inspectionBy: 1,
                status: 1,
                refundRequired: 1,
                refundStatus: 1,
                inspectionAddress: 1,
                scheduledDate: 1,
                timeSlot: 1,
                createdAt: 1,

                requestedBy: {
                    _id: "$requestedBy._id",
                    username: "$requestedBy.username",
                    email: "$requestedBy.email"
                },

                listing: {
                    _id: "$listing._id",
                    year: "$listing.year",
                    price: "$listing.price",
                    status: "$listing.status",
                    saleMode: "$listing.saleMode",
                    seller: "$listing.seller",
                    images: "$listing.images",
                    brand: {
                        _id: "$listing.brand._id",
                        name: "$listing.brand.name"
                    },
                    carModel: {
                        _id: "$listing.carModel._id",
                        name: "$listing.carModel.name"
                    }
                }
            }
        }
    ]);

    return inspections;
}

