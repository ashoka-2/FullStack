import axios from "axios";

const api = axios.create({
    baseURL: "/api/auth",
    withCredentials: true,
});

// Fetch all users (seller + admin)
export const getAllUsers = () => api.get("/users").then(r => r.data);

// Fetch full user detail: profile + wishlist + cart + orders + products
export const getUserDetail = (id) => api.get(`/users/${id}/detail`).then(r => r.data);

// Ban/unban a user
export const toggleBanUser = (id) => api.put(`/users/${id}/ban`).then(r => r.data);
