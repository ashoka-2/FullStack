import mongoose from "mongoose";

const socialConnectionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    platform: {
        type: String,
        required: true,
        enum: ["instagram", "facebook", "pinterest", "twitter", "tiktok", "linkedin", "youtube", "google", "gmail"],
        lowercase: true
    },
    // Platform-specific user ID
    platformUserId: {
        type: String,
        required: true
    },
    // Display info
    platformUsername: {
        type: String,
        default: ""
    },
    profilePicUrl: {
        type: String,
        default: ""
    },
    // Tokens (select: false for security)
    accessToken: {
        type: String,
        required: true,
        select: false
    },
    refreshToken: {
        type: String,
        select: false
    },
    tokenExpiresAt: {
        type: Date
    },
    // Scopes granted by the user
    scopes: {
        type: [String],
        default: []
    },
    isConnected: {
        type: Boolean,
        default: true
    },
    // Platform-specific extras (e.g., page ID for Facebook, board IDs for Pinterest)
    meta: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, { timestamps: true });

// Compound unique index: one connection per platform per user
socialConnectionSchema.index({ user: 1, platform: 1 }, { unique: true });

const SocialConnection = mongoose.model("SocialConnection", socialConnectionSchema);

export default SocialConnection;
