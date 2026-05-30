import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import placeModel from "../models/place.model.js";

export const getPlace = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    try {
        const place = await placeModel.findOne({ user: userId });
        if (!place) {
            return res.status(200).json({ success: true, place: null });
        }
        return res.status(200).json({ success: true, place });
    } catch (error) {
        console.error("Get place error:", error);
        return res.status(500).json({ message: "Server error retrieving address" });
    }
};

export const updatePlace = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    const { pincode, post, place, city, state } = req.body;

    // Validate inputs
    if (!pincode || !post || !place || !city || !state) {
        return res.status(400).json({ message: "All address details are required" });
    }

    try {
        let address = await placeModel.findOne({ user: userId });

        if (address) {
            address.pincode = pincode;
            address.post = post;
            address.place = place;
            address.city = city;
            address.state = state;
            await address.save();
        } else {
            address = await placeModel.create({
                user: userId,
                pincode,
                post,
                place,
                city,
                state
            });
        }

        return res.status(200).json({ success: true, message: "Address updated successfully", place: address });
    } catch (error) {
        console.error("Update place error:", error);
        return res.status(500).json({ message: "Server error saving address" });
    }
};
