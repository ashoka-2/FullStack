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

    // We show loader if it hasn't finished OR if we are still waiting for initial auth
    if (!loaderFinished || !authWaitDone) {
        return <Loading onFinished={() => setLoaderFinished(true)} />;
    }

    return (
        <div className="bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300 min-h-screen">
            <ScrollToTop />
            <Outlet />
        </div>
    );
};

export default Layout;
