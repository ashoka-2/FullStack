import mongoose, { Document, Model, Schema } from "mongoose";

export interface ICollar extends Document {
    name: string;       // e.g. "Round Neck", "V-Neck", "Polo", "Mandarin"
    isActive: boolean;
}

const collarSchema = new Schema<ICollar>(
    {
        name: {
            type: String,
            required: [true, "Collar name is required"],
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

const collarModel: Model<ICollar> = mongoose.model<ICollar>("Collar", collarSchema);

export default collarModel;
