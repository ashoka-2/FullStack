import mongoose from "mongoose";
import { config } from "./config.js";

const connectDB = async () => {
    try {
        await mongoose.connect(config.MONGO_URI);
        console.log("Connected to Database successfully");
    } catch (error) {
        console.log("error connecting to Database:", error);
        throw error;
    }
};

export default connectDB;