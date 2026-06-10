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

