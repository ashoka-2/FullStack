import mongoose from "mongoose";


const messageSchema = new mongoose.Schema({
    chat:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Chat",
        required:true
    },
    content:{
        type:String,
        required:[true,"Message content is required"],
    },
    role:{
        type:String,
        enum:['user','ai'],
        required:true
    },
    file: {
        type: Object, // To store ImageKit response details like url, fileId, etc.
        default: null
    }
},{
    timestamps:true
})

const messageModel = mongoose.model('Message',messageSchema);

export default messageModel;