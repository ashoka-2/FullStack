import mongoose, { Document, Model, Schema } from "mongoose";

export interface ICategory extends Document {
    name: string;
    slug: string;          // URL-safe auto-generated from name
    description?: string;
    image?: string;        // ImageKit CDN URL
    isActive: boolean;
    createdBy: mongoose.Types.ObjectId | null;
    isPublic: boolean;
}

const categorySchema = new Schema<ICategory>(
    {
        name: {
            type: String,
            required: [true, "Category name is required"],
            trim: true,
        },
        slug: {
            type: String,
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
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        isPublic: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// Scoped uniqueness: name + createdBy
categorySchema.index({ name: 1, createdBy: 1 }, { unique: true });
categorySchema.index({ slug: 1, createdBy: 1 }, { unique: true, sparse: true });
categorySchema.index({ createdBy: 1, isPublic: 1 });

// Auto-generate slug from name before saving
categorySchema.pre("save", async function () {
    if (this.isModified("name")) {
        const base = this.name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-");
        // Append seller suffix to avoid slug collision across sellers
        const suffix = this.createdBy ? `-${this.createdBy.toString().slice(-4)}` : "";
        this.slug = base + suffix;
    }
});

const categoryModel: Model<ICategory> = mongoose.model<ICategory>("Category", categorySchema);

export default categoryModel;
