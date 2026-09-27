import mongoose from "mongoose";

const deviceMacroSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    targetDevice: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Device",
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 120
    },
    description: {
        type: String,
        default: ""
    },
    steps: [{
        action: { type: String, required: true },
        target: { type: String, default: "" },
        params: { type: mongoose.Schema.Types.Mixed, default: {} },
        delayMs: { type: Number, default: 300 }
    }],
    schedule: {
        enabled: { type: Boolean, default: false },
        type: { type: String, enum: ["manual", "interval", "cron"], default: "manual" },
        intervalMinutes: { type: Number, default: 60 },
        cronExpression: { type: String, default: "" },
        nextRunAt: { type: Date, default: null }
    },
    lastRunAt: {
        type: Date,
        default: null
    },
    runCount: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

const deviceMacroModel = mongoose.model("DeviceMacro", deviceMacroSchema);
export default deviceMacroModel;
