import mongoose from "mongoose";
import { config } from "./config.js";

const connectDB = async () => {
    try {
        await mongoose.connect(config.MONGO_URI, {
            maxPoolSize: 100,    // Max concurrent DB connections
            minPoolSize: 10,     // Keep 10 connections alive in idle
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log("Connected to Database successfully");
    } catch (error) {
        console.log("error connecting to Database:", error);
        throw error;
    }
};

export default connectDB;