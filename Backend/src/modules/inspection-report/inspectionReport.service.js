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

async function getInspectionWithListing(inspectionId) {
  return inspectionModel
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
}

// The seller may edit the listing (year/make/model/images…) while the report
// is still a DRAFT. Those identity fields aren't editable in the builder, so
// re-sync them from the live listing whenever a draft is opened or published.
// Admin-entered fields (chassisNo/engineNo/registrationNo and any manual
// overrides of mileage/colour/city) are left untouched. Published reports are
// never re-synced — they are frozen documents.
async function syncDraftSnapshot(report) {
  if (!report || report.status !== "DRAFT") return report;

  const inspection = await getInspectionWithListing(report.inspection);
  const l = inspection?.listing;
  if (!l) return report;

  report.carSnapshot.title          = l.title ?? `${l.brand?.name} ${l.carModel?.name} ${l.year}`;
  report.carSnapshot.year           = l.year;
  report.carSnapshot.brand          = l.brand?.name ?? "";
  report.carSnapshot.carModel       = l.carModel?.name ?? "";
  report.carSnapshot.engineCapacity = l.engineCapacity;
  report.carSnapshot.transmission   = l.transmission;
  report.carSnapshot.engineType     = l.engineType;
  report.carSnapshot.images         = l.images ?? [];
  report.markModified("carSnapshot");
  await report.save();

  return report;
}

export async function initReport(inspectionId) {
  const existing = await InspectionReport.findOne({ inspection: inspectionId });

  if (existing) {
    return syncDraftSnapshot(existing);
  }

  const inspection = await getInspectionWithListing(inspectionId);

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
  // Opening the builder always shows the listing's current identity/images
  return syncDraftSnapshot(report);
}

export async function getReportByInspectionId(inspectionId) {
  return InspectionReport.findOne({ inspection: inspectionId });
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function updateReport(reportId, body) {
  const report = await InspectionReport.findById(reportId);
  if (!report) throw new ApiError(404, "Report not found");

  // Published reports stay live on the same public link while being edited —
  // we just stamp when they were last changed so the edit is transparent to
  // anyone viewing the report.
  const editingPublished = report.status === "PUBLISHED";

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

  if (editingPublished) {
    report.lastEditedAt = new Date();
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

  // Freeze the latest listing identity/images into the report at the moment
  // of publishing — after this the snapshot never changes again.
  await syncDraftSnapshot(report);

  report.status      = "PUBLISHED";
  report.verifyToken = crypto.randomBytes(16).toString("hex");
  report.overallRating = calcOverallRating(report.sections);
  report.publishedAt = new Date();

  await report.save();

  // Publishing the report is what activates a managed listing — the seller's
  // car is now verified and ready to go live. (General listings are already
  // ACTIVE; this only affects managed ones still pending onboarding.)
  const listing = await listingModel.findById(report.listing);
  if (listing && listing.saleMode === "MANAGED" && listing.status === "PENDING") {
    listing.status = "ACTIVE";
    await listing.save();
  }

  return report;
}

// ── Public view ───────────────────────────────────────────────────────────────

export async function getPublicReport(verifyToken) {
  const report = await InspectionReport.findOne({ verifyToken, status: "PUBLISHED" });
  if (!report) throw new ApiError(404, "Report not found or not yet published");

  // A published report stays reachable by its link/QR for both ACTIVE and
  // SOLD listings — a buyer who bought the car (or downloaded the report)
  // must still be able to verify it. ONLY a REMOVED listing blocks the
  // report, so a downloaded copy of a taken-down listing can't masquerade
  // as live. (Do NOT gate this on ACTIVE — that hides sold cars' reports.)
  const listing = await listingModel.findById(report.listing).select("status");
  if (!listing || listing.status === "REMOVED") {
    throw new ApiError(410, "This report is no longer available — the listing has been removed.");
  }

  return report;
}
