import { io } from "socket.io-client";

let socket;

export const initializeSocketConnection = () => {
    if (socket) return socket;

    const socketUrl = import.meta.env.VITE_HOST_URL || 'http://localhost:3000';

    socket = io(socketUrl, {
        withCredentials: true,
    })

    socket.on("connect", () => {
        console.log("Connected to Socket.io server", socket.id);
    })

    return socket;
}

export const getSocket = () => socket;