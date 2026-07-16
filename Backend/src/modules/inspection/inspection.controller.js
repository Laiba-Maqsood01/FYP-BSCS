import * as inspectionService from "./inspection.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";

export const requestInspection = asyncHandler(async (req, res) => {

    const { listingId } = req.params; // already validated through zod

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

// External inspection — car not listed on GearTrade
export const requestExternalInspection = asyncHandler(async (req, res) => {
    const inspection = await inspectionService.requestExternalInspection(
        req.user._id,
        req.body
    );

    res.status(201).json(
        new ApiResponse(201, "Inspection requested successfully", inspection)
    );
});

export const getExternalFeeQuote = asyncHandler(async (req, res) => {
    const { bodyType, engineType, engineCapacity } = req.query;
    if (!bodyType || !engineType || !engineCapacity) {
        return res.status(400).json({
            success: false,
            message: "bodyType, engineType and engineCapacity query params are required",
        });
    }
    const quote = await inspectionService.getExternalFeeQuote({ bodyType, engineType, engineCapacity });
    res.status(200).json(new ApiResponse(200, "Inspection fee quote", quote));
});

export const getInspectionFeeQuote = asyncHandler(async (req, res) => {
    const quote = await inspectionService.getInspectionFeeQuote(req.params.listingId);
    res.status(200).json(new ApiResponse(200, "Inspection fee quote", quote));
});

export const getAvailableSlots = asyncHandler(async (req, res) => {
    const { date, excludeInspectionId } = req.query;
    if (!date) {
        return res.status(400).json({ success: false, message: "date query param required (YYYY-MM-DD)" });
    }
    const data = await inspectionService.getAvailableSlots(date, excludeInspectionId);
    res.status(200).json(new ApiResponse(200, "Available slots fetched", data));
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