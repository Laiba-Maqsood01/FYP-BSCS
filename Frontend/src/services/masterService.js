import api from "./api";

export const getBrands    = ()         => api.get("/master/brands").then(r => r.data.data);
export const getModels    = (brandId)  => api.get(`/master/models?brand=${brandId}`).then(r => r.data.data);
export const getCities    = ()         => api.get("/master/cities").then(r => r.data.data);
export const getBodyTypes = ()         => api.get("/master/body-types").then(r => r.data.data);
export const getManagedCities = ()     => api.get("/master/managed-cities").then(r => r.data.data);
