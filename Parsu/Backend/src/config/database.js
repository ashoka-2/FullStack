import mongoose from "mongoose";

export async function connectToDB(){
    try{

        await mongoose.connect(process.env.MONGODB_URI)
        .then(()=>{
            console.log("Connected to database");
            
        })

    }catch(error){
        console.log("Database connection error",error);
        
    }
}