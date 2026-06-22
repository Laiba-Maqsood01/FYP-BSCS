import api from "./api";

export const enrollCourse = (courseId) =>
  api.post(`/enrollments/${courseId}`);

export const getMyCourses = () =>
  api.get("/enrollments/my-courses");

export const completeLesson = (data) =>
  api.post("/enrollments/complete-lesson", data);

