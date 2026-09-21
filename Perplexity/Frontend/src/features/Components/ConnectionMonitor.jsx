import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/axios';
import OfflineBlobPlayground from './OfflineBlobPlayground';
import { useDispatch } from 'react-redux';
import { addToast } from '../../utils/toast.slice';

/**
 * ConnectionMonitor
 * Continuously monitors:
 * 1. Browser online / offline status (`navigator.onLine`).
 * 2. Backend server availability (`/api/health` or network failure events).
 * Remembers the exact route where the user was working and restores them smoothly upon recovery.
 */
export default function ConnectionMonitor({ children }) {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [isServerDown, setIsServerDown] = useState(false);
    const [isChecking, setIsChecking] = useState(false);

    // Track the last successfully visited path so user returns to the exact spot
    const lastActivePathRef = useRef(location.pathname + location.search + location.hash);
    const wasDisconnectedRef = useRef(false);

    // Update lastActivePath when connection is healthy
    useEffect(() => {
        if (!isOffline && !isServerDown) {
            lastActivePathRef.current = location.pathname + location.search + location.hash;
        }
    }, [location, isOffline, isServerDown]);

    // Check health of backend server
    const checkServerHealth = useCallback(async () => {
        if (!navigator.onLine) {
            setIsOffline(true);
            return false;
        }

        setIsChecking(true);
        try {
            // Ping health endpoint with cache-busting timestamp
            const healthUrl = `${API_BASE_URL}/api/health?_t=${Date.now()}`;
            const res = await axios.get(healthUrl, { timeout: 4000 });
            
            if (res.status === 200) {
                if (isServerDown || isOffline) {
                    // Just recovered!
                    setIsServerDown(false);
                    setIsOffline(false);
                    if (wasDisconnectedRef.current) {
                        wasDisconnectedRef.current = false;
                        dispatch(addToast({ 
                            message: "Connection restored! Resuming your session...", 
                            type: "success" 
                        }));
                        // Return to last path if current path diverged
                        const target = lastActivePathRef.current || '/';
                        if (location.pathname + location.search + location.hash !== target) {
                            navigate(target, { replace: true });
                        }
                    }
                }
                return true;
            } else {
                setIsServerDown(true);
                wasDisconnectedRef.current = true;
                return false;
            }
        } catch (err) {
            // If offline, flag offline; otherwise server is down / connection refused
            if (!navigator.onLine) {
                setIsOffline(true);
            } else {
                setIsServerDown(true);
            }
            wasDisconnectedRef.current = true;
            return false;
        } finally {
            setIsChecking(false);
        }
    }, [isServerDown, isOffline, location, navigate, dispatch]);

    // Setup network event listeners & health check polling
    useEffect(() => {
        const handleOnline = () => {
            setIsOffline(false);
            checkServerHealth();
        };

        const handleOffline = () => {
            setIsOffline(true);
            wasDisconnectedRef.current = true;
        };

        const handleAxiosNetworkError = () => {
            if (!isServerDown && !isOffline) {
                checkServerHealth();
            }
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        window.addEventListener('app_network_error', handleAxiosNetworkError);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('app_network_error', handleAxiosNetworkError);
        };
    }, [checkServerHealth, isServerDown, isOffline]);

    const isDisconnected = isOffline || isServerDown;

    return (
        <>
            {isDisconnected && (
                <OfflineBlobPlayground
                    isOffline={isOffline}
                    isServerDown={isServerDown}
                    isChecking={isChecking}
                    onRetry={checkServerHealth}
                    lastPath={lastActivePathRef.current}
                />
            )}
            {children}
        </>
    );
}
