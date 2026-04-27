import mongoose, { Document, Model, Schema } from "mongoose";


export interface IBrand extends Document {
    name: string;
    logo?: string;          // ImageKit CDN URL for brand logo
    description?: string;
    website?: string;
    isActive: boolean;
}

const brandSchema = new Schema<IBrand>(
    {
        name: {
            type: String,
            required: [true, "Brand name is required"],
            trim: true,
            unique: true,
        },
        logo: {
            type: String,
        },
        description: {
            type: String,
            trim: true,
        },
        website: {
            type: String,
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

const brandModel: Model<IBrand> = mongoose.model<IBrand>("Brand", brandSchema);

export default brandModel;
