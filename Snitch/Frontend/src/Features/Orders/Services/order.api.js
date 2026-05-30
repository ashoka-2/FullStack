import axios from "axios";

const orderApiInstance = axios.create({
    baseURL: "/api/orders",
    withCredentials: true,
});

export async function placeOrder(shippingAddress, contactNumber, items = null) {
    const response = await orderApiInstance.post("/create", { shippingAddress, contactNumber, items });
    return response.data;
}

export async function fetchMyOrders() {
    const response = await orderApiInstance.get("/my");
    return response.data;
}

export async function cancelOrReturnOrder(orderId, action) {
    const response = await orderApiInstance.put(`/cancel-return/${orderId}`, { action });
    return response.data;
}
