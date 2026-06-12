import inspectionModel from "./inspection.model.js";
import listingModel from "../listing/listing.model.js";
import paymentModel from "../payment/payment.model.js";
import { ApiError } from "../../utils/apiError.js";

import { calculateInspectionFee } from "./inspectionPricing.js";

import { createStripeCheckoutSession } from "../payment/payment.service.js";

import crypto from "crypto";

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

    // 3. Detect ownership (CRITICAL LOGIC)
    const isOwner =
        listing.seller.toString() === userId.toString();

    console.log("Owner or not ", isOwner)

    console.log("Address date time ", inspectionAddress, scheduledDate, timeSlot)

    const inspectionBy = isOwner ? "OWNER" : "BUYER";

    // 4. Prevent duplicate active inspections
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

    // 5. OWNER validation (must provide schedule)
    if (isOwner) {
        if (!inspectionAddress || !scheduledDate || !timeSlot) {
            throw new ApiError(
                400,
                "Owner must provide address, date, and time slot for inspection"
            );
        }
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

    // 7. Time slot checking
    const slotMap = {
        "10AM-12PM": 10,
        "12PM-2PM": 12,
        "2PM-4PM": 14,
        "4PM-6PM": 16,
        "6PM-8PM": 18
    };

    const isToday =
        selectedDate.toDateString() === new Date().toDateString();

    if (isToday) {
        const slotHour = slotMap[timeSlot];

        if (slotHour <= new Date().getHours()) {
            throw new ApiError(
                400,
                "Time slot has already passed"
            );
        }
    }



    // 6. Create inspection
    const inspection = await inspectionModel.create({
        listing: listingId,
        requestedBy: userId,

        type: inspectionType,
        inspectionBy,
        status: "PENDING",

        // Only store these for OWNER
        inspectionAddress: isOwner
            ? inspectionAddress
            : undefined,

        scheduledDate: isOwner
            ? scheduledDate
            : undefined,

        timeSlot: isOwner
            ? timeSlot
            : undefined
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

    // validate required fields (OWNER flow)
    if (!inspectionAddress || !scheduledDate || !timeSlot) {
        throw new ApiError(
            400,
            "Inspection address, date and time slot are required"
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

    // 7. Time slot checking
    const slotMap = {
        "10AM-12PM": 10,
        "12PM-2PM": 12,
        "2PM-4PM": 14,
        "4PM-6PM": 16,
        "6PM-8PM": 18
    };

    const isToday =
        selectedDate.toDateString() === new Date().toDateString();

    if (isToday) {
        const slotHour = slotMap[timeSlot];

        if (slotHour <= new Date().getHours()) {
            throw new ApiError(
                400,
                "Time slot has already passed"
            );
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
        timeSlot
    });

    return inspection;
}

export async function createInspectionPayment(inspectionId, userId) {
    const inspection = await inspectionModel.findById(inspectionId).populate("listing");

    if (!inspection) {
        throw new ApiError(404, "Inspection not found");
    }

    // prevent duplicate payment
    const existingPayment = await paymentModel.findOne({
        referenceId: inspectionId,
        status: "PENDING"
    });

    if (existingPayment) {
        throw new ApiError(
            400,
            "Payment already exists for this inspection"
        );
    }

    // 🧠 FIXED: dynamic pricing based on listing
    const amount = calculateInspectionFee(inspection.listing);

    const transactionId = crypto.randomUUID();

    const payment = await paymentModel.create({
        user: userId,
        listing: inspection.listing._id,
        purpose: inspection.type,
        referenceId: inspection._id,
        amount,
        transactionId,
        status: "PENDING"
    });

    inspection.payment = payment._id;
    await inspection.save();

    const session = await createStripeCheckoutSession(payment);

    // return {
    //     payment,
    //     paymentUrl: `http://localhost:5173/sandbox-payment/${transactionId}`
    // };

    return {
        payment,
        checkoutUrl: session.url
    };
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
        {
            $match: {
                $or: [
                    {
                        // You are the requester
                       requestedBy: userId
                    },
                    {
                        // You own the listing
                        "listing.seller": userId
                    }
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

