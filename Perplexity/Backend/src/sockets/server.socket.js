import {Server} from "socket.io";

let io;
export function initSocket(httpServer){
    io = new Server(httpServer,{
        cors:{
            origin: ["https://perplexity-cohort.vercel.app", "http://localhost:5173", "http://127.0.0.1:5173", process.env.FRONTEND_URL].filter(Boolean),
            credentials:true
        }
    })

    console.log("Socket.io server is Running...")

    io.on("connection",(socket)=>{
        console.log("A user connected: "+socket.id);

        
    })

}


export function getIO(){
    if(!io){
        throw new Error("Socket.io not initialized");
    }

    return io;
}
