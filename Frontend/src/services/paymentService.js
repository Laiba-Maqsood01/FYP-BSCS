import api from "./api";

export const getMyPayments = (params) =>
  api.get("/payment/my-history", { params }).then(r => r.data.data);

export const getPaymentById = (id) =>
  api.get(`/payment/${id}`).then(r => r.data.data);
