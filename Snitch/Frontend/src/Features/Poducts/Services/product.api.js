import axios from "../../../utils/axios";

const productApiInstance = axios.create({
    baseURL: axios.defaults.baseURL + "/api/products",
})

export async function createProduct(productdata){
    const response = await productApiInstance.post("/add", productdata)
    return response.data
}

export async function getAllProducts(){
    const response = await productApiInstance.get("/all")
    return response.data
}

export async function getSellerProducts(){
    const response = await productApiInstance.get("/sellers-all")
    return response.data
}

// Metadata is now seller-scoped — requires auth cookie (sent automatically)
export async function getProductMetadata(){
    const response = await productApiInstance.get("/metadata")
    return response.data
}

export async function getProductById(id) {
    const response = await productApiInstance.get(`/${id}`);
    return response.data;
}

export async function updateProduct(id, data) {
    const response = await productApiInstance.put(`/update/${id}`, data);
    return response.data;
}

export async function deleteProduct(id) {
    const response = await productApiInstance.delete(`/delete/${id}`);
    return response.data;
}

// ─── Color ───────────────────────────────────────────────────────────────────
export async function createColor(name, hexCode) {
    const response = await productApiInstance.post("/colors", { name, hexCode });
    return response.data;
}

// ─── Category ─────────────────────────────────────────────────────────────────
export async function createCategory(formData) {
    const response = await productApiInstance.post("/categories", formData, {
        headers: { "Content-Type": "multipart/form-data" }
    });
    return response.data;
}

// ─── Brand ────────────────────────────────────────────────────────────────────
export async function createBrand(formData) {
    const response = await productApiInstance.post("/brands", formData, {
        headers: { "Content-Type": "multipart/form-data" }
    });
    return response.data;
}

// ─── Unit ─────────────────────────────────────────────────────────────────────
export async function createUnit(name, abbreviation, description) {
    const response = await productApiInstance.post("/units", { name, abbreviation, description });
    return response.data;
}

// ─── Size ─────────────────────────────────────────────────────────────────────
export async function createSize(name, sortOrder, category) {
    const response = await productApiInstance.post("/sizes", { name, sortOrder, category });
    return response.data;
}

// ─── Pattern ──────────────────────────────────────────────────────────────────
export async function createPattern(name) {
    const response = await productApiInstance.post("/patterns", { name });
    return response.data;
}

// ─── Fit ──────────────────────────────────────────────────────────────────────
export async function createFit(name) {
    const response = await productApiInstance.post("/fits", { name });
    return response.data;
}

// ─── Material ─────────────────────────────────────────────────────────────────
export async function createMaterial(name) {
    const response = await productApiInstance.post("/materials", { name });
    return response.data;
}

// ─── Collar ───────────────────────────────────────────────────────────────────
export async function createCollar(name) {
    const response = await productApiInstance.post("/collars", { name });
    return response.data;
}

// ─── Size Chart ───────────────────────────────────────────────────────────────
export async function getSellerSizeChart() {
    const response = await productApiInstance.get("/size-chart");
    return response.data;
}

export async function uploadSellerSizeChart(formData) {
    const response = await productApiInstance.post("/size-chart", formData, {
        headers: { "Content-Type": "multipart/form-data" }
    });
    return response.data;
}

export async function deleteSellerSizeChart() {
    const response = await productApiInstance.delete("/size-chart");
    return response.data;
}