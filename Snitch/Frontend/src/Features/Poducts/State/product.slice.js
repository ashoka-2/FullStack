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
        // Currently viewed single product
        currentProduct: null,
        loading: false,
        sellerLoading: false,
        currentLoading: false,   // dedicated loading for single product fetch
        creating: false,    // dedicated state for create product action
        error: null,
    },
    reducers: {
        setAllProducts: (state, action) => {
            const products = action.payload || [];
            state.allProducts = products;
            // Auto-derive "New Products" — products from last 7 days
            const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
            state.newProducts = products.filter(p =>
                new Date(p.createdAt).getTime() > sevenDaysAgo
            );
        },
        setSellerProducts: (state, action) => {
            state.sellerProducts = action.payload;
        },
        // Prepend newly created product to seller's list without a re-fetch
        prependSellerProduct: (state, action) => {
            state.sellerProducts = [action.payload, ...state.sellerProducts];
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
        setCurrentLoading: (state, action) => {
            state.currentLoading = action.payload;
        },
        setCurrentProduct: (state, action) => {
            state.currentProduct = action.payload;
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setSellerLoading: (state, action) => {
            state.sellerLoading = action.payload;
        },
        setCreating: (state, action) => {
            state.creating = action.payload;
        },
        updateProductInList: (state, action) => {
            const updated = action.payload;
            state.allProducts = state.allProducts.map(p => p._id === updated._id ? updated : p);
            state.sellerProducts = state.sellerProducts.map(p => p._id === updated._id ? updated : p);
        },
        removeProductFromList: (state, action) => {
            const id = action.payload;
            state.allProducts = state.allProducts.filter(p => p._id !== id);
            state.sellerProducts = state.sellerProducts.filter(p => p._id !== id);
        },
        setError: (state, action) => {
            state.error = action.payload;
        },
    },
});

export const {
    setAllProducts,
    setSellerProducts,
    prependSellerProduct,
    setRecentlyBought,
    setFrequentlyBought,
    addRecentlyVisited,
    setLoading,
    setSellerLoading,
    setCreating,
    setCurrentProduct,
    setCurrentLoading,
    updateProductInList,
    removeProductFromList,
    setError,
} = productSlice.actions;

export default productSlice.reducer;