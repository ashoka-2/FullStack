import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import { Outlet, useNavigate } from 'react-router';
import { flushSync } from 'react-dom';
import { useSelector } from 'react-redux';
import CartDrawer from './CartDrawer';
import CheckoutModal from './CheckoutModal';
import { useCart } from '../Cart/Hooks/useCart';
import { useWishlist } from '../Wishlist/Hooks/useWishlist';
import { useOrder } from '../Orders/Hooks/useOrder';
import socket from '../../utils/socket';

const MainLayout = () => {
    const user = useSelector(state => state.auth.user);
    const navigate = useNavigate();
    const { getCart } = useCart();
    const { getWishlist } = useWishlist();
    const { getMyOrders } = useOrder();

    // Use localStorage to persist theme. Default to dark mode given the Snitch branding.
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('theme');
        if (saved) return saved === 'dark';
        return true; // Default to dark mode
    });
    
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

    useEffect(() => {
        if (user?.role === 'admin') {
            navigate('/admin');
        }
    }, [user, navigate]);

    useEffect(() => {
        if (!user) return;

        const handleRealtimeUpdate = (payload) => {
            console.log("Socket.io update message received (buyer):", payload.type);
            if (payload.type === "cart_update") {
                getCart();
            } else if (payload.type === "wishlist_update") {
                getWishlist();
            } else if (payload.type === "order_update") {
                getMyOrders();
            }
        };

        socket.on("realtime_update", handleRealtimeUpdate);

        return () => {
            socket.off("realtime_update", handleRealtimeUpdate);
        };
    }, [user, getCart, getWishlist, getMyOrders]);

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    const toggleTheme = (e) => {
        if (!document.startViewTransition) {
            setIsDarkMode(!isDarkMode);
            return;
        }

        const x = e?.clientX ?? window.innerWidth / 2;
        const y = e?.clientY ?? window.innerHeight / 2;

        document.documentElement.style.setProperty('--click-x', `${x}px`);
        document.documentElement.style.setProperty('--click-y', `${y}px`);

        document.startViewTransition(() => {
            flushSync(() => {
                setIsDarkMode(!isDarkMode);
            });
        });
    };

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-500 overflow-x-clip">
            <div className="max-w-[1440px] mx-auto px-4 md:px-6 py-4 md:py-6">
                <Navbar toggleTheme={toggleTheme} isDarkMode={isDarkMode} />
                <main className="pt-16 md:pt-20 w-full relative z-10">
                    <Outlet />
                </main>
            </div>
            
            {/* Global E-commerce Overlays */}
            <CartDrawer onCheckout={() => setIsCheckoutOpen(true)} />
            <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} />
        </div>
    );
};

export default MainLayout;
