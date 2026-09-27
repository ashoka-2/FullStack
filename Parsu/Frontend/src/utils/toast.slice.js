import { createSlice } from "@reduxjs/toolkit";

const toastSlice = createSlice({
    name: "toast",
    initialState: {
        toasts: []
    },
    reducers: {
        addToast: (state, action) => {
            state.toasts.push({
                id: Date.now(),
                message: action.payload.message,
                description: action.payload.description,
                title: action.payload.title,
                action: action.payload.action,
                type: action.payload.type || "info",
            });
            // Max 3 toasts at once — shift oldest if exceeded
            if (state.toasts.length > 3) {
                state.toasts.shift();
            }
        },
        removeToast: (state, action) => {
            state.toasts = state.toasts.filter(toast => toast.id !== action.payload);
        }
    }
});

export const { addToast, removeToast } = toastSlice.actions;
export default toastSlice.reducer;
