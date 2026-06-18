import mongoose, { Document, Model, Schema } from "mongoose";

export interface ICartItem {
    _id?: mongoose.Types.ObjectId;
    product: mongoose.Types.ObjectId;
    size?: mongoose.Types.ObjectId;
    color?: mongoose.Types.ObjectId;
    variantId?: mongoose.Types.ObjectId;
    selectedAttributes?: Map<string, string>;
    quantity: number;
}

export interface ICart extends Document {
    user: mongoose.Types.ObjectId;
    items: ICartItem[];
}

const cartSchema = new Schema<ICart>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User is required"],
            unique: true,
        },
        items: [
            {
                product: {
                    type: Schema.Types.ObjectId,
                    ref: "Product",
                    required: [true, "Product is required"],
                },
                size: {
                    type: Schema.Types.ObjectId,
                    ref: "Size",
                    default: null,
                },
                color: {
                    type: Schema.Types.ObjectId,
                    ref: "Color",
                    default: null,
                },
                variantId: {
                    type: Schema.Types.ObjectId,
                    default: null,
                },
                selectedAttributes: {
                    type: Map,
                    of: String,
                    default: {},
                },
                quantity: {
                    type: Number,
                    required: [true, "Quantity is required"],
                    min: [1, "Quantity cannot be less than 1"],
                    default: 1,
                },
            },
        ],
    },
    { timestamps: true }
);

const cartModel: Model<ICart> = mongoose.model<ICart>("Cart", cartSchema);
export default cartModel;
