import { createSlice } from "@reduxjs/toolkit";

const toastSlice = createSlice({
    name: "toast",
    initialState: {
        toasts: []
    },
    reducers: {
        addToast: (state, action) => {
            const uniqueId = action.payload.id || `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            state.toasts.push({
                id: uniqueId,
                message: action.payload.message,
                description: action.payload.description,
                title: action.payload.title,
                action: action.payload.action,
                type: action.payload.type || "info",
                duration: action.payload.duration || 4000,
            });
            // Max 3 toasts at once — shift oldest if exceeded
            if (state.toasts.length > 3) {
                state.toasts.shift();
            }
        },
        removeToast: (state, action) => {
            state.toasts = state.toasts.filter(toast => String(toast.id) !== String(action.payload));
        }
    }
});

export const { addToast, removeToast } = toastSlice.actions;
export default toastSlice.reducer;
