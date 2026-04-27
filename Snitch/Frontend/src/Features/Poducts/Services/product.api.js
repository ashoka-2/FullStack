import axios from "axios";

const productApiInstance = axios.create({
    baseURL:"/api/products",
    withCredentials:true,
})


export async function createProduct(productdata){
    const response = await productApiInstance.post("/add",productdata)
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