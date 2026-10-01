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

    // Check health of backend server
    const checkServerHealth = useCallback(async () => {
        if (!navigator.onLine) {
            setIsOffline(true);
            broadcastStatus(true, isServerDown);
            return false;
        }

        setIsChecking(true);
        try {
            const res = await customAxios.get(`/api/health?_t=${Date.now()}`, { timeout: 6000 });
            
            if (res.status === 200) {
                if (isServerDown || isOffline) {
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
                broadcastStatus(isOffline, true);
                return false;
            }
        } catch (err) {
            if (!navigator.onLine) {
                setIsOffline(true);
                broadcastStatus(true, isServerDown);
            } else {
                setIsServerDown(true);
                broadcastStatus(false, true);
            }
            wasDisconnectedRef.current = true;
            return false;
        } finally {
            setIsChecking(false);
        }
    }, [isServerDown, isOffline, dispatch, broadcastStatus]);

    // Setup network event listeners & health check polling
    useEffect(() => {
        // Initial health check on mount to ensure server is reachable
        checkServerHealth();

        const handleOnline = () => {
            setIsOffline(false);
            checkServerHealth();
        };

        const handleOffline = () => {
            setIsOffline(true);
            wasDisconnectedRef.current = true;
            broadcastStatus(true, isServerDown);
        };

        const handleAxiosNetworkError = () => {
            if (!isServerDown && !isOffline) {
                checkServerHealth();
            }
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        window.addEventListener('app_network_error', handleAxiosNetworkError);

        // Periodically verify server health every 30s when disconnected
        let interval = null;
        if (isOffline || isServerDown) {
            interval = setInterval(() => {
                checkServerHealth();
            }, 10000);
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('app_network_error', handleAxiosNetworkError);
            if (interval) clearInterval(interval);
        };
    }, [checkServerHealth, isServerDown, isOffline, broadcastStatus]);

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
