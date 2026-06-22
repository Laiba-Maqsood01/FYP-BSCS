import * as inspectionService from "./inspection.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";

export const requestInspection = asyncHandler(async (req, res) => {

    const { listingId } = req.params; // already validated through zod

    const inspection = await inspectionService.requestInspection(
        listingId,
        req.user._id
    );

    res.status(201).json(
        new ApiResponse(
            201,
            "Inspection requested successfully",
            inspection
        )
    );
});

// SELLER RE-INSPECTION
export const requestSellerReInspection = asyncHandler(async (req, res) => {

    const { listingId } = req.params;
    const inspection = await inspectionService.requestInspection(
        listingId,
        req.user._id,
        {
            inspectionAddress: req.body.inspectionAddress,

            scheduledDate: req.body.scheduledDate,

            timeSlot: req.body.timeSlot
        }
    );

    res.status(201).json(
        new ApiResponse(
            201,
            "Re-inspection requested successfully",
            inspection
        )
    );
});


export const requestManagedInspection = asyncHandler(async (req, res) => {

    const { listingId } = req.params;

    const inspection = await inspectionService.requestManagedInspection(
        listingId,
        req.user._id,
        {
            inspectionAddress: req.body.inspectionAddress,
            scheduledDate: req.body.scheduledDate,
            timeSlot: req.body.timeSlot
        }
    );

    res.status(201).json(
        new ApiResponse(
            201,
            "Managed inspection requested successfully",
            inspection
        )
    );
});

export const createInspectionPayment = asyncHandler(async (req, res) => {

    const inspection = await inspectionService.createInspectionPayment(
        req.params.inspectionId,
        req.user._id
    );

    res.status(200).json(
        new ApiResponse(
            200,
            "Inspection payment session created",
            inspection
        )
    );
});

export const getAvailableSlots = asyncHandler(async (req, res) => {
    const { date } = req.query;
    if (!date) {
        return res.status(400).json({ success: false, message: "date query param required (YYYY-MM-DD)" });
    }
    const booked = await inspectionService.getAvailableSlots(date);
    res.status(200).json(new ApiResponse(200, "Available slots fetched", { bookedSlots: booked }));
});

export const getListingInspectionStatus = asyncHandler(async (req, res) => {
    const { listingId } = req.params;
    const inspection = await inspectionService.getListingInspectionStatus(listingId);
    res.status(200).json(new ApiResponse(200, "Listing inspection status fetched", inspection));
});

export const getMyInspections = asyncHandler(async (req, res) => {

    const inspections = await inspectionService.getMyInspections(
        req.user._id,
        req.query
    );

    res.status(200).json(
        new ApiResponse(
            200,
            "My inspections fetched successfully",
            inspections
        )
    );
});