import api from "./api";

export const requestFeatured = (listingId, plan) =>
  api.post("/featured/request", { listingId, plan }).then(r => r.data.data);

export const createFeaturedPayment = (featureId) =>
  api.post(`/featured/${featureId}/payment`).then(r => r.data.data);
