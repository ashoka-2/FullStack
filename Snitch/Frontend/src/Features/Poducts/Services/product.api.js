import axios from "axios";

const productApiInstance = axios.create({
    baseURL:"api/products",
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