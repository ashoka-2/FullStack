import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import { Outlet, useNavigate } from 'react-router';
import { flushSync } from 'react-dom';
import { useSelector, useDispatch } from 'react-redux';
import CartDrawer from './CartDrawer';
import CheckoutModal from './CheckoutModal';
import PopupManager from './PopupManager';
import Footer from './Footer';
import { useCart } from '../Cart/Hooks/useCart';
import { useWishlist } from '../Wishlist/Hooks/useWishlist';
import { useOrder } from '../Orders/Hooks/useOrder';
import { useSettings } from '../Settings/Hooks/useSettings';
import { applyRealtimeSettings } from '../Settings/State/settings.slice';
import socket from '../../utils/socket';

const MainLayout = () => {
    const user = useSelector(state => state.auth.user);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { getCart } = useCart();
    const { getWishlist } = useWishlist();
    const { getMyOrders } = useOrder();
    const { handleGetSettings } = useSettings();

    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('theme');
        if (saved) return saved === 'dark';
        return true;
    });

    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

    // Fetch settings once on mount for Footer, About, Contact pages
    useEffect(() => {
        handleGetSettings();
    }, []);

    useEffect(() => {
        if (user?.role === 'admin') {
            navigate('/admin');
        }
    }, [user, navigate]);

    useEffect(() => {
        // ⚡ GLOBAL REALTIME SOCKET HANDLER
        const handleRealtimeUpdate = (payload) => {
            console.log("Socket.io event:", payload.type);
            if (payload.type === "cart_update" && user) {
                getCart();
            } else if (payload.type === "wishlist_update" && user) {
                getWishlist();
            } else if (payload.type === "order_update" && user) {
                getMyOrders();
            } else if (payload.type === "settings_update") {
                // ⚡ Instantly apply site settings for ALL users (no reload needed)
                dispatch(applyRealtimeSettings(payload.data));
            }
        };

        socket.on("realtime_update", handleRealtimeUpdate);
        return () => {
            socket.off("realtime_update", handleRealtimeUpdate);
        };
    }, [user, getCart, getWishlist, getMyOrders, dispatch]);

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
        <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-500 overflow-x-clip">
            <div className="max-w-[1440px] w-full mx-auto px-4 md:px-6 py-4 md:py-6 flex-grow">
                <Navbar toggleTheme={toggleTheme} isDarkMode={isDarkMode} />
                <main className="pt-16 md:pt-20 w-full relative z-10 pb-20">
                    <Outlet />
                </main>
            </div>

            <Footer />

            {/* Global E-commerce Overlays */}
            <CartDrawer onCheckout={() => setIsCheckoutOpen(true)} />
            <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} />
            <PopupManager />
        </div>
    );
};

export default MainLayout;
