import express from "express";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes.js"

const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended:true}));



app.get('/',(req,res)=>{
    res.json({Message:"Welcome to Perplexity Backend API"})
})

app.use("/api/auth",authRouter)


export default app;

