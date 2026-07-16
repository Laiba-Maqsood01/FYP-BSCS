import api from "./api";

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const getAdminDashboard = () => api.get("/admin/dashboard");

// ── Users ─────────────────────────────────────────────────────────────────────
export const getAdminUsers        = (params)     => api.get("/admin/users", { params });
export const getAdminUser         = (id)         => api.get(`/admin/users/${id}`);
export const blockToggleUser      = (id, days)   => api.patch(`/admin/users/${id}/block-toggle`, { days });
export const deleteAdminUser      = (id)         => api.patch(`/admin/users/${id}/delete`);

// ── Listings ──────────────────────────────────────────────────────────────────
export const getAdminListings     = (params)     => api.get("/admin/listings", { params });
export const getAdminListingDetail = (id)        => api.get(`/admin/listings/${id}`).then(r => r.data.data);
export const approveListing       = (id)         => api.patch(`/admin/listings/${id}/approve`);
export const rejectListing        = (id, reason) => api.patch(`/admin/listings/${id}/reject`, { reason });
export const removeListing        = (id)         => api.patch(`/admin/listings/${id}/remove`);
export const markListingSold      = (id, salePrice) => api.patch(`/admin/listings/${id}/mark-sold`, { salePrice });

// ── Inspections ───────────────────────────────────────────────────────────────
export const getAdminInspections  = (params)              => api.get("/admin/inspections", { params });
export const assignInspector      = (id, assignedInspector) => api.patch(`/admin/inspections/${id}/assign`, { assignedInspector });
export const updateInspectionStatus = (id, status, cancelReason) => api.patch(`/admin/inspections/${id}/status`, { status, ...(cancelReason ? { cancelReason } : {}) });
export const scheduleInspection   = (id, data)            => api.patch(`/admin/inspections/${id}/schedule`, data);

// ── Featured ──────────────────────────────────────────────────────────────────
export const getAdminFeatured     = (params)     => api.get("/admin/featured", { params });
export const getAdminFeaturedPlans = ()          => api.get("/admin/featured-plans");
export const createFeaturedPlan   = (data)       => api.post("/admin/featured-plans", data);
export const updateFeaturedPlan   = (id, data)   => api.patch(`/admin/featured-plans/${id}`, data);

// ── Refunds ───────────────────────────────────────────────────────────────────
export const getAdminRefunds      = (params)     => api.get("/admin/refunds", { params });
export const approveRefund        = (id)         => api.patch(`/admin/refunds/${id}/approve`);

// ── Deletion Requests ─────────────────────────────────────────────────────────
export const getAdminDeletions    = (params)          => api.get("/admin/deletion-requests", { params });
export const acceptDeletion       = (id, body)        => api.patch(`/admin/deletion-requests/${id}/accept`, body);
export const markBreakChargePaid  = (id)              => api.patch(`/admin/deletion-requests/${id}/mark-paid`);
export const rejectDeletion       = (id, adminNote)   => api.patch(`/admin/deletion-requests/${id}/reject`, { adminNote });

// ── Commissions (settlement ledger — records are created already PAID) ────────
export const getAdminCommissions  = (params)     => api.get("/admin/commissions", { params });

// ── Site Settings ─────────────────────────────────────────────────────────────
export const getSiteSettings    = ()       => api.get('/admin/settings').then(r => r.data.data);
export const updateSiteSettings = (fields) => api.patch('/admin/settings', fields).then(r => r.data.data);

// ── Inspection Report Builder ─────────────────────────────────────────────────
export const initInspectionReport       = (inspectionId)         => api.post(`/admin/inspections/${inspectionId}/report`).then(r => r.data.data);
export const getInspectionReportStatus  = (inspectionId)         => api.get(`/admin/inspections/${inspectionId}/report`).then(r => r.data.data);
export const getChecklistMeta           = ()                     => api.get(`/admin/inspection-reports/meta`).then(r => r.data.data);
export const getInspectionReport        = (reportId)             => api.get(`/admin/inspection-reports/${reportId}`).then(r => r.data.data);
export const updateInspectionReport     = (reportId, data)       => api.patch(`/admin/inspection-reports/${reportId}`, data).then(r => r.data.data);
export const publishInspectionReport    = (reportId)             => api.post(`/admin/inspection-reports/${reportId}/publish`).then(r => r.data.data);

// ── Inspection Slots ──────────────────────────────────────────────────────────
export const getInspectionSlots   = ()              => api.get('/admin/settings/slots').then(r => r.data.data);
export const addInspectionSlot    = (data)          => api.post('/admin/settings/slots', data).then(r => r.data.data);
export const updateInspectionSlot = (id, data)      => api.patch(`/admin/settings/slots/${id}`, data).then(r => r.data.data);
