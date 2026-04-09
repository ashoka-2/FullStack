import mongoose from "mongoose";


export async function connectDB(){
    try{
        await mongoose.connect()
    }
    catch(error){
        console.log("error connecting to Database:",error);
        throw error
        
    }
} 