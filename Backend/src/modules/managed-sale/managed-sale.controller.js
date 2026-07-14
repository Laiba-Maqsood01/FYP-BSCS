import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import * as managedSaleService from "./managed-sale.service.js";

// Deletion Requests
export const submitDeletionRequest = asyncHandler(async (req, res) => {
    const data = await managedSaleService.submitDeletionRequest(
        req.params.listingId,
        req.user._id,
        req.body.reason
    );
    res.status(201).json(new ApiResponse(201, "Deletion request submitted", data));
});

export const getMyDeletionRequests = asyncHandler(async (req, res) => {
    const data = await managedSaleService.getMyDeletionRequests(req.user._id);
    res.status(200).json(new ApiResponse(200, "Deletion requests fetched", data));
});

// Commission
export const getCommissionDetails = asyncHandler(async (req, res) => {
    const data = await managedSaleService.getCommissionDetails(
        req.params.listingId,
        req.user._id
    );
    res.status(200).json(new ApiResponse(200, "Commission details fetched", data));
});