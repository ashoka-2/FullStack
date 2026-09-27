/**
 * usePWA — Service Worker registration + Push Notification permission manager
 *
 * Registers sw.js, requests notification permission, subscribes to Web Push,
 * and sets up periodic background sync for device heartbeats.
 *
 * Usage: call once from Layout.jsx
 */
import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import api from '../utils/axios';

// VAPID public key — set this in .env: VITE_VAPID_PUBLIC_KEY
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    return new Uint8Array([...rawData].map(c => c.charCodeAt(0)));
}

export function usePWA() {
    const user = useSelector(state => state.auth.user);
    const swReg = useRef(null);

    useEffect(() => {
        if (!('serviceWorker' in navigator)) return;

        navigator.serviceWorker
            .register('/sw.js', { scope: '/', updateViaCache: 'none' })
            .then(async reg => {
                swReg.current = reg;
                console.log('[SW] Registered:', reg.scope);

                // Push for update
                reg.addEventListener('updatefound', () => {
                    const newWorker = reg.installing;
                    newWorker?.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New version available — tell SW to skip waiting silently
                            newWorker.postMessage({ type: 'SKIP_WAITING' });
                        }
                    });
                });

                // Periodic background sync (device heartbeat every 5 min if browser supports it)
                if ('periodicSync' in reg) {
                    try {
                        const status = await navigator.permissions.query({ name: 'periodic-background-sync' });
                        if (status.state === 'granted') {
                            await reg.periodicSync.register('parsu-periodic-heartbeat', { minInterval: 5 * 60 * 1000 });
                            await reg.periodicSync.register('parsu-check-notifications', { minInterval: 2 * 60 * 1000 });
                        }
                    } catch { /* browser doesn't support periodicSync — fine, socket handles it */ }
                }
            })
            .catch(err => console.warn('[SW] Registration failed:', err));

        // Reload page when new SW takes control (seamless update)
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (!refreshing) { refreshing = true; window.location.reload(); }
        });

        // Listen for SW → client navigation messages (from notification clicks)
        navigator.serviceWorker.addEventListener('message', event => {
            const { type, url } = event.data || {};
            if (type === 'NOTIFICATION_NAVIGATE' && url) {
                window.history.pushState({}, '', url);
                window.dispatchEvent(new PopStateEvent('popstate'));
            }
        });
    }, []);

    // Request push permission and subscribe once user is logged in
    useEffect(() => {
        if (!user || !swReg.current || !VAPID_PUBLIC_KEY) return;

        async function subscribePush() {
            try {
                const reg = swReg.current || await navigator.serviceWorker.ready;

                // Check / request notification permission
                const permission = await Notification.requestPermission();
                if (permission !== 'granted') return;

                // Already subscribed?
                const existing = await reg.pushManager.getSubscription();
                if (existing) {
                    await syncSubscriptionWithServer(existing);
                    return;
                }

                // Create new subscription
                const subscription = await reg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                });
                await syncSubscriptionWithServer(subscription);
            } catch (err) {
                console.warn('[Push] Subscription error:', err.message);
            }
        }

        const timer = setTimeout(subscribePush, 3000); // Delay to not block initial render
        return () => clearTimeout(timer);
    }, [user]);

    // Sync SW session token so background tasks can authenticate
    useEffect(() => {
        if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) return;
        const token = localStorage.getItem('parsu_auth_token') || localStorage.getItem('token');
        if (token) {
            // Store token in SW's IndexedDB for background use
            navigator.serviceWorker.controller.postMessage({
                type: 'STORE_SESSION',
                payload: { token }
            });
        }
    }, [user]);

    return { swReg: swReg.current };
}

async function syncSubscriptionWithServer(subscription) {
    try {
        await api.post('/api/notifications/subscribe', {
            subscription: subscription.toJSON()
        });
    } catch (err) {
        console.warn('[Push] Server sync failed:', err.message);
    }
}
