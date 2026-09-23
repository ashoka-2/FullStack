import { Router } from "express";
import NewsletterSubscriber from "../models/newsletter.model.js";

const newsletterRouter = Router();

// Public newsletter subscription endpoint
newsletterRouter.post("/subscribe", async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || !email.includes("@")) {
            return res.status(400).json({
                success: false,
                message: "A valid email address is required."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Check if already subscribed
        let subscriber = await NewsletterSubscriber.findOne({ email: normalizedEmail });

        if (subscriber) {
            if (subscriber.status === "unsubscribed") {
                subscriber.status = "active";
                await subscriber.save();
                return res.status(200).json({
                    success: true,
                    message: "Welcome back! You have been re-subscribed to the Parsu AI newsletter."
                });
            }
            return res.status(200).json({
                success: true,
                message: "You are already subscribed to the Parsu AI newsletter!"
            });
        }

        subscriber = await NewsletterSubscriber.create({
            email: normalizedEmail,
            status: "active"
        });

        return res.status(201).json({
            success: true,
            message: "Successfully subscribed to the Parsu AI newsletter!",
            data: { email: subscriber.email }
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to subscribe to newsletter",
            error: err.message
        });
    }
});

export default newsletterRouter;
