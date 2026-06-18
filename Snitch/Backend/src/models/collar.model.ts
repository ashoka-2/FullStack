import mongoose, { Document, Model, Schema } from "mongoose";

export interface ICollar extends Document {
    name: string;       // e.g. "Round Neck", "V-Neck", "Polo", "Mandarin"
    isActive: boolean;
    createdBy: mongoose.Types.ObjectId | null;
    isPublic: boolean;
}

const collarSchema = new Schema<ICollar>(
    {
        name: {
            type: String,
            required: [true, "Collar name is required"],
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

collarSchema.index({ name: 1, createdBy: 1 }, { unique: true });
collarSchema.index({ createdBy: 1, isPublic: 1 });

const collarModel: Model<ICollar> = mongoose.model<ICollar>("Collar", collarSchema);

export default collarModel;
