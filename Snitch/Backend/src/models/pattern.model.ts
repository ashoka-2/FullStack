import mongoose, { Document, Model, Schema } from "mongoose";

export interface IPattern extends Document {
    name: string;       // e.g. "Striped", "Floral", "Solid"
    isActive: boolean;
}

const patternSchema = new Schema<IPattern>(
    {
        name: {
            type: String,
            required: [true, "Pattern name is required"],
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

const patternModel: Model<IPattern> = mongoose.model<IPattern>("Pattern", patternSchema);

export default patternModel;
