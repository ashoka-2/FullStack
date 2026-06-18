import mongoose, { Document, Model, Schema } from "mongoose";

export interface IUnit extends Document {
    name: string;           // e.g. "Piece"
    abbreviation: string;   // e.g. "pc"
    description?: string;
    isActive: boolean;
    createdBy: mongoose.Types.ObjectId | null;
    isPublic: boolean;
}

const unitSchema = new Schema<IUnit>(
    {
        name: {
            type: String,
            required: [true, "Unit name is required"],
            trim: true,
        },
        abbreviation: {
            type: String,
            required: [true, "Unit abbreviation is required"],
            trim: true,
            lowercase: true,
        },
        description: {
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

unitSchema.index({ name: 1, createdBy: 1 }, { unique: true });
unitSchema.index({ abbreviation: 1, createdBy: 1 }, { unique: true });
unitSchema.index({ createdBy: 1, isPublic: 1 });

const unitModel: Model<IUnit> = mongoose.model<IUnit>("Unit", unitSchema);

export default unitModel;
