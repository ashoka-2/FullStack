import mongoose, { Document, Model, Schema } from "mongoose";

export interface IMaterial extends Document {
    name: string;       // e.g. "100% Cotton", "Polyester Blend", "Linen"
    isActive: boolean;
    createdBy: mongoose.Types.ObjectId | null;
    isPublic: boolean;
}

const materialSchema = new Schema<IMaterial>(
    {
        name: {
            type: String,
            required: [true, "Material name is required"],
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

materialSchema.index({ name: 1, createdBy: 1 }, { unique: true });
materialSchema.index({ createdBy: 1, isPublic: 1 });

const materialModel: Model<IMaterial> = mongoose.model<IMaterial>("Material", materialSchema);

export default materialModel;
