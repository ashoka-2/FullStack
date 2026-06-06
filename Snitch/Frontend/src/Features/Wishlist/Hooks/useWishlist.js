import { useDispatch, useSelector } from "react-redux";
import { addToast } from "../../../app/toast.slice";
import { setWishlist, setLoading, setError } from "../State/wishlist.slice";
import * as api from "../Services/wishlist.api";

export const useWishlist = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const toast = (message, type = "success") =>
    dispatch(addToast({ message, type }));
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

    // --- Optimistic Update ---
    let originalProducts = [];
    let currentWishlist = null;

    dispatch((_, getState) => {
      currentWishlist = getState().wishlist.wishlist;
      originalProducts = currentWishlist
        ? [...(currentWishlist.products || [])]
        : [];
    });

    const isCurrentlyListed = originalProducts.some(
      (p) => (p._id || p) === productId,
    );

    // Optimistically generate new products array
    let nextProducts;
    if (isCurrentlyListed) {
      nextProducts = originalProducts.filter((p) => (p._id || p) !== productId);
      toast("Removed from wishlist.");
    } else {
      // Add simple placeholder object or ID representing the product
      nextProducts = [...originalProducts, productId];
      toast("Added to wishlist! ❤️");
    }

    dispatch(setWishlist({ ...currentWishlist, products: nextProducts }));

    try {
      const data = await api.toggleItemInWishlist(productId);
      dispatch(setWishlist(data.wishlist));
      return data.wishlist;
    } catch (e) {
      // Rollback on failure
      dispatch(setWishlist({ ...currentWishlist, products: originalProducts }));
      toast(errMsg(e), "error");
      throw e;
    }
  };

  return { getWishlist, toggleWishlist };
};
