import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL;


const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // IMPORTANT for cookies
});

// Access token (in memory)
let accessToken = null;

export const setAccessToken = (token) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

// REQUEST INTERCEPTOR
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// RESPONSE INTERCEPTOR (AUTO REFRESH)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If access token expired
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/auth/refresh-token")
    ) {
      originalRequest._retry = true;

      try {
        const res = await axios.get(
          `${BASE_URL}/auth/refresh-token`,
          { withCredentials: true }
        );

        const newAccessToken = res.data.data.accessToken;

        setAccessToken(newAccessToken);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (err) {
        console.error("Refresh token failed");
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default api;