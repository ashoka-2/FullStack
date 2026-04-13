import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import { Outlet } from 'react-router';
import { flushSync } from 'react-dom';

const MainLayout = () => {
    // Use localStorage to persist theme. Default to dark mode given the Snitch branding.
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('theme');
        if (saved) return saved === 'dark';
        return true; // Default to dark mode
    });

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
        <div className="min-h-screen bg-background text-foreground transition-colors duration-500">
            <div className="max-w-[1440px] mx-auto px-4 md:px-6 py-4 md:py-6 overflow-x-hidden">
                <Navbar toggleTheme={toggleTheme} isDarkMode={isDarkMode} />
                <main className="pt-16 md:pt-20 w-full relative z-10">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
