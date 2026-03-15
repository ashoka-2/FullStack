import 'dotenv/config';
import app from "./src/app.js"
import { connectToDB } from "./src/config/database.js";
// import { generateResponse } from './src/services/ai.service.js';
import http from 'http';
import { initSocket } from './src/sockets/server.socket.js';

const PORT = process.env.PORT||3000 ;

const httpServer = http.createServer(app);
initSocket(httpServer);


connectToDB();
// generateResponse();

httpServer.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
})