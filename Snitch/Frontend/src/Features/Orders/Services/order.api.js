import axios from "../../../utils/axios";

const orderApiInstance = axios.create({
    baseURL: axios.defaults.baseURL + "/api/orders",
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
