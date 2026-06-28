import api from "./api";

export const getActiveFeaturedPlans = () =>
  api.get("/featured/plans").then(r => r.data.data);

export const requestFeatured = (listingId, plan) =>
  api.post("/featured/request", { listingId, plan }).then(r => r.data.data);

export const createFeaturedPayment = (featureId) =>
  api.post(`/featured/${featureId}/payment`).then(r => {
    const data = r.data.data;
    return { ...data, url: data.checkoutUrl ?? data.url };
  });

export const getFeaturedByListing = (listingId) =>
  api.get(`/featured/listing/${listingId}`).then(r => r.data.data);
