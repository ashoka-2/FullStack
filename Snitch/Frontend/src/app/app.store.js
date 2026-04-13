import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../Features/auth/state/auth.slice"
import toastReducer from "./toast.slice"

export const store = configureStore({
    reducer: {
        auth: authReducer,
        toast: toastReducer,
    }
})