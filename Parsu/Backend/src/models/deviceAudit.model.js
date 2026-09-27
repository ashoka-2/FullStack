import mongoose from "mongoose";

const deviceAuditSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    device: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Device",
        index: true
    },
    deviceName: {
        type: String,
        default: "Unknown Device"
    },
    platform: {
        type: String,
        default: "windows"
    },
    action: {
        type: String,
        required: true,
        index: true
    },
    tier: {
        type: String,
        enum: ["read-only", "mutating", "destructive"],
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ["pending_confirmation", "executing", "executed", "rejected", "failed", "undone"],
        default: "executing",
        index: true
    },
    details: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    result: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    executionTimeMs: {
        type: Number,
        default: 0
    },
    canUndo: {
        type: Boolean,
        default: false
    },
    undoPayload: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    undoStatus: {
        type: String,
        enum: ["none", "reverted", "failed"],
        default: "none"
    }
}, { timestamps: true });

deviceAuditSchema.index({ user: 1, createdAt: -1 });

const deviceAuditModel = mongoose.model("DeviceAudit", deviceAuditSchema);
export default deviceAuditModel;
