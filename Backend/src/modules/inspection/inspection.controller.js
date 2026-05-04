import * as inspectionService from "./inspection.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";

export const requestInspection = asyncHandler(async (req, res) => {

    const { listingId } = req.params; // already validated through zod

    const inspection =
        await inspectionService.requestInspection(
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