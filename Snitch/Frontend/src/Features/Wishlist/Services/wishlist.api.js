import axios from "axios";

const wishlistApiInstance = axios.create({
    baseURL: "/api/wishlists",
    withCredentials: true,
});

export async function fetchUserWishlist() {
    const response = await wishlistApiInstance.get("/");
    return response.data;
}

export async function toggleItemInWishlist(productId) {
    const response = await wishlistApiInstance.post("/toggle", { productId });
    return response.data;
}
