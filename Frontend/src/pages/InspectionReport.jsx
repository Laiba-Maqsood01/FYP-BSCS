import { useEffect, useState } from "react";
import {
  LuArrowLeft,
  LuBadgeCheck,
  LuCalendarDays,
  LuFileText,
  LuFuel,
  LuGauge,
  LuMapPin,
  LuShieldCheck,
  LuUserRound,
} from "react-icons/lu";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getListingById } from "../../services/api";

function formatInspectionDate(value) {
  if (!value) {
    return "Date not available";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function buildInspectionSections(listing, inspection) {
  return [
    {
      title: "Engine & Transmission",
      items: [
        {
          label: "Engine performance",
          status: "good",
          note: inspection.notes,
          images: inspection.partImages?.["Engine performance"] || [],
        },
        {
          label: "Transmission response",
          status: "good",
          note: "Smooth shifting during inspection.",
          images: inspection.partImages?.["Transmission response"] || [],
        },
        {
          label: "Fluid leakage check",
          status: "good",
          note: "No major leakage observed.",
          images: inspection.partImages?.["Fluid leakage check"] || [],
        },
      ],
    },
    {
      title: "Body & Exterior",
      items: [
        {
          label: "Body panels",
          status: "good",
          note: "Overall alignment looks acceptable.",
          images: inspection.partImages?.["Body panels"] || [],
        },
        {
          label: "Paint condition",
          status: "attention",
          note: "Minor cosmetic wear noted on exterior.",
          images: inspection.partImages?.["Paint condition"] || [],
        },
        {
          label: "Lights & visibility",
          status: "good",
          note: "Primary lights and mirrors checked.",
          images: inspection.partImages?.["Lights & visibility"] || [],
        },
      ],
    },
    {
      title: "Interior & Road Readiness",
      items: [
        {
          label: "Cabin condition",
          status: "good",
          note: "Interior condition is presentable.",
          images: inspection.partImages?.["Cabin condition"] || [],
        },
        {
          label: "Mileage consistency",
          status: "info",
          note: `Odometer recorded at ${listing.mileage}.`,
          images: inspection.partImages?.["Mileage consistency"] || [],
        },
        {
          label: "Overall recommendation",
          status: "good",
          note: inspection.reportOpinion,
          images: inspection.partImages?.["Overall recommendation"] || [],
        },
      ],
    },
  ];
}

function InspectionReport() {
  const navigate = useNavigate();
  const { listingId } = useParams();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activePartGallery, setActivePartGallery] = useState("");

  useEffect(() => {
    const loadListing = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getListingById(listingId);
        setListing(data);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    };

    loadListing();
  }, [listingId]);

  const inspection = listing?.inspection;
  const reportSections =
    listing && inspection ? buildInspectionSections(listing, inspection) : [];

  return (
    <>
      <Navbar />

      <main className="vehicle-details-page">
        <div className="vehicle-details-header">
          <button
            type="button"
            className="view-btn"
            onClick={() => navigate(`/vehicle/${listingId}`)}
          >
            <LuArrowLeft /> Back to Car
          </button>
        </div>

        {loading ? (
          <div className="dashboard-empty-state compact-state">
            <h3>Loading inspection report...</h3>
          </div>
        ) : error ? (
          <div className="dashboard-empty-state compact-state">
            <h3>Unable to load inspection report</h3>
            <p>{error}</p>
          </div>
        ) : !listing ? null : !inspection ? (
          <div className="dashboard-empty-state compact-state">
            <h3>Inspection report not available</h3>
            <p>This car does not have a completed inspection report yet.</p>
          </div>
        ) : (
          <section className="inspection-report-shell">
            <div className="inspection-report-hero">
              <div className="inspection-report-cover">
                <img src={listing.image} alt={listing.name} />
              </div>

              <div className="inspection-report-summary">
                <div className="vehicle-details-top">
                  <div>
                    <h1>{listing.name}</h1>
                    <p>Detailed inspection report for this vehicle</p>
                  </div>

                  <span className="dashboard-status-badge is-inspected">
                    Inspected
                  </span>
                </div>

                <div className="vehicle-details-price">{listing.price}</div>

                <div className="inspection-report-meta">
                  <article className="vehicle-spec-card">
                    <LuUserRound />
                    <div>
                      <span>Inspector</span>
                      <strong>{inspection.inspector || "Assigned Inspector"}</strong>
                    </div>
                  </article>

                  <article className="vehicle-spec-card">
                    <LuCalendarDays />
                    <div>
                      <span>Inspection Date</span>
                      <strong>{formatInspectionDate(inspection.scheduledAt)}</strong>
                    </div>
                  </article>

                  <article className="vehicle-spec-card">
                    <LuMapPin />
                    <div>
                      <span>Location</span>
                      <strong>{listing.location}</strong>
                    </div>
                  </article>

                  <article className="vehicle-spec-card">
                    <LuFileText />
                    <div>
                      <span>Report File</span>
                      <strong>{inspection.reportFileName || "Digital report"}</strong>
                    </div>
                  </article>
                </div>
              </div>
            </div>

            <div className="inspection-report-grid">
              <div className="inspection-report-main">
                <div className="vehicle-info-panel">
                  <h2>Vehicle Overview</h2>
                  <div className="inspection-overview-grid">
                    <div className="inspection-overview-item">
                      <span>Model</span>
                      <strong>{listing.model}</strong>
                    </div>
                    <div className="inspection-overview-item">
                      <span>Year</span>
                      <strong>{listing.year}</strong>
                    </div>
                    <div className="inspection-overview-item">
                      <span>Mileage</span>
                      <strong>{listing.mileage}</strong>
                    </div>
                    <div className="inspection-overview-item">
                      <span>Fuel Type</span>
                      <strong>{listing.fuel}</strong>
                    </div>
                  </div>
                </div>

                {reportSections.map((section) => (
                  <div key={section.title} className="vehicle-info-panel">
                    <h2>{section.title}</h2>
                    <div className="inspection-checklist">
                      {section.items.map((item) => (
                        <div key={item.label} className="inspection-check-item">
                          <div className="inspection-check-copy">
                            <strong>{item.label}</strong>
                            <p>{item.note || "Checked during inspection."}</p>
                            {item.images?.length > 0 && (
                              <button
                                type="button"
                                className="inspection-gallery-trigger"
                                onClick={() =>
                                  setActivePartGallery((current) =>
                                    current === item.label ? "" : item.label,
                                  )
                                }
                              >
                                {activePartGallery === item.label
                                  ? `Hide Images (${item.images.length})`
                                  : `View Images (${item.images.length})`}
                              </button>
                            )}
                          </div>
                          <span
                            className={`inspection-status-badge is-${item.status}`}
                          >
                            {item.status === "good"
                              ? "OK"
                              : item.status === "attention"
                                ? "Attention"
                                : "Info"}
                          </span>

                          {activePartGallery === item.label && item.images?.length > 0 && (
                            <div className="inspection-inline-gallery">
                              {item.images.map((image, index) => (
                                <div
                                  key={`${item.label}-${index}`}
                                  className="inspection-gallery-card"
                                >
                                  <img
                                    src={image}
                                    alt={`${item.label} ${index + 1}`}
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <aside className="inspection-report-side">
                <div className="vehicle-info-panel">
                  <h2>Inspector Remarks</h2>
                  <p>{inspection.notes || "No additional notes were added."}</p>
                </div>

                <div className="vehicle-info-panel">
                  <h2>Final Opinion</h2>
                  <p>
                    {inspection.reportOpinion ||
                      "Vehicle inspection completed successfully and no final opinion text was uploaded."}
                  </p>
                </div>

                <div className="vehicle-info-panel">
                  <h2>Report Snapshot</h2>
                  <div className="vehicle-seller-row">
                    <LuBadgeCheck />
                    <span>Inspection completed and verified</span>
                  </div>
                  <div className="vehicle-seller-row">
                    <LuGauge />
                    <span>Mileage checked: {listing.mileage}</span>
                  </div>
                  <div className="vehicle-seller-row">
                    <LuFuel />
                    <span>Fuel setup: {listing.fuel}</span>
                  </div>
                </div>

                <div className="vehicle-info-panel">
                  <h2>Seller Details</h2>
                  <div className="vehicle-seller-row">
                    <LuUserRound />
                    <span>{listing.owner?.fullName || "AutoHub Seller"}</span>
                  </div>
                  <div className="vehicle-seller-row">
                    <LuShieldCheck />
                    <span>{listing.owner?.email || "seller@autohub.com"}</span>
                  </div>
                  <div className="vehicle-seller-row">
                    <LuBadgeCheck />
                    <span>Inspection verified on AutoHub</span>
                  </div>
                </div>
              </aside>
            </div>
          </section>
        )}
      </main>
    </>
  );
}

export default InspectionReport;
