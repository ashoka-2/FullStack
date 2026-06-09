import axios from "../../../utils/axios";

const adminApi = axios.create({
    baseURL: axios.defaults.baseURL + "/api/admin",
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

// ── Patterns ─────────────────────────────────────────────────────────────────
export const createPattern = (data) => adminApi.post("/patterns", data).then(r => r.data);
export const getAllPatterns = () => adminApi.get("/patterns").then(r => r.data);
export const updatePattern = (id, data) => adminApi.put(`/patterns/${id}`, data).then(r => r.data);
export const deletePattern = (id) => adminApi.delete(`/patterns/${id}`).then(r => r.data);

// ── Fits ─────────────────────────────────────────────────────────────────────
export const createFit = (data) => adminApi.post("/fits", data).then(r => r.data);
export const getAllFits = () => adminApi.get("/fits").then(r => r.data);
export const updateFit = (id, data) => adminApi.put(`/fits/${id}`, data).then(r => r.data);
export const deleteFit = (id) => adminApi.delete(`/fits/${id}`).then(r => r.data);

// ── Materials ─────────────────────────────────────────────────────────────────
export const createMaterial = (data) => adminApi.post("/materials", data).then(r => r.data);
export const getAllMaterials = () => adminApi.get("/materials").then(r => r.data);
export const updateMaterial = (id, data) => adminApi.put(`/materials/${id}`, data).then(r => r.data);
export const deleteMaterial = (id) => adminApi.delete(`/materials/${id}`).then(r => r.data);

// ── Collars ───────────────────────────────────────────────────────────────────
export const createCollar = (data) => adminApi.post("/collars", data).then(r => r.data);
export const getAllCollars = () => adminApi.get("/collars").then(r => r.data);
export const updateCollar = (id, data) => adminApi.put(`/collars/${id}`, data).then(r => r.data);
export const deleteCollar = (id) => adminApi.delete(`/collars/${id}`).then(r => r.data);
