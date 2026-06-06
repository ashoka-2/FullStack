import React, { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { useProduct } from "../Hooks/useProduct";
import ProductCard from "../Components/ProductCard";

const Shop = () => {
    const { handleGetAllProducts } = useProduct();
    const { allProducts, loading } = useSelector((state) => state.product);

    // Filter states
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [selectedBrand, setSelectedBrand] = useState("All");
    const [selectedColor, setSelectedColor] = useState("All");
    const [selectedSize, setSelectedSize] = useState("All");
    const [priceRange, setPriceRange] = useState(10000); // Max price
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

    useEffect(() => {
        handleGetAllProducts();
    }, []);

    // Extract unique filter options dynamically from available products
    const filterOptions = useMemo(() => {
        const categories = new Set(["All"]);
        const brands = new Set(["All"]);
        const colors = new Set(["All"]);
        const sizes = new Set(["All"]);
        let maxPrice = 0;

        if (allProducts && allProducts.length > 0) {
            allProducts.forEach((p) => {
                if (p.category?.name) categories.add(p.category.name);
                if (p.brand?.name) brands.add(p.brand.name);
                if (p.price?.amount > maxPrice) maxPrice = p.price.amount;
                
                if (p.colors && p.colors.length > 0) {
                    p.colors.forEach((c) => colors.add(c.name));
                }
                if (p.sizes && p.sizes.length > 0) {
                    p.sizes.forEach((s) => sizes.add(s.name));
                }
            });
        }

        return {
            categories: Array.from(categories),
            brands: Array.from(brands),
            colors: Array.from(colors),
            sizes: Array.from(sizes),
            maxPrice: maxPrice || 10000,
        };
    }, [allProducts]);

    // Update default price range once max is found
    useEffect(() => {
        if (filterOptions.maxPrice > 0 && priceRange === 10000) {
            setPriceRange(filterOptions.maxPrice);
        }
    }, [filterOptions.maxPrice]);

    // Filter products
    const filteredProducts = useMemo(() => {
        if (!allProducts) return [];

        return allProducts.filter((p) => {
            const matchCategory = selectedCategory === "All" || p.category?.name === selectedCategory;
            const matchBrand = selectedBrand === "All" || p.brand?.name === selectedBrand;
            const matchPrice = (p.price?.saleAmount || p.price?.amount) <= priceRange;
            const matchColor = selectedColor === "All" || p.colors?.some((c) => c.name === selectedColor);
            const matchSize = selectedSize === "All" || p.sizes?.some((s) => s.name === selectedSize);

            return matchCategory && matchBrand && matchPrice && matchColor && matchSize;
        });
    }, [allProducts, selectedCategory, selectedBrand, selectedColor, selectedSize, priceRange]);

    const clearFilters = () => {
        setSelectedCategory("All");
        setSelectedBrand("All");
        setSelectedColor("All");
        setSelectedSize("All");
        setPriceRange(filterOptions.maxPrice);
    };

    if (loading && !allProducts?.length) {
        return <div className="min-h-screen flex items-center justify-center animate-pulse text-xl font-bold tracking-[0.5em] uppercase">Loading Collection...</div>;
    }

    return (
        <div className="flex flex-col md:flex-row gap-8 mt-8 relative">
            
            {/* Mobile Filter Toggle */}
            <div className="md:hidden flex justify-between items-center bg-surface p-4 rounded-2xl border border-border-theme/50">
                <span className="font-bold uppercase tracking-widest text-xs">{filteredProducts.length} Results</span>
                <button 
                    onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
                    className="flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest"
                >
                    <i className="ri-filter-3-line"></i> Filters
                </button>
            </div>

            {/* Sidebar Filters */}
            <aside className={`
                ${isMobileFilterOpen ? "fixed inset-0 z-50 bg-background/95 backdrop-blur-3xl p-6 overflow-y-auto" : "hidden"} 
                md:block md:w-64 md:flex-shrink-0 space-y-8 sticky top-28 h-[calc(100vh-120px)] md:overflow-y-auto scrollbar-hide
            `}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-black uppercase tracking-widest">Filters</h2>
                    {isMobileFilterOpen && (
                        <button onClick={() => setIsMobileFilterOpen(false)} className="md:hidden text-2xl">
                            <i className="ri-close-line"></i>
                        </button>
                    )}
                </div>

                {/* Category */}
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-4">Category</h3>
                    <div className="space-y-2">
                        {filterOptions.categories.map((cat) => (
                            <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative flex items-center justify-center w-5 h-5 rounded border border-border-theme/50 bg-surface group-hover:border-accent transition-colors">
                                    {selectedCategory === cat && <div className="w-3 h-3 bg-accent rounded-sm"></div>}
                                </div>
                                <input type="radio" name="category" className="hidden" checked={selectedCategory === cat} onChange={() => setSelectedCategory(cat)} />
                                <span className={`text-sm font-medium ${selectedCategory === cat ? 'text-accent font-bold' : 'text-foreground/80'}`}>{cat}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Brand */}
                {filterOptions.brands.length > 2 && (
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-4">Brand</h3>
                        <select 
                            value={selectedBrand} 
                            onChange={(e) => setSelectedBrand(e.target.value)}
                            className="w-full bg-surface border border-border-theme/50 rounded-xl px-4 py-3 outline-none focus:border-accent text-sm transition-all"
                        >
                            {filterOptions.brands.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>
                )}

                {/* Color */}
                {filterOptions.colors.length > 2 && (
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-4">Color</h3>
                        <div className="flex flex-wrap gap-2">
                            {filterOptions.colors.map((c) => (
                                <button 
                                    key={c}
                                    onClick={() => setSelectedColor(c)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${selectedColor === c ? 'bg-foreground text-background border-foreground' : 'bg-surface border-border-theme/50 hover:border-accent'}`}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Size */}
                {filterOptions.sizes.length > 2 && (
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-4">Size</h3>
                        <div className="flex flex-wrap gap-2">
                            {filterOptions.sizes.map((s) => (
                                <button 
                                    key={s}
                                    onClick={() => setSelectedSize(s)}
                                    className={`w-10 h-10 rounded-xl text-xs font-bold border transition-all flex items-center justify-center ${selectedSize === s ? 'bg-accent text-accent-content border-accent' : 'bg-surface border-border-theme/50 hover:border-accent'}`}
                                >
                                    {s === "All" ? "ALL" : s}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Price Range */}
                <div>
                    <div className="flex justify-between text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-4">
                        <span>Max Price</span>
                        <span className="text-foreground">₹{priceRange}</span>
                    </div>
                    <input 
                        type="range" 
                        min="0" 
                        max={filterOptions.maxPrice} 
                        value={priceRange} 
                        onChange={(e) => setPriceRange(Number(e.target.value))}
                        className="w-full accent-accent"
                    />
                </div>

                <button 
                    onClick={clearFilters}
                    className="w-full py-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl font-bold uppercase tracking-widest text-xs transition-colors"
                >
                    Clear All
                </button>
            </aside>

            {/* Product Grid */}
            <div className="flex-1">
                {filteredProducts.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-gray-500 bg-surface/50 rounded-3xl border border-border-theme/50">
                        <i className="ri-search-eye-line text-4xl mb-4"></i>
                        <p className="font-bold tracking-widest uppercase text-sm">No products found for these filters.</p>
                        <button onClick={clearFilters} className="mt-4 text-accent hover:underline text-xs font-bold uppercase">Clear Filters</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                        {filteredProducts.map((product) => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
};

export default Shop;
