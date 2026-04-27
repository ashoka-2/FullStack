import mongoose, { Document, Model, Schema } from "mongoose";

export interface IColor extends Document {
    name: string;       // e.g. "Onyx Black", "Cobalt Blue"
    hexCode: string;    // e.g. "#1a1a1a"
    isActive: boolean;
}

const colorSchema = new Schema<IColor>(
    {
        name: {
            type: String,
            required: [true, "Color name is required"],
            trim: true,
            unique: true,
        },
        hexCode: {
            type: String,
            required: [true, "Hex code is required"],
            trim: true,
            match: [/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, "Invalid hex color code"],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

const colorModel: Model<IColor> = mongoose.model<IColor>("Color", colorSchema);

export default colorModel;
