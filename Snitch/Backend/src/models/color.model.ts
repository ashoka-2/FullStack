import mongoose, { Document, Model, Schema } from "mongoose";

export interface IColor extends Document {
    name: string;       // e.g. "Onyx Black", "Cobalt Blue"
    hexCode: string;    // e.g. "#1a1a1a"
    isActive: boolean;
    /** null = admin-created (visible to all); ObjectId = seller who created it */
    createdBy: mongoose.Types.ObjectId | null;
    /** true = visible to all sellers; false = only visible to createdBy seller */
    isPublic: boolean;
}

const colorSchema = new Schema<IColor>(
    {
        name: {
            type: String,
            required: [true, "Color name is required"],
            trim: true,
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
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        isPublic: {
            type: Boolean,
            default: false, // seller-created = private; admin sets to true
        },
    },
    { timestamps: true }
);

// Unique per (name, createdBy) — allows "Red" to exist for both admin (null) and a seller
colorSchema.index({ name: 1, createdBy: 1 }, { unique: true });
colorSchema.index({ createdBy: 1, isPublic: 1 });

const colorModel: Model<IColor> = mongoose.model<IColor>("Color", colorSchema);

export default colorModel;
