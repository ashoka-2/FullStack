import { io } from "socket.io-client";
import { API_BASE_URL } from "../../../utils/axios.js";

let socket;

export const initializeSocketConnection = () => {
    if (socket) return socket;

    // In dev: proxy via Vite server (same-origin, port 5173 -> 3000)
    // In prod: direct connection to Render backend
    const socketUrl = API_BASE_URL || (typeof window !== "undefined" ? window.location.origin : 'http://localhost:3000');

    socket = io(socketUrl, {
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

    return socket;
};

export const getSocket = () => socket;