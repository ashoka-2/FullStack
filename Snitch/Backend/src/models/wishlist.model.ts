import mongoose, { Document, Model, Schema } from "mongoose";

export interface IWishlist extends Document {
    user: mongoose.Types.ObjectId;
    products: mongoose.Types.ObjectId[];
}

const wishlistSchema = new Schema<IWishlist>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User is required"],
            unique: true,
        },
        products: [
            {
                type: Schema.Types.ObjectId,
                ref: "Product",
            },
        ],
    },
    { timestamps: true }
);

const wishlistModel: Model<IWishlist> = mongoose.model<IWishlist>("Wishlist", wishlistSchema);
export default wishlistModel;
