/**
 * ─────────────────────────────────────────────────────────────────────────────
 * product.model.ts  —  Production-grade Mongoose Product Schema
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Design principles
 * ─────────────────
 *  • All sub-documents use explicit _id: false where an id is not needed to
 *    keep documents lean and avoid unnecessary ObjectId generation.
 *  • Variant attributes stored as a plain Map<string,string> so that dynamic
 *    option sets (colour, size, material, …) work without schema migrations.
 *  • Stock management mirrors WooCommerce: `manageStock` toggles the inventory
 *    system; `stockStatus` is the authoritative source of truth for the
 *    storefront; `stock` is a denormalised convenience field kept in sync by
 *    a pre-save hook.
 *  • Full-text index on title/description/tags powers storefront search.
 *  • Compound indexes cover every high-frequency query pattern used by the
 *    seller dashboard, admin panel, and public catalogue.
 *  • Virtual `isOnSale` and `discountPercent` are included in toJSON output
 *    so no calculation is needed in the API layer.
 *  • A static `findPublished` method is provided as a typed query shortcut.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import mongoose, {
    Document,
    Model,
    Schema,
    CallbackError,
    QueryWithHelpers,
    HydratedDocument,
} from "mongoose";
import priceSchema, { Currency, IPriceBlock } from "./price.schema.js";

// ─────────────────────────────────────────────────────────────────────────────
// TypeScript interfaces
// ─────────────────────────────────────────────────────────────────────────────

// Re-export types from price.schema so existing consumers don't break
export type { Currency, IPriceBlock } from "./price.schema.js";

export type ProductStatus = "draft" | "pending_approval" | "published" | "active" | "trash";
export type StockStatus = "instock" | "outofstock" | "onbackorder";
export type BackorderPolicy = "no" | "notify" | "yes";

export interface IImage {
    url: string;
    alt?: string;
    isPrimary?: boolean;
}

export interface IDimensions {
    length?: number;
    width?: number;
    height?: number;
    unit?: "cm" | "in";
}

export interface IVariant {
    _id?: mongoose.Types.ObjectId;
    /** Variant-specific images shown when this variant is selected */
    images: IImage[];
    /**
     * Flat key→value map of attribute selections for this variant.
     * e.g. { color: "Red", size: "M" }
     * Keys should match the `name` (lowercase) of a globalAttribute.
     */
    attributes: Map<string, string>;
    price?: IPriceBlock;
    sku?: string;
    /** Available stock units for this specific variant */
    stock: number;
    stockStatus?: StockStatus;
    /** If true this variant is not shown on the storefront */
    isEnabled: boolean;
    weight?: number;
    dimensions?: IDimensions;
}

export interface IGlobalAttribute {
    /**
     * The canonical display name of the attribute, e.g. "Color", "Size".
     * The variant attribute map keys are the lowercase version of this name.
     */
    name: string;
    /** All possible option values for this attribute */
    options: string[];
    /** Show on the product page even when not used for variation */
    visible: boolean;
    /** Whether this attribute is used to define product variants */
    variation: boolean;
}

export interface IDownloadableFile {
    name: string;
    url: string;
    downloadLimit?: number;  // -1 = unlimited
    downloadExpiry?: number; // days after purchase, -1 = unlimited
}

export interface IProductMethods {
    /** Returns true when the current time falls within an active sale window */
    isCurrentlyOnSale(): boolean;
    /** Recalculates and saves the denormalised stock field from variants */
    syncStock(): Promise<void>;
}

export interface IProductStatics {
    /**
     * Typed shortcut: returns a query pre-filtered to published/active
     * products for a given seller.  Call .lean() / .exec() as needed.
     */
    findBySeller(
        sellerId: mongoose.Types.ObjectId | string,
        statusFilter?: ProductStatus[]
    ): QueryWithHelpers<
        HydratedDocument<IProduct>[],
        HydratedDocument<IProduct>
    >;

    /** Returns a query pre-filtered to all storefront-visible products */
    findPublished(): QueryWithHelpers<
        HydratedDocument<IProduct>[],
        HydratedDocument<IProduct>
    >;
}

export interface IProduct extends Document, IProductMethods {
    // ── Core identity ─────────────────────────────────────────────────
    title: string;
    slug: string;
    description: string;
    shortDescription?: string;
    seller: mongoose.Types.ObjectId;
    status: ProductStatus;
    menuOrder: number;

    // ── Taxonomy & relations ──────────────────────────────────────────
    category: mongoose.Types.ObjectId;     // primary category (legacy)
    categories: mongoose.Types.ObjectId[]; // all applicable categories
    brand?: mongoose.Types.ObjectId;
    unit?: mongoose.Types.ObjectId;
    tags: string[];

    // ── Clothing / fashion attributes (ObjectId refs) ─────────────────
    sizes: mongoose.Types.ObjectId[];
    colors: mongoose.Types.ObjectId[];
    patterns: mongoose.Types.ObjectId[];
    fits: mongoose.Types.ObjectId[];
    materials: mongoose.Types.ObjectId[];
    collars: mongoose.Types.ObjectId[];

    // ── WooCommerce General tab ───────────────────────────────────────
    sku?: string;
    price: IPriceBlock;
    isVirtual: boolean;
    isDownloadable: boolean;
    downloadable?: IDownloadableFile[];

    // ── WooCommerce Inventory tab ─────────────────────────────────────
    manageStock: boolean;
    stockQuantity: number;   // canonical managed inventory count
    stockStatus: StockStatus;
    allowBackorders: BackorderPolicy;
    soldIndividually: boolean;
    /** Denormalised convenience field — sum of all variant stocks or stockQuantity */
    stock: number;
    lowStockThreshold?: number;

    // ── WooCommerce Shipping tab ──────────────────────────────────────
    weight?: number;
    weightUnit?: "kg" | "g" | "lb" | "oz";
    dimensions?: IDimensions;
    shippingClass?: mongoose.Types.ObjectId;
    requiresShipping: boolean;

    // ── WooCommerce Linked products tab ──────────────────────────────
    upSells: mongoose.Types.ObjectId[];
    crossSells: mongoose.Types.ObjectId[];

    // ── WooCommerce Attributes tab ────────────────────────────────────
    globalAttributes: IGlobalAttribute[];

    // ── WooCommerce Advanced tab ──────────────────────────────────────
    purchaseNote?: string;
    enableReviews: boolean;
    reviewCount: number;
    averageRating: number;
    showSizeChart?: boolean;

    // ── Media ─────────────────────────────────────────────────────────
    featuredImage?: string;
    productGallery: string[];
    images: IImage[];

    // ── Variants ──────────────────────────────────────────────────────
    variants: IVariant[];

    // ── Virtuals (populated by Mongoose, not stored in DB) ───────────
    isOnSale: boolean;
    discountPercent: number;
}

export type ProductModel = Model<IProduct, Record<string, never>, IProductMethods> & IProductStatics;

// ─────────────────────────────────────────────────────────────────────────────
// Sub-schemas
// ─────────────────────────────────────────────────────────────────────────────

const imageSchema = new Schema<IImage>(
    {
        url: { type: String, required: true, trim: true },
        alt: { type: String, trim: true },
        isPrimary: { type: Boolean, default: false },
    },
    { _id: false }
);

// priceSchema is now imported from ./price.schema.ts

const dimensionsSchema = new Schema<IDimensions>(
    {
        length: { type: Number, min: 0 },
        width: { type: Number, min: 0 },
        height: { type: Number, min: 0 },
        unit: { type: String, enum: ["cm", "in"], default: "cm" },
    },
    { _id: false }
);

const downloadableFileSchema = new Schema<IDownloadableFile>(
    {
        name: { type: String, required: true, trim: true },
        url: { type: String, required: true, trim: true },
        downloadLimit: { type: Number, default: -1 },
        downloadExpiry: { type: Number, default: -1 },
    },
    { _id: false }
);

const variantSchema = new Schema<IVariant>(
    {
        images: { type: [imageSchema], default: [] },
        /**
         * Flat key→value map of attribute selections.
         * Mongoose serialises Map to a plain JSON object: { color: "Red" }.
         * On the frontend, read with Object.entries(v.attributes) — never
         * assume instanceof Map because JSON transport strips that.
         */
        attributes: {
            type: Map,
            of: String,
            default: {},
        },
        price: { type: priceSchema },
        sku: {
            type: String,
            trim: true,
            sparse: true,
        },
        stock: {
            type: Number,
            default: 0,
            min: [0, "Variant stock cannot be negative"],
        },
        stockStatus: {
            type: String,
            enum: ["instock", "outofstock", "onbackorder"],
        },
        isEnabled: { type: Boolean, default: true },
        weight: { type: Number, min: 0 },
        dimensions: { type: dimensionsSchema },
    },
    {
        _id: true, // variants need their own _id for cart & order references
        timestamps: false,
    }
);

const globalAttributeSchema = new Schema<IGlobalAttribute>(
    {
        name: {
            type: String,
            required: [true, "Attribute name is required"],
            trim: true,
        },
        options: {
            type: [{ type: String, trim: true }],
            default: [],
        },
        visible: { type: Boolean, default: true },
        variation: { type: Boolean, default: true },
    },
    { _id: true }
);

// ─────────────────────────────────────────────────────────────────────────────
// Main product schema
// ─────────────────────────────────────────────────────────────────────────────

const productSchema = new Schema<IProduct, ProductModel, IProductMethods>(
    {
        // ── Core identity ────────────────────────────────────────────────────
        title: {
            type: String,
            required: [true, "Product title is required"],
            trim: true,
            maxlength: [300, "Title must be 300 characters or fewer"],
        },
        slug: {
            type: String,
            trim: true,
            lowercase: true,
            index: true,
            // auto-generated in pre-save hook if not provided
        },
        description: {
            type: String,
            required: [true, "Description is required"],
        },
        shortDescription: {
            type: String,
            maxlength: [500, "Short description must be 500 characters or fewer"],
        },
        seller: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Seller is required"],
            index: true,
        },
        status: {
            type: String,
            enum: ["draft", "pending_approval", "published", "active", "trash"],
            default: "draft",
            index: true,
        },
        menuOrder: { type: Number, default: 0, index: true },

        // ── Taxonomy & relations ─────────────────────────────────────────────
        category: {
            type: Schema.Types.ObjectId,
            ref: "Category",
            required: [true, "Primary category is required"],
        },
        categories: [{ type: Schema.Types.ObjectId, ref: "Category" }],
        brand: { type: Schema.Types.ObjectId, ref: "Brand", default: null },
        unit: { type: Schema.Types.ObjectId, ref: "Unit", default: null },
        tags: [{ type: String, trim: true, lowercase: true }],

        // ── Fashion / clothing attribute refs ────────────────────────────────
        sizes: [{ type: Schema.Types.ObjectId, ref: "Size" }],
        colors: [{ type: Schema.Types.ObjectId, ref: "Color" }],
        patterns: [{ type: Schema.Types.ObjectId, ref: "Pattern" }],
        fits: [{ type: Schema.Types.ObjectId, ref: "Fit" }],
        materials: [{ type: Schema.Types.ObjectId, ref: "Material" }],
        collars: [{ type: Schema.Types.ObjectId, ref: "Collar" }],

        // ── Pricing & type flags ─────────────────────────────────────────────
        sku: {
            type: String,
            trim: true,
            uppercase: true,
            // uniqueness enforced by productSchema.index({ sku: 1 }, { unique: true, sparse: true }) below
        },
        price: { type: priceSchema, required: true },
        isVirtual: { type: Boolean, default: false },
        isDownloadable: { type: Boolean, default: false },
        downloadable: { type: [downloadableFileSchema], default: [] },

        // ── Inventory ────────────────────────────────────────────────────────
        manageStock: { type: Boolean, default: true },
        stockQuantity: {
            type: Number,
            default: 0,
            min: [0, "Stock quantity cannot be negative"],
        },
        stockStatus: {
            type: String,
            enum: ["instock", "outofstock", "onbackorder"],
            default: "instock",
        },
        allowBackorders: {
            type: String,
            enum: ["no", "notify", "yes"],
            default: "no",
        },
        soldIndividually: { type: Boolean, default: false },
        stock: {
            type: Number,
            default: 0,
            min: [0, "Stock cannot be negative"],
        },
        lowStockThreshold: { type: Number, min: 0 },

        // ── Shipping ─────────────────────────────────────────────────────────
        weight: { type: Number, min: 0 },
        weightUnit: {
            type: String,
            enum: ["kg", "g", "lb", "oz"],
            default: "g",
        },
        dimensions: { type: dimensionsSchema },
        shippingClass: {
            type: Schema.Types.ObjectId,
            ref: "ShippingClass",
            default: null,
        },
        requiresShipping: { type: Boolean, default: true },

        // ── Linked products ──────────────────────────────────────────────────
        upSells: [{ type: Schema.Types.ObjectId, ref: "Product" }],
        crossSells: [{ type: Schema.Types.ObjectId, ref: "Product" }],

        // ── Attributes (WooCommerce-style global attribute definitions) ───────
        globalAttributes: { type: [globalAttributeSchema], default: [] },

        // ── Advanced ─────────────────────────────────────────────────────────
        purchaseNote: { type: String, trim: true },
        enableReviews: { type: Boolean, default: true },
        reviewCount: { type: Number, default: 0, min: 0 },
        averageRating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
            set: (v: number) => Math.round(v * 10) / 10, // always 1 decimal place
        },
        showSizeChart: { type: Boolean, default: false },

        // ── Media ────────────────────────────────────────────────────────────
        featuredImage: { type: String, trim: true },
        productGallery: [{ type: String, trim: true }],
        images: { type: [imageSchema], default: [] },

        // ── Variants ─────────────────────────────────────────────────────────
        variants: { type: [variantSchema], default: [] },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
        // Optimistic concurrency — prevents race conditions on stock updates
        optimisticConcurrency: true,
    }
);

// ─────────────────────────────────────────────────────────────────────────────
// Virtuals
// ─────────────────────────────────────────────────────────────────────────────

productSchema.virtual("isOnSale").get(function (this: IProduct): boolean {
    const { amount, saleAmount, saleDateFrom, saleDateTo } = this.price;
    if (!saleAmount || saleAmount >= amount) return false;
    if (!saleDateFrom && !saleDateTo) return true;
    const now = new Date();
    const afterStart = saleDateFrom ? now >= saleDateFrom : true;
    const beforeEnd = saleDateTo ? now <= saleDateTo : true;
    return afterStart && beforeEnd;
});

productSchema.virtual("discountPercent").get(function (this: IProduct): number {
    const { amount, saleAmount } = this.price;
    if (!saleAmount || saleAmount >= amount || amount === 0) return 0;
    return Math.round(((amount - saleAmount) / amount) * 100);
});

// ─────────────────────────────────────────────────────────────────────────────
// Instance methods
// ─────────────────────────────────────────────────────────────────────────────

productSchema.methods.isCurrentlyOnSale = function (this: IProduct): boolean {
    return this.isOnSale as unknown as boolean;
};

productSchema.methods.syncStock = async function (this: IProduct): Promise<void> {
    if (this.variants.length > 0) {
        this.stock = this.variants
            .filter((v) => v.isEnabled)
            .reduce((sum, v) => sum + (v.stock ?? 0), 0);
    } else {
        this.stock = this.stockQuantity;
    }
    this.stockStatus =
        this.stock > 0
            ? "instock"
            : this.allowBackorders !== "no"
            ? "onbackorder"
            : "outofstock";
    await this.save();
};

// ─────────────────────────────────────────────────────────────────────────────
// Static methods
// ─────────────────────────────────────────────────────────────────────────────

productSchema.statics.findBySeller = function (
    sellerId: mongoose.Types.ObjectId | string,
    statusFilter: ProductStatus[] = ["active", "published", "draft", "pending_approval"]
) {
    return this.find({ seller: sellerId, status: { $in: statusFilter } });
};

productSchema.statics.findPublished = function () {
    return this.find({ status: { $in: ["published", "active"] } });
};

// ─────────────────────────────────────────────────────────────────────────────
// Pre-save middleware
// ─────────────────────────────────────────────────────────────────────────────

productSchema.pre("save", async function (this: IProduct) {
    // 1. Auto-generate slug from title if not set or title changed
    if (!this.slug || this.isModified("title")) {
        this.slug = (this.title ?? "")
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .trim()
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .substring(0, 120);
    }

    // 2. Sync denormalised stock
    if (this.variants.length > 0) {
        this.stock = this.variants
            .filter((v) => v.isEnabled)
            .reduce((sum, v) => sum + (v.stock ?? 0), 0);
    } else if (this.isModified("stockQuantity")) {
        this.stock = this.stockQuantity;
    }

    // 3. Derive stockStatus from stock + backorder policy
    if (this.manageStock) {
        if (this.stock > 0) {
            this.stockStatus = "instock";
        } else if (this.allowBackorders !== "no") {
            this.stockStatus = "onbackorder";
        } else {
            this.stockStatus = "outofstock";
        }
    }

    // 4. Virtual products never require shipping
    if (this.isVirtual) {
        this.requiresShipping = false;
    }

    // 5. Ensure `categories` always contains the primary `category`
    const catId = this.category?.toString();
    if (catId && !this.categories.map((c) => c.toString()).includes(catId)) {
        this.categories.push(this.category);
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// Indexes — ordered by query frequency (most-used first)
// ─────────────────────────────────────────────────────────────────────────────

// Seller dashboard — list products by seller and status
productSchema.index({ seller: 1, status: 1, createdAt: -1 });

// Admin panel — filter by status and sort by newest
productSchema.index({ status: 1, createdAt: -1 });

// Catalogue pages — filter by category and status, sort by newest or menuOrder
productSchema.index({ categories: 1, status: 1, createdAt: -1 });
productSchema.index({ categories: 1, status: 1, menuOrder: 1 });

// Primary category (legacy field) queries
productSchema.index({ category: 1, status: 1 });

// Brand filter pages
productSchema.index({ brand: 1, status: 1, createdAt: -1 });

// Slug lookup (unique per seller to allow identical names across shops)
productSchema.index({ slug: 1, seller: 1 }, { unique: true, sparse: true });

// SKU lookup (globally unique when set)
productSchema.index({ sku: 1 }, { unique: true, sparse: true });

// Sale items (homepage "on sale" section)
productSchema.index({ "price.saleAmount": 1, status: 1 });

// Low stock alerts in seller dashboard
productSchema.index({ seller: 1, stock: 1, status: 1 });

// General latest-products sort
productSchema.index({ createdAt: -1 });

// Full-text search (storefront search bar)
productSchema.index(
    { title: "text", description: "text", tags: "text", shortDescription: "text" },
    {
        weights: { title: 10, tags: 6, shortDescription: 3, description: 1 },
        name: "product_text_search",
        default_language: "english",
    }
);

// ─────────────────────────────────────────────────────────────────────────────
// Model export
// ─────────────────────────────────────────────────────────────────────────────

const productModel: ProductModel = mongoose.model<IProduct, ProductModel>(
    "Product",
    productSchema
);

export default productModel;
