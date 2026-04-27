import mongoose, { Document, Model, Schema } from "mongoose";

export interface ICategory extends Document {
    name: string;
    slug: string;          // URL-safe auto-generated from name
    description?: string;
    image?: string;        // ImageKit CDN URL
    isActive: boolean;
}

const categorySchema = new Schema<ICategory>(
    {
        name: {
            type: String,
            required: [true, "Category name is required"],
            trim: true,
            unique: true,
        },
        slug: {
            type: String,
            unique: true,
            lowercase: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        image: {
            type: String,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

// Auto-generate slug from name before saving
categorySchema.pre("save", async function () {
    if (this.isModified("name")) {
        this.slug = this.name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-");
    }
});

const categoryModel: Model<ICategory> = mongoose.model<ICategory>("Category", categorySchema);

export default categoryModel;
