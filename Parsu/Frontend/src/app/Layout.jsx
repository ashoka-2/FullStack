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
import { usePWA } from '../hooks/usePWA';
import GuideOverlay from '../features/guide/GuideOverlay';
import useGuideEngine from '../features/guide/useGuideEngine';

const Layout = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    // Register service worker, push notifications & background sync
    usePWA();
    // AI Guided Help engine — watches AI messages for guide triggers
    useGuideEngine();
    const authLoading = useSelector(state => state.auth.loading);
    
    // Check if the user has already seen the initial loader in this browser session
    const hasLoadedThisSession = typeof window !== 'undefined' && sessionStorage.getItem('parsu_session_initialized') === 'true';

    // Track if the preloader has finished its animation sequence
    const [loaderFinished, setLoaderFinished] = useState(hasLoadedThisSession);
    // Track if we've received the first auth data
    const [authWaitDone, setAuthWaitDone] = useState(hasLoadedThisSession);
    // Track if backend server is unreachable
    const [isServerDown, setIsServerDown] = useState(false);

    // Listen for server connection status broadcast from ConnectionMonitor
    useEffect(() => {
        const handleStatus = (e) => {
            if (e.detail) {
                setIsServerDown(Boolean(e.detail.isServerDown));
            }
        };
        window.addEventListener('connection_status_change', handleStatus);
        return () => window.removeEventListener('connection_status_change', handleStatus);
    }, []);

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
                        <Loading 
                            onFinished={handleLoaderFinished} 
                            authReady={authWaitDone} 
                            isServerDown={isServerDown} 
                        />
                    )}

                    {/* Main app content with background data prefetching */}
                    <ScrollToTop />
                    <Outlet />
                    <FloatingBlobMascot />
                    <GuideOverlay />
                    <ToastContainer />
                </div>
            </ConnectionMonitor>
        </ReactLenis>
    );
};

export default Layout;

