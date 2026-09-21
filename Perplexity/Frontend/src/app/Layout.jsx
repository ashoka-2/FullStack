import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router';
import { ReactLenis } from 'lenis/react';
import 'lenis/dist/lenis.css';
import ScrollToTop from '../features/Components/ScrollToTop';
import { useSelector } from 'react-redux';
import Loading from '../features/Components/Loading';
import FloatingBlobMascot from '../features/Components/FloatingBlobMascot';
import { ToastContainer } from '../features/Components/Toast';
import ConnectionMonitor from '../features/Components/ConnectionMonitor';

const Layout = () => {
    const authLoading = useSelector(state => state.auth.loading);
    // Track if the preloader has finished its animation sequence
    const [loaderFinished, setLoaderFinished] = useState(false);
    // Track if we've received the first auth data
    const [authWaitDone, setAuthWaitDone] = useState(false);

    useEffect(() => {
        // Once auth loading flips from true to false, mark wait as done
        if (!authLoading) {
            setAuthWaitDone(true);
        }

        // Sync Initial Theme
        const theme = localStorage.getItem('theme') || 'dark';
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
        } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.classList.add('light');
        }
        localStorage.setItem('theme', theme);
    }, [authLoading]);

    // When loader is active or initial auth has not completed, disable scroll
    const isOverlayActive = !loaderFinished || !authWaitDone;

    return (
        <ReactLenis
            root
            options={{
                lerp: 0.09,
                duration: 1.2,
                smoothWheel: true,
                wheelMultiplier: 1,
                touchMultiplier: 1.5,
                infinite: false,
            }}
        >
            <ConnectionMonitor>
                <div className={`bg-[#f4f5f7] dark:bg-[#050505] text-zinc-900 dark:text-zinc-100 transition-colors duration-300 min-h-screen relative ${isOverlayActive ? 'h-screen overflow-hidden' : ''}`}>
                    {/* Animated initial loading curtain */}
                    {isOverlayActive && (
                        <Loading onFinished={() => setLoaderFinished(true)} authReady={authWaitDone} />
                    )}

                    {/* Main app content with background data prefetching */}
                    <ScrollToTop />
                    <Outlet />
                    <FloatingBlobMascot />
                    <ToastContainer />
                </div>
            </ConnectionMonitor>
        </ReactLenis>
    );
};

export default Layout;

