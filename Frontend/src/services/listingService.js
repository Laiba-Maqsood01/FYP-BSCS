import api from "./api";
import axios from "axios";

export const getUploadSignatures = (count) =>
  api.post("/upload/sign", { folder: "listings", count, resource_type: "image" })
     .then(r => r.data.data.signatures);

export const uploadToCloudinary = async (file, signature) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", signature.api_key);
  formData.append("timestamp", signature.timestamp);
  formData.append("signature", signature.signature);
  formData.append("folder", signature.folder);

  const res = await axios.post(
    `https://api.cloudinary.com/v1_1/${signature.cloud_name}/image/upload`,
    formData
  );
  return { url: res.data.secure_url, fileId: res.data.public_id };
};

export const createListing = (data) =>
  api.post("/listings", data).then(r => r.data.data);

export const getListingDetail = (listingId) =>
  api.get(`/listings/${listingId}`).then(r => r.data.data);

export const getMyListings = () =>
  api.get("/listings/my-listings").then(r => r.data.data);

export const getMyListingDetail = (id) =>
  api.get(`/listings/${id}/my-detail`).then(r => r.data.data);

export const updateListing = (id, data) =>
  api.put(`/listings/${id}`, data).then(r => r.data.data);

export const deleteListing = (id) =>
  api.delete(`/listings/${id}`).then(r => r.data);

export const markMyListingSold = (id) =>
  api.patch(`/listings/${id}/mark-sold`).then(r => r.data.data);

// Seller contact reveal (OTP-gated)
export const requestContactOtp = (id) =>
  api.post(`/listings/${id}/contact/request-otp`).then(r => r.data.data);

export const verifyContactOtp = (id, code) =>
  api.post(`/listings/${id}/contact/verify-otp`, { code }).then(r => r.data.data);
