import crypto from "crypto";
import { getIO } from "../../sockets/server.socket.js";

/**
 * Companion relay.
 * The Parsu desktop companion (Backend/src/companion) connects with a JWT, joins the room
 * `companion:<userId>` and executes actions locally. When the backend runs somewhere that is
 * NOT the user's PC (deployed), the orchestrator forwards desktop actions here, so a phone
 * or any other browser logged in with the same account can drive the desktop.
 */
const pending = new Map();

export const companionRelayService = {
    async isOnline(userId) {
        try {
            const sockets = await getIO().in(`companion:${userId}`).fetchSockets();
            return sockets.length > 0;
        } catch {
            return false;
        }
    },

    async execute(userId, action, params = {}, timeoutMs = 45000) {
        if (!(await this.isOnline(userId))) {
            throw new Error(
                "Your desktop companion is offline. Start the Parsu desktop companion on your PC (signed in with the same account) to control it remotely."
            );
        }
        const commandId = crypto.randomUUID();
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                pending.delete(commandId);
                reject(new Error("Desktop companion did not respond in time."));
            }, timeoutMs);
            pending.set(commandId, { resolve, reject, timer, userId: String(userId) });
            getIO().to(`companion:${userId}`).emit("companion:execute", { commandId, action, params });
        });
    },

    /** Called from the socket layer when the companion reports back. */
    resolveResult(userId, { commandId, success, result, error }) {
        const entry = pending.get(commandId);
        if (!entry || entry.userId !== String(userId)) return;
        clearTimeout(entry.timer);
        pending.delete(commandId);
        if (success) entry.resolve(result);
        else entry.reject(new Error(error || "Companion action failed"));
    }
};
