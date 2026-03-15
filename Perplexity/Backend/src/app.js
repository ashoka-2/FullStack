import express from "express";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes.js"
import cors from "cors";
import morgan from "morgan";


const app = express();
app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.use(cors({
    origin:process.env.FRONTEND_URL,
    credentials:true,
    methods:["GET","POST","PUT","DELETE"]
}))


app.get('/',(req,res)=>{
    res.json({Message:"Welcome to Perplexity Backend API"})
})

app.use("/api/auth",authRouter)


export default app;

