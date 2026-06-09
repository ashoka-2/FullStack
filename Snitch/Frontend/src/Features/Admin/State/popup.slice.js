import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    activePopups: [],
    allPopups: [],
    loading: false,
    error: null,
};

const popupSlice = createSlice({
    name: "popup",
    initialState,
    reducers: {
        setActivePopups: (state, action) => {
            state.activePopups = action.payload;
        },
        setAllPopups: (state, action) => {
            state.allPopups = action.payload;
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
        },
        addPopup: (state, action) => {
            state.allPopups = [action.payload, ...state.allPopups];
        },
        updatePopupInState: (state, action) => {
            const updated = action.payload;
            state.allPopups = state.allPopups.map((p) => (p._id === updated._id ? updated : p));
            if (updated.isActive) {
                // If the updated popup is active, check if it's already in activePopups, if not add it, if yes update it
                const exists = state.activePopups.some((p) => p._id === updated._id);
                if (exists) {
                    state.activePopups = state.activePopups.map((p) => (p._id === updated._id ? updated : p));
                } else {
                    state.activePopups = [updated, ...state.activePopups];
                }
            } else {
                // If it was deactivated, remove it from activePopups
                state.activePopups = state.activePopups.filter((p) => p._id !== updated._id);
            }
        },
        removePopup: (state, action) => {
            const id = action.payload;
            state.allPopups = state.allPopups.filter((p) => p._id !== id);
            state.activePopups = state.activePopups.filter((p) => p._id !== id);
        },
    },
});

export const {
    setActivePopups,
    setAllPopups,
    setLoading,
    setError,
    addPopup,
    updatePopupInState,
    removePopup,
} = popupSlice.actions;

export default popupSlice.reducer;
