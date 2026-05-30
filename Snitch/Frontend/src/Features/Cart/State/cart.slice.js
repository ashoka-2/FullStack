import { createSlice } from "@reduxjs/toolkit";

const cartSlice = createSlice({
    name: "cart",
    initialState: {
        cart: null,
        isDrawerOpen: false,
        loading: false,
        error: null,
    },
    reducers: {
        setCart: (state, action) => {
            state.cart = action.payload;
        },
        toggleCartDrawer: (state) => {
            state.isDrawerOpen = !state.isDrawerOpen;
        },
        setCartDrawerOpen: (state, action) => {
            state.isDrawerOpen = action.payload;
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
        },
    },
});

export const { setCart, toggleCartDrawer, setCartDrawerOpen, setLoading, setError } = cartSlice.actions;
export default cartSlice.reducer;
