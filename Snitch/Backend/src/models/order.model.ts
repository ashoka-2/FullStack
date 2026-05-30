import mongoose, { Document, Model, Schema } from "mongoose";

export interface IOrder extends Document {
    buyer: mongoose.Types.ObjectId;
    totalAmount: number;
    shippingAddress: {
        pincode: string;
        post: string;
        place: string;
        city: string;
        state: string;
    };
    contactNumber: string;
    status: "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "returned";
    paymentStatus: "pending" | "paid" | "failed";
}

const orderSchema = new Schema<IOrder>(
    {
        buyer: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Buyer is required"],
        },
        totalAmount: {
            type: Number,
            required: [true, "Total amount is required"],
        },
        shippingAddress: {
            pincode: { type: String, required: true },
            post: { type: String, required: true },
            place: { type: String, required: true },
            city: { type: String, required: true },
            state: { type: String, required: true },
        },
        contactNumber: {
            type: String,
            required: [true, "Contact number is required"],
        },
        status: {
            type: String,
            enum: ["pending", "processing", "shipped", "delivered", "cancelled", "returned"],
            default: "pending",
        },
        paymentStatus: {
            type: String,
            enum: ["pending", "paid", "failed"],
            default: "pending",
        },
    },
    { timestamps: true }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// getMyOrders: filter by buyer sorted newest; admin/seller listing by status
orderSchema.index({ buyer: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

const orderModel: Model<IOrder> = mongoose.model<IOrder>("Order", orderSchema);
export default orderModel;
