import React, { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { useProduct } from "../Hooks/useProduct";
import ProductCard from "../Components/ProductCard";

const Shop = () => {
    const { handleGetAllProducts } = useProduct();
    const { allProducts, loading } = useSelector((state) => state.product);

    // Filter states – multi-select arrays
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedBrands, setSelectedBrands] = useState([]);
    const [selectedColors, setSelectedColors] = useState([]);
    const [selectedSizes, setSelectedSizes] = useState([]);
    const [selectedPatterns, setSelectedPatterns] = useState([]);
    const [selectedFits, setSelectedFits] = useState([]);
    const [selectedMaterials, setSelectedMaterials] = useState([]);
    const [selectedCollars, setSelectedCollars] = useState([]);
    const [priceRange, setPriceRange] = useState(10000);
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
    const [sortBy, setSortBy] = useState("newest");

    useEffect(() => {
        handleGetAllProducts();
    }, []);

    // Extract unique filter options dynamically
    const filterOptions = useMemo(() => {
        const categories = new Set();
        const brands = new Set();
        const colors = new Set();
        const sizes = new Set();
        const patterns = new Set();
        const fits = new Set();
        const materials = new Set();
        const collars = new Set();
        let maxPrice = 0;

        if (allProducts?.length > 0) {
            allProducts.forEach((p) => {
                if (p.category?.name) categories.add(p.category.name);
                if (p.brand?.name) brands.add(p.brand.name);
                if ((p.price?.saleAmount || p.price?.amount) > maxPrice) maxPrice = p.price?.saleAmount || p.price?.amount;
                p.colors?.forEach((c) => colors.add(c.name));
                p.sizes?.forEach((s) => sizes.add(s.name));
                p.patterns?.forEach((x) => patterns.add(x.name));
                p.fits?.forEach((x) => fits.add(x.name));
                p.materials?.forEach((x) => materials.add(x.name));
                p.collars?.forEach((x) => collars.add(x.name));
            });
        }

        return {
            categories: Array.from(categories).sort(),
            brands: Array.from(brands).sort(),
            colors: Array.from(colors).sort(),
            sizes: Array.from(sizes).sort(),
            patterns: Array.from(patterns).sort(),
            fits: Array.from(fits).sort(),
            materials: Array.from(materials).sort(),
            collars: Array.from(collars).sort(),
            maxPrice: maxPrice || 10000,
        };
    }, [allProducts]);

    useEffect(() => {
        if (filterOptions.maxPrice > 0 && priceRange === 10000) {
            setPriceRange(filterOptions.maxPrice);
        }
    }, [filterOptions.maxPrice]);

    // Toggle multi-select helpers
    const toggleItem = (setter, value) =>
        setter(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);

    // Filter + sort products
    const filteredProducts = useMemo(() => {
        if (!allProducts) return [];
        let result = allProducts.filter((p) => {
            const matchCat = !selectedCategories.length || selectedCategories.includes(p.category?.name);
            const matchBrand = !selectedBrands.length || selectedBrands.includes(p.brand?.name);
            const matchPrice = (p.price?.saleAmount || p.price?.amount) <= priceRange;
            const matchColor = !selectedColors.length || p.colors?.some((c) => selectedColors.includes(c.name));
            const matchSize = !selectedSizes.length || p.sizes?.some((s) => selectedSizes.includes(s.name));
            const matchPattern = !selectedPatterns.length || p.patterns?.some((x) => selectedPatterns.includes(x.name));
            const matchFit = !selectedFits.length || p.fits?.some((x) => selectedFits.includes(x.name));
            const matchMaterial = !selectedMaterials.length || p.materials?.some((x) => selectedMaterials.includes(x.name));
            const matchCollar = !selectedCollars.length || p.collars?.some((x) => selectedCollars.includes(x.name));
            return matchCat && matchBrand && matchPrice && matchColor && matchSize && matchPattern && matchFit && matchMaterial && matchCollar;
        });

        if (sortBy === "price-asc") result = [...result].sort((a, b) => (a.price?.saleAmount || a.price?.amount) - (b.price?.saleAmount || b.price?.amount));
        if (sortBy === "price-desc") result = [...result].sort((a, b) => (b.price?.saleAmount || b.price?.amount) - (a.price?.saleAmount || a.price?.amount));
        if (sortBy === "newest") result = [...result].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return result;
    }, [allProducts, selectedCategories, selectedBrands, selectedColors, selectedSizes, selectedPatterns, selectedFits, selectedMaterials, selectedCollars, priceRange, sortBy]);

    const clearFilters = () => {
        setSelectedCategories([]);
        setSelectedBrands([]);
        setSelectedColors([]);
        setSelectedSizes([]);
        setSelectedPatterns([]);
        setSelectedFits([]);
        setSelectedMaterials([]);
        setSelectedCollars([]);
        setPriceRange(filterOptions.maxPrice);
    };

    const activeFilterCount = selectedCategories.length + selectedBrands.length + selectedColors.length + selectedSizes.length + selectedPatterns.length + selectedFits.length + selectedMaterials.length + selectedCollars.length;

    if (loading && !allProducts?.length) {
        return <div className="min-h-screen flex items-center justify-center animate-pulse text-xl font-bold tracking-[0.5em] uppercase">Loading Collection...</div>;
    }

    // Reusable multi-select tag list
    const TagFilter = ({ label, options, selected, onToggle, colorClass }) => {
        if (!options.length) return null;
        return (
            <div>
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-3">{label}</h3>
                <div className="flex flex-wrap gap-2">
                    {options.map((opt) => (
                        <button
                            key={opt}
                            onClick={() => onToggle(opt)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${selected.includes(opt)
                                ? `${colorClass || 'bg-foreground text-background border-foreground'}`
                                : 'bg-surface border-border-theme/50 hover:border-accent text-foreground/70'
                                }`}
                        >
                            {opt}
                            {selected.includes(opt) && <i className="ri-close-line ml-1 text-xs" />}
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col md:flex-row gap-8 mt-8 relative">

            {/* Mobile Header */}
            <div className="md:hidden flex justify-between items-center bg-surface p-4 rounded-2xl border border-border-theme/50">
                <div className="flex items-center gap-2">
                    <span className="font-bold uppercase tracking-widest text-xs">{filteredProducts.length} Results</span>
                    {activeFilterCount > 0 && (
                        <span className="bg-accent text-accent-content text-[10px] font-black px-2 py-0.5 rounded-full">{activeFilterCount}</span>
                    )}
                </div>
                <div className="flex gap-2">
                    <select
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value)}
                        className="bg-surface border border-border-theme/50 rounded-lg px-2 py-1 text-xs font-bold outline-none"
                    >
                        <option value="newest">Newest</option>
                        <option value="price-asc">Price: Low</option>
                        <option value="price-desc">Price: High</option>
                    </select>
                    <button
                        onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
                        className="flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest"
                    >
                        <i className="ri-filter-3-line"></i>
                        Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
                    </button>
                </div>
            </div>

            {/* Sidebar Filters */}
            <aside className={`
                ${isMobileFilterOpen ? "fixed inset-0 z-50 bg-background/97 backdrop-blur-3xl p-6 overflow-y-auto" : "hidden"} 
                md:block md:w-64 md:flex-shrink-0 space-y-6 sticky top-28 h-[calc(100vh-120px)] md:overflow-y-auto scrollbar-hide
            `}>
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-black uppercase tracking-widest">Filters</h2>
                        {activeFilterCount > 0 && (
                            <span className="bg-accent text-accent-content text-[10px] font-black px-2 py-0.5 rounded-full">{activeFilterCount}</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {activeFilterCount > 0 && (
                            <button onClick={clearFilters} className="text-xs text-accent font-bold hover:underline">
                                Clear All
                            </button>
                        )}
                        {isMobileFilterOpen && (
                            <button onClick={() => setIsMobileFilterOpen(false)} className="md:hidden text-2xl">
                                <i className="ri-close-line"></i>
                            </button>
                        )}
                    </div>
                </div>

                {/* Sort (desktop) */}
                <div className="hidden md:block">
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-3">Sort By</h3>
                    <select
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value)}
                        className="w-full bg-surface border border-border-theme/50 rounded-xl px-4 py-3 outline-none focus:border-accent text-sm transition-all"
                    >
                        <option value="newest">Newest First</option>
                        <option value="price-asc">Price: Low to High</option>
                        <option value="price-desc">Price: High to Low</option>
                    </select>
                </div>

                {/* Category */}
                <TagFilter
                    label="Category"
                    options={filterOptions.categories}
                    selected={selectedCategories}
                    onToggle={v => toggleItem(setSelectedCategories, v)}
                    colorClass="bg-foreground text-background border-foreground"
                />

                {/* Brand */}
                {filterOptions.brands.length > 0 && (
                    <TagFilter
                        label="Brand"
                        options={filterOptions.brands}
                        selected={selectedBrands}
                        onToggle={v => toggleItem(setSelectedBrands, v)}
                        colorClass="bg-foreground text-background border-foreground"
                    />
                )}

                {/* Color */}
                {filterOptions.colors.length > 0 && (
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-3">Color</h3>
                        <div className="flex flex-wrap gap-2">
                            {filterOptions.colors.map((c) => (
                                <button
                                    key={c}
                                    onClick={() => toggleItem(setSelectedColors, c)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${selectedColors.includes(c) ? 'bg-foreground text-background border-foreground' : 'bg-surface border-border-theme/50 hover:border-accent text-foreground/70'}`}
                                >
                                    {c}{selectedColors.includes(c) && <i className="ri-close-line ml-1 text-xs" />}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Size */}
                {filterOptions.sizes.length > 0 && (
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-3">Size</h3>
                        <div className="flex flex-wrap gap-2">
                            {filterOptions.sizes.map((s) => (
                                <button
                                    key={s}
                                    onClick={() => toggleItem(setSelectedSizes, s)}
                                    className={`w-10 h-10 rounded-xl text-xs font-bold border transition-all flex items-center justify-center ${selectedSizes.includes(s) ? 'bg-accent text-accent-content border-accent' : 'bg-surface border-border-theme/50 hover:border-accent'}`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Pattern */}
                <TagFilter
                    label="Pattern"
                    options={filterOptions.patterns}
                    selected={selectedPatterns}
                    onToggle={v => toggleItem(setSelectedPatterns, v)}
                    colorClass="bg-violet-500 text-white border-violet-500"
                />

                {/* Fit */}
                <TagFilter
                    label="Fit"
                    options={filterOptions.fits}
                    selected={selectedFits}
                    onToggle={v => toggleItem(setSelectedFits, v)}
                    colorClass="bg-sky-500 text-white border-sky-500"
                />

                {/* Material */}
                <TagFilter
                    label="Material"
                    options={filterOptions.materials}
                    selected={selectedMaterials}
                    onToggle={v => toggleItem(setSelectedMaterials, v)}
                    colorClass="bg-amber-500 text-white border-amber-500"
                />

                {/* Collar */}
                <TagFilter
                    label="Collar"
                    options={filterOptions.collars}
                    selected={selectedCollars}
                    onToggle={v => toggleItem(setSelectedCollars, v)}
                    colorClass="bg-rose-500 text-white border-rose-500"
                />

                {/* Price Range */}
                <div>
                    <div className="flex justify-between text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-3">
                        <span>Max Price</span>
                        <span className="text-foreground">₹{priceRange.toLocaleString('en-IN')}</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max={filterOptions.maxPrice}
                        value={priceRange}
                        onChange={(e) => setPriceRange(Number(e.target.value))}
                        className="w-full accent-accent"
                    />
                    <div className="flex justify-between text-[10px] text-foreground/30 mt-1">
                        <span>₹0</span>
                        <span>₹{filterOptions.maxPrice.toLocaleString('en-IN')}</span>
                    </div>
                </div>

                {isMobileFilterOpen && (
                    <button
                        onClick={() => setIsMobileFilterOpen(false)}
                        className="w-full py-4 bg-foreground text-background rounded-2xl font-black uppercase tracking-widest text-sm mt-4"
                    >
                        View {filteredProducts.length} Results
                    </button>
                )}
            </aside>

            {/* Product Grid */}
            <div className="flex-1">
                {/* Desktop sort + result count */}
                <div className="hidden md:flex items-center justify-between mb-6">
                    <p className="text-sm text-foreground/50 font-bold">
                        <span className="text-foreground">{filteredProducts.length}</span> products
                        {activeFilterCount > 0 && <span className="text-accent ml-2">(filtered)</span>}
                    </p>
                </div>

                {filteredProducts.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-gray-500 bg-surface/50 rounded-3xl border border-border-theme/50">
                        <i className="ri-search-eye-line text-4xl mb-4"></i>
                        <p className="font-bold tracking-widest uppercase text-sm">No products match these filters.</p>
                        <button onClick={clearFilters} className="mt-4 text-accent hover:underline text-xs font-bold uppercase">
                            Clear Filters
                        </button>
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
