import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import productModel from "../models/product.model.js";
import { uploadFile } from "../services/imagekit.service.js";
import categoryModel from "../models/category.model.js";
import brandModel from "../models/brand.model.js";
import sizeModel from "../models/size.model.js";
import colorModel from "../models/color.model.js";
import unitModel from "../models/unit.model.js";

// Reusable populate config
const POPULATE = [
    { path: "category", select: "name slug" },
    { path: "brand", select: "name logo" },
    { path: "sizes", select: "name sortOrder" },
    { path: "colors", select: "name hexCode" },
    { path: "unit", select: "name abbreviation" },
];

export const getProductMetadata = async (_req: Request, res: Response) => {
    try {
        const filter = { isActive: { $ne: false } };
        const [categories, brands, sizes, colors, units] = await Promise.all([
            categoryModel.find(filter).sort({ name: 1 }),
            brandModel.find(filter).sort({ name: 1 }),
            sizeModel.find(filter).sort({ sortOrder: 1, name: 1 }),
            colorModel.find(filter).sort({ name: 1 }),
            unitModel.find(filter).sort({ name: 1 }),
        ]);

        return res.status(200).json({
            success: true,
            categories,
            brands,
            sizes,
            colors,
            units,
        });
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

        const sellerId = req.user?.id;
        if (!sellerId) {
            return res.status(401).json({ success: false, message: "Not authenticated" });
        }

        // Upload images to ImageKit (from files)
        const imageFiles = (req.files as any[]) || [];
        const fileUploads = imageFiles.map((file: any) =>
            uploadFile({ file: file.buffer, filename: file.originalname, folder: "/snitch/products" })
        );

        // Upload images from URLs (if provided)
        const imageUrls: string[] = Array.isArray(req.body.imageUrls) 
            ? req.body.imageUrls 
            : req.body.imageUrl ? [req.body.imageUrl] : [];
            
        const urlUploads = imageUrls.map(url => 
            uploadFile({ file: url, filename: `url-${Date.now()}`, folder: "/snitch/products" })
        );

        const allUploads = await Promise.all([...fileUploads, ...urlUploads]);

        const price: any = {
            amount: Number(priceAmount),
            currency: priceCurrency || "INR",
        };
        if (saleAmount !== undefined && saleAmount !== "") {
            price.saleAmount = Number(saleAmount);
        }

        const productData: any = {
            title,
            description,
            seller: sellerId,
            category,
            brand: brand || null,
            sizes,
            colors,
            unit,
            price,
            stock: Number(stock),
            status: status || "active",
            images: allUploads.map((img: any) => ({ url: img.url })),
        };

        if (sku) productData.sku = sku;
        if (weight) productData.weight = Number(weight);

        const product = await productModel.create(productData);

        // Populate before returning so the frontend gets full objects
        await product.populate(POPULATE);

        return res.status(201).json({ success: true, message: "Product created successfully", product });
    } catch (err) {
        console.error("Create Product Error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};


export const getAllProducts = async (_req: Request, res: Response) => {
    try {
        const products = await productModel
            .find({ status: "active" })
            .populate(POPULATE)
            .sort({ createdAt: -1 });

        return res.status(200).json({ success: true, products });
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

        // Sellers see all their products (draft + active)
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
        const product = await productModel.findById(id).populate(POPULATE);
        if (!product) return res.status(404).json({ success: false, message: "Product not found" });

        return res.status(200).json({ success: true, product });
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
            unit, priceAmount, priceCurrency, saleAmount, 
            stock, sku, weight, status 
        } = req.body;

        const product = await productModel.findById(id);
        if (!product) return res.status(404).json({ success: false, message: "Product not found" });

        // Security: Ensure the seller owns the product
        if (product.seller.toString() !== sellerId) {
            return res.status(403).json({ success: false, message: "Unauthorized to edit this product" });
        }

        const updateData: any = {};
        if (title) updateData.title = title;
        if (description) updateData.description = description;
        if (category) updateData.category = category;
        if (brand !== undefined) updateData.brand = brand || null;
        if (sizes) updateData.sizes = Array.isArray(sizes) ? sizes : [sizes];
        if (colors) updateData.colors = Array.isArray(colors) ? colors : [colors];
        if (unit) updateData.unit = unit;
        if (stock !== undefined) updateData.stock = Number(stock);
        if (sku !== undefined) updateData.sku = sku;
        if (weight !== undefined) updateData.weight = weight === "" ? undefined : Number(weight);
        if (status) updateData.status = status;

        if (priceAmount) {
            updateData.price = {
                amount: Number(priceAmount),
                currency: priceCurrency || product.price.currency
            };
            if (saleAmount !== undefined) {
                updateData.price.saleAmount = saleAmount === "" ? undefined : Number(saleAmount);
            }
        }

        // Image handling: handle Files + URLs
        const imageFiles = (req.files as any[]) || [];
        const imageUrls: string[] = Array.isArray(req.body.imageUrls) 
            ? req.body.imageUrls 
            : req.body.imageUrl ? [req.body.imageUrl] : [];

        if (imageFiles.length > 0 || imageUrls.length > 0) {
            const fileUploads = imageFiles.map((file: any) =>
                uploadFile({ file: file.buffer, filename: file.originalname, folder: "/snitch/products" })
            );
            const urlUploads = imageUrls.map(url => 
                uploadFile({ file: url, filename: `edit-url-${Date.now()}`, folder: "/snitch/products" })
            );

            const allUploads = await Promise.all([...fileUploads, ...urlUploads]);
            updateData.images = allUploads.map((img: any) => ({ url: img.url }));
        }

        const updatedProduct = await productModel.findByIdAndUpdate(
            id, 
            { $set: updateData }, 
            { new: true, runValidators: true }
        ).populate(POPULATE);

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

        if (product.seller.toString() !== sellerId) {
            return res.status(403).json({ success: false, message: "Unauthorized to delete this product" });
        }

        await productModel.findByIdAndDelete(id);
        return res.status(200).json({ success: true, message: "Product deleted successfully" });
    } catch (err) {
        console.error("Delete Product Error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};