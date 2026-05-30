import { useDispatch } from "react-redux";
import { addToast } from "../../../app/toast.slice";
import { setOrders, setLoading, setPlacing, setError, prependOrder } from "../State/order.slice";
import { setCart } from "../../Cart/State/cart.slice";
import * as api from "../Services/order.api";

export const useOrder = () => {
    const dispatch = useDispatch();

    const toast = (message, type = "success") => dispatch(addToast({ message, type }));
    const errMsg = (e) => e?.response?.data?.message || "Order processing failed.";

    const handlePlaceOrder = async (shippingAddress, contactNumber, items = null) => {
        dispatch(setPlacing(true));
        try {
            const data = await api.placeOrder(shippingAddress, contactNumber, items);
            dispatch(prependOrder(data.order));
            // On checkout success, reset local cart state to empty
            if (!items) {
                dispatch(setCart({ items: [] }));
            }
            toast("Order placed successfully! 🎉");
            return data.order;
        } catch (e) {
            toast(errMsg(e), "error");
            throw e;
        } finally {
            dispatch(setPlacing(false));
        }
    };

    const getMyOrders = async () => {
        dispatch(setLoading(true));
        try {
            const data = await api.fetchMyOrders();
            dispatch(setOrders(data.orders));
            return data.orders;
        } catch (e) {
            dispatch(setError(errMsg(e)));
        } finally {
            dispatch(setLoading(false));
        }
    };

    const handleCancelOrReturnOrder = async (orderId, action) => {
        dispatch(setLoading(true));
        try {
            const data = await api.cancelOrReturnOrder(orderId, action);
            toast(`Order ${action === "cancel" ? "cancelled" : "returned"} successfully!`);
            await getMyOrders();
            return data.order;
        } catch (e) {
            toast(errMsg(e), "error");
            throw e;
        } finally {
            dispatch(setLoading(false));
        }
    };

    return { handlePlaceOrder, getMyOrders, handleCancelOrReturnOrder };
};
