import React, { useRef, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addToast } from '../../../app/toast.slice';
import { useNavigate } from 'react-router';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion, useAnimation } from 'framer-motion';

gsap.registerPlugin(ScrollTrigger);

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(state => state.auth.user);
  const cardRef = useRef(null);
  const dragContainerRef = useRef(null);
  
  // States for the Draggable Cart
  const [isDragged, setIsDragged] = useState(false);
  const controls = useAnimation();

  // Ensure arrow starts at left: 0 on mount
  useEffect(() => {
    controls.set({ x: 0 });
  }, [controls]);

  useGSAP(() => {
    if (cardRef.current) {
      gsap.fromTo(cardRef.current, 
        { opacity: 0, y: 30, scale: 0.98 },
        { 
          opacity: 1, 
          y: 0, 
          scale: 1,
          duration: 0.8, 
          ease: "power3.out",
          scrollTrigger: {
            trigger: cardRef.current,
            start: "top 85%",
            toggleActions: "play none none reverse"
          }
        }
      );
    }
  }, { scope: cardRef });

  const handleAddToCart = () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if(!isDragged) {
      setIsDragged(true);
      dispatch(addToast({
        message: "Cart functionality not implemented yet",
        type: "info"
      }));
      
      // Reset after 2 seconds
      setTimeout(() => {
        setIsDragged(false);
        controls.start({ x: 0, transition: { type: "spring", stiffness: 300, damping: 20 } }); 
      }, 2000);
    }
  };

  const handleDragEnd = (event, info) => {
    // Check if dragged far enough to the right (approx half width)
    if (info.offset.x > 100) {
      handleAddToCart();
      // Snap it fully to the right visually until reset
      controls.start({ x: dragContainerRef.current.clientWidth - 40 }); 
    } else {
      // Snap back if not dragged far enough
      controls.start({ x: 0, transition: { type: "spring", stiffness: 400, damping: 25 } });
    }
  };

  // Default values if product data is missing
  const defaultImage = "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
  const title = product?.title || "Premium Cotton Blend T-Shirt";
  const desc = product?.description || "Unmatched comfort.";
  const amount = product?.price?.amount || 1499;
  const currency = product?.price?.currency || "INR";
  const image = product?.images?.[0]?.url || defaultImage;
  const isNew = true; 

  const formatPrice = (amount, currencyCode) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 0
    }).format(amount);
  };



  return (
    <div 
      ref={cardRef}
      className="group relative bg-surface dark:bg-[#121212] border border-border-theme/30 rounded-[2.2rem] w-full max-w-[240px] mx-auto shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden flex-shrink-0 cursor-pointer p-2.5"
    >
      {/* Image Container with Inset Padding */}
      <div className="relative w-full aspect-[4/5] rounded-[1.6rem] overflow-hidden bg-background-alt">
        <img
            src={image}
            alt={title}
            className="w-full h-full object-cover object-center transition-transform duration-1000 group-hover:scale-105"
            loading="lazy"
        />
        
        {/* Top Badges */}
        <div className="absolute top-3 left-3">
            <div className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-[0.2em] backdrop-blur-md border ${product?.stock > 0 ? 'bg-green-500/10 text-green-500 border-green-500/10' : 'bg-red-500/10 text-red-500 border-red-500/10'}`}>
                {product?.stock > 0 ? `${product.stock} IN STOCK` : 'OUT OF STOCK'}
            </div>
        </div>
      </div>

      <div className="px-2 pt-3 pb-1">
          <div className="flex flex-col mb-3">
              <h4 className="font-bold text-[11px] mb-0.5 tracking-tight truncate uppercase leading-none">{title}</h4>
              <p className="text-[8px] text-accent font-bold tracking-[0.25em] uppercase truncate h-3">
                  {product?.category?.name || "Premium Collection"}
              </p>
          </div>

          {/* Original Style Refined Slide to Cart */}
          <div 
             ref={dragContainerRef}
             className="relative bg-background border border-border-theme/40 rounded-full flex items-center w-full shadow-sm overflow-hidden h-9 touch-none"
             style={{ transition: 'background-color 0.3s' }} 
          >
              <div className={`absolute inset-0 bg-accent transition-opacity duration-300 ${isDragged ? 'opacity-100' : 'opacity-0'}`} />

              {/* Text Background (Price Refresh) */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 {isDragged ? (
                    <span className="font-bold text-[8px] text-accent-content tracking-[0.3em] uppercase animate-pulse">Added to Bag</span>
                 ) : (
                    <div className="ml-10 flex items-center gap-2 overflow-hidden px-2 w-full justify-center">
                        {/* Desktop: Dynamic Reveal */}
                        <div className="hidden lg:flex items-center gap-2 transition-all duration-500">
                             {!product?.price?.saleAmount ? (
                                <span className="font-bold text-[8px] text-foreground/25 tracking-[0.25em] uppercase whitespace-nowrap">
                                    Slide to Bag • {formatPrice(amount, currency)}
                                </span>
                             ) : (
                                <div className="relative h-4 overflow-hidden flex items-center justify-center min-w-[100px]">
                                    {/* Default State: Just Sale Price */}
                                    <span className="absolute inset-0 flex items-center justify-center font-bold text-[8px] tracking-[0.25em] transition-all duration-500 uppercase group-hover:translate-y-[-100%] group-hover:opacity-0">
                                        Sale • {formatPrice(product.price.saleAmount, currency)}
                                    </span>
                                    {/* Hover State: Struck MRP + Sale Price */}
                                    <div className="absolute inset-0 flex items-center justify-center translate-y-[100%] group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
                                        <span className="text-foreground/20 line-through text-[7px] mr-1 uppercase">{formatPrice(amount, currency)}</span>
                                        <span className="text-foreground/80 font-black text-[8px] tracking-widest uppercase">{formatPrice(product.price.saleAmount, currency)}</span>
                                    </div>
                                </div>
                             )}
                        </div>

                        {/* Mobile/Tablet: Static Direct Price */}
                        <div className="lg:hidden flex items-center gap-2">
                            {product?.price?.saleAmount ? (
                                <div className="flex items-center gap-1.5">
                                    <span className="text-foreground/20 line-through text-[7px] font-bold uppercase">{formatPrice(amount, currency)}</span>
                                    <span className="text-foreground/80 font-black text-[8px] tracking-[0.25em] uppercase">{formatPrice(product.price.saleAmount, currency)}</span>
                                </div>
                            ) : (
                                <span className="font-bold text-[8px] text-foreground/25 tracking-[0.25em] uppercase">
                                    {formatPrice(amount, currency)}
                                </span>
                            )}
                        </div>
                    </div>
                 )}
              </div>

              {/* Draggable Circle */}
              <motion.div 
                  drag={isDragged ? false : "x"}
                  initial={{ x: 0 }}
                  dragConstraints={dragContainerRef} 
                  dragElastic={0}
                  dragMomentum={false}
                  onDragEnd={handleDragEnd}
                  animate={controls}
                  className="h-full aspect-square bg-accent text-accent-content rounded-full shadow-md z-10 flex items-center justify-center cursor-grab active:cursor-grabbing absolute left-0"
              >
                  <i className={isDragged ? "ri-check-line text-lg font-black" : "ri-arrow-right-s-line text-lg font-bold pointer-events-none"}></i>
              </motion.div>
          </div>
      </div>
    </div>
  );
};

export default ProductCard;