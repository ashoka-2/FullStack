import mongoose from "mongoose";

const contactSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name is required"],
        trim: true
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        trim: true,
        lowercase: true
    },
    subject: {
        type: String,
        default: "General Inquiry",
        trim: true
    },
    message: {
        type: String,
        required: [true, "Message is required"],
        trim: true
    },
    status: {
        type: String,
        enum: ["new", "read", "replied"],
        default: "new"
    },
    adminNotes: {
        type: String,
        default: ""
    }
}, { timestamps: true });

const ContactMessage = mongoose.model("ContactMessage", contactSchema);

export default ContactMessage;
