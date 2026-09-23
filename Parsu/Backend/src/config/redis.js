import { Redis } from "ioredis";

let redisClient = null;
let isConnected = false;

const host = process.env.REDIS_HOST || "redis-19437.crce182.ap-south-1-1.ec2.cloud.redislabs.com";
const port = parseInt(process.env.REDIS_PORT || "19437", 10);
const password = process.env.REDIS_PASSWORD || "9Qv8zCwGHBngK6yBejo62bt9M549HZRl";

try {
    redisClient = new Redis({
        host,
        port,
        password,
        maxRetriesPerRequest: 2,
        connectTimeout: 5000,
        retryStrategy: (times) => Math.min(times * 200, 10000),
        lazyConnect: false,
    });

    redisClient.on("connect", () => {
        isConnected = true;
        console.log("✅ [Redis] Connected successfully to Redis server (Parsu AI)");
    });

    redisClient.on("ready", () => {
        isConnected = true;
    });

    redisClient.on("close", () => {
        isConnected = false;
    });

    redisClient.on("error", (error) => {
        isConnected = false;
        console.warn("⚠️ [Redis] Non-fatal Redis connection issue:", error.message || error);
    });
} catch (err) {
    console.warn("⚠️ [Redis] Failed to initialize Redis client. Fallback to direct DB queries:", err.message);
    redisClient = null;
}

export const isRedisReady = () => isConnected && redisClient && redisClient.status === "ready";
export default redisClient;