import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import { config } from "../config/config.js";

let io: Server | null = null;

export const setupSocket = (httpServer: HttpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: config.FRONTEND_URL,
            methods: ["GET", "POST", "PUT", "DELETE"],
            credentials: true
        }
    });

    io.on("connection", (socket) => {
        console.log(`Socket client connected: ${socket.id}`);
        socket.on("disconnect", () => {
            console.log(`Socket client disconnected: ${socket.id}`);
        });
    });

    return io;
};

export const broadcastUpdate = (eventType: string, data: any = {}) => {
    if (io) {
        console.log(`Broadcasting Socket.io event: ${eventType}`);
        io.emit("realtime_update", { type: eventType, data });
    } else {
        console.warn("Socket.io is not initialized yet!");
    }
};
