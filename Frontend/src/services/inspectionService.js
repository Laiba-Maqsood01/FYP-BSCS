import api from "./api";

// Fetch active slots + booked slots for a given date (YYYY-MM-DD)
// Returns { slots: [{_id, label, ...}], bookedSlots: [label, ...] }
// Pass excludeInspectionId when rescheduling so the inspection's own current
// slot isn't shown as unavailable.
export const getAvailableSlots = (date, excludeInspectionId) =>
  api.get(`/inspection/available-slots`, { params: { date, excludeInspectionId } }).then(r => r.data.data);

// Onboarding inspection — managed listing seller (listing is PENDING)
export const requestManagedInspection = (listingId, body) =>
  api.post(`/inspection/${listingId}/managed`, body).then(r => r.data.data);

// Seller inspection / re-inspection — general listing seller (listing is ACTIVE)
export const requestSellerReInspection = (listingId, body) =>
  api.post(`/inspection/${listingId}/reinspection`, body).then(r => r.data.data);

// Buyer inspection request — buyer coordinates schedule with the seller
// and books address/date/slot just like the seller flow
export const requestBuyerInspection = (listingId, body) =>
  api.post(`/inspection/${listingId}/request`, body).then(r => r.data.data);

// Fee quote for a listing — { amount }, same calculation the payment uses
export const getInspectionFeeQuote = (listingId) =>
  api.get(`/inspection/${listingId}/fee`).then(r => r.data.data);

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
