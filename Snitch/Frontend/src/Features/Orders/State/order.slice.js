import { createSlice } from "@reduxjs/toolkit";

const orderSlice = createSlice({
    name: "order",
    initialState: {
        orders: [],
        loading: false,
        placing: false,
        error: null,
    },
    reducers: {
        setOrders: (state, action) => {
            state.orders = action.payload;
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setPlacing: (state, action) => {
            state.placing = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
        },
        prependOrder: (state, action) => {
            state.orders = [action.payload, ...state.orders];
        },
    },
});

export const { setOrders, setLoading, setPlacing, setError, prependOrder } = orderSlice.actions;
export default orderSlice.reducer;
