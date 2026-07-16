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

export const getListingDetail = asyncHandler(async (req, res) => {
    const data = await adminService.getListingDetail(req.params.id);

    res.status(200).json(
        new ApiResponse(
            200,
            "Listing details fetched",
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
    const data = await adminService.updateInspectionStatus(req.params.id, req.body.status, req.body.cancelReason);

    res.status(200).json(
        new ApiResponse(
            200,
            "Inspection status updated",
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


// Deletion Requests
export const getDeletionRequests = asyncHandler(async (req, res) => {
    const data = await adminService.getDeletionRequests(req.query);
    res.status(200).json(new ApiResponse(200, "Deletion requests fetched", data));
});

export const acceptDeletionRequest = asyncHandler(async (req, res) => {
    const data = await adminService.acceptDeletionRequest(req.params.id, req.user._id, {
        amount: req.body.amount,
        paymentMode: req.body.paymentMode,
    });
    res.status(200).json(new ApiResponse(200, "Deletion request accepted", data));
});

export const markBreakChargePaid = asyncHandler(async (req, res) => {
    const data = await adminService.markBreakChargePaid(req.params.id);
    res.status(200).json(new ApiResponse(200, "Break charge settled", data));
});

export const rejectDeletionRequest = asyncHandler(async (req, res) => {
    const data = await adminService.rejectDeletionRequest(
        req.params.id,
        req.body.adminNote
    );
    res.status(200).json(new ApiResponse(200, "Deletion request rejected", data));
});


// Commission
export const markListingSold = asyncHandler(async (req, res) => {
    const data = await adminService.markListingSold(
        req.params.id,
        req.body.salePrice,
        req.user._id
    );
    res.status(200).json(new ApiResponse(200, "Listing marked as sold, commission created", data));
});

export const getCommissions = asyncHandler(async (req, res) => {
    const data = await adminService.getCommissions(req.query);
    res.status(200).json(new ApiResponse(200, "Commissions fetched", data));
});



export const scheduleInspection = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { inspectionAddress, scheduledDate, timeSlot } = req.body;

    const result = await adminService.scheduleInspection(id, {
        inspectionAddress,
        scheduledDate,
        timeSlot,
    });

    res.status(200).json(new ApiResponse(200, result.message, result.inspection));
});
export const getFeaturedPlans = asyncHandler(async (req, res) => {
    const plans = await adminService.getFeaturedPlans();
    res.status(200).json(new ApiResponse(200, "Featured plans fetched", plans));
});

export const createFeaturedPlan = asyncHandler(async (req, res) => {
    const { name, label, amount, durationDays } = req.body;
    const plan = await adminService.createFeaturedPlan({ name, label, amount, durationDays });
    res.status(201).json(new ApiResponse(201, "Featured plan created", plan));
});

export const updateFeaturedPlan = asyncHandler(async (req, res) => {
    const plan = await adminService.updateFeaturedPlan(req.params.id, req.body);
    res.status(200).json(new ApiResponse(200, "Featured plan updated", plan));
});

// Site Settings
export const getSiteSettings = asyncHandler(async (req, res) => {
    const settings = await adminService.getSiteSettings();
    res.status(200).json(new ApiResponse(200, "Settings fetched", settings));
});

export const updateSiteSettings = asyncHandler(async (req, res) => {
    const settings = await adminService.updateSiteSettings(req.body);
    res.status(200).json(new ApiResponse(200, "Settings updated", settings));
});

// Inspection Slots
export const getInspectionSlots = asyncHandler(async (req, res) => {
    const slots = await adminService.getInspectionSlots();
    res.status(200).json(new ApiResponse(200, "Slots fetched", slots));
});

export const addInspectionSlot = asyncHandler(async (req, res) => {
    const slots = await adminService.addInspectionSlot(req.body);
    res.status(201).json(new ApiResponse(201, "Slot added", slots));
});

export const updateInspectionSlot = asyncHandler(async (req, res) => {
    const slots = await adminService.updateInspectionSlot(req.params.slotId, req.body);
    res.status(200).json(new ApiResponse(200, "Slot updated", slots));
});
