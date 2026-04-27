import mongoose, { Document, Model, Schema } from "mongoose";

export interface IProduct extends Document {
    title: string;
    description: string;
    seller: mongoose.Types.ObjectId;        // ref: User
    category: mongoose.Types.ObjectId;      // ref: Category  (admin-managed)
    brand?: mongoose.Types.ObjectId;        // ref: Brand     (admin-managed, optional)
    sizes: mongoose.Types.ObjectId[];       // ref: Size       (admin-managed)
    colors: mongoose.Types.ObjectId[];      // ref: Color      (admin-managed)
    unit: mongoose.Types.ObjectId;          // ref: Unit       (admin-managed)
    price: {
        amount: number;
        saleAmount?: number;
        currency: "USD" | "EUR" | "GBP" | "JPY" | "INR";
    };
    stock: number;
    sku?: string;
    weight?: number;          // grams
    status: "draft" | "active";
    images: { url: string }[];
}

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
        category: {
            type: Schema.Types.ObjectId,
            ref: "Category",
            required: [true, "Category is required"],
        },
        brand: {
            type: Schema.Types.ObjectId,
            ref: "Brand",
            default: null,
        },
        sizes: [
            {
                type: Schema.Types.ObjectId,
                ref: "Size",
            },
        ],
        colors: [
            {
                type: Schema.Types.ObjectId,
                ref: "Color",
            },
        ],
        unit: {
            type: Schema.Types.ObjectId,
            ref: "Unit",
            required: [true, "Unit is required"],
        },
        price: {
            amount: {
                type: Number,
                required: [true, "Price amount is required"],
                min: [0, "Price cannot be negative"],
            },
            saleAmount: {
                type: Number,
                min: [0, "Sale price cannot be negative"],
            },
            currency: {
                type: String,
                enum: ["USD", "EUR", "GBP", "JPY", "INR"],
                default: "INR",
            },
        },
        stock: {
            type: Number,
            required: [true, "Stock quantity is required"],
            min: [0, "Stock cannot be negative"],
            default: 0,
        },
        sku: {
            type: String,
            trim: true,
        },
        weight: {
            type: Number,
            min: [0, "Weight cannot be negative"],
        },
        status: {
            type: String,
            enum: ["draft", "active"],
            default: "active",
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

const productModel: Model<IProduct> = mongoose.model<IProduct>("Product", productSchema);

export default productModel;
