import mongoose, { Document, Model, Schema } from "mongoose";

/**
 * Stores a seller's size chart image.
 * One record per seller. The seller can update or delete their chart at any time.
 * Products reference their seller's size chart via the seller field.
 */
export interface ISellerSizeChart extends Document {
    seller: mongoose.Types.ObjectId;   // 1:1 with User (seller)
    imageUrl: string;                  // ImageKit CDN URL for the size chart
    label?: string;                    // optional label e.g. "Men's Apparel Size Guide"
    updatedAt: Date;
}

const sellerSizeChartSchema = new Schema<ISellerSizeChart>(
    {
        seller: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,   // one size chart per seller
        },
        imageUrl: {
            type: String,
            required: [true, "Size chart image URL is required"],
            trim: true,
        },
        label: {
            type: String,
            trim: true,
            default: "Size Chart",
        },
    },
    { timestamps: true }
);

sellerSizeChartSchema.index({ seller: 1 });

const sellerSizeChartModel: Model<ISellerSizeChart> = mongoose.model<ISellerSizeChart>(
    "SellerSizeChart",
    sellerSizeChartSchema
);

export default sellerSizeChartModel;
