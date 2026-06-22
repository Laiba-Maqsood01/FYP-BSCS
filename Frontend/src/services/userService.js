import api from "./api";

export const requestInstructor = () =>
  api.post("/users/request-instructor");