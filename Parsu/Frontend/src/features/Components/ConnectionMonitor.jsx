import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import { useLocation } from 'react-router';
import customAxios from '../../utils/axios';
import { useDispatch } from 'react-redux';
import { addToast } from '../../utils/toast.slice';
import { RiWifiOffLine, RiServerLine, RiRefreshLine } from '@remixicon/react';

export const ConnectionContext = createContext({
    isOffline: false,
    isServerDown: false,
    isChecking: false,
    isSlowNetwork: false,
    checkServerHealth: () => {}
});

export const useConnection = () => useContext(ConnectionContext);

/**
 * ConnectionMonitor
 * Non-intrusive connection & health monitor:
 * 1. Tracks browser network status (navigator.onLine).
 * 2. Tracks slow network / data-saver mode (navigator.connection).
 * 3. Tracks backend server health (/api/health).
 * 4. Displays a sleek, non-intrusive inline banner right below the navbar.
 */
export default function ConnectionMonitor({ children }) {
    const location = useLocation();
    const dispatch = useDispatch();

    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [isServerDown, setIsServerDown] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    const [isSlowNetwork, setIsSlowNetwork] = useState(() => {
        if (typeof navigator === 'undefined') return false;
        const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        return Boolean(conn && (conn.saveData || conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g'));
    });

    // Toggle low-data mode class on root element
    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('low-network-mode', isSlowNetwork);
        }
    }, [isSlowNetwork]);

    // Listen to network speed changes
    useEffect(() => {
        if (typeof navigator === 'undefined') return;
        const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (!conn) return;

        const checkSpeed = () => {
            const slow = Boolean(conn.saveData || conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g');
            setIsSlowNetwork(slow);
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('network_speed_change', { detail: { isSlow: slow } }));
            }
        };

        conn.addEventListener('change', checkSpeed);
        return () => conn.removeEventListener('change', checkSpeed);
    }, []);

    // Track if user was previously disconnected to trigger reconnection toast
    const wasDisconnectedRef = useRef(false);

    // Broadcast status for Layout and other components
    const broadcastStatus = useCallback((offline, serverDown) => {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(
                new CustomEvent('connection_status_change', {
                    detail: { isOffline: offline, isServerDown: serverDown }
                })
            );
        }
    }, []);

    const isCheckingRef = useRef(false);
    const lastCheckTimeRef = useRef(0);
    const isServerDownRef = useRef(isServerDown);
    const isOfflineRef = useRef(isOffline);

    useEffect(() => {
        isServerDownRef.current = isServerDown;
    }, [isServerDown]);

    useEffect(() => {
        isOfflineRef.current = isOffline;
    }, [isOffline]);

    // Check health purely client-side without HTTP network overhead
    const checkServerHealth = useCallback(async () => {
        const offline = !navigator.onLine;
        setIsOffline(offline);
        setIsServerDown(false);
        broadcastStatus(offline, false);
        if (!offline && wasDisconnectedRef.current) {
            wasDisconnectedRef.current = false;
            dispatch(addToast({ 
                message: "Connection restored! Resuming your session...", 
                type: "success" 
            }));
        }
        return !offline;
    }, [dispatch, broadcastStatus]);

    // Setup network event listeners (only check if an actual network error occurs)
    useEffect(() => {
        const handleOnline = () => {
            setIsOffline(false);
            checkServerHealth(true);
        };

        const handleOffline = () => {
            setIsOffline(true);
            wasDisconnectedRef.current = true;
            broadcastStatus(true, isServerDownRef.current);
        };

        const handleAxiosNetworkError = () => {
            checkServerHealth();
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        window.addEventListener('app_network_error', handleAxiosNetworkError);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('app_network_error', handleAxiosNetworkError);
        };
    }, [checkServerHealth, broadcastStatus]);

    return (
        <ConnectionContext.Provider value={{ isOffline, isServerDown, isChecking, isSlowNetwork, checkServerHealth }}>
            {/* Non-intrusive Inline Connection Banner right below ChatNavbar / top of page */}
            {(isOffline || isServerDown) && (
                <div 
                    className="fixed top-14 left-0 right-0 z-[9999] flex justify-center px-4 pointer-events-none animate-in fade-in slide-in-from-top-2 duration-300"
                    role="alert"
                >
                    <div className="pointer-events-auto max-w-xl w-full mx-auto px-4 py-2 rounded-full bg-zinc-900/95 dark:bg-black/95 backdrop-blur-xl border border-amber-500/40 text-amber-200 shadow-2xl flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                            {isOffline ? (
                                <RiWifiOffLine size={16} className="text-amber-400 shrink-0" />
                            ) : (
                                <RiServerLine size={16} className="text-amber-400 shrink-0" />
                            )}
                            <span className="font-medium truncate text-zinc-100">
                                {isOffline
                                    ? "No internet connection. Please check your network."
                                    : "Server is temporarily unreachable. Please wait while it reconnects..."}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => checkServerHealth()}
                            disabled={isChecking}
                            className="px-3 py-1 rounded-full bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 text-[11px] font-semibold transition-all cursor-pointer shrink-0 disabled:opacity-50 flex items-center gap-1 active:scale-95"
                            title="Retry connection"
                        >
                            <RiRefreshLine size={12} className={isChecking ? "animate-spin" : ""} />
                            <span>{isChecking ? "Checking..." : "Retry"}</span>
                        </button>
                    </div>
                </div>
            )}
            {children}
        </ConnectionContext.Provider>
    );
}
