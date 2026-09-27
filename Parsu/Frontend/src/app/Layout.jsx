import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router';
import { ReactLenis } from 'lenis/react';
import 'lenis/dist/lenis.css';
import ScrollToTop from '../features/Components/ScrollToTop';
import { useSelector, useDispatch } from 'react-redux';
import { setUser } from '../features/auth/auth.slice';
import Loading from '../features/Components/Loading';
import FloatingBlobMascot from '../features/Components/FloatingBlobMascot';
import { ToastContainer } from '../features/Components/Toast';
import ConnectionMonitor from '../features/Components/ConnectionMonitor';
import ShapeOverlaysTransition from '../features/Components/ShapeOverlaysTransition';
import { usePWA } from '../hooks/usePWA';

const Layout = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    // Register service worker, push notifications & background sync
    usePWA();
    const authLoading = useSelector(state => state.auth.loading);
    
    // Check if the user has already seen the initial loader in this browser session
    const hasLoadedThisSession = typeof window !== 'undefined' && sessionStorage.getItem('parsu_session_initialized') === 'true';

    // Track if the preloader has finished its animation sequence
    const [loaderFinished, setLoaderFinished] = useState(hasLoadedThisSession);
    // Track if we've received the first auth data
    const [authWaitDone, setAuthWaitDone] = useState(hasLoadedThisSession);

    // Invalidate stale user session if restored from browser back-forward cache (bfcache)
    useEffect(() => {
        const handlePageShow = (event) => {
            if (event.persisted) {
                const token = localStorage.getItem('parsu_auth_token') || localStorage.getItem('token');
                if (!token) {
                    dispatch(setUser(null));
                }
            }
        };
        window.addEventListener('pageshow', handlePageShow);
        return () => window.removeEventListener('pageshow', handlePageShow);
    }, [dispatch]);

    useEffect(() => {
        // Once auth loading flips from true to false, mark wait as done
        if (!authLoading) {
            setAuthWaitDone(true);
        }

        // Sync Initial Theme & User Custom Colors
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

    // Global Organic Liquid Wave Transition for all internal page link navigations
    useEffect(() => {
        const handleGlobalLinkClick = (e) => {
            const anchor = e.target.closest('a');
            if (!anchor) return;

            const href = anchor.getAttribute('href');
            if (
                !href ||
                href.startsWith('#') ||
                href.startsWith('http://') ||
                href.startsWith('https://') ||
                href.startsWith('//') ||
                href.startsWith('mailto:') ||
                href.startsWith('tel:') ||
                anchor.target === '_blank' ||
                anchor.getAttribute('download') !== null ||
                e.ctrlKey ||
                e.metaKey ||
                e.shiftKey ||
                e.altKey ||
                e.defaultPrevented
            ) {
                return;
            }

            const currentPath = window.location.pathname;
            const targetPath = href.split('?')[0].split('#')[0];
            if (currentPath === targetPath && !href.includes('?') && !href.includes('#')) {
                return;
            }

            e.preventDefault();
            e.stopPropagation();

            window.dispatchEvent(
                new CustomEvent('trigger_liquid_transition', {
                    detail: {
                        onNavigate: () => {
                            navigate(href);
                        }
                    }
                })
            );
        };

        document.addEventListener('click', handleGlobalLinkClick, { capture: true });
        return () => document.removeEventListener('click', handleGlobalLinkClick, { capture: true });
    }, [navigate]);

    // When loader has already finished this session, NEVER show overlay on reload
    const isOverlayActive = !hasLoadedThisSession && (!loaderFinished || !authWaitDone);

    const handleLoaderFinished = () => {
        setLoaderFinished(true);
        try {
            sessionStorage.setItem('parsu_session_initialized', 'true');
        } catch (e) {
            console.warn('SessionStorage unavailable', e);
        }
    };

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
                <div className={`bg-[var(--bg-primary)] text-zinc-900 dark:text-zinc-100 transition-colors duration-300 min-h-screen relative ${isOverlayActive ? 'h-[100dvh] overflow-hidden' : ''}`}>
                    {/* Animated initial loading curtain (only on first session entry) */}
                    {isOverlayActive && (
                        <Loading onFinished={handleLoaderFinished} authReady={authWaitDone} />
                    )}

                    {/* Main app content with background data prefetching */}
                    <ScrollToTop />
                    <Outlet />
                    <FloatingBlobMascot />
                    <ToastContainer />
                    <ShapeOverlaysTransition />
                </div>
            </ConnectionMonitor>
        </ReactLenis>
    );
};

export default Layout;

