import { Request, Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import productModel from "../models/product.model.js";
import { uploadFile } from "../services/imagekit.service.js";
import categoryModel from "../models/category.model.js";
import brandModel from "../models/brand.model.js";
import sizeModel from "../models/size.model.js";
import colorModel from "../models/color.model.js";
import unitModel from "../models/unit.model.js";
import patternModel from "../models/pattern.model.js";
import fitModel from "../models/fit.model.js";
import materialModel from "../models/material.model.js";
import collarModel from "../models/collar.model.js";
import redisClient from "../config/redis.js";

// Reusable populate config
const POPULATE = [
    { path: "seller", select: "fullname email profilePic" },
    { path: "category", select: "name slug" },
    { path: "brand", select: "name logo" },
    { path: "sizes", select: "name sortOrder" },
    { path: "colors", select: "name hexCode" },
    { path: "unit", select: "name abbreviation" },
    { path: "patterns", select: "name" },
    { path: "fits", select: "name" },
    { path: "materials", select: "name" },
    { path: "collars", select: "name" },
    { path: "upSells", select: "title price images stock description category brand unit" },
    { path: "crossSells", select: "title price images stock description category brand unit" },
];

// ─── Cache TTLs ─────────────────────────────────────────────────────────────
const TTL_PRODUCTS_ALL  = 5 * 60;   // 5 minutes  — product catalog
const TTL_PRODUCT_ONE   = 5 * 60;   // 5 minutes  — single product
const TTL_METADATA      = 30 * 60;  // 30 minutes — categories/brands/sizes (rarely change)

// ─── Cache Key Helpers ───────────────────────────────────────────────────────
const KEY_ALL       = "products:all:v2";
const KEY_METADATA  = "products:metadata:v2";
const keyOne = (id: string) => `products:v2:${id}`;

// ─── Cache Invalidation ──────────────────────────────────────────────────────
// Called whenever a product is created, updated, or deleted
const bustProductCache = async (id?: string) => {
    const keys = [KEY_ALL];
    if (id) keys.push(keyOne(id));
    await redisClient.del(...keys);
};

// ─────────────────────────────────────────────────────────────────────────────

export const createColor = async (req: AuthRequest, res: Response) => {
    try {
        const { name, hexCode } = req.body;
        if (!name || !hexCode) {
            return res.status(400).json({ success: false, message: "Name and hex code are required" });
        }
        // Case-insensitive check
        let color = await colorModel.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
        if (color) {
            return res.status(200).json({ success: true, message: "Color already exists", color });
        }
        color = await colorModel.create({ name, hexCode });
        
        // Bust metadata cache since a new color was added
        await redisClient.del(KEY_METADATA);
        
        return res.status(201).json({ success: true, message: "Color created successfully", color });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const getProductMetadata = async (_req: Request, res: Response) => {
    try {
        // Try cache first
        const cached = await redisClient.get(KEY_METADATA);
        if (cached) {
            return res.status(200).json(JSON.parse(cached));
        }

        const filter = { isActive: { $ne: false } };
        const [categories, brands, sizes, colors, units, patterns, fits, materials, collars] = await Promise.all([
            categoryModel.find(filter).sort({ name: 1 }),
            brandModel.find(filter).sort({ name: 1 }),
            sizeModel.find(filter).sort({ sortOrder: 1, name: 1 }),
            colorModel.find(filter).sort({ name: 1 }),
            unitModel.find(filter).sort({ name: 1 }),
            patternModel.find(filter).sort({ name: 1 }),
            fitModel.find(filter).sort({ name: 1 }),
            materialModel.find(filter).sort({ name: 1 }),
            collarModel.find(filter).sort({ name: 1 }),
        ]);

        const payload = { success: true, categories, brands, sizes, colors, units, patterns, fits, materials, collars };
        await redisClient.setex(KEY_METADATA, TTL_METADATA, JSON.stringify(payload));

        return res.status(200).json(payload);
    } catch (err) {
        console.error("Get Metadata Error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const createProduct = async (req: AuthRequest, res: Response) => {
    try {
        const {
            title,
            description,
            priceAmount,
            priceCurrency,
            saleAmount,
            category,           // ObjectId string
            brand,              // ObjectId string (optional)
            unit,               // ObjectId string
            stock,
            sku,
            weight,
            status,
        } = req.body;

        // sizes & colors come as repeated FormData keys → always normalise to array
        const sizes: string[] = Array.isArray(req.body.sizes)
            ? req.body.sizes
            : req.body.sizes ? [req.body.sizes] : [];

        const colors: string[] = Array.isArray(req.body.colors)
            ? req.body.colors
            : req.body.colors ? [req.body.colors] : [];

        const patterns: string[] = Array.isArray(req.body.patterns)
            ? req.body.patterns
            : req.body.patterns ? [req.body.patterns] : [];

        const fits: string[] = Array.isArray(req.body.fits)
            ? req.body.fits
            : req.body.fits ? [req.body.fits] : [];

        const materials: string[] = Array.isArray(req.body.materials)
            ? req.body.materials
            : req.body.materials ? [req.body.materials] : [];

        const collars: string[] = Array.isArray(req.body.collars)
            ? req.body.collars
            : req.body.collars ? [req.body.collars] : [];

        const sellerId = req.user?.id;
        if (!sellerId) {
            return res.status(401).json({ success: false, message: "Not authenticated" });
        }

        // Upload files dynamically using ImageKit (main images + variant images)
        const files = (req.files as any[]) || [];
        const fileUploads = files.map((file: any) =>
            uploadFile({ file: file.buffer, filename: file.originalname, folder: "/snitch/products" })
                .then(res => ({ fieldname: file.fieldname, url: res.url }))
        );

        // Upload main images from URLs (if provided)
        const imageUrls: string[] = Array.isArray(req.body.imageUrls) 
            ? req.body.imageUrls 
            : req.body.imageUrl ? [req.body.imageUrl] : [];
            
        const urlUploads = imageUrls.map(url => 
            uploadFile({ file: url, filename: `url-${Date.now()}`, folder: "/snitch/products" })
                .then(res => ({ fieldname: "images", url: res.url }))
        );

        const allUploaded = await Promise.all([...fileUploads, ...urlUploads]);

        const price: any = {
            amount: Number(priceAmount),
            currency: priceCurrency || "INR",
        };
        if (saleAmount !== undefined && saleAmount !== "") {
            price.saleAmount = Number(saleAmount);
        }

        // Process variants
        const parsedVariants = typeof req.body.variants === "string" ? JSON.parse(req.body.variants) : (req.body.variants || []);
        const variants = parsedVariants.map((v: any, index: number) => {
            const variantImages = allUploaded
                .filter(f => f.fieldname === `variant_images_${index}`)
                .map(f => ({ url: f.url }));
            return {
                images: variantImages,
                stock: Number(v.stock || 0),
                attributes: v.attributes || {},
                price: v.price ? {
                    amount: Number(v.price.amount || 0),
                    currency: v.price.currency || "INR",
                    saleAmount: v.price.saleAmount ? Number(v.price.saleAmount) : undefined
                } : undefined
            };
        });

        const mainImages = allUploaded.filter(f => f.fieldname === "images").map(f => ({ url: f.url }));

        // Parse WooCommerce fields
        const isVirtual = req.body.isVirtual === "true" || req.body.isVirtual === true;
        const isDownloadable = req.body.isDownloadable === "true" || req.body.isDownloadable === true;
        const manageStock = req.body.manageStock === "true" || req.body.manageStock === true || req.body.manageStock === undefined;
        const stockQuantity = req.body.stockQuantity !== undefined ? Number(req.body.stockQuantity) : 0;
        const stockStatus = req.body.stockStatus || "instock";
        const allowBackorders = req.body.allowBackorders || "no";
        const soldIndividually = req.body.soldIndividually === "true" || req.body.soldIndividually === true;
        const shippingClass = req.body.shippingClass || null;
        
        const dimensions = req.body.dimensions 
            ? (typeof req.body.dimensions === "string" ? JSON.parse(req.body.dimensions) : req.body.dimensions)
            : undefined;

        const upSells = req.body.upSells 
            ? (typeof req.body.upSells === "string" ? JSON.parse(req.body.upSells) : req.body.upSells)
            : [];

        const crossSells = req.body.crossSells 
            ? (typeof req.body.crossSells === "string" ? JSON.parse(req.body.crossSells) : req.body.crossSells)
            : [];

        const globalAttributes = req.body.globalAttributes 
            ? (typeof req.body.globalAttributes === "string" ? JSON.parse(req.body.globalAttributes) : req.body.globalAttributes)
            : [];

        const categories = req.body.categories 
            ? (typeof req.body.categories === "string" ? JSON.parse(req.body.categories) : req.body.categories)
            : (category ? [category] : []);

        const tags = req.body.tags 
            ? (typeof req.body.tags === "string" ? JSON.parse(req.body.tags) : req.body.tags)
            : [];

        const purchaseNote = req.body.purchaseNote || "";
        const menuOrder = req.body.menuOrder !== undefined ? Number(req.body.menuOrder) : 0;
        const enableReviews = req.body.enableReviews === "true" || req.body.enableReviews === true || req.body.enableReviews === undefined;

        const featuredImage = mainImages[0]?.url || req.body.featuredImage || undefined;
        const productGallery = req.body.productGallery 
            ? (typeof req.body.productGallery === "string" ? JSON.parse(req.body.productGallery) : req.body.productGallery)
            : (mainImages.length > 1 ? mainImages.slice(1).map(img => img.url) : []);

        const productData: any = {
            title,
            description,
            seller: sellerId,
            category,
            brand: brand || null,
            sizes,
            colors,
            patterns,
            fits,
            materials,
            collars,
            unit,
            price,
            stock: Number(stock),
            status: status || "active",
            images: mainImages,
            variants,
            isVirtual,
            isDownloadable,
            manageStock,
            stockQuantity,
            stockStatus,
            allowBackorders,
            soldIndividually,
            dimensions,
            shippingClass,
            upSells,
            crossSells,
            globalAttributes,
            purchaseNote,
            menuOrder,
            enableReviews,
            categories,
            tags,
            featuredImage,
            productGallery,
        };

        if (sku) productData.sku = sku;
        if (weight) productData.weight = Number(weight);

        const product = await productModel.create(productData);

        // Populate before returning so the frontend gets full objects
        await product.populate(POPULATE);

        // Bust catalog cache — new product should appear immediately
        await bustProductCache();

        return res.status(201).json({ success: true, message: "Product created successfully", product });
    } catch (err) {
        console.error("Create Product Error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};


export const getAllProducts = async (_req: Request, res: Response) => {
    try {
        // Try cache first
        const cached = await redisClient.get(KEY_ALL);
        if (cached) {
            return res.status(200).json(JSON.parse(cached));
        }

        const products = await productModel
            .find({ status: "active" })
            .populate(POPULATE)
            .sort({ createdAt: -1 });

        const payload = { success: true, products };
        await redisClient.setex(KEY_ALL, TTL_PRODUCTS_ALL, JSON.stringify(payload));

        return res.status(200).json(payload);
    } catch (err) {
        console.error("Get All Products Error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};


export const getSellersAllProducts = async (req: AuthRequest, res: Response) => {
    try {
        const sellerId = req.user?.id;
        if (!sellerId) {
            return res.status(401).json({ success: false, message: "Not authenticated" });
        }

        // Sellers see all their products (draft + active) — not cached (seller-specific & low traffic)
        const products = await productModel
            .find({ seller: sellerId })
            .populate(POPULATE)
            .sort({ createdAt: -1 });

        return res.status(200).json({ success: true, products });
    } catch (err) {
        console.error("Get Seller Products Error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const getProductById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!id || !mongoose.Types.ObjectId.isValid(id as string)) {
            return res.status(400).json({ success: false, message: "Invalid product ID" });
        }

        // Try cache first
        const cacheKey = keyOne(id as string);
        const cached = await redisClient.get(cacheKey);
        if (cached) {
            const parsed = JSON.parse(cached);
            // If cache exists but seller is not populated (still a string ID), bypass cache to heal it
            if (parsed && parsed.product && typeof parsed.product.seller === "string") {
                await redisClient.del(cacheKey);
            } else {
                return res.status(200).json(parsed);
            }
        }

        const product = await productModel.findById(id).populate(POPULATE);
        if (!product) return res.status(404).json({ success: false, message: "Product not found" });

        const payload = { success: true, product };
        await redisClient.setex(cacheKey, TTL_PRODUCT_ONE, JSON.stringify(payload));

        return res.status(200).json(payload);
    } catch (err) {
        console.error("Get Product By ID Error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const sellerId = req.user?.id;
        const { 
            title, description, category, brand, sizes, colors,
            patterns, fits, materials, collars,
            unit, priceAmount, priceCurrency, saleAmount, 
            stock, sku, weight, status 
        } = req.body;

        const product = await productModel.findById(id);
        if (!product) return res.status(404).json({ success: false, message: "Product not found" });

        // Security: Ensure the seller owns the product, except when Admin bypasses
        const isAdmin = req.user?.role === "admin";
        if (!isAdmin && product.seller.toString() !== sellerId) {
            return res.status(403).json({ success: false, message: "Unauthorized to edit this product" });
        }

        const updateData: any = {};
        if (title) updateData.title = title;
        if (description) updateData.description = description;
        if (category) updateData.category = category;
        if (brand !== undefined) updateData.brand = brand || null;
        if (sizes) updateData.sizes = Array.isArray(sizes) ? sizes : [sizes];
        if (colors) updateData.colors = Array.isArray(colors) ? colors : [colors];
        if (patterns !== undefined) updateData.patterns = Array.isArray(patterns) ? patterns : (patterns ? [patterns] : []);
        if (fits !== undefined) updateData.fits = Array.isArray(fits) ? fits : (fits ? [fits] : []);
        if (materials !== undefined) updateData.materials = Array.isArray(materials) ? materials : (materials ? [materials] : []);
        if (collars !== undefined) updateData.collars = Array.isArray(collars) ? collars : (collars ? [collars] : []);
        if (unit) updateData.unit = unit;
        if (stock !== undefined) updateData.stock = Number(stock);
        if (sku !== undefined) updateData.sku = sku;
        if (weight !== undefined) updateData.weight = weight === "" ? undefined : Number(weight);
        if (status) updateData.status = status;

        if (req.body.isVirtual !== undefined) updateData.isVirtual = req.body.isVirtual === "true" || req.body.isVirtual === true;
        if (req.body.isDownloadable !== undefined) updateData.isDownloadable = req.body.isDownloadable === "true" || req.body.isDownloadable === true;
        if (req.body.manageStock !== undefined) updateData.manageStock = req.body.manageStock === "true" || req.body.manageStock === true;
        if (req.body.stockQuantity !== undefined) updateData.stockQuantity = Number(req.body.stockQuantity);
        if (req.body.stockStatus !== undefined) updateData.stockStatus = req.body.stockStatus;
        if (req.body.allowBackorders !== undefined) updateData.allowBackorders = req.body.allowBackorders;
        if (req.body.soldIndividually !== undefined) updateData.soldIndividually = req.body.soldIndividually === "true" || req.body.soldIndividually === true;
        if (req.body.shippingClass !== undefined) updateData.shippingClass = req.body.shippingClass || null;

        if (req.body.dimensions !== undefined) {
            updateData.dimensions = typeof req.body.dimensions === "string" ? JSON.parse(req.body.dimensions) : req.body.dimensions;
        }
        if (req.body.upSells !== undefined) {
            updateData.upSells = typeof req.body.upSells === "string" ? JSON.parse(req.body.upSells) : req.body.upSells;
        }
        if (req.body.crossSells !== undefined) {
            updateData.crossSells = typeof req.body.crossSells === "string" ? JSON.parse(req.body.crossSells) : req.body.crossSells;
        }
        if (req.body.globalAttributes !== undefined) {
            updateData.globalAttributes = typeof req.body.globalAttributes === "string" ? JSON.parse(req.body.globalAttributes) : req.body.globalAttributes;
        }
        if (req.body.categories !== undefined) {
            updateData.categories = typeof req.body.categories === "string" ? JSON.parse(req.body.categories) : req.body.categories;
        }
        if (req.body.tags !== undefined) {
            updateData.tags = typeof req.body.tags === "string" ? JSON.parse(req.body.tags) : req.body.tags;
        }
        if (req.body.purchaseNote !== undefined) updateData.purchaseNote = req.body.purchaseNote;
        if (req.body.menuOrder !== undefined) updateData.menuOrder = Number(req.body.menuOrder);
        if (req.body.enableReviews !== undefined) updateData.enableReviews = req.body.enableReviews === "true" || req.body.enableReviews === true;

        if (priceAmount) {
            updateData.price = {
                amount: Number(priceAmount),
                currency: priceCurrency || product.price.currency
            };
            if (saleAmount !== undefined) {
                updateData.price.saleAmount = saleAmount === "" ? undefined : Number(saleAmount);
            }
        }

        // Upload files dynamically using ImageKit (main images + variant images)
        const files = (req.files as any[]) || [];
        const fileUploads = files.map((file: any) =>
            uploadFile({ file: file.buffer, filename: file.originalname, folder: "/snitch/products" })
                .then(res => ({ fieldname: file.fieldname, url: res.url }))
        );

        // Upload main images from URLs (if provided)
        const imageUrls: string[] = Array.isArray(req.body.imageUrls) 
            ? req.body.imageUrls 
            : req.body.imageUrl ? [req.body.imageUrl] : [];
            
        const urlUploads = imageUrls.map(url => 
            uploadFile({ file: url, filename: `edit-url-${Date.now()}`, folder: "/snitch/products" })
                .then(res => ({ fieldname: "images", url: res.url }))
        );

        const allUploaded = await Promise.all([...fileUploads, ...urlUploads]);

        // If new main images uploaded, replace/update them
        const newMainImages = allUploaded.filter(f => f.fieldname === "images").map(f => ({ url: f.url }));
        if (newMainImages.length > 0) {
            updateData.images = newMainImages;
            updateData.featuredImage = newMainImages[0]?.url;
            updateData.productGallery = newMainImages.slice(1).map(img => img.url);
        } else {
            if (req.body.featuredImage !== undefined) updateData.featuredImage = req.body.featuredImage;
            if (req.body.productGallery !== undefined) {
                updateData.productGallery = typeof req.body.productGallery === "string" ? JSON.parse(req.body.productGallery) : req.body.productGallery;
            }
        }

        // Process variants if passed
        if (req.body.variants) {
            const parsedVariants = typeof req.body.variants === "string" ? JSON.parse(req.body.variants) : (req.body.variants || []);
            updateData.variants = parsedVariants.map((v: any, index: number) => {
                const variantImages = allUploaded
                    .filter(f => f.fieldname === `variant_images_${index}`)
                    .map(f => ({ url: f.url }));
                const existingImages = Array.isArray(v.images) ? v.images.filter((img: any) => img && img.url && !img.file) : [];
                return {
                    images: [...existingImages, ...variantImages],
                    stock: Number(v.stock || 0),
                    attributes: v.attributes || {},
                    price: v.price ? {
                        amount: Number(v.price.amount || 0),
                        currency: v.price.currency || "INR",
                        saleAmount: v.price.saleAmount ? Number(v.price.saleAmount) : undefined
                    } : undefined
                };
            });
        }

        const updatedProduct = await productModel.findByIdAndUpdate(
            id, 
            { $set: updateData }, 
            { new: true, runValidators: true }
        ).populate(POPULATE);

        // Bust both the catalog cache and this product's individual cache
        await bustProductCache(id as string);

        return res.status(200).json({ success: true, message: "Product updated", product: updatedProduct });
    } catch (err) {
        console.error("Update Product Error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const deleteProduct = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const sellerId = req.user?.id;

        const product = await productModel.findById(id);
        if (!product) return res.status(404).json({ success: false, message: "Product not found" });

        // Security: Ensure the seller owns the product, except when Admin bypasses
        const isAdmin = req.user?.role === "admin";
        if (!isAdmin && product.seller.toString() !== sellerId) {
            return res.status(403).json({ success: false, message: "Unauthorized to delete this product" });
        }

        await productModel.findByIdAndDelete(id);

        // Bust both catalog + individual product cache
        await bustProductCache(id as string);

        return res.status(200).json({ success: true, message: "Product deleted successfully" });
    } catch (err) {
        console.error("Delete Product Error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};