import { useEffect, useMemo, useState } from "react";
import {
  LuBadgeCheck,
  LuCarFront,
  LuCircleCheckBig,
  LuFileText,
  LuGlobe,
  LuEllipsisVertical,
  LuEye,
  LuLayoutDashboard,
  LuMail,
  LuPlus,
  LuSearch,
  LuSettings,
  LuShield,
  LuSlidersHorizontal,
  LuTrash2,
  LuUsers,
} from "react-icons/lu";
import car2 from "../assets/car2.png";
import {
  createUserByAdmin,
  createInspection,
  getAdminOverview,
  updateInspection,
  updateListingFeatured,
} from "../../services/api";

const adminTabs = [
  { id: "dashboard", label: "Dashboard", icon: LuLayoutDashboard },
  { id: "inspections", label: "Inspections", icon: LuBadgeCheck },
  { id: "listings", label: "All Listings", icon: LuCarFront },
  { id: "users", label: "Users", icon: LuUsers },
  { id: "settings", label: "Settings", icon: LuSettings },
];

function Admin() {
  const [activeTab, setActiveTab] = useState("inspections");
  const [showFilters, setShowFilters] = useState(false);
  const [overview, setOverview] = useState({
    users: [],
    listings: [],
    inspections: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [inspectionStatusFilter, setInspectionStatusFilter] = useState("all");
  const [inspectionLocationFilter, setInspectionLocationFilter] = useState("all");
  const [inspectionInspectorFilter, setInspectionInspectorFilter] = useState("all");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userStatusFilter, setUserStatusFilter] = useState("all");
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isNewInspectionModalOpen, setIsNewInspectionModalOpen] = useState(false);
  const [creatingInspection, setCreatingInspection] = useState(false);
  const [inspectionForm, setInspectionForm] = useState({
    listingId: "",
    inspector: "Ali",
    inspectionType: "onsite",
    scheduledAt: "",
    city: "Rahim Yar Khan",
    address: "",
    notes: "",
    reportOpinion: "",
    reportFileName: "",
  });
  const [creatingUser, setCreatingUser] = useState(false);
  const [userForm, setUserForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    role: "user",
    accountType: "buyer",
    location: "Rahim Yar Khan",
    status: "active",
    password: "123456",
  });
  const [settingsForm, setSettingsForm] = useState({
    siteTitle: "AutoHub",
    supportEmail: "support@autohub.com",
    defaultCity: "Rahim Yar Khan",
    maintenanceMode: false,
    userRegistration: true,
    inspectionRequests: true,
  });

  const loadOverview = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getAdminOverview();
      setOverview(data);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  useEffect(() => {
    setShowFilters(false);
  }, [activeTab]);

  const inspectionLocations = useMemo(
    () => [
      "all",
      ...new Set(
        overview.inspections
          .map((inspection) => inspection.listing?.location)
          .filter(Boolean),
      ),
    ],
    [overview.inspections],
  );

  const inspectionInspectors = useMemo(
    () => [
      "all",
      ...new Set(overview.inspections.map((inspection) => inspection.inspector)),
    ],
    [overview.inspections],
  );

  const filteredInspections = useMemo(() => {
    return overview.inspections.filter((inspection) => {
      const matchesSearch = `${inspection.listing?.name || ""} ${
        inspection.listing?.location || ""
      } ${inspection.inspector || ""}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus =
        inspectionStatusFilter === "all" ||
        inspection.status === inspectionStatusFilter;
      const matchesLocation =
        inspectionLocationFilter === "all" ||
        inspection.listing?.location === inspectionLocationFilter;
      const matchesInspector =
        inspectionInspectorFilter === "all" ||
        inspection.inspector === inspectionInspectorFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesLocation &&
        matchesInspector
      );
    });
  }, [
    overview.inspections,
    searchTerm,
    inspectionInspectorFilter,
    inspectionLocationFilter,
    inspectionStatusFilter,
  ]);

  const filteredListings = useMemo(() => {
    return overview.listings.filter((listing) =>
      `${listing.name} ${listing.location} ${listing.model}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
    );
  }, [overview.listings, searchTerm]);

  const userStats = useMemo(() => {
    const totalUsers = overview.users.length;
    const buyers = overview.users.filter(
      (user) => user.accountType === "buyer",
    ).length;
    const sellers = overview.users.filter(
      (user) => user.accountType === "seller",
    ).length;
    const admins = overview.users.filter((user) => user.role === "admin").length;

    return { totalUsers, buyers, sellers, admins };
  }, [overview.users]);

  const filteredUsers = useMemo(() => {
    return overview.users.filter((user) => {
      const matchesSearch = `${user.fullName} ${user.email}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesRole =
        userRoleFilter === "all" ||
        user.role === userRoleFilter ||
        user.accountType === userRoleFilter;
      const matchesStatus =
        userStatusFilter === "all" || (user.status || "active") === userStatusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [overview.users, searchTerm, userRoleFilter, userStatusFilter]);

  const formatJoinDate = (value) =>
    new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(value));

  const getInitials = (name) =>
    name
      .split(" ")
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("");

  const handleSettingsChange = (event) => {
    const { name, value, type, checked } = event.target;
    setSettingsForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleUserFormChange = (event) => {
    const { name, value } = event.target;
    setUserForm((current) => {
      if (name === "role" && value === "admin") {
        return {
          ...current,
          role: value,
          accountType: "seller",
        };
      }

      return {
        ...current,
        [name]: value,
      };
    });
  };

  const handleOpenAddUserModal = () => {
    setUserForm({
      fullName: "",
      email: "",
      phone: "",
      role: "user",
      accountType: "buyer",
      location: "Rahim Yar Khan",
      status: "active",
      password: "123456",
    });
    setIsAddUserModalOpen(true);
  };

  const handleCloseAddUserModal = () => {
    setIsAddUserModalOpen(false);
  };

  const handleCreateUser = async (event) => {
    event.preventDefault();

    try {
      setCreatingUser(true);
      const createdUser = await createUserByAdmin(userForm);
      setOverview((current) => ({
        ...current,
        users: [createdUser, ...current.users],
      }));
      setIsAddUserModalOpen(false);
    } catch (actionError) {
      alert(actionError.message);
    } finally {
      setCreatingUser(false);
    }
  };

  const handleToggleFeatured = async (listing) => {
    try {
      await updateListingFeatured(listing.id, !listing.featured);
      await loadOverview();
    } catch (actionError) {
      alert(actionError.message);
    }
  };

  const handleInspectionStatus = async (inspection, status) => {
    try {
      await updateInspection(inspection.id, { status });
      await loadOverview();
    } catch (actionError) {
      alert(actionError.message);
    }
  };

  const handleNewInspection = async () => {
    const pendingListing =
      overview.listings.find((listing) => listing.status !== "inspected") ||
      overview.listings[0];

    if (!pendingListing) {
      alert("No listing available for inspection.");
      return;
    }

    setInspectionForm({
      listingId: pendingListing.id,
      inspector: "Ali",
      inspectionType: "onsite",
      scheduledAt: "",
      city: pendingListing.location || "Rahim Yar Khan",
      address: "",
      notes: "",
      reportOpinion: "",
      reportFileName: "",
    });
    setIsNewInspectionModalOpen(true);
  };

  const handleInspectionFormChange = (event) => {
    const { name, value, files } = event.target;

    if (name === "reportFile") {
      setInspectionForm((current) => ({
        ...current,
        reportFileName: files?.[0]?.name || "",
      }));
      return;
    }

    setInspectionForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleCloseInspectionModal = () => {
    setIsNewInspectionModalOpen(false);
  };

  const handleCreateInspection = async (event) => {
    event.preventDefault();

    try {
      setCreatingInspection(true);
      const selectedListing = overview.listings.find(
        (listing) => listing.id === inspectionForm.listingId,
      );

      const createdInspection = await createInspection({
        listingId: inspectionForm.listingId,
        ownerId: selectedListing?.owner?.id,
        inspector: inspectionForm.inspector,
        scheduledAt: inspectionForm.scheduledAt,
        reportOpinion: inspectionForm.reportOpinion,
        reportFileName: inspectionForm.reportFileName,
        notes: [
          `Inspector: ${inspectionForm.inspector}`,
          `Inspection Type: ${inspectionForm.inspectionType}`,
          `City: ${inspectionForm.city}`,
          `Address: ${inspectionForm.address || "N/A"}`,
          `Notes: ${inspectionForm.notes || "N/A"}`,
        ].join(" | "),
      });

      setOverview((current) => ({
        ...current,
        inspections: [createdInspection, ...current.inspections],
      }));
      setIsNewInspectionModalOpen(false);
      setActiveTab("inspections");
    } catch (actionError) {
      alert(actionError.message);
    } finally {
      setCreatingInspection(false);
    }
  };

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="logo">
            <div className="logo-mark">
              <LuCarFront className="car-icon" />
            </div>
            <h2>
              Auto<span>Hub</span>
            </h2>
          </div>
        </div>

        <nav className="admin-nav">
          {adminTabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={`admin-nav-item ${activeTab === id ? "active" : ""}`}
              onClick={() => setActiveTab(id)}
            >
              <Icon />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <section className="admin-content">
        <header className="admin-content-header">
          <h1>
            {activeTab === "inspections"
              ? "Inspections"
              : activeTab === "listings"
                ? "All Listings"
                : activeTab === "users"
                  ? "Users"
                  : activeTab === "settings"
                    ? "Settings"
                    : "Dashboard"}
          </h1>
        </header>

        <div className="admin-panel-body">
          {error ? (
            <div className="dashboard-empty-state">
              <h3>failed to load admin data</h3>
              <p>{error}</p>
              <button
                type="button"
                className="dashboard-empty-button"
                onClick={loadOverview}
              >
                Retry
              </button>
            </div>
          ) : loading ? (
            <div className="dashboard-empty-state">
              <h3>Loading admin data...</h3>
            </div>
          ) : (
            <>
            <div className="admin-toolbar">
                {(activeTab === "inspections" || activeTab === "users") && (
                  <div className="admin-search">
                    <LuSearch />
                    <input
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder={
                        activeTab === "inspections"
                          ? "Search inspections..."
                          : "Search users by name or email..."
                      }
                    />
                  </div>
                )}

                {activeTab === "inspections" && (
                  <>
                    <button
                      type="button"
                      className="admin-filter-btn"
                      onClick={() => setShowFilters((current) => !current)}
                    >
                      <LuSlidersHorizontal /> Filter
                    </button>
                    <button
                      type="button"
                      className="admin-primary-btn"
                      onClick={handleNewInspection}
                    >
                      <LuPlus /> New Inspection
                    </button>
                  </>
                )}

                {activeTab === "users" && (
                  <button
                    type="button"
                    className="admin-filter-btn"
                    onClick={() => setShowFilters((current) => !current)}
                  >
                    <LuSlidersHorizontal /> Filter
                  </button>
                )}

                {activeTab === "users" && (
                  <>
                    <button
                      type="button"
                      className="admin-primary-btn"
                      onClick={handleOpenAddUserModal}
                    >
                      <LuPlus /> Add User
                    </button>
                  </>
                )}
              </div>

              {activeTab === "inspections" && showFilters && (
                <div className="filter-dropdown">
                  <div className="filter-grid">
                    <label className="filter-field">
                      <span>Status</span>
                      <select
                        value={inspectionStatusFilter}
                        onChange={(event) =>
                          setInspectionStatusFilter(event.target.value)
                        }
                      >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                      </select>
                    </label>

                    <label className="filter-field">
                      <span>City</span>
                      <select
                        value={inspectionLocationFilter}
                        onChange={(event) =>
                          setInspectionLocationFilter(event.target.value)
                        }
                      >
                        {inspectionLocations.map((location) => (
                          <option key={location} value={location}>
                            {location === "all" ? "All Cities" : location}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="filter-field">
                      <span>Inspector</span>
                      <select
                        value={inspectionInspectorFilter}
                        onChange={(event) =>
                          setInspectionInspectorFilter(event.target.value)
                        }
                      >
                        {inspectionInspectors.map((inspector) => (
                          <option key={inspector} value={inspector}>
                            {inspector === "all" ? "All Inspectors" : inspector}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>
              )}

              {activeTab === "inspections" && (
                <div className="admin-card-stack">
                  {filteredInspections.map((inspection) => (
                    <article key={inspection.id} className="admin-inspection-card">
                      <div className="admin-inspection-left">
                        <img
                          src={inspection.listing?.image || car2}
                          alt={inspection.listing?.name || "Vehicle"}
                        />
                        <div>
                          <h3>{inspection.listing?.name || "Inspection"}</h3>
                          <p>
                            {inspection.listing?.price || "Rs 0"} .{" "}
                            {inspection.listing?.location || "Pakistan"}
                          </p>
                          {(inspection.reportFileName || inspection.reportOpinion) && (
                            <p>
                              {inspection.reportFileName
                                ? `PDF: ${inspection.reportFileName}`
                                : inspection.reportOpinion}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="admin-inspection-right">
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

                        <div className="admin-actions">
                          <button
                            type="button"
                            className="dashboard-save-button"
                            onClick={() =>
                              handleInspectionStatus(inspection, "completed")
                            }
                          >
                            Complete
                          </button>
                          <button
                            type="button"
                            className="admin-secondary-button"
                            onClick={() =>
                              handleInspectionStatus(inspection, "pending")
                            }
                          >
                            Pending
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {activeTab === "listings" && (
                <div className="admin-card-stack">
                  {filteredListings.map((listing) => (
                    <article key={listing.id} className="admin-inspection-card">
                      <div className="admin-inspection-left">
                        <img src={listing.image || car2} alt={listing.name} />
                        <div>
                          <h3>{listing.name}</h3>
                          <p>
                            {listing.price} . {listing.location}
                          </p>
                        </div>
                      </div>

                      <div className="admin-inspection-right">
                        <span
                          className={`dashboard-status-badge ${
                            listing.featured ? "is-inspected" : "is-pending"
                          }`}
                        >
                          {listing.featured ? "Featured" : "Standard"}
                        </span>

                        <button
                          type="button"
                          className="dashboard-save-button"
                          onClick={() => handleToggleFeatured(listing)}
                        >
                          {listing.featured ? "Remove Featured" : "Make Featured"}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {activeTab === "users" && (
                <section className="admin-users-panel">
                  <div className="admin-users-stats">
                    <article className="admin-stat-card">
                      <span>Total Users</span>
                      <strong>{userStats.totalUsers}</strong>
                    </article>
                    <article className="admin-stat-card accent-orange">
                      <span>Buyers</span>
                      <strong>{userStats.buyers}</strong>
                    </article>
                    <article className="admin-stat-card accent-green">
                      <span>Sellers</span>
                      <strong>{userStats.sellers}</strong>
                    </article>
                    <article className="admin-stat-card accent-gold">
                      <span>Admins</span>
                      <strong>{userStats.admins}</strong>
                    </article>
                  </div>

                  {showFilters && (
                    <div className="filter-dropdown admin-users-filters">
                      <div className="filter-grid">
                        <label className="filter-field">
                          <span>Role</span>
                          <select
                            value={userRoleFilter}
                            onChange={(event) => setUserRoleFilter(event.target.value)}
                          >
                            <option value="all">All Roles</option>
                            <option value="buyer">Buyer</option>
                            <option value="seller">Seller</option>
                            <option value="admin">Admin</option>
                          </select>
                        </label>

                        <label className="filter-field">
                          <span>Status</span>
                          <select
                            value={userStatusFilter}
                            onChange={(event) => setUserStatusFilter(event.target.value)}
                          >
                            <option value="all">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </label>
                      </div>
                    </div>
                  )}

                  <div className="admin-users-table-wrap">
                    <div className="admin-users-table">
                      <div className="admin-users-head">
                        <span>User</span>
                        <span>Email</span>
                        <span>Role</span>
                        <span>Status</span>
                        <span>Joined</span>
                        <span>Actions</span>
                      </div>

                      {filteredUsers.map((user) => (
                        <article key={user.id} className="admin-users-row">
                          <div className="admin-user-cell admin-user-profile">
                            <div className="admin-user-avatar">
                              {getInitials(user.fullName)}
                            </div>
                            <div>
                              <strong>{user.fullName}</strong>
                            </div>
                          </div>

                          <div className="admin-user-cell admin-user-email">
                            {user.email}
                          </div>

                          <div className="admin-user-cell">
                            <span
                              className={`admin-role-badge ${
                                user.role === "admin"
                                  ? "is-admin"
                                  : user.accountType === "seller"
                                    ? "is-seller"
                                    : "is-buyer"
                              }`}
                            >
                              {user.role === "admin"
                                ? "Admin"
                                : user.accountType === "seller"
                                  ? "Seller"
                                  : "Buyer"}
                            </span>
                          </div>

                          <div className="admin-user-cell">
                            <span
                              className={`admin-status-pill ${
                                (user.status || "active") === "active"
                                  ? "is-active"
                                  : "is-inactive"
                              }`}
                            >
                              <LuShield />
                              {(user.status || "active") === "active"
                                ? "Active"
                                : "Inactive"}
                            </span>
                          </div>

                          <div className="admin-user-cell">
                            {formatJoinDate(user.joinedAt)}
                          </div>

                          <div className="admin-user-cell admin-user-actions">
                            <button type="button" className="admin-icon-button">
                              <LuEye />
                            </button>
                            <button type="button" className="admin-icon-button">
                              <LuEllipsisVertical />
                            </button>
                            <button
                              type="button"
                              className="admin-icon-button danger"
                            >
                              <LuTrash2 />
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {(activeTab === "settings" || activeTab === "dashboard") && (
                <section className="admin-settings-panel">
                  {activeTab === "dashboard" && (
                    <div className="dashboard-empty-state compact-state">
                      <div className="dashboard-empty-icon">
                        <LuCircleCheckBig />
                      </div>
                      <h3>Admin tools ready</h3>
                      <p>
                        Use Inspections, Listings, Users, and Settings to manage
                        your website operations.
                      </p>
                    </div>
                  )}

                  {activeTab === "settings" && (
                    <div className="admin-settings-grid">
                      <article className="admin-settings-card">
                        <div className="admin-settings-title">
                          <LuGlobe />
                          <div>
                            <h3>Website Settings</h3>
                            <p>Manage the public-facing basics of your website.</p>
                          </div>
                        </div>

                        <div className="dashboard-profile-grid admin-settings-fields">
                          <label className="dashboard-field">
                            <span>Site Title</span>
                            <input
                              name="siteTitle"
                              value={settingsForm.siteTitle}
                              onChange={handleSettingsChange}
                            />
                          </label>

                          <label className="dashboard-field">
                            <span>Default City</span>
                            <input
                              name="defaultCity"
                              value={settingsForm.defaultCity}
                              onChange={handleSettingsChange}
                            />
                          </label>
                        </div>
                      </article>

                      <article className="admin-settings-card">
                        <div className="admin-settings-title">
                          <LuMail />
                          <div>
                            <h3>Contact Settings</h3>
                            <p>Set the main email used for support and inquiries.</p>
                          </div>
                        </div>

                        <label className="dashboard-field">
                          <span>Support Email</span>
                          <input
                            name="supportEmail"
                            value={settingsForm.supportEmail}
                            onChange={handleSettingsChange}
                          />
                        </label>
                      </article>

                      <article className="admin-settings-card">
                        <div className="admin-settings-title">
                          <LuShield />
                          <div>
                            <h3>Access & Platform Controls</h3>
                            <p>Enable or disable important website features.</p>
                          </div>
                        </div>

                        <div className="admin-toggle-list">
                          <label className="admin-toggle-row">
                            <div>
                              <strong>User Registration</strong>
                              <p>Allow new users to create accounts.</p>
                            </div>
                            <input
                              name="userRegistration"
                              type="checkbox"
                              checked={settingsForm.userRegistration}
                              onChange={handleSettingsChange}
                            />
                          </label>

                          <label className="admin-toggle-row">
                            <div>
                              <strong>Inspection Requests</strong>
                              <p>Allow sellers to submit inspection requests.</p>
                            </div>
                            <input
                              name="inspectionRequests"
                              type="checkbox"
                              checked={settingsForm.inspectionRequests}
                              onChange={handleSettingsChange}
                            />
                          </label>

                          <label className="admin-toggle-row">
                            <div>
                              <strong>Maintenance Mode</strong>
                              <p>Temporarily pause major public interactions.</p>
                            </div>
                            <input
                              name="maintenanceMode"
                              type="checkbox"
                              checked={settingsForm.maintenanceMode}
                              onChange={handleSettingsChange}
                            />
                          </label>
                        </div>
                      </article>

                      <div className="admin-settings-actions">
                        <button type="button" className="dashboard-save-button">
                          Save Settings
                        </button>
                      </div>
                    </div>
                  )}
                </section>
              )}
            </>
          )}
        </div>
      </section>

      {isAddUserModalOpen && (
        <div
          className="listing-modal-overlay"
          role="presentation"
          onClick={handleCloseAddUserModal}
        >
          <div
            className="listing-modal admin-user-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Add user"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="listing-modal-header">
              <div>
                <h2>Add New User</h2>
                <p>
                  Create a new user account with role, city, access, and contact
                  details.
                </p>
              </div>

              <button
                type="button"
                className="listing-modal-close"
                onClick={handleCloseAddUserModal}
              >
                x
              </button>
            </div>

            <form className="listing-modal-form" onSubmit={handleCreateUser}>
              <div className="listing-modal-grid">
                <label className="dashboard-field">
                  <span>Full Name</span>
                  <input
                    name="fullName"
                    value={userForm.fullName}
                    onChange={handleUserFormChange}
                    required
                  />
                </label>

                <label className="dashboard-field">
                  <span>Email</span>
                  <input
                    name="email"
                    type="email"
                    value={userForm.email}
                    onChange={handleUserFormChange}
                    required
                  />
                </label>

                <label className="dashboard-field">
                  <span>Phone</span>
                  <input
                    name="phone"
                    value={userForm.phone}
                    onChange={handleUserFormChange}
                  />
                </label>

                <label className="dashboard-field">
                  <span>City</span>
                  <input
                    name="location"
                    value={userForm.location}
                    onChange={handleUserFormChange}
                    required
                  />
                </label>

                <label className="dashboard-field">
                  <span>Role</span>
                  <select
                    name="role"
                    value={userForm.role}
                    onChange={handleUserFormChange}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>

                <label className="dashboard-field">
                  <span>Account Type</span>
                  <select
                    name="accountType"
                    value={userForm.accountType}
                    onChange={handleUserFormChange}
                    disabled={userForm.role === "admin"}
                  >
                    <option value="buyer">Buyer</option>
                    <option value="seller">Seller</option>
                  </select>
                </label>

                <label className="dashboard-field">
                  <span>Status</span>
                  <select
                    name="status"
                    value={userForm.status}
                    onChange={handleUserFormChange}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </label>

                <label className="dashboard-field">
                  <span>Temporary Password</span>
                  <input
                    name="password"
                    value={userForm.password}
                    onChange={handleUserFormChange}
                  />
                </label>
              </div>

              <button type="submit" className="dashboard-save-button">
                {creatingUser ? "Creating..." : "Create User"}
              </button>
            </form>
          </div>
        </div>
      )}

      {isNewInspectionModalOpen && (
        <div
          className="listing-modal-overlay"
          role="presentation"
          onClick={handleCloseInspectionModal}
        >
          <div
            className="listing-modal admin-user-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Create inspection"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="listing-modal-header">
              <div>
                <h2>New Inspection</h2>
                <p>
                  Create a new inspection request with vehicle, scheduling, and
                  inspector details.
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

            <form className="listing-modal-form" onSubmit={handleCreateInspection}>
              <div className="listing-modal-grid">
                <label className="dashboard-field">
                  <span>Select Listing</span>
                  <select
                    name="listingId"
                    value={inspectionForm.listingId}
                    onChange={handleInspectionFormChange}
                    required
                  >
                    {overview.listings.map((listing) => (
                      <option key={listing.id} value={listing.id}>
                        {listing.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="dashboard-field">
                  <span>Assigned Inspector</span>
                  <select
                    name="inspector"
                    value={inspectionForm.inspector}
                    onChange={handleInspectionFormChange}
                  >
                    <option value="Ali">Ali</option>
                    <option value="Sara">Sara</option>
                    <option value="Assigned Inspector">Assigned Inspector</option>
                  </select>
                </label>

                <label className="dashboard-field">
                  <span>Inspection Type</span>
                  <select
                    name="inspectionType"
                    value={inspectionForm.inspectionType}
                    onChange={handleInspectionFormChange}
                  >
                    <option value="onsite">Onsite Inspection</option>
                    <option value="pre-purchase">Pre-Purchase Inspection</option>
                    <option value="pickup">Pickup and Inspect</option>
                  </select>
                </label>

                <label className="dashboard-field">
                  <span>Preferred Date</span>
                  <input
                    name="scheduledAt"
                    type="date"
                    value={inspectionForm.scheduledAt}
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
                  <span>Inspection Address</span>
                  <input
                    name="address"
                    value={inspectionForm.address}
                    onChange={handleInspectionFormChange}
                    placeholder="Street, area, landmark"
                  />
                </label>

                <label className="dashboard-field listing-upload-field">
                  <span>Inspection Report PDF</span>
                  <label className="listing-upload-box">
                    <LuFileText />
                    <strong>
                      {inspectionForm.reportFileName || "Upload PDF report"}
                    </strong>
                    <small>Attach a PDF report file if already available</small>
                    <input
                      name="reportFile"
                      type="file"
                      accept="application/pdf"
                      onChange={handleInspectionFormChange}
                    />
                  </label>
                </label>

                <label className="dashboard-field listing-upload-field">
                  <span>Inspector Opinion</span>
                  <textarea
                    name="reportOpinion"
                    rows="4"
                    value={inspectionForm.reportOpinion}
                    onChange={handleInspectionFormChange}
                    placeholder="Summarize the inspector's overall opinion about the car condition"
                  />
                </label>

                <label className="dashboard-field listing-upload-field">
                  <span>Inspection Notes</span>
                  <textarea
                    name="notes"
                    rows="5"
                    value={inspectionForm.notes}
                    onChange={handleInspectionFormChange}
                    placeholder="Mention condition concerns, access details, or timing notes"
                  />
                </label>
              </div>

              <button type="submit" className="dashboard-save-button">
                {creatingInspection ? "Creating..." : "Create Inspection"}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default Admin;
