import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router';
import ScrollToTop from '../features/Components/ScrollToTop';
import { useSelector } from 'react-redux';
import Loading from '../features/Components/Loading';

const Layout = () => {
    const authLoading = useSelector(state => state.auth.loading);
    // Track if the preloader has finished its animation sequence
    const [loaderFinished, setLoaderFinished] = useState(false);
    // Track if we've received the first auth data
    const [authWaitDone, setAuthWaitDone] = useState(false);

    useEffect(() => {
        // Once auth loading flips from true to false, we mark wait as done
        if (!authLoading) {
            setAuthWaitDone(true);
        }

        // Sync Initial Theme
        const theme = localStorage.getItem('theme') || 'dark';
        console.log('Theme changed to:', theme);
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        console.log('HTML classes after change:', document.documentElement.className);
        localStorage.setItem('theme', theme);
    }, [authLoading]);

    // Agar loader chal raha hai ya auth abhi fetch nahi hua, toh scroll aur interactable elements ban kar denge (overflow-hidden)
    const isOverlayActive = !loaderFinished || !authWaitDone;

    return (
        <div className={`bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300 min-h-screen relative ${isOverlayActive ? 'h-screen overflow-hidden' : ''}`}>
            {/* Loading component screen ke upar aayega jaise ek parda (curtain) */}
            {isOverlayActive && (
                <Loading onFinished={() => setLoaderFinished(true)} authReady={authWaitDone} />
            )}

            {/* Jab tak parda (loading) hai, tab tak app back me render ho raha hai taaki data fetch ho sake */}
            <ScrollToTop />
            <Outlet />
        </div>
    );
};

export default Layout;
