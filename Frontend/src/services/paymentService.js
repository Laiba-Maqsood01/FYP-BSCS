import api from "./api";

export const getMyPayments = (params) =>
  api.get("/payment/my-history", { params }).then(r => r.data.data);

export const getPaymentById = (id) =>
  api.get(`/payment/${id}`).then(r => r.data.data);

export const retryInspectionPayment = (inspectionId) =>
  api.post(`/inspection/${inspectionId}/payment`).then(r => {
    const data = r.data.data;
    return { ...data, url: data.checkoutUrl ?? data.url };
  });

export const retryFeaturedPayment = (featureId) =>
  api.post(`/featured/${featureId}/payment`).then(r => {
    const data = r.data.data;
    return { ...data, url: data.checkoutUrl ?? data.url };
  });
