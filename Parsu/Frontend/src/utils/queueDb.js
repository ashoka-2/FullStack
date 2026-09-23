/**
 * IndexedDB Service for persisting Chat Message Queues
 * Supports File/Blob objects, text prompts, models, and metadata
 * Persists across page refreshes and browser restarts.
 */

const DB_NAME = 'ParsuQueueDB';
const DB_VERSION = 1;
const STORE_NAME = 'message_queue';

function openDB() {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined' || !window.indexedDB) {
            return reject(new Error('IndexedDB not supported in this environment'));
        }

        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('chatId', 'chatId', { unique: false });
                store.createIndex('createdAt', 'createdAt', { unique: false });
            }
        };

        request.onsuccess = (event) => {
            resolve(event.target.result);
        };

        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

/**
 * Save a message to the persistent IndexedDB queue
 */
export async function saveQueueItem(item) {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const request = store.put(item);

            request.onsuccess = () => resolve(item);
            request.onerror = (e) => reject(e.target.error);
        });
    } catch (err) {
        console.warn('Failed to save to IndexedDB queue:', err);
        return item;
    }
}

/**
 * Load all queued messages for a specific chat (or all chats)
 */
export async function getQueueItems(chatId) {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => {
                const all = request.result || [];
                // If chatId is provided, filter by chatId, otherwise return all
                const filtered = chatId 
                    ? all.filter(item => !item.chatId || item.chatId === chatId)
                    : all;
                // Sort by creation time
                filtered.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
                resolve(filtered);
            };
            request.onerror = (e) => reject(e.target.error);
        });
    } catch (err) {
        console.warn('Failed to get from IndexedDB queue:', err);
        return [];
    }
}

/**
 * Remove a specific message from IndexedDB after it has been sent or deleted
 */
export async function removeQueueItem(id) {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const request = store.delete(id);

            request.onsuccess = () => resolve(true);
            request.onerror = (e) => reject(e.target.error);
        });
    } catch (err) {
        console.warn('Failed to delete from IndexedDB queue:', err);
        return false;
    }
}

/**
 * Clear all items from the queue
 */
export async function clearQueue(chatId) {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            if (!chatId) {
                const request = store.clear();
                request.onsuccess = () => resolve(true);
                request.onerror = (e) => reject(e.target.error);
            } else {
                const request = store.getAll();
                request.onsuccess = () => {
                    const items = request.result || [];
                    items.filter(i => i.chatId === chatId).forEach(i => store.delete(i.id));
                    resolve(true);
                };
            }
        });
    } catch (err) {
        console.warn('Failed to clear IndexedDB queue:', err);
        return false;
    }
}
