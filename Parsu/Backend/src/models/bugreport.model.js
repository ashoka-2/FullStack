import mongoose from "mongoose";

const bugReportSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    title: {
        type: String,
        required: [true, "Bug title is required"],
        trim: true,
        maxlength: 200
    },
    description: {
        type: String,
        required: [true, "Bug description is required"],
        maxlength: 5000
    },
    category: {
        type: String,
        enum: ['ui', 'chat', 'auth', 'voice', 'performance', 'billing', 'other'],
        default: 'other'
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    stepsToReproduce: {
        type: String,
        default: "",
        maxlength: 3000
    },
    expectedBehavior: {
        type: String,
        default: ""
    },
    actualBehavior: {
        type: String,
        default: ""
    },
    browserInfo: {
        type: String,
        default: ""
    },
    status: {
        type: String,
        enum: ['open', 'in_progress', 'resolved', 'closed', 'wont_fix'],
        default: 'open'
    },
    adminNotes: {
        type: String,
        default: ""
    }
}, { timestamps: true });

const bugReportModel = mongoose.model("BugReport", bugReportSchema);
export default bugReportModel;
