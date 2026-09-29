import { io } from "socket.io-client";
import { API_BASE_URL, getActiveBackendUrl } from "../../../utils/axios.js";

let socket;

export const initializeSocketConnection = () => {
    if (socket) return socket;

    // In dev: proxy via Vite server (same-origin, port 5173 -> 3000)
    // In prod: direct connection to active Render backend
    const resolveSocketUrl = () => {
        if (import.meta.env.DEV) {
            return typeof window !== "undefined" ? window.location.origin : 'http://localhost:3000';
        }
        return getActiveBackendUrl();
    };

    socket = io(resolveSocketUrl(), {
        withCredentials: true,
        reconnectionAttempts: 8,
        reconnectionDelay: 3000,
        reconnectionDelayMax: 10000,
        timeout: 7000,
        transports: ['websocket', 'polling'], // Prefer WebSocket first, avoiding excessive polling requests
    });

    socket.on("connect", () => {
        console.log("Connected to Socket.io server", socket.id);
    });

    socket.on("connect_error", (err) => {
        // Suppress noisy uncaught console dumps when local backend server is offline or restarting
        // ConnectionMonitor handles the network/offline UI state
    });

    // Handle real-time automatic model failover / vision switching
    socket.on("model:switched", (data) => {
        console.log("[Socket.IO] Active AI model switched by backend:", data);
        if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("model_auto_switched", { detail: data }));
        }
    });

    // Reconnect socket to new backend URL if an HTTP failover occurred
    if (typeof window !== "undefined") {
        window.addEventListener("backend_server_switched", (e) => {
            const newServer = e.detail?.serverUrl;
            if (newServer && socket && !import.meta.env.DEV) {
                console.log(`[Socket.IO] Reconnecting to backup backend: ${newServer}`);
                socket.disconnect();
                socket.io.uri = newServer;
                socket.connect();
            }
        });
    }

    return socket;
};

export const getSocket = () => socket;