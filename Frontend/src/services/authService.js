import api, { setAccessToken } from "./api";

export const register = (data) => {
  // data shape: { username, email, password, confirmPassword, mobileNumber, agreeToTerms }
  return api.post("/auth/register", data);
};

export const login = async (data) => {
  // data shape: { email, password, rememberMe? }
  const res = await api.post("/auth/login", data);
  const { accessToken, user } = res.data.data;
  setAccessToken(accessToken);
  return { user, accessToken };
};

export const getMe = () => {
  return api.get("/auth/get-me");
};

export const verifyEmail = (email, otp) => {
  return api.post("/auth/verify-email", { email, otp });
};

export const resendOTP = (email) => {
  return api.post("/auth/resend-otp", { email });
};

// ── Phone verification (step 2 of registration) ──────────────────────────────

export const sendPhoneOtp = (email) =>
  api.post("/auth/send-phone-otp", { email }).then(r => r.data.data);

export const verifyPhone = (email, code) =>
  api.post("/auth/verify-phone", { email, code }).then(r => r.data.data);

export const changeVerificationNumber = (email, newNumber) =>
  api.post("/auth/change-verification-number", { email, newNumber }).then(r => r.data.data);

export const logout = async () => {
  await api.post("/auth/logout");
  setAccessToken(null);
};

export const logoutAll = async () => {
  await api.post("/auth/logout-all");
  setAccessToken(null);
};

export const changePassword = (oldPassword, newPassword) => {
  return api.post("/auth/change-password", { oldPassword, newPassword });
};

export const forgotPassword = (email) => {
  return api.post("/auth/forgot-password", { email });
};

export const resetPassword = (token, newPassword) => {
  return api.post("/auth/reset-password", { token, newPassword });
};

export const requestEmailChange = (newEmail, password) => {
  return api.post("/auth/request-email-change", { newEmail, password });
};

export const confirmEmailChange = (otp) => {
  return api.post("/auth/confirm-email-change", { otp });
};

export const cancelEmailChange = () => {
  return api.post("/auth/cancel-email-change");
};

export const deleteAccount = () => {
  return api.patch("/auth/delete-account");
};