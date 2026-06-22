import api from "./api";

export const getAllUsers = () => api.get("/admin/users");

export const deleteUser = (id) =>
  api.delete(`/admin/users/${id}`);

export const approveInstructor = (id) =>
  api.put(`/admin/approve-instructor/${id}`);

export const rejectInstructor = (id) =>
  api.put(`/admin/reject-instructor/${id}`);

export const getAllCourses = () =>
  api.get("/admin/courses");

export const getAnalytics = () =>
  api.get("/admin/analytics");