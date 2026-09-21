import api from '../../../utils/axios.js';

export async function register({ username, email, password }) {
  const response = await api.post("/api/auth/register", { username, email, password });
  return response.data;
}

export async function login({ email, password }) {
  const response = await api.post("/api/auth/login", { email, password });
  return response.data;
}

export async function getMe() {
  const response = await api.get("/api/auth/me");
  return response.data;
}

export async function resendVerificationEmail({ email }) {
  const response = await api.post("/api/auth/resend-verification-email", { email });
  return response.data;
}

export async function logout() {
  const response = await api.post("/api/auth/logout");
  return response.data;
}

export async function updateUserProfile({ username, profilePic, preferredModel }) {
  const response = await api.put("/api/auth/profile", { username, profilePic, preferredModel });
  return response.data;
}

export async function forgotPasswordApi({ email }) {
  const response = await api.post("/api/auth/forgot-password", { email });
  return response.data;
}

export async function verifyOtpApi({ email, otp }) {
  const response = await api.post("/api/auth/verify-otp", { email, otp });
  return response.data;
}

export async function resetPasswordApi({ email, otp, newPassword }) {
  const response = await api.post("/api/auth/reset-password", { email, otp, newPassword });
  return response.data;
}

export async function changePasswordApi({ currentPassword, newPassword }) {
  const response = await api.post("/api/auth/change-password", { currentPassword, newPassword });
  return response.data;
}

export default api;