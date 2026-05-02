import { useEffect, useState } from "react";
import { LuFileText } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import ListingCard from "../components/dashboard/ListingCard";
import ListingFormModal from "../components/dashboard/ListingFormModal";
import {
  clearCurrentUser,
  createInspection,
  deleteListing,
  getCurrentUser,
  getUserInspections,
  getUserListings,
} from "../../services/api";

function Dashboard() {
  const navigate = useNavigate();
  const [currentUser] = useState(() => getCurrentUser());
  const [activeSection, setActiveSection] = useState("listings");
  const [listings, setListings] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isListingModalOpen, setIsListingModalOpen] = useState(false);
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [inspectionForm, setInspectionForm] = useState({
    listingId: "",
    contactName: currentUser?.fullName || "",
    phone: currentUser?.phone || "",
    city: currentUser?.location || "",
    inspectionType: "onsite",
    preferredDate: "",
    address: "",
    notes: "",
  });
  const [profile, setProfile] = useState({
    fullName: currentUser?.fullName || "User Name",
    email: currentUser?.email || "user@example.com",
    phone: currentUser?.phone || "+92 300 1234567",
    location: currentUser?.location || "Rahim Yar Khan",
  });

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError("");
        const [userListings, userInspections] = await Promise.all([
          getUserListings(currentUser.id),
          getUserInspections(currentUser.id),
        ]);
        setListings(userListings);
        setInspections(userInspections);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [currentUser?.id, navigate]);

  const handleDelete = async (id) => {
    try {
      await deleteListing(id);
      setListings((currentListings) =>
        currentListings.filter((listing) => listing.id !== id),
      );
      setInspections((currentInspections) =>
        currentInspections.filter((inspection) => inspection.listing?.id !== id),
      );
    } catch (deleteError) {
      alert(deleteError.message);
    }
  };

  const handleOpenListingModal = (listing = null) => {
    setSelectedListing(listing);
    setIsListingModalOpen(true);
  };

  const handleViewListing = (listing) => {
    navigate(`/vehicle/${listing.id}`);
  };

  const handleCloseListingModal = () => {
    setSelectedListing(null);
    setIsListingModalOpen(false);
  };

  const handleListingSaved = (listing, mode) => {
    const normalizedListing = {
      ...listing,
      status: listing.status === "inspected" ? "Inspected" : "Pending",
    };

    if (mode === "edit") {
      setListings((currentListings) =>
        currentListings.map((item) =>
          item.id === normalizedListing.id ? normalizedListing : item,
        ),
      );
      return;
    }

    setListings((currentListings) => [normalizedListing, ...currentListings]);
  };

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfile((currentProfile) => ({
      ...currentProfile,
      [name]: value,
    }));
  };

  const handleOpenInspectionModal = () => {
    if (!listings.length || !currentUser) {
      alert("Add a listing first to request inspection.");
      return;
    }

    setInspectionForm({
      listingId: listings[0]?.id || "",
      contactName: currentUser.fullName || "",
      phone: currentUser.phone || "",
      city: currentUser.location || "",
      inspectionType: "onsite",
      preferredDate: "",
      address: "",
      notes: "",
    });
    setIsInspectionModalOpen(true);
  };

  const handleCloseInspectionModal = () => {
    setIsInspectionModalOpen(false);
  };

  const handleSectionChange = (section) => {
    if (section === "logout") {
      if (currentUser?.role === "admin") {
        window.alert("Admin account cannot be signed out from here.");
        return;
      }

      clearCurrentUser();
      navigate("/login");
      return;
    }

    setActiveSection(section);
  };

  const handleInspectionFormChange = (event) => {
    const { name, value } = event.target;
    setInspectionForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleRequestInspection = async (event) => {
    if (event) {
      event.preventDefault();
    }

    if (!inspectionForm.listingId || !currentUser) {
      alert("Select a listed car first.");
      return;
    }

    try {
      const inspection = await createInspection({
        listingId: inspectionForm.listingId,
        ownerId: currentUser.id,
        scheduledAt: inspectionForm.preferredDate,
        notes: [
          `Contact: ${inspectionForm.contactName}`,
          `Phone: ${inspectionForm.phone}`,
          `City: ${inspectionForm.city}`,
          `Inspection Type: ${inspectionForm.inspectionType}`,
          `Address: ${inspectionForm.address}`,
          `Notes: ${inspectionForm.notes || "N/A"}`,
        ].join(" | "),
      });
      setInspections((current) => [inspection, ...current]);
      setActiveSection("reports");
      setIsInspectionModalOpen(false);
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <>
      <Navbar />

      <main className="dashboard-page">
        <section className="dashboard-hero">
          <div>
            <h1 className="dashboard-title">
              My <span>Dashboard</span>
            </h1>
            <p className="dashboard-desc">
              Manage your listings and track inspections
            </p>
          </div>
        </section>

        <section className="dashboard-layout">
          <DashboardSidebar
            activeSection={activeSection}
            onSectionChange={handleSectionChange}
          />

          <div className="dashboard-content">
            {error && (
              <div className="dashboard-inline-error">
                <p>{error}</p>
              </div>
            )}

            {activeSection === "listings" && (
              <section>
                <div className="dashboard-section-heading">
                  <div>
                    <h2>My Listings</h2>
                    <p>{listings.length} vehicles in your seller profile</p>
                  </div>

                  <button
                    type="button"
                    className="dashboard-add-btn"
                    onClick={() => handleOpenListingModal()}
                  >
                    <span>+</span> Add New Car
                  </button>
                </div>

                {loading ? (
                  <div className="dashboard-empty-state compact-state">
                    <h3>Loading your listings...</h3>
                  </div>
                ) : (
                  <div className="listing-stack">
                    {listings.map((listing) => (
                      <ListingCard
                        key={listing.id}
                        listing={{
                          ...listing,
                          status:
                            listing.status === "inspected" ? "Inspected" : "Pending",
                        }}
                        onDelete={handleDelete}
                        onEdit={handleOpenListingModal}
                        onView={handleViewListing}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}

            {activeSection === "reports" && (
              <section>
                <div className="dashboard-section-heading">
                  <div>
                    <h2>Inspection Reports</h2>
                  </div>

                  <button
                    type="button"
                    className="dashboard-add-btn"
                    onClick={handleOpenInspectionModal}
                  >
                    Request Inspection
                  </button>
                </div>

                {loading ? (
                  <div className="dashboard-empty-state compact-state">
                    <h3>Loading inspections...</h3>
                  </div>
                ) : inspections.length === 0 ? (
                  <div className="dashboard-empty-state">
                    <div className="dashboard-empty-icon">
                      <LuFileText />
                    </div>
                    <h3>No inspection reports yet</h3>
                    <p>
                      Request an inspection for your listed cars to build buyer
                      trust.
                    </p>
                    <button
                      type="button"
                      className="dashboard-empty-button"
                      onClick={handleOpenInspectionModal}
                    >
                      Request Inspection
                    </button>
                  </div>
                ) : (
                  <div className="admin-list">
                    {inspections.map((inspection) => (
                      <article key={inspection.id} className="admin-row">
                        <div>
                          <strong>{inspection.listing?.name}</strong>
                          <p>
                            {inspection.listing?.price} .{" "}
                            {inspection.listing?.location}
                          </p>
                          {(inspection.reportFileName || inspection.reportOpinion) && (
                            <p>
                              {inspection.reportFileName
                                ? `Report: ${inspection.reportFileName}`
                                : inspection.reportOpinion}
                            </p>
                          )}
                        </div>
                        <span
                          className={`dashboard-status-badge ${
                            inspection.status === "completed"
                              ? "is-inspected"
                              : "is-pending"
                          }`}
                        >
                          {inspection.status === "completed"
                            ? "Completed"
                            : "Pending"}
                        </span>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )}

            {activeSection === "profile" && (
              <section>
                <div className="dashboard-section-heading">
                  <h2>Profile Settings</h2>
                </div>

                <form className="dashboard-profile-card">
                  <div className="dashboard-profile-grid">
                    <label className="dashboard-field">
                      <span>Full Name</span>
                      <input
                        name="fullName"
                        value={profile.fullName}
                        onChange={handleProfileChange}
                      />
                    </label>

                    <label className="dashboard-field">
                      <span>Email</span>
                      <input
                        name="email"
                        value={profile.email}
                        onChange={handleProfileChange}
                      />
                    </label>

                    <label className="dashboard-field">
                      <span>Phone</span>
                      <input
                        name="phone"
                        value={profile.phone}
                        onChange={handleProfileChange}
                      />
                    </label>

                    <label className="dashboard-field">
                      <span>Location</span>
                      <input
                        name="location"
                        value={profile.location}
                        onChange={handleProfileChange}
                      />
                    </label>
                  </div>

                  <button type="button" className="dashboard-save-button">
                    Save Changes
                  </button>
                </form>
              </section>
            )}
          </div>
        </section>
      </main>

      <ListingFormModal
        isOpen={isListingModalOpen}
        mode={selectedListing ? "edit" : "create"}
        currentUser={currentUser}
        initialValues={selectedListing}
        onClose={handleCloseListingModal}
        onSaved={handleListingSaved}
      />

      {isInspectionModalOpen && (
        <div
          className="listing-modal-overlay"
          role="presentation"
          onClick={handleCloseInspectionModal}
        >
          <div
            className="listing-modal inspection-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Request inspection"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="listing-modal-header">
              <div>
                <h2>Request Inspection</h2>
                <p>
                  Share the vehicle and contact details usually required for a
                  pre-sale inspection booking.
                </p>
              </div>

              <button
                type="button"
                className="listing-modal-close"
                onClick={handleCloseInspectionModal}
              >
                x
              </button>
            </div>

            <form className="listing-modal-form" onSubmit={handleRequestInspection}>
              <div className="listing-modal-grid">
                <label className="dashboard-field">
                  <span>Select Car</span>
                  <select
                    name="listingId"
                    value={inspectionForm.listingId}
                    onChange={handleInspectionFormChange}
                    required
                  >
                    {listings.map((listing) => (
                      <option key={listing.id} value={listing.id}>
                        {listing.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="dashboard-field">
                  <span>Contact Name</span>
                  <input
                    name="contactName"
                    value={inspectionForm.contactName}
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

                <label className="dashboard-field">
                  <span>Inspection Type</span>
                  <select
                    name="inspectionType"
                    value={inspectionForm.inspectionType}
                    onChange={handleInspectionFormChange}
                    required
                  >
                    <option value="onsite">Onsite Inspection</option>
                    <option value="pickup">Pickup and Inspect</option>
                    <option value="pre-purchase">Pre-Purchase Inspection</option>
                  </select>
                </label>

                <label className="dashboard-field">
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
                  <span>Inspection Address</span>
                  <input
                    name="address"
                    value={inspectionForm.address}
                    onChange={handleInspectionFormChange}
                    placeholder="House / street / area"
                    required
                  />
                </label>

                <label className="dashboard-field listing-upload-field">
                  <span>Additional Notes</span>
                  <textarea
                    name="notes"
                    value={inspectionForm.notes}
                    onChange={handleInspectionFormChange}
                    placeholder="Mention engine issue, documents, timing, or anything important"
                    rows="5"
                  />
                </label>
              </div>

              <button type="submit" className="dashboard-save-button">
                Submit Inspection Request
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default Dashboard;
