import api from "./api";

export const addFavorite = (listingId) =>
  api.post(`/favorite/${listingId}`).then(r => r.data);

export const removeFavorite = (listingId) =>
  api.delete(`/favorite/${listingId}`).then(r => r.data);

export const checkFavoriteStatus = (listingId) =>
  api.get(`/favorite/${listingId}/status`).then(r => r.data.data);

export const getMyFavorites = () =>
  api.get("/favorite").then(r => r.data.data);
