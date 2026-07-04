import axios from "axios";
import { showError } from "../utils/toast";

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

// Rate-limit toast throttle — a burst of parallel requests all hitting 429
// shouldn't stack up a dozen identical toasts.
let lastRateLimitToast = 0;

// RESPONSE INTERCEPTOR (AUTO REFRESH)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Rate limited — surface the backend's message globally so individual
    // pages' silent catch blocks don't swallow it.
    if (error.response?.status === 429) {
      const now = Date.now();
      if (now - lastRateLimitToast > 5000) {
        lastRateLimitToast = now;
        showError(error.response?.data?.message || "Too many requests, please try again later.");
      }
      return Promise.reject(error);
    }

    // If access token expired.
    // /auth/login is excluded: a 401 there means wrong credentials, not an
    // expired token — retrying via refresh would swallow the real error
    // ("Invalid credentials") and surface "Refresh token not found!" instead.
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/auth/refresh-token") &&
      !originalRequest.url.includes("/auth/login")
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
        // Refresh failed — clear token and signal the app to log out
        setAccessToken(null);
        window.dispatchEvent(new CustomEvent("auth:session-expired"));
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default api;