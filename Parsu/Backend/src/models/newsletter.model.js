import mongoose from "mongoose";

const newsletterSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        trim: true,
        lowercase: true
    },
    status: {
        type: String,
        enum: ["active", "unsubscribed"],
        default: "active"
    },
    source: {
        type: String,
        default: "website_footer"
    }
}, { timestamps: true });

const NewsletterSubscriber = mongoose.model("NewsletterSubscriber", newsletterSchema);

export default NewsletterSubscriber;
