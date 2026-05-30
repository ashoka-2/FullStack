import axios from "axios";

const cartApiInstance = axios.create({
    baseURL: "/api/carts",
    withCredentials: true,
});

export async function fetchUserCart() {
    const response = await cartApiInstance.get("/");
    return response.data;
}

export async function addItemToCart(productId, sizeId, colorId, quantity) {
    const response = await cartApiInstance.post("/add", { productId, sizeId, colorId, quantity });
    return response.data;
}

export async function updateItemQuantity(itemId, quantity) {
    const response = await cartApiInstance.put("/update", { itemId, quantity });
    return response.data;
}

export async function deleteItemFromCart(itemId) {
    const response = await cartApiInstance.delete(`/remove/${itemId}`);
    return response.data;
}

export async function emptyUserCart() {
    const response = await cartApiInstance.delete("/clear");
    return response.data;
}
