import { useDispatch, useSelector } from "react-redux";
import { addToast } from "../../../app/toast.slice";
import {
  setCart,
  toggleCartDrawer,
  setCartDrawerOpen,
  setLoading,
  setError,
} from "../State/cart.slice";
import * as api from "../Services/cart.api";

export const useCart = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const toast = (message, type = "success") =>
    dispatch(addToast({ message, type }));
  const errMsg = (e) => e?.response?.data?.message || "Operation failed.";

  const getCart = async () => {
    if (!user) return;
    dispatch(setLoading(true));
    try {
      const data = await api.fetchUserCart();
      dispatch(setCart(data.cart));
      return data.cart;
    } catch (e) {
      dispatch(setError(errMsg(e)));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const addToCart = async (
    productId,
    sizeId = null,
    colorId = null,
    quantity = 1,
    variantId = null,
    selectedAttributes = null
  ) => {
    if (!user) {
      toast("Please login to add products to your cart.", "info");
      return;
    }
    dispatch(setLoading(true));
    try {
      const data = await api.addItemToCart(
        productId,
        sizeId,
        colorId,
        quantity,
        variantId,
        selectedAttributes
      );
      dispatch(setCart(data.cart));
      toast("Product added to bag! 👜");
      return data.cart;
    } catch (e) {
      toast(errMsg(e), "error");
      throw e;
    } finally {
      dispatch(setLoading(false));
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    let originalItems = [];
    let currentCart = null;

    dispatch((_, getState) => {
      currentCart = getState().cart.cart;
      originalItems = currentCart ? [...(currentCart.items || [])] : [];
    });

    // Optimistic state calculation
    const nextItems = originalItems.map((item) => {
      if (item._id === itemId) {
        return { ...item, quantity };
      }
      return item;
    });

    dispatch(setCart({ ...currentCart, items: nextItems }));

    try {
      const data = await api.updateItemQuantity(itemId, quantity);
      dispatch(setCart(data.cart));
      return data.cart;
    } catch (e) {
      // Rollback
      dispatch(setCart({ ...currentCart, items: originalItems }));
      toast(errMsg(e), "error");
      throw e;
    }
  };

  const removeFromCart = async (itemId) => {
    let originalItems = [];
    let currentCart = null;

    dispatch((_, getState) => {
      currentCart = getState().cart.cart;
      originalItems = currentCart ? [...(currentCart.items || [])] : [];
    });

    // Optimistic state calculation
    const nextItems = originalItems.filter((item) => item._id !== itemId);
    dispatch(setCart({ ...currentCart, items: nextItems }));
    toast("Item removed from bag.");

    try {
      const data = await api.deleteItemFromCart(itemId);
      dispatch(setCart(data.cart));
      return data.cart;
    } catch (e) {
      // Rollback
      dispatch(setCart({ ...currentCart, items: originalItems }));
      toast(errMsg(e), "error");
      throw e;
    }
  };

  const clearCart = async () => {
    dispatch(setLoading(true));
    try {
      const data = await api.emptyUserCart();
      dispatch(setCart(data.cart));
      return data.cart;
    } catch (e) {
      toast(errMsg(e), "error");
      throw e;
    } finally {
      dispatch(setLoading(false));
    }
  };

  const toggleDrawer = () => {
    dispatch(toggleCartDrawer());
  };

  const setDrawerOpen = (isOpen) => {
    dispatch(setCartDrawerOpen(isOpen));
  };

  return {
    getCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    toggleDrawer,
    setDrawerOpen,
  };
};
