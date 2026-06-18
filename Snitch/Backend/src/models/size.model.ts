import mongoose, { Document, Model, Schema } from "mongoose";

export interface ISize extends Document {
    name: string;                               // e.g. "S", "M", "32"
    category?: mongoose.Types.ObjectId;         // optional Category ref
    sortOrder: number;                          // for display ordering
    isActive: boolean;
    /** null = admin-created (global); ObjectId = seller who created it */
    createdBy: mongoose.Types.ObjectId | null;
    /** true = visible to all sellers */
    isPublic: boolean;
}

const sizeSchema = new Schema<ISize>(
    {
        name: {
            type: String,
            required: [true, "Size name is required"],
            trim: true,
        },
        category: {
            type: Schema.Types.ObjectId,
            ref: "Category",
            default: null,
        },
        sortOrder: {
            type: Number,
            default: 0,
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

// Unique per (name, createdBy) scope
sizeSchema.index({ name: 1, createdBy: 1 }, { unique: true });
sizeSchema.index({ createdBy: 1, isPublic: 1 });

const sizeModel: Model<ISize> = mongoose.model<ISize>("Size", sizeSchema);

export default sizeModel;
