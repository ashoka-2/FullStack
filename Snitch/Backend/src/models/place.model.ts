import mongoose, { Document, Model, Schema } from "mongoose";

export interface IPlace extends Document {
    user: mongoose.Types.ObjectId;
    pincode: string;
    post: string;
    place: string;
    city: string;
    state: string;
}

const placeSchema = new Schema<IPlace>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User is required"],
            unique: true, // Ensuring a 1-to-1 normalized relationship for the profile address
        },
        pincode: {
            type: String,
            required: [true, "Pincode is required"],
            trim: true,
        },
        post: {
            type: String,
            required: [true, "Post office/area is required"],
            trim: true,
        },
        place: {
            type: String,
            required: [true, "Place/Street is required"],
            trim: true,
        },
        city: {
            type: String,
            required: [true, "City is required"],
            trim: true,
        },
        state: {
            type: String,
            required: [true, "State is required"],
            trim: true,
        },
    },
    { timestamps: true }
);

const placeModel: Model<IPlace> = mongoose.model<IPlace>("Place", placeSchema);
export default placeModel;
