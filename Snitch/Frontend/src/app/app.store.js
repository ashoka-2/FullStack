import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../Features/auth/State/auth.slice"
import toastReducer from "./toast.slice"
import productReducer from "../Features/Poducts/State/product.slice"
import adminReducer from "../Features/Admin/State/admin.slice"

export const store = configureStore({
    reducer: {
        auth: authReducer,
        toast: toastReducer,
        product: productReducer,
        admin: adminReducer,
    }
})