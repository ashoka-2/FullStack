import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useProduct } from '../Hooks/useProduct';
import ProductCard from '../Components/ProductCard';
import PageLoader from '../../Components/PageLoader';
import { ProductSectionSkeleton } from '../../Components/Skeletons';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ─────────────────────────────────────────────
// Reusable Section Component
// ─────────────────────────────────────────────
const ProductSection = ({ title, subtitle, badge, products, emptyMessage }) => {
    const sectionRef = useRef(null);
    const titleRef = useRef(null);

    useGSAP(() => {
        if (!sectionRef.current || !titleRef.current) return;

        // Animate the section title
        gsap.fromTo(titleRef.current,
            { opacity: 0, y: 20 },
            {
                opacity: 1,
                y: 0,
                duration: 0.7,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: titleRef.current,
                    start: "top 88%",
                    toggleActions: "play none none reverse",
                }
            }
        );
    }, { scope: sectionRef });

    if (!products || products.length === 0) return null;

    return (
        <div ref={sectionRef} className="w-full mb-20">
            {/* Section Header */}
            <div ref={titleRef} className="flex items-end justify-between mb-8 px-1">
                <div className="flex flex-col gap-1">
                    {badge && (
                        <span className="text-[10px] font-black tracking-[0.4em] uppercase text-accent mb-1">{badge}</span>
                    )}
                    <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-foreground">{title}</h2>
                    {subtitle && (
                        <p className="text-sm text-foreground/50 font-medium mt-1">{subtitle}</p>
                    )}
                </div>
                <button className="text-xs font-black tracking-widest uppercase text-accent hover:tracking-[0.3em] transition-all duration-300 flex items-center gap-1 group">
                    View All
                    <i className="ri-arrow-right-line group-hover:translate-x-1 transition-transform"></i>
                </button>
            </div>

            {/* Horizontal scroll on mobile, grid on desktop */}
            {/* Horizontal scroll on mobile, grid on desktop with tight gaps */}
            <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 sm:overflow-visible sm:pb-0 sm:gap-2">
                {products.map((product, idx) => (
                    <div key={product._id || idx} className="snap-start flex-shrink-0 w-[200px] sm:w-auto">
                        <ProductCard product={product} />
                    </div>
                ))}
            </div>
        </div>
    );
};


// ─────────────────────────────────────────────
// Main AllProducts Page Section
// ─────────────────────────────────────────────
const AllProducts = () => {
    const { handleGetAllProducts } = useProduct();
    const { allProducts, newProducts, recentlyVisited, recentlyBought, frequentlyBought, loading, error } = useSelector(state => state.product);

    // Fetch all products once on mount
    useEffect(() => {
        handleGetAllProducts();
    }, []);

    if (loading) {
        return (
            <section className="w-full py-16 px-2">
                <PageLoader skeleton={ProductSectionSkeleton} />
                <PageLoader skeleton={ProductSectionSkeleton} />
            </section>
        );
    }

    if (error) {
        return (
            <section className="w-full py-16 flex flex-col items-center justify-center gap-4 text-center">
                <i className="ri-error-warning-line text-5xl text-accent"></i>
                <p className="text-foreground/60 text-sm font-medium">Couldn't load products right now.</p>
                <button
                    onClick={handleGetAllProducts}
                    className="bg-accent text-accent-content px-6 py-2 rounded-full text-xs font-black tracking-widest uppercase hover:opacity-80 transition"
                >
                    Retry
                </button>
            </section>
        );
    }

    return (
        <section className="w-full py-16 px-2">

            {/* Section Divider */}
            <div className="flex items-center gap-4 mb-16">
                <div className="w-8 h-[2px] bg-accent"></div>
                <span className="text-[10px] font-black tracking-[0.5em] uppercase text-foreground/40">Collections</span>
                <div className="flex-1 h-[1px] bg-border-theme/30"></div>
            </div>

            {/* 1. All Products */}
            {allProducts?.length > 0 ? (
                <ProductSection
                    badge="The Full Edit"
                    title="All Products"
                    subtitle="Everything we've got. Your next obsession is here."
                    products={allProducts}
                />
            ) : (
                <div className="bg-surface/50 border border-dash border-border-theme rounded-3xl p-20 text-center mb-10">
                    <i className="ri-shopping-bag-line text-5xl text-accent/20 mb-4 block"></i>
                    <h3 className="text-xl font-bold">No products found</h3>
                    <p className="text-sm text-foreground/40 mt-1">Check back later or try refreshing.</p>
                </div>
            )}

            {/* 2. New Arrivals */}
            {newProducts?.length > 0 && (
                <ProductSection
                    badge="Just Dropped"
                    title="New Arrivals"
                    subtitle="Fresh threads, straight from the workshop."
                    products={newProducts}
                />
            )}

            {/* 3. Recently Visited
            <ProductSection
                badge="You Were Here"
                title="Recently Viewed"
                subtitle="Pick up where you left off."
                products={recentlyVisited}
            />

            {/* 4. Recently Bought */}
            {/* <ProductSection
                badge="Your History"
                title="Recently Bought"
                subtitle="Your last purchases."
                products={recentlyBought}
            /> */}

            {/* 5. Frequently Bought */}
            {/* <ProductSection
                badge="Fan Favourites"
                title="Frequently Bought"
                subtitle="Community-approved picks."
                products={frequentlyBought}
            /> */}

        </section>
    );
};

export default AllProducts;