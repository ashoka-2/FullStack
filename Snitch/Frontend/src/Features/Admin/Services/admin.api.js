import axios from "axios";

const adminApi = axios.create({
    baseURL: "/api/admin",
    withCredentials: true,
});

// ── Categories ──────────────────────────────────────────────────────────────
export const createCategory = (data) => adminApi.post("/categories", data).then(r => r.data);
export const getAllCategories = () => adminApi.get("/categories").then(r => r.data);
export const updateCategory = (id, data) => adminApi.put(`/categories/${id}`, data).then(r => r.data);
export const deleteCategory = (id) => adminApi.delete(`/categories/${id}`).then(r => r.data);

// ── Units ───────────────────────────────────────────────────────────────────
export const createUnit = (data) => adminApi.post("/units", data).then(r => r.data);
export const getAllUnits = () => adminApi.get("/units").then(r => r.data);
export const updateUnit = (id, data) => adminApi.put(`/units/${id}`, data).then(r => r.data);
export const deleteUnit = (id) => adminApi.delete(`/units/${id}`).then(r => r.data);

// ── Sizes ───────────────────────────────────────────────────────────────────
export const createSize = (data) => adminApi.post("/sizes", data).then(r => r.data);
export const getAllSizes = () => adminApi.get("/sizes").then(r => r.data);
export const updateSize = (id, data) => adminApi.put(`/sizes/${id}`, data).then(r => r.data);
export const deleteSize = (id) => adminApi.delete(`/sizes/${id}`).then(r => r.data);

// ── Colors ──────────────────────────────────────────────────────────────────
export const createColor = (data) => adminApi.post("/colors", data).then(r => r.data);
export const getAllColors = () => adminApi.get("/colors").then(r => r.data);
export const updateColor = (id, data) => adminApi.put(`/colors/${id}`, data).then(r => r.data);
export const deleteColor = (id) => adminApi.delete(`/colors/${id}`).then(r => r.data);

// ── Brands ──────────────────────────────────────────────────────────────────
export const createBrand = (data) => adminApi.post("/brands", data, { headers: { "Content-Type": "multipart/form-data" } }).then(r => r.data);
export const getAllBrands = () => adminApi.get("/brands").then(r => r.data);
export const updateBrand = (id, data) => adminApi.put(`/brands/${id}`, data, { headers: { "Content-Type": "multipart/form-data" } }).then(r => r.data);
export const deleteBrand = (id) => adminApi.delete(`/brands/${id}`).then(r => r.data);
