import api from "./api";

export const getDeletionRequests = () =>
  api.get("/managed-sale/deletion-requests").then(r => r.data.data);

export const submitDeletionRequest = (listingId, reason) =>
  api.post(`/managed-sale/deletion-request/${listingId}`, { reason }).then(r => r.data.data);

// Agreement break fee — open Stripe checkout for an accepted deletion request
export const createBreakChargePayment = (chargeId) =>
  api.post(`/managed-sale/break-charge/${chargeId}/payment`).then(r => r.data.data);

// Settled commission record for a sold managed listing (display only)
export const getCommissionDetails = (listingId) =>
  api.get(`/managed-sale/commission/${listingId}`).then(r => r.data.data);
