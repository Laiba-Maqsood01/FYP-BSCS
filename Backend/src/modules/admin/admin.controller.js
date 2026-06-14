import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import * as adminService from "./admin.service.js";

// Dashboard
export const getDashboard = asyncHandler(async (req, res) => {
    const data = await adminService.getDashboard();

    res.status(200).json(
        new ApiResponse(
            200,
            "Dashboard stats",
            data
        )
    );
});

// Users
export const getUsers = asyncHandler(async (req, res) => {
    const data = await adminService.getUsers(req.query);

    res.status(200).json(
        new ApiResponse(
            200,
            "Users fetched",
            data
        )
    );
});

export const getUserDetail = asyncHandler(async (req, res) => {
    const data = await adminService.getUserDetail(req.params.id);

    res.status(200).json(
        new ApiResponse(
            200,
            "User detail",
            data
        )
    );
});

export const toggleBlockUser = asyncHandler(async (req, res) => {
    const data = await adminService.toggleBlockUser(req.params.id, req.body.days);

    res.status(200).json(
        new ApiResponse(
            200,
            data.message,
            data
        )
    );
});

export const deleteUser = asyncHandler(async (req, res) => {
    const data = await adminService.deleteUser(req.params.id);

    res.status(200).json(
        new ApiResponse(
            200,
            "User deleted ",
            data
        )
    );
});

// Listings
export const getListings = asyncHandler(async (req, res) => {
    const data = await adminService.getListings(req.query);

    res.status(200).json(
        new ApiResponse(
            200,
            "Listings fetched",
            data
        )
    );
});

export const approveListing = asyncHandler(async (req, res) => {
    const data = await adminService.approveListing(req.params.id);

    res.status(200).json(
        new ApiResponse(
            200,
            "Listing approved",
            data
        )
    );
});

export const rejectListing = asyncHandler(async (req, res) => {
    const data = await adminService.rejectListing(req.params.id, req.body.reason);

    res.status(200).json(
        new ApiResponse(
            200,
            "Listing rejected",
            data
        )
    );
});

export const removeListing = asyncHandler(async (req, res) => {
    const data = await adminService.removeListing(req.params.id);

    res.status(200).json(
        new ApiResponse(
            200,
            "Listing removed",
            data
        )
    );
});

// Inspections
export const getInspections = asyncHandler(async (req, res) => {
    const data = await adminService.getInspections(req.query);

    res.status(200).json(
        new ApiResponse(
            200,
            "Inspections fetched",
            data
        )
    );
});

export const assignInspector = asyncHandler(async (req, res) => {
    const data = await adminService.assignInspector(req.params.id, req.body.assignedInspector);

    res.status(200).json(
        new ApiResponse(
            200,
            "Inspector assigned",
            data
        )
    );
});

export const updateInspectionStatus = asyncHandler(async (req, res) => {
    const data = await adminService.updateInspectionStatus(req.params.id, req.body.status);

    res.status(200).json(
        new ApiResponse(
            200,
            "Inspection status updated",
            data
        )
    );
});

export const uploadInspectionReport = asyncHandler(async (req, res) => {
    const data = await adminService.uploadInspectionReport(req.params.id, req.body);

    res.status(200).json(
        new ApiResponse(
            200,
            "Report uploaded",
            data
        )
    );
});

// Featured
export const getFeatured = asyncHandler(async (req, res) => {
    const data = await adminService.getFeatured(req.query);

    res.status(200).json(
        new ApiResponse(
            200,
            "Featured listings fetched",
            data
        )
    );
});


// Refunds
export const getRefunds = asyncHandler(async (req, res) => {
    const data = await adminService.getRefunds(req.query);

    res.status(200).json(
        new ApiResponse(
            200,
            "Refunds fetched",
            data
        )
    );
});

export const approveRefund = asyncHandler(async (req, res) => {
    const data = await adminService.approveRefund(req.params.id);

    res.status(200).json(
        new ApiResponse(
            200,
            "Refund processed",
            data
        )
    );
});