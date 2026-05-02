import { useEffect, useState } from "react";
import {
  LuArrowLeft,
  LuBadgeCheck,
  LuCalendarDays,
  LuCircleCheckBig,
  LuFileText,
  LuFuel,
  LuGauge,
  LuMapPin,
  LuSearchCheck,
  LuShieldCheck,
  LuUserRound,
} from "react-icons/lu";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import {
  createInspection,
  getCurrentUser,
  getListingById,
} from "../../services/api";

function VehicleDetails() {
  const navigate = useNavigate();
  const { listingId } = useParams();
  const currentUser = getCurrentUser();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
  const [buyForm, setBuyForm] = useState(() => {
    return {
      fullName: currentUser?.fullName || "",
      email: currentUser?.email || "",
      phone: currentUser?.phone || "",
      message: "I want to buy this car. Please contact me with the next steps.",
    };
  });
  const [inspectionForm, setInspectionForm] = useState({
    requesterType: currentUser?.accountType || "buyer",
    fullName: currentUser?.fullName || "",
    email: currentUser?.email || "",
    phone: currentUser?.phone || "",
    city: currentUser?.location || "",
    inspectionType: "pre-purchase",
    preferredDate: "",
    notes: "",
  });

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

  const handleBackHome = () => {
    navigate("/");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOpenInspectionReport = () => {
    navigate(`/inspection-report/${listingId}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBuyFormChange = (event) => {
    const { name, value } = event.target;

    setBuyForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleBuySubmit = (event) => {
    event.preventDefault();
    setIsBuyModalOpen(false);
    window.alert("Your purchase request has been sent to the seller.");
  };

  const handleInspectionFormChange = (event) => {
    const { name, value } = event.target;

    setInspectionForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleInspectionSubmit = async (event) => {
    event.preventDefault();

    if (!listing) {
      return;
    }

    try {
      await createInspection({
        listingId: listing.id,
        ownerId: listing.owner?.id,
        scheduledAt: inspectionForm.preferredDate,
        notes: [
          `Requested As: ${inspectionForm.requesterType}`,
          `Contact Name: ${inspectionForm.fullName}`,
          `Email: ${inspectionForm.email}`,
          `Phone: ${inspectionForm.phone}`,
          `City: ${inspectionForm.city}`,
          `Inspection Type: ${inspectionForm.inspectionType}`,
          `Notes: ${inspectionForm.notes || "N/A"}`,
        ].join(" | "),
      });

      setIsInspectionModalOpen(false);
      window.alert("Inspection request submitted successfully.");
    } catch (submitError) {
      window.alert(submitError.message);
    }
  };

  return (
    <>
      <Navbar />

      <main className="vehicle-details-page">
        <div className="vehicle-details-header">
          <button
            type="button"
            className="view-btn"
            onClick={handleBackHome}
          >
            <LuArrowLeft /> Back
          </button>
        </div>

        {loading ? (
          <div className="dashboard-empty-state compact-state">
            <h3>Loading vehicle details...</h3>
          </div>
        ) : error ? (
          <div className="dashboard-empty-state compact-state">
            <h3>Unable to load vehicle</h3>
            <p>{error}</p>
          </div>
        ) : listing ? (
          <section className="vehicle-details-layout">
            <div className="vehicle-details-media">
              <div className="vehicle-details-gallery">
                <img src={listing.image} alt={listing.name} />
              </div>

              <div className="vehicle-media-actions">
                <button
                  type="button"
                  className="dashboard-add-btn vehicle-buy-button is-full"
                  onClick={() => setIsBuyModalOpen(true)}
                >
                  Buy This Car
                </button>

                {listing.status !== "inspected" && (
                  <button
                    type="button"
                    className="vehicle-secondary-action"
                    onClick={() => setIsInspectionModalOpen(true)}
                  >
                    <LuSearchCheck /> Request Inspection
                  </button>
                )}
              </div>
            </div>

            <div className="vehicle-details-card">
              <div className="vehicle-details-top">
                <div>
                  <h1>{listing.name}</h1>
                  <p>{listing.model}</p>
                </div>

                {listing.status === "inspected" ? (
                  <button
                    type="button"
                    className="dashboard-status-badge is-inspected vehicle-report-trigger"
                    onClick={handleOpenInspectionReport}
                  >
                    Inspected
                  </button>
                ) : (
                  <span className="dashboard-status-badge is-pending">Pending</span>
                )}
              </div>

              <div className="vehicle-details-price">{listing.price}</div>

              <div className="vehicle-details-grid">
                <article className="vehicle-spec-card">
                  <LuCalendarDays />
                  <div>
                    <span>Year</span>
                    <strong>{listing.year}</strong>
                  </div>
                </article>

                <article className="vehicle-spec-card">
                  <LuGauge />
                  <div>
                    <span>Mileage</span>
                    <strong>{listing.mileage}</strong>
                  </div>
                </article>

                <article className="vehicle-spec-card">
                  <LuFuel />
                  <div>
                    <span>Fuel</span>
                    <strong>{listing.fuel}</strong>
                  </div>
                </article>

                <article className="vehicle-spec-card">
                  <LuMapPin />
                  <div>
                    <span>Location</span>
                    <strong>{listing.location}</strong>
                  </div>
                </article>
              </div>

              <div className="vehicle-details-panels">
                {listing.inspection && (
                  <div className="vehicle-info-panel vehicle-report-panel">
                    <div>
                      <h2>Inspection Report</h2>
                      <p>
                        This car has been inspected. Click below to open the full
                        report for this vehicle.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="dashboard-add-btn vehicle-report-button"
                      onClick={handleOpenInspectionReport}
                    >
                      <LuFileText /> Open Inspection Report
                    </button>
                  </div>
                )}

                <div className="vehicle-info-panel">
                  <h2>Overview</h2>
                  <p>
                    This vehicle is available on the platform with verified listing
                    details, pricing, and seller information for quick review.
                  </p>
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
                  {listing.featured && (
                    <div className="vehicle-seller-row">
                      <LuBadgeCheck />
                      <span>Featured Listing</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </main>

      {isBuyModalOpen && listing && (
        <div
          className="listing-modal-overlay"
          role="presentation"
          onClick={() => setIsBuyModalOpen(false)}
        >
          <div
            className="listing-modal vehicle-buy-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Buy this car"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="listing-modal-header">
              <div>
                <h2>Buy This Car</h2>
                <p>
                  Send your purchase interest for {listing.name} to the seller.
                </p>
              </div>

              <button
                type="button"
                className="listing-modal-close"
                onClick={() => setIsBuyModalOpen(false)}
              >
                x
              </button>
            </div>

            <form className="listing-modal-form" onSubmit={handleBuySubmit}>
              <div className="listing-modal-grid">
                <label className="dashboard-field">
                  <span>Your Name</span>
                  <input
                    name="fullName"
                    value={buyForm.fullName}
                    onChange={handleBuyFormChange}
                    required
                  />
                </label>

                <label className="dashboard-field">
                  <span>Email</span>
                  <input
                    name="email"
                    type="email"
                    value={buyForm.email}
                    onChange={handleBuyFormChange}
                    required
                  />
                </label>

                <label className="dashboard-field">
                  <span>Phone Number</span>
                  <input
                    name="phone"
                    value={buyForm.phone}
                    onChange={handleBuyFormChange}
                    required
                  />
                </label>

                <label className="dashboard-field">
                  <span>Seller</span>
                  <input
                    value={listing.owner?.fullName || "AutoHub Seller"}
                    readOnly
                  />
                </label>

                <label className="dashboard-field listing-upload-field">
                  <span>Message</span>
                  <textarea
                    name="message"
                    rows="5"
                    value={buyForm.message}
                    onChange={handleBuyFormChange}
                    required
                  />
                </label>
              </div>

              <div className="vehicle-buy-actions">
                <div className="vehicle-buy-note">
                  <LuCircleCheckBig />
                  <span>Seller will receive your buying request with your details.</span>
                </div>

                <button type="submit" className="dashboard-save-button">
                  Confirm Purchase Interest
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isInspectionModalOpen && listing && (
        <div
          className="listing-modal-overlay"
          role="presentation"
          onClick={() => setIsInspectionModalOpen(false)}
        >
          <div
            className="listing-modal vehicle-buy-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Request inspection"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="listing-modal-header">
              <div>
                <h2>Request Inspection</h2>
                <p>
                  Tell us whether you want the inspection as a buyer or seller for{" "}
                  {listing.name}.
                </p>
              </div>

              <button
                type="button"
                className="listing-modal-close"
                onClick={() => setIsInspectionModalOpen(false)}
              >
                x
              </button>
            </div>

            <form className="listing-modal-form" onSubmit={handleInspectionSubmit}>
              <div className="listing-modal-grid">
                <label className="dashboard-field">
                  <span>Requesting As</span>
                  <select
                    name="requesterType"
                    value={inspectionForm.requesterType}
                    onChange={handleInspectionFormChange}
                    required
                  >
                    <option value="buyer">Buyer</option>
                    <option value="seller">Seller</option>
                  </select>
                </label>

                <label className="dashboard-field">
                  <span>Inspection Type</span>
                  <select
                    name="inspectionType"
                    value={inspectionForm.inspectionType}
                    onChange={handleInspectionFormChange}
                    required
                  >
                    <option value="pre-purchase">Pre-Purchase Inspection</option>
                    <option value="onsite">Onsite Inspection</option>
                    <option value="pickup">Pickup and Inspect</option>
                  </select>
                </label>

                <label className="dashboard-field">
                  <span>Your Name</span>
                  <input
                    name="fullName"
                    value={inspectionForm.fullName}
                    onChange={handleInspectionFormChange}
                    required
                  />
                </label>

                <label className="dashboard-field">
                  <span>Email</span>
                  <input
                    name="email"
                    type="email"
                    value={inspectionForm.email}
                    onChange={handleInspectionFormChange}
                    required
                  />
                </label>

                <label className="dashboard-field">
                  <span>Phone Number</span>
                  <input
                    name="phone"
                    value={inspectionForm.phone}
                    onChange={handleInspectionFormChange}
                    required
                  />
                </label>

                <label className="dashboard-field">
                  <span>City</span>
                  <input
                    name="city"
                    value={inspectionForm.city}
                    onChange={handleInspectionFormChange}
                    required
                  />
                </label>

                <label className="dashboard-field listing-upload-field">
                  <span>Preferred Date</span>
                  <input
                    name="preferredDate"
                    type="date"
                    value={inspectionForm.preferredDate}
                    onChange={handleInspectionFormChange}
                    required
                  />
                </label>

                <label className="dashboard-field listing-upload-field">
                  <span>Additional Notes</span>
                  <textarea
                    name="notes"
                    rows="5"
                    value={inspectionForm.notes}
                    onChange={handleInspectionFormChange}
                    placeholder="Share any concern you want checked during inspection"
                  />
                </label>
              </div>

              <div className="vehicle-buy-actions">
                <div className="vehicle-buy-note">
                  <LuCircleCheckBig />
                  <span>Your inspection request will be shared with the listing owner.</span>
                </div>

                <button type="submit" className="dashboard-save-button">
                  Submit Inspection Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default VehicleDetails;
