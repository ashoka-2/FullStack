import mongoose, { Document, Model, Schema } from "mongoose";

// Define the Product interface
export interface IProduct extends Document {
    title: string;
    description: string;
    seller: mongoose.Types.ObjectId;
    price: {
        amount: number;
        currency: "USD" | "EUR" | "GBP" | "JPY" | "INR";
    };
    images: {
        url: string;
    }[];
}

// Define the Schema
const productSchema = new Schema<IProduct>(
    {
        title: {
            type: String,
            required: [true, "Title is required"],
            trim: true,
        },
        description: {
            type: String,
            required: [true, "Description is required"],
        },
        seller: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Seller is required"],
        },
        price: {
            amount: {
                type: Number,
                required: [true, "Price amount is required"],
            },
            currency: {
                type: String,
                enum: ["USD", "EUR", "GBP", "JPY", "INR"],
                default: "INR",
            },
        },
        images: [
            {
                url: {
                    type: String,
                    required: [true, "Image URL is required"],
                },
            },
        ],
    },
    { timestamps: true }
);

// Create the model
const productModel: Model<IProduct> = mongoose.model<IProduct>("Product", productSchema);

export default productModel;
