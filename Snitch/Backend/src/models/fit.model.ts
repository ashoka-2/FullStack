import mongoose, { Document, Model, Schema } from "mongoose";

export interface IFit extends Document {
    name: string;       // e.g. "Slim Fit", "Regular Fit", "Oversized"
    isActive: boolean;
    createdBy: mongoose.Types.ObjectId | null;
    isPublic: boolean;
}

const fitSchema = new Schema<IFit>(
    {
        name: {
            type: String,
            required: [true, "Fit name is required"],
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

fitSchema.index({ name: 1, createdBy: 1 }, { unique: true });
fitSchema.index({ createdBy: 1, isPublic: 1 });

const fitModel: Model<IFit> = mongoose.model<IFit>("Fit", fitSchema);

export default fitModel;
