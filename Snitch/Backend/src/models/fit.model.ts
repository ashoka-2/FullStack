import mongoose, { Document, Model, Schema } from "mongoose";

export interface IFit extends Document {
    name: string;       // e.g. "Slim Fit", "Regular Fit", "Oversized"
    isActive: boolean;
}

const fitSchema = new Schema<IFit>(
    {
        name: {
            type: String,
            required: [true, "Fit name is required"],
            trim: true,
            unique: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

const fitModel: Model<IFit> = mongoose.model<IFit>("Fit", fitSchema);

export default fitModel;
