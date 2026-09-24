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
    role:{
        type:String,
        enum:["user","admin"],
        default:"user"
    },
    isBlocked:{
        type:Boolean,
        default:false
    },
    subscription: {
        plan: {
            type: String,
            enum: ['free', 'starter', 'pro', 'enterprise'],
            default: 'free'
        },
        billingCycle: {
            type: String,
            enum: ['monthly', 'annual', 'lifetime', 'none'],
            default: 'none'
        },
        status: {
            type: String,
            enum: ['active', 'inactive', 'cancelled', 'past_due'],
            default: 'active'
        },
        startDate: { type: Date, default: Date.now },
        endDate: { type: Date },
        razorpayOrderId: { type: String, default: '' },
        razorpayPaymentId: { type: String, default: '' },
        amount: { type: Number, default: 0 },
        currency: { type: String, default: 'INR' }
    },
    usageQuotas: {
        queriesToday: { type: Number, default: 0 },
        queriesLimit: { type: Number, default: 50 }, // 50 for free, -1 for unlimited
        lastQueryReset: { type: Date, default: Date.now },
        documentUploadsToday: { type: Number, default: 0 },
        documentUploadsLimit: { type: Number, default: 2 }, // 2 for free, 50 for pro, -1 for enterprise
        socialPostsThisMonth: { type: Number, default: 0 },
        socialPostsLimit: { type: Number, default: 10 } // 10 for free, -1 for pro
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
    },

    // ── Memory System ────────────────────────────────────────────────────────
    memory: {
        enabled: { type: Boolean, default: true },
        nickname: { type: String, default: "", trim: true },
        occupation: { type: String, default: "", trim: true },
        customInstructions: { type: String, default: "", maxlength: 2000 },
        summary: { type: String, default: "" },   // AI-generated overview
        facts: [{ type: String }],                // individual facts learned
        librarySearchEnabled: { type: Boolean, default: false },
        lastUpdated: { type: Date, default: Date.now }
    },

    // ── User Preferences ─────────────────────────────────────────────────────
    preferences: {
        theme: { type: String, enum: ['system', 'light', 'dark'], default: 'system' },
        language: { type: String, default: 'en' },
        hapticFeedback: { type: Boolean, default: true },
        webSearchEnabled: { type: Boolean, default: false },
        safetyFilter: { type: Boolean, default: true },
        notifications: {
            enabled: { type: Boolean, default: true },
            aiResponse: { type: Boolean, default: true },
            systemAlerts: { type: Boolean, default: true }
        }
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