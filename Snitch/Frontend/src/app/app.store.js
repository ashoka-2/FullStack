import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../Features/auth/State/auth.slice";
import toastReducer from "./toast.slice";
import productReducer from "../Features/Poducts/State/product.slice";
import adminReducer from "../Features/Admin/State/admin.slice";
import cartReducer from "../Features/Cart/State/cart.slice";
import wishlistReducer from "../Features/Wishlist/State/wishlist.slice";
import orderReducer from "../Features/Orders/State/order.slice";
import sellerReducer from "../Features/Seller/State/seller.slice";
import usersReducer from "../Features/Users/State/users.slice";
import settingsReducer from "../Features/Settings/State/settings.slice";
import messagesReducer from "../Features/Messages/State/messages.slice";
import popupReducer from "../Features/Admin/State/popup.slice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    toast: toastReducer,
    product: productReducer,
    admin: adminReducer,
    cart: cartReducer,
    wishlist: wishlistReducer,
    order: orderReducer,
    seller: sellerReducer,
    users: usersReducer,
    settings: settingsReducer,
    messages: messagesReducer,
    popup: popupReducer,
  },
});
