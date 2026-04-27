import mongoose, { Document, Model, Schema } from "mongoose";


export interface IUnit extends Document {
    name: string;           // e.g. "Piece"
    abbreviation: string;   // e.g. "pc"
    description?: string;
    isActive: boolean;
}

const unitSchema = new Schema<IUnit>(
    {
        name: {
            type: String,
            required: [true, "Unit name is required"],
            trim: true,
            unique: true,
        },
        abbreviation: {
            type: String,
            required: [true, "Unit abbreviation is required"],
            trim: true,
            lowercase: true,
            unique: true,
        },
        description: {
            type: String,
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

const unitModel: Model<IUnit> = mongoose.model<IUnit>("Unit", unitSchema);

export default unitModel;
