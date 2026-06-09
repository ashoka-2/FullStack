import { createSlice } from "@reduxjs/toolkit";

const adminSlice = createSlice({
    name: "admin",
    initialState: {
        categories: [],
        units: [],
        sizes: [],
        colors: [],
        brands: [],
        patterns: [],
        fits: [],
        materials: [],
        collars: [],
        loading: false,
        error: null,
    },
    reducers: {
        setCategories: (s, a) => { s.categories = a.payload; },
        setUnits: (s, a) => { s.units = a.payload; },
        setSizes: (s, a) => { s.sizes = a.payload; },
        setColors: (s, a) => { s.colors = a.payload; },
        setBrands: (s, a) => { s.brands = a.payload; },
        setPatterns: (s, a) => { s.patterns = a.payload; },
        setFits: (s, a) => { s.fits = a.payload; },
        setMaterials: (s, a) => { s.materials = a.payload; },
        setCollars: (s, a) => { s.collars = a.payload; },

        addCategory: (s, a) => { s.categories.unshift(a.payload); },
        addUnit: (s, a) => { s.units.unshift(a.payload); },
        addSize: (s, a) => { s.sizes.unshift(a.payload); },
        addColor: (s, a) => { s.colors.unshift(a.payload); },
        addBrand: (s, a) => { s.brands.unshift(a.payload); },
        addPattern: (s, a) => { s.patterns.unshift(a.payload); },
        addFit: (s, a) => { s.fits.unshift(a.payload); },
        addMaterial: (s, a) => { s.materials.unshift(a.payload); },
        addCollar: (s, a) => { s.collars.unshift(a.payload); },

        updateCategoryInList: (s, a) => { s.categories = s.categories.map(c => c._id === a.payload._id ? a.payload : c); },
        updateUnitInList: (s, a) => { s.units = s.units.map(u => u._id === a.payload._id ? a.payload : u); },
        updateSizeInList: (s, a) => { s.sizes = s.sizes.map(sz => sz._id === a.payload._id ? a.payload : sz); },
        updateColorInList: (s, a) => { s.colors = s.colors.map(c => c._id === a.payload._id ? a.payload : c); },
        updateBrandInList: (s, a) => { s.brands = s.brands.map(b => b._id === a.payload._id ? a.payload : b); },
        updatePatternInList: (s, a) => { s.patterns = s.patterns.map(p => p._id === a.payload._id ? a.payload : p); },
        updateFitInList: (s, a) => { s.fits = s.fits.map(f => f._id === a.payload._id ? a.payload : f); },
        updateMaterialInList: (s, a) => { s.materials = s.materials.map(m => m._id === a.payload._id ? a.payload : m); },
        updateCollarInList: (s, a) => { s.collars = s.collars.map(c => c._id === a.payload._id ? a.payload : c); },

        removeCategoryFromList: (s, a) => { s.categories = s.categories.filter(c => c._id !== a.payload); },
        removeUnitFromList: (s, a) => { s.units = s.units.filter(u => u._id !== a.payload); },
        removeSizeFromList: (s, a) => { s.sizes = s.sizes.filter(sz => sz._id !== a.payload); },
        removeColorFromList: (s, a) => { s.colors = s.colors.filter(c => c._id !== a.payload); },
        removeBrandFromList: (s, a) => { s.brands = s.brands.filter(b => b._id !== a.payload); },
        removePatternFromList: (s, a) => { s.patterns = s.patterns.filter(p => p._id !== a.payload); },
        removeFitFromList: (s, a) => { s.fits = s.fits.filter(f => f._id !== a.payload); },
        removeMaterialFromList: (s, a) => { s.materials = s.materials.filter(m => m._id !== a.payload); },
        removeCollarFromList: (s, a) => { s.collars = s.collars.filter(c => c._id !== a.payload); },

        setLoading: (s, a) => { s.loading = a.payload; },
        setError: (s, a) => { s.error = a.payload; },
    },
});

export const {
    setCategories, setUnits, setSizes, setColors, setBrands, setPatterns, setFits, setMaterials, setCollars,
    addCategory, addUnit, addSize, addColor, addBrand, addPattern, addFit, addMaterial, addCollar,
    updateCategoryInList, updateUnitInList, updateSizeInList, updateColorInList, updateBrandInList,
    updatePatternInList, updateFitInList, updateMaterialInList, updateCollarInList,
    removeCategoryFromList, removeUnitFromList, removeSizeFromList, removeColorFromList, removeBrandFromList,
    removePatternFromList, removeFitFromList, removeMaterialFromList, removeCollarFromList,
    setLoading, setError,
} = adminSlice.actions;

export default adminSlice.reducer;
