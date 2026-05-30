import { useDispatch } from "react-redux";
import { addToast } from "../../../app/toast.slice";
import {
    setAllCarts, setAllWishlists, setAllOrders, setUsers, updateSellerOrderStatus, setLoading, setError
} from "../State/seller.slice";
import axios from "axios";

export const useSeller = () => {
    const dispatch = useDispatch();

    const toast = (message, type = "success") => dispatch(addToast({ message, type }));
    const errMsg = (e) => e?.response?.data?.message || "Operation failed. Please try again.";

    const fetchDashboardData = async () => {
        dispatch(setLoading(true));
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

    return { fetchDashboardData, handleUpdateOrderStatus };
};
