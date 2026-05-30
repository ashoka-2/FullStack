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
