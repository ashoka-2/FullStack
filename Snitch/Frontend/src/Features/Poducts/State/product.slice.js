import { createSlice } from "@reduxjs/toolkit";

const productSlice = createSlice({
    name: "product",
    initialState: {
        // All products from the store
        allProducts: [],
        // Seller's own products
        sellerProducts: [],
        // Products fetched within the last 7 days (sorted by createdAt)
        newProducts: [],
        // Products recently viewed by the user (stored locally, max 10)
        recentlyVisited: [],
        // Products recently bought by the user
        recentlyBought: [],
        // Products frequently bought (can be based on global order count)
        frequentlyBought: [],
        loading: false,
        error: null,
    },
    reducers: {
        setAllProducts: (state, action) => {
            state.allProducts = action.payload;
            // Auto-derive "New Products" — products from last 7 days
            const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
            state.newProducts = action.payload.filter(p =>
                new Date(p.createdAt).getTime() > sevenDaysAgo
            );
        },
        setSellerProducts: (state, action) => {
            state.sellerProducts = action.payload;
        },
        setRecentlyBought: (state, action) => {
            state.recentlyBought = action.payload;
        },
        setFrequentlyBought: (state, action) => {
            state.frequentlyBought = action.payload;
        },
        // Add a product to recently visited (max 10 unique items)
        addRecentlyVisited: (state, action) => {
            const product = action.payload;
            const exists = state.recentlyVisited.find(p => p._id === product._id);
            if (!exists) {
                state.recentlyVisited = [product, ...state.recentlyVisited].slice(0, 10);
            }
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
        },
    },
});

export const {
    setAllProducts,
    setSellerProducts,
    setRecentlyBought,
    setFrequentlyBought,
    addRecentlyVisited,
    setLoading,
    setError,
} = productSlice.actions;

export default productSlice.reducer;