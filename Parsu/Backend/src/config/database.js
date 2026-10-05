import mongoose from "mongoose";

let isConnecting = false;
let retryTimer = null;

export async function connectToDB() {
    if (mongoose.connection.readyState === 1 || isConnecting) {
        return;
    }

    isConnecting = true;
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 10000,
            maxPoolSize: 50,
            minPoolSize: 10,
            socketTimeoutMS: 45000,
            maxIdleTimeMS: 30000,
        });
        console.log("✅ [Database] Connected successfully to MongoDB");
        if (retryTimer) {
            clearTimeout(retryTimer);
            retryTimer = null;
        }
    } catch (error) {
        console.error("❌ [Database] Connection error:", error?.message || error);
        
        if (
            error?.message?.includes("whitelist") ||
            error?.message?.includes("Could not connect to any servers") ||
            error?.message?.includes("buffering timed out")
        ) {
            console.error("👉 [MongoDB Atlas Action Required] Your current IP may not be whitelisted!");
            console.error("   Please open MongoDB Atlas > Network Access > IP Access List, and whitelist your current IP (or add 0.0.0.0/0).");
        }

        // Schedule auto-retry in 10 seconds
        if (!retryTimer) {
            retryTimer = setTimeout(() => {
                retryTimer = null;
                connectToDB();
            }, 10000);
        }
    } finally {
        isConnecting = false;
    }
}

mongoose.connection.on("disconnected", () => {
    console.warn("⚠️ [Database] Disconnected from MongoDB. Attempting to reconnect...");
    if (!retryTimer) {
        retryTimer = setTimeout(() => {
            retryTimer = null;
            connectToDB();
        }, 5000);
    }
});