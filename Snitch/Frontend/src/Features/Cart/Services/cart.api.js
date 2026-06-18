import axios from "../../../utils/axios";

const cartApiInstance = axios.create({
    baseURL: axios.defaults.baseURL + "/api/carts",
});

export async function fetchUserCart() {
    const response = await cartApiInstance.get("/");
    return response.data;
}

export async function addItemToCart(productId, sizeId, colorId, quantity, variantId, selectedAttributes) {
    const response = await cartApiInstance.post("/add", { productId, sizeId, colorId, quantity, variantId, selectedAttributes });
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
