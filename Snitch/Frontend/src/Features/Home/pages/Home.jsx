import React, { useState, useEffect } from 'react';
import Navbar from '../../Components/Navbar';
import Hero from '../components/Hero';

const Home = () => {
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

    const toggleTheme = () => setIsDarkMode(!isDarkMode);

    return (
        <div className="min-h-screen bg-background text-foreground font-sans transition-colors duration-500 pb-16">
            <div className="max-w-[1440px] mx-auto px-4 md:px-6 py-4 md:py-6 overflow-x-hidden">
                <Navbar toggleTheme={toggleTheme} isDarkMode={isDarkMode} />
                <div className="mt-6 md:mt-2 w-full">
                    <Hero />
                </div>
            </div>
        </div>
    );
};

export default Home;