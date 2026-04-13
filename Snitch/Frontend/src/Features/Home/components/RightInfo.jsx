import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const products = [
    {
        title: "Urban Vanguard Tee",
        subtitle: "Unmatched comfort.",
        price: "$26.72",
        image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        badge: "NEW"
    },
    {
        title: "Neon Cyber Jacket",
        subtitle: "Illuminate the night.",
        price: "$119.99",
        image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80",
        badge: "HOT"
    },
    {
        title: "Stealth Cargo Pants",
        subtitle: "Tactical everyday wear.",
        price: "$45.50",
        image: "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        badge: "SALE"
    },
    {
        title: "Nebula Low Sneakers",
        subtitle: "Walk on the stars.",
        price: "$89.00",
        image: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        badge: "LIMITED"
    },
    {
        title: "Void Knit Beanie",
        subtitle: "Minimalist warmth.",
        price: "$18.20",
        image: "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        badge: "RESTOCK"
    }
];

const ProductCardItem = ({ product, isDesktop }) => (
    <div className={`bg-surface dark:bg-[#1C1C1E] text-foreground p-3 rounded-[2.5rem] w-[240px] shadow-md lg:shadow-2xl relative border border-white/10 dark:border-white/10 transition-colors flex-shrink-0 snap-center`}>
        <div className="w-full h-auto rounded-[1.7rem] overflow-hidden mb-4 bg-background relative group">
            <img
                src={product.image}
                alt={product.title}
                className="w-full h-[180px] object-cover object-top transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
            />
            <div className="absolute top-3 left-3 bg-white/90 dark:bg-accent text-[#131313] dark:text-accent-content text-[10px] font-black px-2 py-1 rounded-lg shadow-sm">{product.badge}</div>
        </div>
        <div className="px-2 pb-2 text-center">
            <h4 className="font-bold text-sm mb-0.5 tracking-tight">{product.title}</h4>
            <p className="text-[10px] text-gray-500 font-serif italic mb-4">{product.subtitle}</p>

            <div className="border border-accent/20 rounded-full p-1 flex justify-between items-center w-full hover:bg-accent/5 cursor-pointer transition-all shadow-sm relative overflow-hidden group">
                <div className="absolute inset-0 bg-accent/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300"></div>

                <div className="bg-accent text-accent-content p-2 rounded-full shadow-md z-10 flex items-center justify-center">
                    <i className="ri-shopping-bag-3-fill text-xs"></i>
                </div>
                <span className="font-black text-xs px-6 text-accent whitespace-nowrap z-10 transition-colors">{product.price}</span>
            </div>
        </div>
    </div>
);

const FeatureCard = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const desktopCardRef = useRef(null);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % products.length);
        }, 3500);
        return () => clearInterval(interval);
    }, []);

    useGSAP(() => {
        if (desktopCardRef.current) {
            gsap.fromTo(desktopCardRef.current,
                { opacity: 0, y: 15, scale: 0.98 },
                { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "power3.out" }
            );
        }
    }, [currentIndex]);

    return (
        <div className="flex flex-col items-center lg:items-end mt-auto relative z-20 pb-8 lg:pb-0 w-full overflow-hidden">
            <div className="w-full text-left lg:text-right px-6 lg:px-0 mb-3 lg:mb-2">
                <p className="font-bold tracking-widest text-foreground/60 lg:text-white/50 dark:text-accent uppercase text-[10px] lg:mr-4">Featured Products</p>
            </div>

            {/* Desktop View: Auto-carousel with single card */}
            <div className="hidden lg:flex flex-col items-end">
                <div ref={desktopCardRef}>
                    <ProductCardItem product={products[currentIndex]} isDesktop={true} />
                </div>
                <div className="flex gap-2 mt-4 justify-center w-[240px]">
                    {products.map((_, idx) => (
                        <div
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 cursor-pointer ${idx === currentIndex ? 'bg-white w-4 shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'bg-white/30 hover:bg-white/50'}`}
                        />
                    ))}
                </div>
            </div>

            {/* Mobile View: Horizontal Scroll */}
            <div
                className="flex lg:hidden w-[100vw] sm:w-full overflow-x-auto snap-x snap-mandatory gap-4 px-6 pb-6 pt-2"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {/* Embedded style to reliably hide scrollbar in WebKit (Safari/Chrome) without app.css modification */}
                <style dangerouslySetInnerHTML={{ __html: `div::-webkit-scrollbar { display: none; }` }} />
                {products.map((product, idx) => (
                    <ProductCardItem key={idx} product={product} />
                ))}
            </div>
        </div>
    );
};


const RightInfo = ({
    features = [
        { title: "Future\nThreads", iconClass: "ri-price-tag-3-line" },
        { title: "Unique\nDesigns", iconClass: "ri-quill-pen-line" },
        { title: "Limited\nDrops", iconClass: "ri-time-line" }
    ],

}) => {
    return (
        <div className="w-full flex flex-col lg:text-white text-foreground z-10 relative lg:items-end">
            <div className="flex justify-center lg:justify-between gap-10 sm:gap-14 lg:gap-0 mt-0 lg:mt-0 mb-4 lg:mb-4 px-2 lg:px-0 lg:w-[240px]">
                {features.map((feature, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-2 group cursor-pointer lg:w-1/3">
                        <div className="lg:bg-white/10 bg-accent/10 dark:bg-accent/10 w-16 h-16 lg:w-11 lg:h-11 rounded-[16px] lg:rounded-full group-hover:bg-white/20 transition-colors backdrop-blur-md shadow-sm border border-border-theme flex items-center justify-center">
                            <i className={`${feature.iconClass} text-2xl lg:text-lg lg:text-white text-accent dark:text-accent`}></i>
                        </div>
                        <p className="text-[9px] lg:text-[7px] text-center font-black opacity-80 lg:text-white/80 dark:text-gray-400 tracking-[0.2em] whitespace-pre-line uppercase">{feature.title}</p>
                    </div>
                ))}
            </div>

            <FeatureCard />
        </div>
    );
};

export default RightInfo;
