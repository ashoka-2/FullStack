import { useDispatch, useSelector } from "react-redux";
import { addToast } from "../../../app/toast.slice";
import { setWishlist, setLoading, setError } from "../State/wishlist.slice";
import * as api from "../Services/wishlist.api";

export const useWishlist = () => {
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);

    const toast = (message, type = "success") => dispatch(addToast({ message, type }));
    const errMsg = (e) => e?.response?.data?.message || "Operation failed.";

    const getWishlist = async () => {
        if (!user) return;
        dispatch(setLoading(true));
        try {
            const data = await api.fetchUserWishlist();
            dispatch(setWishlist(data.wishlist));
            return data.wishlist;
        } catch (e) {
            dispatch(setError(errMsg(e)));
        } finally {
            dispatch(setLoading(false));
        }
    };

    const toggleWishlist = async (productId) => {
        if (!user) {
            toast("Please login to wishlist products.", "info");
            return;
        }
        dispatch(setLoading(true));
        try {
            const data = await api.toggleItemInWishlist(productId);
            dispatch(setWishlist(data.wishlist));
            if (data.action === "added") {
                toast("Added to wishlist! ❤️");
            } else {
                toast("Removed from wishlist.");
            }
            return data.wishlist;
        } catch (e) {
            toast(errMsg(e), "error");
            throw e;
        } finally {
            dispatch(setLoading(false));
        }
    };

    return { getWishlist, toggleWishlist };
};
