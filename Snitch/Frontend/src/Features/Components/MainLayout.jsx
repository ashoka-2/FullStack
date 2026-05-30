import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import { Outlet, useNavigate } from 'react-router';
import { flushSync } from 'react-dom';
import { useSelector } from 'react-redux';
import CartDrawer from './CartDrawer';
import CheckoutModal from './CheckoutModal';

const MainLayout = () => {
    const { user } = useSelector(state => state.auth);
    const navigate = useNavigate();

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
