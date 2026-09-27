import mongoose from "mongoose";

const platformSettingsSchema = new mongoose.Schema({
    siteName: { type: String, default: "Parsu AI" },
    supportEmail: { type: String, default: "support@parsuai.com" },
    maintenanceMode: { type: Boolean, default: false },
    allowUserRegistration: { type: Boolean, default: true },
    defaultUserPlan: { type: String, enum: ["free", "pro", "ultra"], default: "free" },
    maxUploadSizeMB: { type: Number, default: 50 },
    allowedFileFormats: { 
        type: [String], 
        default: ["jpg", "jpeg", "png", "webp", "gif", "mp4", "mov", "pdf", "docx", "csv", "txt"] 
    },
    defaultAiModel: { type: String, default: "gemini-3.6-flash" },
    defaultAiTemperature: { type: Number, default: 0.7 },
    safetyFilterLevel: { type: String, enum: ["strict", "moderate", "permissive"], default: "moderate" },
    enablePublicPricing: { type: Boolean, default: true }
}, { timestamps: true });

const PlatformSettings = mongoose.model("PlatformSettings", platformSettingsSchema);
export default PlatformSettings;
