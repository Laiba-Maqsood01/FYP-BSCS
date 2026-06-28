import api from "./api";
import axios from "axios";

export const getPdfUploadSignature = () =>
  api.post("/upload/sign", { folder: "inspection-reports", count: 1, resource_type: "raw" })
     .then(r => r.data.data.signatures[0]);

export const uploadPdfToCloudinary = async (file, signature) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", signature.api_key);
  formData.append("timestamp", signature.timestamp);
  formData.append("signature", signature.signature);
  formData.append("folder", signature.folder);
  const res = await axios.post(
    `https://api.cloudinary.com/v1_1/${signature.cloud_name}/raw/upload`,
    formData
  );
  return { url: res.data.secure_url, fileId: res.data.public_id };
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const getAdminDashboard = () => api.get("/admin/dashboard");

// ── Users ─────────────────────────────────────────────────────────────────────
export const getAdminUsers        = (params)     => api.get("/admin/users", { params });
export const getAdminUser         = (id)         => api.get(`/admin/users/${id}`);
export const blockToggleUser      = (id, days)   => api.patch(`/admin/users/${id}/block-toggle`, { days });
export const deleteAdminUser      = (id)         => api.patch(`/admin/users/${id}/delete`);

// ── Listings ──────────────────────────────────────────────────────────────────
export const getAdminListings     = (params)     => api.get("/admin/listings", { params });
export const approveListing       = (id)         => api.patch(`/admin/listings/${id}/approve`);
export const rejectListing        = (id, reason) => api.patch(`/admin/listings/${id}/reject`, { reason });
export const removeListing        = (id)         => api.patch(`/admin/listings/${id}/remove`);
export const markListingSold      = (id, salePrice) => api.patch(`/admin/listings/${id}/mark-sold`, { salePrice });

// ── Inspections ───────────────────────────────────────────────────────────────
export const getAdminInspections  = (params)              => api.get("/admin/inspections", { params });
export const assignInspector      = (id, assignedInspector) => api.patch(`/admin/inspections/${id}/assign`, { assignedInspector });
export const updateInspectionStatus = (id, status, cancelReason) => api.patch(`/admin/inspections/${id}/status`, { status, ...(cancelReason ? { cancelReason } : {}) });
export const uploadInspectionReport = (id, data)          => api.post(`/admin/inspections/${id}/report`, data);
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
export const approveDeletion      = (id)              => api.patch(`/admin/deletion-requests/${id}/approve`);
export const rejectDeletion       = (id, adminNote)   => api.patch(`/admin/deletion-requests/${id}/reject`, { adminNote });

// ── Commissions ───────────────────────────────────────────────────────────────
export const getAdminCommissions  = (params)     => api.get("/admin/commissions", { params });
export const reinitiateCommission = (id)         => api.patch(`/admin/commissions/${id}/reinitiate`);
export const cancelCommission     = (id, reason) => api.patch(`/admin/commissions/${id}/cancel`, { cancelReason: reason });

// ── Site Settings ─────────────────────────────────────────────────────────────
export const getSiteSettings    = ()       => api.get('/admin/settings').then(r => r.data.data);
export const updateSiteSettings = (fields) => api.patch('/admin/settings', fields).then(r => r.data.data);

// ── Inspection Slots ──────────────────────────────────────────────────────────
export const getInspectionSlots   = ()              => api.get('/admin/settings/slots').then(r => r.data.data);
export const addInspectionSlot    = (data)          => api.post('/admin/settings/slots', data).then(r => r.data.data);
export const updateInspectionSlot = (id, data)      => api.patch(`/admin/settings/slots/${id}`, data).then(r => r.data.data);
