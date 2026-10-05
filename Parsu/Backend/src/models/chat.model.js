import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    title:{
        type:String,
        default:"New Chat",
        trim:true
    },
    isPinned: {
        type: Boolean,
        default: false
    },
    incognito: {
        type: Boolean,
        default: false
    }
},{
    timestamps:true
})

// High performance compound indexes for fast chat list queries
chatSchema.index({ user: 1, incognito: 1, updatedAt: -1 });
chatSchema.index({ user: 1, isPinned: -1, updatedAt: -1 });

const chatModel = mongoose.model('Chat',chatSchema);

export default chatModel;