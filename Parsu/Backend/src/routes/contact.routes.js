import { Router } from "express";
import ContactMessage from "../models/contact.model.js";

const contactRouter = Router();

// Public submission endpoint for contact form
contactRouter.post("/", async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: "Name, email, and message are required."
            });
        }

        const newMsg = await ContactMessage.create({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            subject: subject ? subject.trim() : "General Inquiry",
            message: message.trim()
        });

        return res.status(201).json({
            success: true,
            message: "Thank you for contacting Parsu AI. We have received your inquiry and will respond shortly!",
            data: { id: newMsg._id }
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to submit message",
            error: err.message
        });
    }
});

export default contactRouter;
