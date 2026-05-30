import mongoose, { Document, Model, Schema } from "mongoose";

export interface IOrderItem {
    product: mongoose.Types.ObjectId;
    size?: mongoose.Types.ObjectId;
    color?: mongoose.Types.ObjectId;
    quantity: number;
    price: number; // Historical price at checkout
}

export interface IOrder extends Document {
    buyer: mongoose.Types.ObjectId;
    items: IOrderItem[];
    totalAmount: number;
    shippingAddress: {
        pincode: string;
        post: string;
        place: string;
        city: string;
        state: string;
    };
    contactNumber: string;
    status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
    paymentStatus: "pending" | "paid" | "failed";
}

const orderSchema = new Schema<IOrder>(
    {
        buyer: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Buyer is required"],
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
                quantity: {
                    type: Number,
                    required: [true, "Quantity is required"],
                    min: [1, "Quantity cannot be less than 1"],
                },
                price: {
                    type: Number,
                    required: [true, "Historical price is required"],
                },
            },
        ],
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
            enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
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

const orderModel: Model<IOrder> = mongoose.model<IOrder>("Order", orderSchema);
export default orderModel;
