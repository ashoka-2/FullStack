import mongoose, { Document, Model, Schema } from "mongoose";

export interface IOrderSub extends Document {
    order: mongoose.Types.ObjectId;
    product: mongoose.Types.ObjectId;
    size?: mongoose.Types.ObjectId;
    color?: mongoose.Types.ObjectId;
    quantity: number;
    price: number; // Historical checkout price
}

const orderSubSchema = new Schema<IOrderSub>(
    {
        order: {
            type: Schema.Types.ObjectId,
            ref: "Order",
            required: [true, "Order reference is required"],
        },
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
        quantity: {
            type: Number,
            required: [true, "Quantity is required"],
            min: [1, "Quantity cannot be less than 1"],
        },
        price: {
            type: Number,
            required: [true, "Price is required"],
        },
    },
    { timestamps: true }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// The most critical index: every order detail fetch does find({ order: { $in: ids } })
orderSubSchema.index({ order: 1 });

const orderSubModel: Model<IOrderSub> = mongoose.model<IOrderSub>("OrderSub", orderSubSchema);
export default orderSubModel;
