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
        type: Object, // Legacy single file support
        default: null
    },
    files: [{
        type: Object, // Multiple files (up to 10 images/videos/docs)
        default: []
    }],
    socialPosts: [{
        platform: { 
            type: String, 
            enum: ['instagram', 'facebook', 'pinterest', 'twitter', 'tiktok', 'linkedin', 'youtube'] 
        },
        mediaId: String,
        postUrl: String,
        postType: { type: String, enum: ['single', 'carousel', 'separate'], default: 'single' },
        caption: String,
        postedAt: { type: Date, default: Date.now }
    }],
    // Vector embedding for semantic search (RAG)
    embedding: {
        type: [Number],
        default: undefined,
        select: false // Don't include in normal queries to save bandwidth
    }
},{
    timestamps:true
})

const messageModel = mongoose.model('Message',messageSchema);

export default messageModel;