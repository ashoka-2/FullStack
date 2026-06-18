import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useCart } from '../Cart/Hooks/useCart';
import { motion, AnimatePresence } from 'framer-motion';
import { PrimaryBtn, SecondaryBtn } from './Buttons';
import { useNavigate } from 'react-router';

const CartDrawer = ({ onCheckout }) => {
    const navigate = useNavigate();
    const { cart, isDrawerOpen, loading } = useSelector((state) => state.cart);
    const { getCart, updateQuantity, removeFromCart, setDrawerOpen } = useCart();

    useEffect(() => {
        if (isDrawerOpen) {
            getCart();
        }
    }, [isDrawerOpen]);

    const formatPrice = (amount, currencyCode = 'INR') => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: currencyCode,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const calculateTotal = () => {
        if (!cart || !cart.items) return 0;
        return cart.items.reduce((acc, item) => {
            const price = item.product?.price?.saleAmount || item.product?.price?.amount || 0;
            return acc + (price * item.quantity);
        }, 0);
    };

    return (
        <AnimatePresence>
            {isDrawerOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setDrawerOpen(false)}
                        className="fixed inset-0 bg-background/60 backdrop-blur-md z-[1100]"
                    />

                    {/* Drawer Content */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-surface/90 border-l border-border-theme backdrop-blur-2xl z-[1200] flex flex-col justify-between shadow-2xl"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-border-theme/40 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <i className="ri-shopping-bag-3-line text-2xl text-accent" />
                                <h2 className="text-xl font-black tracking-tighter">Your Bag</h2>
                            </div>
                            <button
                                onClick={() => setDrawerOpen(false)}
                                className="w-10 h-10 rounded-full bg-foreground/5 hover:bg-accent hover:text-accent-content transition-colors flex items-center justify-center text-foreground/40"
                            >
                                <i className="ri-close-line text-xl" />
                            </button>
                        </div>

                        {/* Cart List */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
                            {loading && !cart && (
                                <div className="h-full flex items-center justify-center">
                                    <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}

                            {cart?.items?.length > 0 ? (
                                cart.items.map((item, idx) => {
                                    const matchingVariant = item.variantId && item.product?.variants?.find(v => (v._id || v) === item.variantId);
                                    const price = matchingVariant?.price?.saleAmount || matchingVariant?.price?.amount || item.product?.price?.saleAmount || item.product?.price?.amount || 0;
                                    const img = (matchingVariant?.images && matchingVariant.images.length > 0)
                                        ? matchingVariant.images[0].url
                                        : item.product?.images?.[0]?.url || "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=400&q=80";
                                    
                                    const selectedAttributesObj = item.selectedAttributes instanceof Map 
                                        ? Object.fromEntries(item.selectedAttributes) 
                                        : (item.selectedAttributes || {});
                                    const attrsText = Object.keys(selectedAttributesObj).length > 0
                                        ? Object.entries(selectedAttributesObj).map(([k, v]) => `${k.toUpperCase()}: ${v}`).join(' • ')
                                        : `Size: ${item.size?.name || 'STD'} • Color: ${item.color?.name || 'STD'}`;

                                    return (
                                        <div 
                                            key={item._id || idx} 
                                            onClick={() => {
                                                if (item.product?._id) {
                                                    navigate(`/products/${item.product._id}`);
                                                    setDrawerOpen(false);
                                                }
                                            }}
                                            className="flex gap-4 p-4 bg-background/50 border border-border-theme/40 rounded-3xl hover:border-accent/30 transition-colors group cursor-pointer"
                                        >
                                            <div className="w-16 h-20 bg-surface rounded-2xl overflow-hidden flex-shrink-0">
                                                <img src={img} alt={item.product?.title} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                                <div>
                                                    <h3 className="text-xs font-black truncate uppercase leading-tight">{item.product?.title || 'Removed Product'}</h3>
                                                    <p className="text-[10px] text-accent font-bold tracking-widest uppercase mt-1">
                                                        {attrsText}
                                                    </p>
                                                </div>

                                                <div className="flex items-center justify-between mt-2">
                                                    <div 
                                                        className="flex items-center gap-2.5 bg-background border border-border-theme/60 rounded-full px-2.5 py-1"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <button 
                                                            onClick={() => updateQuantity(item._id, Math.max(1, item.quantity - 1))}
                                                            className="text-foreground/45 hover:text-accent font-black"
                                                        >
                                                            <i className="ri-subtract-line text-xs" />
                                                        </button>
                                                        <span className="text-xs font-black">{item.quantity}</span>
                                                        <button 
                                                            onClick={() => updateQuantity(item._id, item.quantity + 1)}
                                                            className="text-foreground/45 hover:text-accent font-black"
                                                        >
                                                            <i className="ri-add-line text-xs" />
                                                        </button>
                                                    </div>

                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); removeFromCart(item._id); }}
                                                        className="text-red-500 hover:scale-110 active:scale-95 transition-transform"
                                                    >
                                                        <i className="ri-delete-bin-line text-lg" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="text-right flex flex-col justify-between py-1">
                                                <span className="text-xs font-black text-accent">{formatPrice(price * item.quantity)}</span>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center text-foreground/30 px-4">
                                    <i className="ri-shopping-bag-line text-5xl text-accent/15 mb-4 block" />
                                    <p className="font-bold text-sm text-foreground/70">Your shopping bag is empty.</p>
                                    <p className="text-[10px] uppercase font-bold tracking-widest mt-1 text-foreground/40 mb-6">Explore our premium catalog</p>
                                    <PrimaryBtn 
                                        onClick={() => {
                                            setDrawerOpen(false);
                                            navigate("/");
                                        }}
                                        icon="ri-arrow-right-line"
                                        className="!w-auto px-6 py-3 font-semibold text-xs tracking-wider"
                                    >
                                        Continue Shopping
                                    </PrimaryBtn>
                                </div>
                            )}
                        </div>

                        {/* Footer Checkout */}
                        {cart?.items?.length > 0 && (
                            <div className="p-6 border-t border-border-theme/40 bg-background/50 backdrop-blur-md space-y-4">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[8px] font-black tracking-widest text-foreground/45 uppercase">TOTAL BILL</p>
                                        <p className="text-2xl font-black text-accent">{formatPrice(calculateTotal())}</p>
                                    </div>
                                    <span className="text-[9px] text-green-500 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full uppercase tracking-tighter">Simulated FREE Delivery</span>
                                </div>

                                <div className="flex gap-3">
                                    <SecondaryBtn onClick={() => setDrawerOpen(false)} className="flex-1">Keep Shopping</SecondaryBtn>
                                    <PrimaryBtn 
                                        onClick={() => {
                                            setDrawerOpen(false);
                                            onCheckout();
                                        }} 
                                        className="flex-1"
                                        icon="ri-wallet-3-line"
                                    >
                                        Checkout Bag
                                    </PrimaryBtn>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default CartDrawer;
