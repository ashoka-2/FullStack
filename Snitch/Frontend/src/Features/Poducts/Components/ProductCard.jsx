import React, { useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { addToast } from '../../../app/toast.slice';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion, useAnimation } from 'framer-motion';

gsap.registerPlugin(ScrollTrigger);

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const cardRef = useRef(null);
  const dragContainerRef = useRef(null);
  
  // States for the Draggable Cart
  const [isDragged, setIsDragged] = useState(false);
  const controls = useAnimation();

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
      className={`bg-surface dark:bg-[#1C1C1E] text-foreground p-3 rounded-[2.5rem] w-full max-w-[280px] mx-auto shadow-md lg:shadow-2xl relative border border-white/10 dark:border-white/10 transition-colors flex-shrink-0 cursor-pointer`}
    >
      <div className="w-full h-auto rounded-[1.7rem] overflow-hidden mb-4 bg-background relative group">
        <img
            src={image}
            alt={title}
            className="w-full h-[220px] object-cover object-top transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
        />
        {isNew && (
            <div className="absolute top-3 left-3 bg-white/90 dark:bg-accent text-[#131313] dark:text-accent-content text-[10px] font-black px-2 py-1 rounded-lg shadow-sm">
                NEW
            </div>
        )}
      </div>

      <div className="px-2 pb-2 text-center">
          <h4 className="font-bold text-sm mb-0.5 tracking-tight truncate">{title}</h4>
          <p className="text-[10px] text-gray-500 font-serif italic mb-4 truncate">{desc}</p>

          <div 
             ref={dragContainerRef}
             className="relative border border-accent/20 rounded-full flex items-center w-full shadow-sm overflow-hidden h-10 touch-none"
             style={{ backgroundColor: isDragged ? 'var(--color-acc)' : 'transparent', transition: 'background-color 0.3s' }} 
          >
              {/* Text Background */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 {isDragged ? (
                    <span className="font-black text-xs text-accent-content tracking-widest uppercase animate-pulse">Added</span>
                 ) : (
                    <span className="font-black text-xs text-accent/50 tracking-widest pointer-events-none ml-6">SLIDE TO CART • {formatPrice(amount, currency)}</span>
                 )}
              </div>

              {/* Draggable Bag Icon */}
              <motion.div 
                  drag={isDragged ? false : "x"}
                  dragConstraints={dragContainerRef} 
                  dragElastic={0}
                  dragMomentum={false}
                  onDragEnd={handleDragEnd}
                  animate={controls}
                  className={`h-full aspect-square bg-accent text-accent-content rounded-full shadow-md z-10 flex items-center justify-center cursor-grab active:cursor-grabbing absolute left-0`}
              >
                  <i className={isDragged ? "ri-check-line text-lg font-black" : "ri-arrow-right-s-line text-lg pointer-events-none"}></i>
              </motion.div>
          </div>
      </div>
    </div>
  );
};

export default ProductCard;