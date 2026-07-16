import crypto from "crypto";
import InspectionReport, {
  buildEmptySections,
  calcSectionScore,
  calcOverallRating,
  SECTION_KEYS,
} from "./inspectionReport.model.js";
import inspectionModel from "../inspection/inspection.model.js";
import listingModel    from "../listing/listing.model.js";
import userModel       from "../../models/user.model.js";
import { ApiError }    from "../../utils/apiError.js";
import { sendEmail }   from "../../services/email.service.js";
import config          from "../../config/config.js";

// ── Init / get ────────────────────────────────────────────────────────────────

async function getInspectionWithListing(inspectionId) {
  return inspectionModel
    .findById(inspectionId)
    .populate({
      path:     "listing",
      populate: [
        { path: "brand",        select: "name" },
        { path: "carModel",     select: "name" },
        { path: "bodyType",     select: "name" },
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

  // External inspections have no listing — their snapshot is frozen booking
  // data from the requester, nothing to re-sync.
  if (!report.listing) return report;

  const inspection = await getInspectionWithListing(report.inspection);
  const l = inspection?.listing;
  if (!l) return report;

  report.carSnapshot.title          = l.title ?? `${l.brand?.name} ${l.carModel?.name} ${l.year}`;
  report.carSnapshot.year           = l.year;
  report.carSnapshot.brand          = l.brand?.name ?? "";
  report.carSnapshot.carModel       = l.carModel?.name ?? "";
  report.carSnapshot.bodyType       = l.bodyType?.name ?? "";
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
  const ext = inspection.externalCar;

  // External inspection → snapshot from the requester's booking details;
  // listing inspection → snapshot from the live listing.
  const carSnapshot = l ? {
    title:          l.title ?? `${l.brand?.name} ${l.carModel?.name} ${l.year}`,
    year:           l.year,
    brand:          l.brand?.name  ?? "",
    carModel:       l.carModel?.name ?? "",
    bodyType:       l.bodyType?.name ?? "",
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
  } : {
    title:          `${ext?.brand ?? ""} ${ext?.carModel ?? ""} ${ext?.year ?? ""}`.trim(),
    year:           ext?.year,
    brand:          ext?.brand ?? "",
    carModel:       ext?.carModel ?? "",
    bodyType:       ext?.bodyType ?? "",
    engineCapacity: ext?.engineCapacity,
    engineType:     ext?.engineType ?? "",
    chassisNo:      "",
    engineNo:       "",
    registrationNo: "",
    location:       ext?.city ?? "",
    images:         [],
  };

  const report = await InspectionReport.create({
    inspection:    inspectionId,
    listing:       l?._id ?? null,
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

  // External reports have no listing gallery — the report's own photos are
  // the only images. Require at least two (the first becomes the cover).
  if (!report.listing && (report.reportPhotos?.length ?? 0) < 2) {
    throw new ApiError(
      400,
      "Upload at least 2 photos in the Photos step before publishing — external reports use them as the car's images."
    );
  }

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

  // Email the report link to the requester — and to the listing owner too,
  // when someone else (a buyer) requested the inspection.
  const inspection = await inspectionModel
    .findById(report.inspection)
    .select("requestedBy");

  const recipientIds = [
    ...new Set(
      [inspection?.requestedBy, listing?.seller]
        .filter(Boolean)
        .map(id => id.toString())
    ),
  ];

  const recipients = await userModel
    .find({ _id: { $in: recipientIds } })
    .select("username email");

  const reportUrl = `${config.CLIENT_URL}/reports/${report.verifyToken}`;
  const carLabel  = report.carSnapshot?.title || "your vehicle";

  for (const recipient of recipients) {
    if (!recipient.email) continue;
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0">
        <h2 style="font-size:20px;font-weight:700;color:#0f172a;margin:0 0 8px">Inspection Report Published</h2>
        <p style="font-size:14px;color:#64748b;margin:0 0 24px">Hi ${recipient.username}, the inspection of <strong>${carLabel}</strong> is complete and its report is now available.</p>

        <a href="${reportUrl}" style="display:inline-block;background:#16a34a;color:#ffffff;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none;margin-bottom:24px">View Inspection Report</a>

        <p style="font-size:13px;color:#64748b;margin:16px 0 0">Or copy this link into your browser:</p>
        <p style="font-size:12px;color:#334155;word-break:break-all;margin:4px 0 0">${reportUrl}</p>

        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0" />
        <p style="font-size:12px;color:#94a3b8;margin:0">GearTrade.app — Pakistan's trusted car marketplace</p>
      </div>
    `;
    await sendEmail(
      recipient.email,
      "Inspection Report Published — GearTrade",
      `The inspection of ${carLabel} is complete. View the report: ${reportUrl}`,
      html
    );
  }

  return report;
}

// ── Public view ───────────────────────────────────────────────────────────────

export async function getPublicReport(verifyToken) {
  const report = await InspectionReport.findOne({ verifyToken, status: "PUBLISHED" });
  if (!report) throw new ApiError(404, "Report not found or not yet published");

  // A published report is a self-contained verifiable document — anyone
  // holding its URL / QR code can open it, regardless of what later happened
  // to the listing (sold, removed), and for external inspections that never
  // had a listing at all. It renders entirely from its frozen car snapshot.
  return report;
}
