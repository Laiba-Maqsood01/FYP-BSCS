import * as featuredService from "./featured.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";

export const requestFeatured = asyncHandler(async (req, res) => {

    const result = await featuredService.requestFeaturedListing({
        listingId: req.body.listingId,
        sellerId: req.user._id,
        plan: req.body.plan
    });

    res.status(201).json(
        new ApiResponse(
            201,
            "Featured request created",
            result
        )
    );
});

export const createFeaturedPayment = asyncHandler(async (req, res) => {

    const result = await featuredService.createFeaturedPayment(
        req.params.featureId,
        req.user._id
    );

    res.status(200).json(
        new ApiResponse(
            200,
            "Featured payment session created",
            result
        )
    );
});