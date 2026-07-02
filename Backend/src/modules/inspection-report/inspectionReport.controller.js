import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse }   from "../../utils/apiResponse.js";
import * as service      from "./inspectionReport.service.js";
import {
  SECTION_LABELS, CHECKLIST_DEF,
  DAMAGE_CODES, DAMAGE_LABELS,
  PANELS, PANEL_LABELS,
} from "./inspectionReport.model.js";

// Admin — init or return existing report for an inspection
export const initReport = asyncHandler(async (req, res) => {
  const report = await service.initReport(req.params.inspectionId);
  res.status(200).json(new ApiResponse(200, "Report ready", report));
});

// Admin — get report by ID
export const getReport = asyncHandler(async (req, res) => {
  const report = await service.getReportById(req.params.reportId);
  res.status(200).json(new ApiResponse(200, "Report fetched", report));
});

// Admin — check if report exists for an inspection (lightweight)
export const getReportByInspection = asyncHandler(async (req, res) => {
  const report = await service.getReportByInspectionId(req.params.inspectionId);
  res.status(200).json(new ApiResponse(200, "Report status", report ? { exists: true, reportId: report._id, status: report.status, verifyToken: report.verifyToken } : { exists: false }));
});

// Admin — update report content
export const updateReport = asyncHandler(async (req, res) => {
  const report = await service.updateReport(req.params.reportId, req.body);
  res.status(200).json(new ApiResponse(200, "Report updated", report));
});

// Admin — publish report
export const publishReport = asyncHandler(async (req, res) => {
  const report = await service.publishReport(req.params.reportId);
  res.status(200).json(new ApiResponse(200, "Report published", report));
});

// Public — view published report by verify token
export const getPublicReport = asyncHandler(async (req, res) => {
  const report = await service.getPublicReport(req.params.verifyToken);
  res.status(200).json(new ApiResponse(200, "Report fetched", report));
});

// Admin — return full checklist definition (sections, groups, items, options)
export const getChecklistMeta = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, "Checklist meta", {
    sectionLabels: SECTION_LABELS,
    checklistDef:  CHECKLIST_DEF,
    damageCodes:   DAMAGE_CODES,
    damageLabels:  DAMAGE_LABELS,
    panels:        PANELS,
    panelLabels:   PANEL_LABELS,
  }));
});
