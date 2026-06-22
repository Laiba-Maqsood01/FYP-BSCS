import api from "./api";

export const getAllCourses = () => api.get("/courses");

export const getCourseById = async (id) => {
  const res = await api.get(`/courses/${id}`);
  return res.data.data;

};
export const createCourse = (data) => api.post("/courses", data);

export const updateCourse = (id, data) =>
  api.put(`/courses/${id}`, data);

export const deleteCourse = (id) =>
  api.delete(`/courses/${id}`);

export const getInstructorCourses = () =>
  api.get("/courses/instructor/my-courses");

export const addLesson = (id, data) =>
  api.post(`/courses/${id}/lesson`, data);

export const publishCourse = (id) =>
  api.put(`/courses/${id}/publish`);

export const fetchCourses = async ({
  page = 1,
  limit = 9,
  search = "",
  category = "",
  featured = false,
}) => {
  const params = new URLSearchParams();

  params.append("page", page);
  params.append("limit", limit);

  if (search) params.append("search", search);
  if (category) params.append("category", category);
  if (featured) params.append("featured", true);

  const res = await api.get(`/courses?${params.toString()}`);

  return res.data.data;
};

