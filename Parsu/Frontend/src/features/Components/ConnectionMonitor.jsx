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
    checkServerHealth: () => {}
});

export const useConnection = () => useContext(ConnectionContext);

/**
 * ConnectionMonitor
 * Non-intrusive connection & health monitor:
 * 1. Tracks browser network status (navigator.onLine).
 * 2. Tracks backend server health (/api/health).
 * 3. Never forces a full-screen takeover — displays a sleek, non-intrusive inline banner
 *    right below the navbar so users can continue viewing their active page.
 * 4. Preserves current route on reload.
 */
export default function ConnectionMonitor({ children }) {
    const location = useLocation();
    const dispatch = useDispatch();

    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [isServerDown, setIsServerDown] = useState(false);
    const [isChecking, setIsChecking] = useState(false);

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

    // Check health of backend server (throttled to avoid rapid request storm)
    const checkServerHealth = useCallback(async (force = false) => {
        const now = Date.now();
        if (!force && (isCheckingRef.current || now - lastCheckTimeRef.current < 4000)) {
            return false;
        }

        if (!navigator.onLine) {
            setIsOffline(true);
            broadcastStatus(true, isServerDownRef.current);
            return false;
        }

        isCheckingRef.current = true;
        lastCheckTimeRef.current = now;
        setIsChecking(true);

        try {
            const res = await customAxios.get(`/api/health?_t=${now}`, { timeout: 5000 });
            
            if (res.status === 200) {
                if (isServerDownRef.current || isOfflineRef.current) {
                    setIsServerDown(false);
                    setIsOffline(false);
                    broadcastStatus(false, false);
                    if (wasDisconnectedRef.current) {
                        wasDisconnectedRef.current = false;
                        dispatch(addToast({ 
                            message: "Connection restored! Resuming your session...", 
                            type: "success" 
                        }));
                    }
                }
                return true;
            } else {
                setIsServerDown(true);
                wasDisconnectedRef.current = true;
                broadcastStatus(isOfflineRef.current, true);
                return false;
            }
        } catch (err) {
            if (!navigator.onLine) {
                setIsOffline(true);
                broadcastStatus(true, isServerDownRef.current);
            } else {
                setIsServerDown(true);
                broadcastStatus(false, true);
            }
            wasDisconnectedRef.current = true;
            return false;
        } finally {
            isCheckingRef.current = false;
            setIsChecking(false);
        }
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
        <ConnectionContext.Provider value={{ isOffline, isServerDown, isChecking, checkServerHealth }}>
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
