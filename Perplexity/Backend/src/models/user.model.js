import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
    username:{
        type:String,
        required:[true,"Username is required"],
        unique:[true,"Username already exists"],
        trim:true,
    },
    email:{
        type:String,
        unique:[true,"Email already exists"],
        required:[true,"Email is required"],
        trim:true,
        lowercase:true
    },
    alternateEmails: [{
        type: String,
        trim: true,
        lowercase: true
    }],
    password:{
        type:String,
        select:false,
        // Not required — Google OAuth users won't have a password
    },
    googleId:{
        type:String,
        unique:true,
        sparse:true, // Allows multiple null values (for non-Google users)
    },
    authProvider:{
        type:String,
        enum:["local","google"],
        default:"local"
    },
    profilePic:{
        type:String,
        default:"https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png",
    },
    verified:{
        type:Boolean,
        default:false
    },
    resetPasswordOtp: {
        type: String,
        select: false,
    },
    resetPasswordOtpExpires: {
        type: Date,
        select: false,
    },
    // Custom Gemini API key for backwards compatibility
    geminiApiKey:{
        type:String,
        select:false
    },
    preferredModel:{
        type:String,
        default:""
    },
    customApiKeys: [{
        provider: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            default: ""
        },
        apiKey: {
            type: String,
            required: true,
            select: false
        },
        maskedKey: {
            type: String,
            default: ""
        },
        baseUrl: {
            type: String,
            default: ""
        },
        models: [{
            id: { type: String, required: true },
            name: { type: String, default: "" },
            description: { type: String, default: "" },
            contextLength: { type: Number, default: 0 }
        }],
        isActive: {
            type: Boolean,
            default: true
        },
        lastTested: {
            type: Date,
            default: Date.now
        }
    }],
    selectedModel: {
        provider: { type: String, default: "gemini" },
        modelId: { type: String, default: "gemini-2.5-flash" },
        modelName: { type: String, default: "Gemini 2.5 Flash" }
    }
},{timestamps:true})

userSchema.pre('save',async function(){
    if(!this.isModified("password") || !this.password) return;
    this.password = await bcrypt.hash(this.password,10);
})

userSchema.methods.comparePassword = async function(candidatePassword){
    return await bcrypt.compare(candidatePassword,this.password);
}

const userModel = mongoose.model("User",userSchema);


export default userModel;