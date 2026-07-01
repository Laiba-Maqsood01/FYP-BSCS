import crypto from "crypto";
import InspectionReport, {
  buildEmptySections,
  calcSectionScore,
  calcOverallRating,
  SECTION_KEYS,
} from "./inspectionReport.model.js";
import inspectionModel from "../inspection/inspection.model.js";
import listingModel    from "../listing/listing.model.js";
import { ApiError }    from "../../utils/apiError.js";

// ── Init / get ────────────────────────────────────────────────────────────────

export async function initReport(inspectionId) {
  // Return existing draft/report if already created
  const existing = await InspectionReport.findOne({ inspection: inspectionId });
  if (existing) return existing;

  const inspection = await inspectionModel
    .findById(inspectionId)
    .populate({
      path:     "listing",
      populate: [
        { path: "brand",        select: "name" },
        { path: "carModel",     select: "name" },
        { path: "city",         select: "name" },
        { path: "registeredIn", select: "name" },
      ],
    });

  if (!inspection) throw new ApiError(404, "Inspection not found");
  if (inspection.status !== "COMPLETED")
    throw new ApiError(400, "Report can only be created for COMPLETED inspections");

  const l = inspection.listing;

  const carSnapshot = {
    title:          l.title ?? `${l.brand?.name} ${l.carModel?.name} ${l.year}`,
    year:           l.year,
    brand:          l.brand?.name  ?? "",
    carModel:       l.carModel?.name ?? "",
    engineCapacity: l.engineCapacity,
    mileage:        l.mileage,
    transmission:   l.transmission,
    engineType:     l.engineType,
    exteriorColor:  l.exteriorColor,
    chassisNo:      "",
    engineNo:       "",
    registrationNo: "",
    registeredCity: l.registeredIn?.name ?? "",
    location:       l.city?.name ?? "",
    images:         l.images ?? [],
  };

  const report = await InspectionReport.create({
    inspection:    inspectionId,
    listing:       l._id,
    carSnapshot,
    inspectorName: inspection.assignedInspector ?? "",
    inspectionDate: inspection.scheduledDate ?? new Date(),
    sections:      buildEmptySections(),
    exteriorDamage: [],
  });

  return report;
}

export async function getReportById(reportId) {
  const report = await InspectionReport.findById(reportId);
  if (!report) throw new ApiError(404, "Report not found");
  return report;
}

export async function getReportByInspectionId(inspectionId) {
  return InspectionReport.findOne({ inspection: inspectionId });
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function updateReport(reportId, body) {
  const report = await InspectionReport.findById(reportId);
  if (!report) throw new ApiError(404, "Report not found");
  if (report.status === "PUBLISHED")
    throw new ApiError(400, "Published reports cannot be edited");

  // Meta fields
  if (body.inspectorName  !== undefined) report.inspectorName  = body.inspectorName;
  if (body.inspectionDate !== undefined) report.inspectionDate = body.inspectionDate;

  // Car snapshot overrides (chassis, engine, reg numbers filled by admin)
  if (body.carSnapshot) {
    const allowed = ["chassisNo", "engineNo", "registrationNo", "registeredCity", "location", "mileage", "exteriorColor"];
    for (const key of allowed) {
      if (body.carSnapshot[key] !== undefined)
        report.carSnapshot[key] = body.carSnapshot[key];
    }
    report.markModified("carSnapshot");
  }

  // Section update
  if (body.sectionKey && SECTION_KEYS.includes(body.sectionKey) && Array.isArray(body.items)) {
    report.sections[body.sectionKey].items  = body.items;
    report.sections[body.sectionKey].score  = calcSectionScore(body.items);
    report.markModified("sections");
    report.overallRating = calcOverallRating(report.sections);
  }

  // Exterior damage
  if (Array.isArray(body.exteriorDamage)) {
    report.exteriorDamage = body.exteriorDamage;
  }

  // Report photos
  if (Array.isArray(body.reportPhotos)) {
    report.reportPhotos = body.reportPhotos;
    report.markModified("reportPhotos");
  }

  await report.save();
  return report;
}

// ── Publish ───────────────────────────────────────────────────────────────────

export async function publishReport(reportId) {
  const report = await InspectionReport.findById(reportId);
  if (!report) throw new ApiError(404, "Report not found");
  if (report.status === "PUBLISHED")
    throw new ApiError(400, "Report is already published");

  report.status      = "PUBLISHED";
  report.verifyToken = crypto.randomBytes(16).toString("hex");
  report.overallRating = calcOverallRating(report.sections);

  await report.save();
  return report;
}

// ── Public view ───────────────────────────────────────────────────────────────

export async function getPublicReport(verifyToken) {
  const report = await InspectionReport.findOne({ verifyToken, status: "PUBLISHED" });
  if (!report) throw new ApiError(404, "Report not found or not yet published");
  return report;
}
