import mongoose, { Document, Model, Schema } from "mongoose";

export interface IMaterial extends Document {
    name: string;       // e.g. "100% Cotton", "Polyester Blend", "Linen"
    isActive: boolean;
}

const materialSchema = new Schema<IMaterial>(
    {
        name: {
            type: String,
            required: [true, "Material name is required"],
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

const materialModel: Model<IMaterial> = mongoose.model<IMaterial>("Material", materialSchema);

export default materialModel;
