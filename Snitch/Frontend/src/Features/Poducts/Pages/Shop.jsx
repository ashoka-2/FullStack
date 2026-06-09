import React, { useEffect, useState, useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import { useProduct } from "../Hooks/useProduct";
import ProductCard from "../Components/ProductCard";

// ── Dual Range Price Slider ───────────────────────────────────────────────────
// ── Dual Range Price Slider ───────────────────────────────────────────────────
const DualRangeSlider = ({ min, max, low, high, onChange }) => {
    const rangeRef = useRef(null);
    const [activeThumb, setActiveThumb] = useState("low");

    const thumbLow = ((low - min) / (max - min)) * 100;
    const thumbHigh = ((high - min) / (max - min)) * 100;

    const updateActiveThumb = (e) => {
        if (!rangeRef.current) return;
        const rect = rangeRef.current.getBoundingClientRect();
        const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0]?.clientX);
        if (clientX === undefined) return;
        const x = clientX - rect.left;
        const pct = (x / rect.width) * 100;
        
        const distLow = Math.abs(pct - thumbLow);
        const distHigh = Math.abs(pct - thumbHigh);
        
        if (distLow < distHigh) {
            setActiveThumb("low");
        } else {
            setActiveThumb("high");
        }
    };

    const handleMouseMove = (e) => {
        if (e.buttons === 1) return; // ignore if dragging on desktop
        updateActiveThumb(e);
    };

    const handleTouchStart = (e) => {
        updateActiveThumb(e);
    };

    const handleLowChange = (e) => {
        const val = Math.min(Number(e.target.value), high - 1);
        onChange(val, high);
    };
    const handleHighChange = (e) => {
        const val = Math.max(Number(e.target.value), low + 1);
        onChange(low, val);
    };

    return (
        <div 
            ref={rangeRef} 
            className="relative h-6 flex items-center"
            onMouseMove={handleMouseMove}
            onTouchStart={handleTouchStart}
        >
            {/* Track */}
            <div className="absolute w-full h-1 rounded-full bg-border-theme/40" />
            {/* Active range */}
            <div
                className="absolute h-1 rounded-full bg-accent"
                style={{ left: `${thumbLow}%`, right: `${100 - thumbHigh}%` }}
            />
            {/* Low thumb */}
            <input
                type="range" min={min} max={max} value={low}
                onChange={handleLowChange}
                className="absolute w-full h-1 appearance-none bg-transparent cursor-pointer focus:outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-accent [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-background [&::-moz-range-thumb]:shadow-md"
                style={{ zIndex: activeThumb === "low" ? 5 : 3 }}
            />
            {/* High thumb */}
            <input
                type="range" min={min} max={max} value={high}
                onChange={handleHighChange}
                className="absolute w-full h-1 appearance-none bg-transparent cursor-pointer focus:outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-accent [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-background [&::-moz-range-thumb]:shadow-md"
                style={{ zIndex: activeThumb === "high" ? 5 : 3 }}
            />
        </div>
    );
};

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
    const [priceLow, setPriceLow] = useState(0);
    const [priceHigh, setPriceHigh] = useState(10000);
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
        let minPrice = Infinity, maxPrice = 0;

        if (allProducts?.length > 0) {
            allProducts.forEach((p) => {
                const price = p.price?.saleAmount || p.price?.amount || 0;
                if (price < minPrice) minPrice = price;
                if (price > maxPrice) maxPrice = price;
                if (p.category?.name) categories.add(p.category.name);
                if (p.brand?.name) brands.add(p.brand.name);
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
            minPrice: minPrice === Infinity ? 0 : Math.floor(minPrice),
            maxPrice: maxPrice || 10000,
        };
    }, [allProducts]);

    // Toggle multi-select helpers
    const toggleItem = (setter, value) =>
        setter(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);

    // Filter + sort products
    const filteredProducts = useMemo(() => {
        if (!allProducts) return [];
        let result = allProducts.filter((p) => {
            const price = p.price?.saleAmount || p.price?.amount || 0;
            const matchCat = !selectedCategories.length || selectedCategories.includes(p.category?.name);
            const matchBrand = !selectedBrands.length || selectedBrands.includes(p.brand?.name);
            const matchPrice = price >= priceLow && price <= priceHigh;
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
    }, [allProducts, selectedCategories, selectedBrands, selectedColors, selectedSizes, selectedPatterns, selectedFits, selectedMaterials, selectedCollars, priceLow, priceHigh, sortBy]);

    const clearFilters = () => {
        setSelectedCategories([]);
        setSelectedBrands([]);
        setSelectedColors([]);
        setSelectedSizes([]);
        setSelectedPatterns([]);
        setSelectedFits([]);
        setSelectedMaterials([]);
        setSelectedCollars([]);
        setPriceLow(0);
        setPriceHigh(10000);
    };

    const activeFilterCount = selectedCategories.length + selectedBrands.length + selectedColors.length + selectedSizes.length + selectedPatterns.length + selectedFits.length + selectedMaterials.length + selectedCollars.length;
    const isPriceFiltered = priceLow > 0 || priceHigh < 10000;

    if (loading && !allProducts?.length) {
        return <div className="min-h-screen flex items-center justify-center animate-pulse text-xl font-bold tracking-[0.5em] uppercase">Loading Collection...</div>;
    }

    const fmt = (v) => `₹${Number(v).toLocaleString('en-IN')}`;

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

    const FilterSidebar = () => (
        <>
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black uppercase tracking-widest">Filters</h2>
                    {(activeFilterCount > 0 || isPriceFiltered) && (
                        <span className="bg-accent text-accent-content text-[10px] font-black px-2 py-0.5 rounded-full">
                            {activeFilterCount + (isPriceFiltered ? 1 : 0)}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {(activeFilterCount > 0 || isPriceFiltered) && (
                        <button onClick={clearFilters} className="text-xs text-accent font-bold hover:underline">
                            Clear All
                        </button>
                    )}
                    <button onClick={() => setIsMobileFilterOpen(false)} className="md:hidden text-2xl">
                        <i className="ri-close-line"></i>
                    </button>
                </div>
            </div>

            {/* Sort By */}
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

            {/* Price Range — Dual Slider */}
            <div>
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Price Range</h3>
                </div>
                <div className="flex items-center justify-between text-xs font-black text-foreground mb-2 gap-2">
                    <span className="px-2 py-1 rounded-lg bg-surface border border-border-theme/50">{fmt(priceLow)}</span>
                    <div className="flex-1 h-[1px] bg-border-theme/30" />
                    <span className="px-2 py-1 rounded-lg bg-surface border border-border-theme/50">{fmt(priceHigh)}</span>
                </div>
                <DualRangeSlider
                    min={0}
                    max={10000}
                    low={priceLow}
                    high={priceHigh}
                    onChange={(l, h) => { setPriceLow(l); setPriceHigh(h); }}
                />
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
            <TagFilter label="Pattern" options={filterOptions.patterns} selected={selectedPatterns} onToggle={v => toggleItem(setSelectedPatterns, v)} colorClass="bg-violet-500 text-white border-violet-500" />

            {/* Fit */}
            <TagFilter label="Fit" options={filterOptions.fits} selected={selectedFits} onToggle={v => toggleItem(setSelectedFits, v)} colorClass="bg-sky-500 text-white border-sky-500" />

            {/* Material */}
            <TagFilter label="Material" options={filterOptions.materials} selected={selectedMaterials} onToggle={v => toggleItem(setSelectedMaterials, v)} colorClass="bg-amber-500 text-white border-amber-500" />

            {/* Collar */}
            <TagFilter label="Collar" options={filterOptions.collars} selected={selectedCollars} onToggle={v => toggleItem(setSelectedCollars, v)} colorClass="bg-rose-500 text-white border-rose-500" />

            {isMobileFilterOpen && (
                <button
                    onClick={() => setIsMobileFilterOpen(false)}
                    className="w-full py-4 bg-foreground text-background rounded-2xl font-black uppercase tracking-widest text-sm mt-4"
                >
                    View {filteredProducts.length} Results
                </button>
            )}
        </>
    );

    return (
        <div className="flex flex-col md:flex-row gap-8 mt-8 relative">

            {/* Mobile Header */}
            <div className="md:hidden flex justify-between items-center bg-surface p-4 rounded-2xl border border-border-theme/50">
                <div className="flex items-center gap-2">
                    <span className="font-bold uppercase tracking-widest text-xs">{filteredProducts.length} Results</span>
                    {(activeFilterCount > 0 || isPriceFiltered) && (
                        <span className="bg-accent text-accent-content text-[10px] font-black px-2 py-0.5 rounded-full">
                            {activeFilterCount + (isPriceFiltered ? 1 : 0)}
                        </span>
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
                        Filters {(activeFilterCount + (isPriceFiltered ? 1 : 0)) > 0 && `(${activeFilterCount + (isPriceFiltered ? 1 : 0)})`}
                    </button>
                </div>
            </div>

            {/* Sidebar Filters — Mobile Fullscreen Overlay */}
            {isMobileFilterOpen && (
                <div className="fixed inset-0 z-50 bg-background/97 backdrop-blur-3xl p-6 overflow-y-auto flex flex-col gap-6 md:hidden">
                    <FilterSidebar />
                </div>
            )}

            {/* Sidebar Filters — Desktop Sticky */}
            <aside className="hidden md:flex md:flex-col gap-6 md:w-64 md:flex-shrink-0 sticky top-28 h-[calc(100vh-120px)] overflow-y-auto scrollbar-hide">
                <FilterSidebar />
            </aside>

            {/* Product Grid */}
            <div className="flex-1">
                <div className="hidden md:flex items-center justify-between mb-6">
                    <p className="text-sm text-foreground/50 font-bold">
                        <span className="text-foreground">{filteredProducts.length}</span> products
                        {(activeFilterCount > 0 || isPriceFiltered) && <span className="text-accent ml-2">(filtered)</span>}
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
