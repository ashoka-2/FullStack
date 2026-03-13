import 'dotenv/config';
import app from "./src/app.js"
import { connectToDB } from "./src/config/database.js";
import { generateResponse } from './src/services/ai.service.js';

const PORT = process.env.PORT||3000 ;

connectToDB();
generateResponse();

app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
})