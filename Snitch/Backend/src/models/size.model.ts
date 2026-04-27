import mongoose, { Document, Model, Schema } from "mongoose";


export interface ISize extends Document {
    name: string;                               // e.g. "S", "M", "32"
    category?: mongoose.Types.ObjectId;         // optional Category ref
    sortOrder: number;                          // for display ordering
    isActive: boolean;
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
            default: null,   // null = applies to all categories
        },
        sortOrder: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

const sizeModel: Model<ISize> = mongoose.model<ISize>("Size", sizeSchema);

export default sizeModel;
