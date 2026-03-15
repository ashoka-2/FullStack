import {io} from "socket.io-client";

export const initializeSocketConnection = ()=>{

    const socketUrl = import.meta.env.VITE_HOST_URL;

    const socket = io(socketUrl,{
        withCredentials:true,
    })

    socket.on("connect",()=>{
        console.log("Connected to Socket.io server");
        
    })
}