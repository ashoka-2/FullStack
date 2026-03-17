import express from "express";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes.js"
import cors from "cors";
import morgan from "morgan";
import chatRouter from "./routes/chat.routes.js";

const app = express();

// 1. CORS at the very top (Security Requirement)
app.use(cors({
    origin: ['https://perplexity-cohort.vercel.app',"http://localhost:5173",process.env.FRONTEND_URL],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.json({ Message: "Welcome to Perplexity Backend API" })
})

app.use("/api/auth", authRouter)
app.use("/api/chats", chatRouter)

export default app;
