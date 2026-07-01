import api from "./api";

export const getPublicReport = (verifyToken) =>
  api.get(`/reports/${verifyToken}`).then(r => r.data.data);
