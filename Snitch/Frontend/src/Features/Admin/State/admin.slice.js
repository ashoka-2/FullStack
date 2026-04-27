import { createSlice } from "@reduxjs/toolkit";

const adminSlice = createSlice({
    name: "admin",
    initialState: {
        categories: [],
        units: [],
        sizes: [],
        colors: [],
        brands: [],
        loading: false,
        error: null,
    },
    reducers: {
        setCategories: (s, a) => { s.categories = a.payload; },
        setUnits: (s, a) => { s.units = a.payload; },
        setSizes: (s, a) => { s.sizes = a.payload; },
        setColors: (s, a) => { s.colors = a.payload; },
        setBrands: (s, a) => { s.brands = a.payload; },

        addCategory: (s, a) => { s.categories.unshift(a.payload); },
        addUnit: (s, a) => { s.units.unshift(a.payload); },
        addSize: (s, a) => { s.sizes.unshift(a.payload); },
        addColor: (s, a) => { s.colors.unshift(a.payload); },
        addBrand: (s, a) => { s.brands.unshift(a.payload); },

        updateCategoryInList: (s, a) => { s.categories = s.categories.map(c => c._id === a.payload._id ? a.payload : c); },
        updateUnitInList: (s, a) => { s.units = s.units.map(u => u._id === a.payload._id ? a.payload : u); },
        updateSizeInList: (s, a) => { s.sizes = s.sizes.map(sz => sz._id === a.payload._id ? a.payload : sz); },
        updateColorInList: (s, a) => { s.colors = s.colors.map(c => c._id === a.payload._id ? a.payload : c); },
        updateBrandInList: (s, a) => { s.brands = s.brands.map(b => b._id === a.payload._id ? a.payload : b); },

        removeCategoryFromList: (s, a) => { s.categories = s.categories.filter(c => c._id !== a.payload); },
        removeUnitFromList: (s, a) => { s.units = s.units.filter(u => u._id !== a.payload); },
        removeSizeFromList: (s, a) => { s.sizes = s.sizes.filter(sz => sz._id !== a.payload); },
        removeColorFromList: (s, a) => { s.colors = s.colors.filter(c => c._id !== a.payload); },
        removeBrandFromList: (s, a) => { s.brands = s.brands.filter(b => b._id !== a.payload); },

        setLoading: (s, a) => { s.loading = a.payload; },
        setError: (s, a) => { s.error = a.payload; },
    },
});

export const {
    setCategories, setUnits, setSizes, setColors, setBrands,
    addCategory, addUnit, addSize, addColor, addBrand,
    updateCategoryInList, updateUnitInList, updateSizeInList, updateColorInList, updateBrandInList,
    removeCategoryFromList, removeUnitFromList, removeSizeFromList, removeColorFromList, removeBrandFromList,
    setLoading, setError,
} = adminSlice.actions;

export default adminSlice.reducer;
