import { useDispatch } from "react-redux";
import { addToast } from "../../../app/toast.slice";
import {
    setAllCarts, setAllWishlists, setAllOrders, setUsers, updateSellerOrderStatus, setLoading, setError
} from "../State/seller.slice";
import axios from "axios";
import socket from "../../../utils/socket";

export const useSeller = () => {
    const dispatch = useDispatch();

    const toast = (message, type = "success") => dispatch(addToast({ message, type }));
    const errMsg = (e) => e?.response?.data?.message || "Operation failed. Please try again.";

    // Silent background sync that updates Redux state without showing a loading spinner
    const syncDashboardData = async () => {
        try {
            const [cartsRes, wishRes, ordersRes, usersRes] = await Promise.all([
                axios.get("/api/carts/all", { withCredentials: true }),
                axios.get("/api/wishlists/all", { withCredentials: true }),
                axios.get("/api/orders/all", { withCredentials: true }),
                axios.get("/api/auth/users", { withCredentials: true })
            ]);

            dispatch(setAllCarts(cartsRes.data.carts));
            dispatch(setAllWishlists(wishRes.data.wishlists));
            dispatch(setAllOrders(ordersRes.data.orders));
            dispatch(setUsers(usersRes.data.users));
        } catch (e) {
            console.error("Seller dashboard background sync error", e);
        }
    };

    // Open connection to Socket.io connection for realtime updates (WhatsApp/Gmail style)
    const setupRealtimeListener = () => {
        if (window.sellerSocketListening) return;
        window.sellerSocketListening = true;

        socket.on("realtime_update", (payload) => {
            console.log("Socket.io update message received (seller):", payload.type);
            if (["cart_update", "wishlist_update", "order_update"].includes(payload.type)) {
                syncDashboardData();
            }
        });
    };

    const fetchDashboardData = async () => {
        dispatch(setLoading(true));
        try {
            // Establish the realtime listener connection
            setupRealtimeListener();

            const [cartsRes, wishRes, ordersRes, usersRes] = await Promise.all([
                axios.get("/api/carts/all", { withCredentials: true }),
                axios.get("/api/wishlists/all", { withCredentials: true }),
                axios.get("/api/orders/all", { withCredentials: true }),
                axios.get("/api/auth/users", { withCredentials: true })
            ]);

            dispatch(setAllCarts(cartsRes.data.carts));
            dispatch(setAllWishlists(wishRes.data.wishlists));
            dispatch(setAllOrders(ordersRes.data.orders));
            dispatch(setUsers(usersRes.data.users));
        } catch (e) {
            console.error("Seller dashboard fetch error", e);
            dispatch(setError(errMsg(e)));
            toast(errMsg(e), "error");
        } finally {
            dispatch(setLoading(false));
        }
    };

    const handleUpdateOrderStatus = async (orderId, status) => {
        try {
            const res = await axios.put(`/api/orders/status/${orderId}`, { status }, { withCredentials: true });
            dispatch(updateSellerOrderStatus(res.data.order));
            toast(`Order status updated to ${status}!`);
            return res.data;
        } catch (e) {
            toast(errMsg(e), "error");
            throw e;
        }
    };

    return { fetchDashboardData, handleUpdateOrderStatus, syncDashboardData, setupRealtimeListener };
};
