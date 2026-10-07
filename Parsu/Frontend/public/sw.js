/* ============================================================
 * Parsu AI — Service Worker
 * Handles: background sync, push notifications, offline cache,
 * periodic device heartbeat, cross-device relay queue
 * ============================================================ */

const CACHE_NAME = 'parsu-v4';
const OFFLINE_PAGE = '/offline.html';

// Assets to pre-cache for offline & slow-connection instant load
const STATIC_ASSETS = [
    '/',
    '/offline.html',
    '/site.webmanifest',
    '/favicon.ico',
    '/favicon-16x16.png',
    '/favicon-32x32.png',
    '/favicon-48x48.png',
    '/android-chrome-192x192.png',
    '/android-chrome-512x512.png',
    '/apple-touch-icon.png',
    '/parsu.svg'
];

// ─── Install — Pre-cache static shell ─────────────────────────────────────────
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(STATIC_ASSETS).catch(() => {});
        }).then(() => self.skipWaiting())
    );
});

// ─── Activate — Clean stale caches ────────────────────────────────────────────
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

// ─── Fetch — Cache-First for static assets, Fast fallback for documents ───────
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET, browser-extension, and real-time backend endpoints
    if (
        request.method !== 'GET' ||
        url.origin !== self.location.origin ||
        url.pathname.startsWith('/api/') ||
        url.pathname.startsWith('/socket.io/')
    ) return;

    // Static immutable assets (/assets/*) or static images: Cache-First with background revalidation
    if (url.pathname.startsWith('/assets/') || ['image', 'font'].includes(request.destination)) {
        event.respondWith(
            caches.match(request).then(cached => {
                if (cached) {
                    // Revalidate in background without blocking slow connection
                    fetch(request).then(networkResponse => {
                        if (networkResponse && networkResponse.ok) {
                            caches.open(CACHE_NAME).then(cache => cache.put(request, networkResponse));
                        }
                    }).catch(() => {});
                    return cached;
                }
                return fetch(request).then(networkResponse => {
                    if (networkResponse && networkResponse.ok) {
                        const cloned = networkResponse.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(request, cloned));
                    }
                    return networkResponse;
                });
            })
        );
        return;
    }

    // HTML Documents / Navigation: Network-First with offline/cached shell fallback
    if (request.mode === 'navigate' || request.destination === 'document') {
        event.respondWith(
            fetch(request)
                .then(response => {
                    if (response && response.ok) {
                        const cloned = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(request, cloned));
                    }
                    return response;
                })
                .catch(async () => {
                    const cached = await caches.match(request);
                    if (cached) return cached;
                    const cachedRoot = await caches.match('/');
                    if (cachedRoot) return cachedRoot;
                    return caches.match(OFFLINE_PAGE);
                })
        );
        return;
    }

    // Scripts & Styles: Network with instant cached fallback
    event.respondWith(
        fetch(request)
            .then(response => {
                if (response.ok && ['script', 'style'].includes(request.destination)) {
                    const cloned = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(request, cloned));
                }
                return response;
            })
            .catch(() => caches.match(request).then(cached => cached || caches.match('/')))
    );
});

// ─── Push Notification Handler ────────────────────────────────────────────────
self.addEventListener('push', (event) => {
    let data = {};
    try {
        data = event.data ? event.data.json() : {};
    } catch {
        data = { title: 'Parsu AI', body: event.data?.text() || 'New notification' };
    }

    const title = data.title || 'Parsu AI';
    const options = {
        body: data.body || '',
        icon: '/android-chrome-192x192.png',
        badge: '/favicon-48x48.png',
        image: data.image || undefined,
        tag: data.tag || 'parsu-general',
        renotify: true,
        silent: false,
        vibrate: [100, 50, 100],
        timestamp: Date.now(),
        data: {
            url: data.url || '/',
            chatId: data.chatId || null,
            deviceId: data.deviceId || null,
            actionType: data.actionType || 'open',
        },
        actions: data.actions || [
            { action: 'open', title: 'Open', icon: '/android-chrome-192x192.png' },
            { action: 'dismiss', title: 'Dismiss' }
        ]
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

// ─── Notification Click Handler ───────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const { action } = event;
    const { url, chatId } = event.notification.data || {};

    if (action === 'dismiss') return;

    const targetUrl = chatId ? `/chat/${chatId}` : (url || '/');

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
            // Focus existing window if already open
            const existing = clients.find(c => c.url.includes(self.location.origin));
            if (existing) {
                existing.focus();
                existing.postMessage({ type: 'NOTIFICATION_NAVIGATE', url: targetUrl });
                return;
            }
            return self.clients.openWindow(targetUrl);
        })
    );
});

// ─── Background Sync — queued messages & device relay ─────────────────────────
self.addEventListener('sync', (event) => {
    if (event.tag === 'parsu-message-queue') {
        event.waitUntil(flushMessageQueue());
    }
    if (event.tag === 'parsu-device-heartbeat') {
        event.waitUntil(sendDeviceHeartbeat());
    }
});

// ─── Periodic Background Sync — keep device status live ──────────────────────
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'parsu-periodic-heartbeat') {
        event.waitUntil(sendDeviceHeartbeat());
    }
    if (event.tag === 'parsu-check-notifications') {
        event.waitUntil(fetchAndShowPendingNotifications());
    }
});

// ─── Message from Client ──────────────────────────────────────────────────────
self.addEventListener('message', (event) => {
    const { type, payload } = event.data || {};

    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;

        case 'DEVICE_HEARTBEAT':
            // Persist latest heartbeat data for background use
            self.deviceHeartbeatData = payload;
            break;

        case 'QUEUE_MESSAGE':
            // Store message for background sync (used when offline)
            storeQueuedMessage(payload);
            break;

        case 'CACHE_ASSET':
            caches.open(CACHE_NAME).then(c => c.add(payload.url));
            break;
    }
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function flushMessageQueue() {
    try {
        const db = await openDB();
        const messages = await getAll(db, 'messageQueue');
        for (const msg of messages) {
            try {
                const r = await fetch('/api/chats/message', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${msg.token}` },
                    body: JSON.stringify(msg.payload)
                });
                if (r.ok) await deleteRecord(db, 'messageQueue', msg.id);
            } catch {}
        }
    } catch {}
}

async function sendDeviceHeartbeat() {
    try {
        const db = await openDB();
        const session = await get(db, 'session', 'current');
        if (!session?.token) return;
        await fetch('/api/devices/heartbeat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.token}` },
            body: JSON.stringify({ systemMetrics: self.deviceHeartbeatData || {} })
        });
    } catch {}
}

async function fetchAndShowPendingNotifications() {
    try {
        const db = await openDB();
        const session = await get(db, 'session', 'current');
        if (!session?.token) return;
        const r = await fetch('/api/notifications/pending', {
            headers: { 'Authorization': `Bearer ${session.token}` }
        });
        if (!r.ok) return;
        const { notifications = [] } = await r.json();
        for (const n of notifications) {
            await self.registration.showNotification(n.title, {
                body: n.body,
                icon: '/android-chrome-192x192.png',
                badge: '/favicon-48x48.png',
                tag: n.tag || `parsu-${n._id}`,
                data: { url: n.url || '/', chatId: n.chatId }
            });
        }
    } catch {}
}

async function storeQueuedMessage(payload) {
    try {
        const db = await openDB();
        const tx = db.transaction('messageQueue', 'readwrite');
        tx.objectStore('messageQueue').add({ ...payload, id: Date.now() });
    } catch {}
}

// ─── Minimal IndexedDB wrapper ────────────────────────────────────────────────
function openDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open('parsu-sw-db', 2);
        req.onupgradeneeded = e => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('messageQueue')) {
                db.createObjectStore('messageQueue', { keyPath: 'id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains('session')) {
                db.createObjectStore('session', { keyPath: 'key' });
            }
        };
        req.onsuccess = e => resolve(e.target.result);
        req.onerror = e => reject(e.target.error);
    });
}

function getAll(db, storeName) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const req = tx.objectStore(storeName).getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

function get(db, storeName, key) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const req = tx.objectStore(storeName).get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

function deleteRecord(db, storeName, id) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const req = tx.objectStore(storeName).delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}
