import mongoose, { Document, Model, Schema } from "mongoose";

export interface IBrand extends Document {
    name: string;
    logo?: string;          // ImageKit CDN URL for brand logo
    description?: string;
    website?: string;
    isActive: boolean;
    createdBy: mongoose.Types.ObjectId | null;
    isPublic: boolean;
}

const brandSchema = new Schema<IBrand>(
    {
        name: {
            type: String,
            required: [true, "Brand name is required"],
            trim: true,
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
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        isPublic: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

brandSchema.index({ name: 1, createdBy: 1 }, { unique: true });
brandSchema.index({ createdBy: 1, isPublic: 1 });

const brandModel: Model<IBrand> = mongoose.model<IBrand>("Brand", brandSchema);

export default brandModel;
