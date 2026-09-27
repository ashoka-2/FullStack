import mongoose from "mongoose";

const deviceSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    deviceType: {
        type: String,
        enum: ["desktop", "mobile", "tablet", "browser", "iot"],
        default: "desktop"
    },
    platform: {
        type: String,
        enum: ["windows", "macos", "linux", "android", "ios", "chrome", "generic"],
        default: "windows"
    },
    // Internal-only device credential — NEVER returned in API responses or logged
    deviceSecret: {
        type: String,
        required: true,
        unique: true,
        index: true,
        select: false  // Never included in default queries
    },
    status: {
        type: String,
        enum: ["online", "offline", "busy"],
        default: "offline"
    },
    lastSeen: {
        type: Date,
        default: Date.now
    },
    capabilities: [{
        type: String,
        enum: [
            "app_control",
            "input_simulation",
            "file_system",
            "clipboard",
            "system_settings",
            "screen_capture",
            "screen_vision_ocr",
            "notifications",
            "macros",
            "browser_control",
            "accessibility",
            "telephony",
            "device_sync"
        ]
    }],
    systemInfo: {
        osVersion: { type: String, default: "" },
        hostname: { type: String, default: "" },
        cpuModel: { type: String, default: "" },
        cpuUsagePercent: { type: Number, default: 0 },
        totalMemoryBytes: { type: Number, default: 0 },
        freeMemoryBytes: { type: Number, default: 0 },
        batteryLevel: { type: Number, default: 100 },
        isCharging: { type: Boolean, default: true },
        ipAddress: { type: String, default: "" },
        activeWindow: { type: String, default: "" },
        displaysCount: { type: Number, default: 1 },
        resolution: { type: String, default: "1920x1080" }
    },
    systemMetrics: {
        cpuUsagePercent: { type: Number, default: 0 },
        ramUsageMb: { type: Number, default: 0 },
        batteryPercent: { type: Number, default: 100 },
        isCharging: { type: Boolean, default: true }
    },
    localServiceUrl: {
        type: String,
        default: ""
    },
    isTrusted: {
        type: Boolean,
        default: true
    },
    // Session permission flag allowing mutating actions without repeated prompts
    sessionApprovedMutating: {
        type: Boolean,
        default: false
    },
    isDefault: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

deviceSchema.index({ user: 1, status: 1 });
deviceSchema.index({ user: 1, platform: 1, deviceType: 1 });

// Never expose deviceSecret in JSON output
deviceSchema.methods.toSafeJSON = function () {
    const obj = this.toObject();
    delete obj.deviceSecret;
    return obj;
};

const deviceModel = mongoose.model("Device", deviceSchema);
export default deviceModel;
