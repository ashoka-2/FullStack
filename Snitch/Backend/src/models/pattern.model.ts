import mongoose, { Document, Model, Schema } from "mongoose";

export interface IPattern extends Document {
    name: string;       // e.g. "Striped", "Floral", "Solid"
    isActive: boolean;
    createdBy: mongoose.Types.ObjectId | null;
    isPublic: boolean;
}

const patternSchema = new Schema<IPattern>(
    {
        name: {
            type: String,
            required: [true, "Pattern name is required"],
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

patternSchema.index({ name: 1, createdBy: 1 }, { unique: true });
patternSchema.index({ createdBy: 1, isPublic: 1 });

const patternModel: Model<IPattern> = mongoose.model<IPattern>("Pattern", patternSchema);

export default patternModel;
