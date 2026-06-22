import api from "./api";

// Fetch booked slots for a given date (YYYY-MM-DD)
export const getAvailableSlots = (date) =>
  api.get(`/inspection/available-slots?date=${date}`).then(r => r.data.data.bookedSlots);

// Onboarding inspection — managed listing seller (listing is PENDING)
export const requestManagedInspection = (listingId, body) =>
  api.post(`/inspection/${listingId}/managed`, body).then(r => r.data.data);

// Seller inspection / re-inspection — general listing seller (listing is ACTIVE)
export const requestSellerReInspection = (listingId, body) =>
  api.post(`/inspection/${listingId}/reinspection`, body).then(r => r.data.data);

// Buyer inspection request
export const requestBuyerInspection = (listingId) =>
  api.post(`/inspection/${listingId}/request`).then(r => r.data.data);

// Create payment session — returns { payment, checkoutUrl }
export const createInspectionPayment = (inspectionId) =>
  api.post(`/inspection/${inspectionId}/payment`).then(r => r.data.data);

// Fetch own listing by ID (any status) — for inspection form prefill
export const getMyListingDetail = (listingId) =>
  api.get(`/listings/${listingId}/my-detail`).then(r => r.data.data);

// Fetch public listing by ID (ACTIVE only) — for buyer inspection
export const getPublicListingDetail = (listingId) =>
  api.get(`/listings/${listingId}`).then(r => r.data.data);

// Latest non-cancelled inspection for a listing (auth required)
export const getListingInspectionStatus = (listingId) =>
  api.get(`/inspection/listing/${listingId}`).then(r => r.data.data);

export const getMyInspections = (params) =>
  api.get("/inspection/my-inspections", { params }).then(r => r.data.data);
