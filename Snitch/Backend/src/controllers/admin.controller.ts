import mongoose from "mongoose";
import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import { uploadFile } from "../services/imagekit.service.js";
import { broadcastUpdate as originalBroadcastUpdate } from "../services/socket.service.js";
import categoryModel from "../models/category.model.js";
import unitModel from "../models/unit.model.js";
import sizeModel from "../models/size.model.js";
import colorModel from "../models/color.model.js";
import brandModel from "../models/brand.model.js";
import patternModel from "../models/pattern.model.js";
import fitModel from "../models/fit.model.js";
import materialModel from "../models/material.model.js";
import collarModel from "../models/collar.model.js";
import sellerSizeChartModel from "../models/sellerSizeChart.model.js";
import redisClient from "../config/redis.js";

// ─── Cache helpers ────────────────────────────────────────────────────────────
const KEY_METADATA_SELLER = (sellerId: string) => `products:metadata:seller:${sellerId}`;
const KEY_METADATA_ADMIN  = "products:metadata:admin:all";

const bustMetadataCaches = async (sellerId?: string) => {
    try {
        const keys: string[] = [KEY_METADATA_ADMIN];
        if (sellerId) keys.push(KEY_METADATA_SELLER(sellerId));
        // Also bust all seller caches when admin promotes something global
        const sellerKeys = await redisClient.keys("products:metadata:seller:*");
        if (sellerKeys.length) keys.push(...sellerKeys);
        if (keys.length) await redisClient.del(...keys);
    } catch (e) {
        console.error("Failed to bust metadata caches:", e);
    }
};

const broadcastUpdate = (event: string, sellerId?: string) => {
    originalBroadcastUpdate(event);
    bustMetadataCaches(sellerId);
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const err500 = (res: Response, e: unknown) => {
    console.error(e);
    return res.status(500).json({ success: false, message: "Server error" });
};

/**
 * Determines scope based on who's calling:
 *  - admin → createdBy: null, isPublic: true  (visible to all)
 *  - seller → createdBy: sellerId, isPublic: false  (private)
 */
const getScope = (req: AuthRequest) => {
    const isAdmin = req.user?.role === "admin";
    return {
        createdBy: isAdmin ? null : new mongoose.Types.ObjectId(req.user!.id),
        isPublic: isAdmin,
    };
};

// Visibility filter for a given seller (sees global + own items)
export const sellerVisibilityFilter = (sellerId: string) => ({
    isActive: { $ne: false },
    $or: [
        { isPublic: true, createdBy: null },
        { createdBy: new mongoose.Types.ObjectId(sellerId) },
    ],
});


// ══════════════════════════════════════════════════════════════════════════════
//  PROMOTE (Admin only — makes a seller-created item globally visible)
// ══════════════════════════════════════════════════════════════════════════════
const MODEL_MAP: Record<string, any> = {
    category: categoryModel,
    unit: unitModel,
    size: sizeModel,
    color: colorModel,
    brand: brandModel,
    pattern: patternModel,
    fit: fitModel,
    material: materialModel,
    collar: collarModel,
};

export const promoteMetadata = async (req: AuthRequest, res: Response) => {
    try {
        const { type, id } = req.params;
        const model = MODEL_MAP[type as string];
        if (!model) {
            return res.status(400).json({ success: false, message: `Unknown type: ${type}` });
        }
        const item = await model.findByIdAndUpdate(
            id,
            { $set: { isPublic: true } },
            { new: true }
        );
        if (!item) return res.status(404).json({ success: false, message: "Item not found" });
        await bustMetadataCaches();
        return res.status(200).json({ success: true, message: `${type} promoted to global`, item });
    } catch (e) { return err500(res, e); }
};

export const demoteMetadata = async (req: AuthRequest, res: Response) => {
    try {
        const { type, id } = req.params;
        const model = MODEL_MAP[type as string];
        if (!model) {
            return res.status(400).json({ success: false, message: `Unknown type: ${type}` });
        }
        const item = await model.findByIdAndUpdate(
            id,
            { $set: { isPublic: false } },
            { new: true }
        );
        if (!item) return res.status(404).json({ success: false, message: "Item not found" });
        await bustMetadataCaches();
        return res.status(200).json({ success: true, message: `${type} demoted to private`, item });
    } catch (e) { return err500(res, e); }
};

// Admin-only: get ALL items of a type (for admin dashboard management)
export const getAllMetadataByType = async (req: AuthRequest, res: Response) => {
    try {
        const { type } = req.params;
        const model = MODEL_MAP[type as string];
        if (!model) {
            return res.status(400).json({ success: false, message: `Unknown type: ${type}` });
        }
        const items = await model.find().sort({ createdAt: -1 });
        return res.status(200).json({ success: true, items });
    } catch (e) { return err500(res, e); }
};


// ══════════════════════════════════════════════════════════════════════════════
//  CATEGORIES
// ══════════════════════════════════════════════════════════════════════════════
export const createCategory = async (req: AuthRequest, res: Response) => {
    try {
        const { name, description } = req.body;
        const file = req.file as any;
        const scope = getScope(req);

        // Prevent duplicate name within same scope
        const existing = await categoryModel.findOne({ name: { $regex: new RegExp(`^${name}$`, "i") }, createdBy: scope.createdBy });
        if (existing) {
            return res.status(200).json({ success: true, message: "Category already exists", category: existing });
        }

        let image: string | undefined;
        if (file) {
            const uploaded = await uploadFile({
                file: file.buffer,
                filename: file.originalname,
                folder: "/snitch/categories",
            });
            image = uploaded.url;
        }

        const categoryData: any = { name, description, ...scope };
        if (image) categoryData.image = image;

        const category = await categoryModel.create(categoryData);
        broadcastUpdate("catalog_update", scope.createdBy?.toString());
        return res.status(201).json({ success: true, message: "Category created", category });
    } catch (e) { return err500(res, e); }
};

export const getAllCategories = async (_req: AuthRequest, res: Response) => {
    try {
        const categories = await categoryModel.find().sort({ name: 1 });
        return res.status(200).json({ success: true, categories });
    } catch (e) { return err500(res, e); }
};

export const updateCategory = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, description, isActive } = req.body;
        const file = req.file as any;

        const update: any = {
            ...(name && { name }),
            ...(description !== undefined && { description }),
            ...(isActive !== undefined && { isActive }),
        };

        if (file) {
            const uploaded = await uploadFile({ file: file.buffer, filename: file.originalname, folder: "/snitch/categories" });
            update.image = uploaded.url;
        }

        const category = await categoryModel.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true });
        if (!category) return res.status(404).json({ success: false, message: "Category not found" });
        broadcastUpdate("catalog_update");
        return res.status(200).json({ success: true, message: "Category updated", category });
    } catch (e) { return err500(res, e); }
};

export const deleteCategory = async (req: AuthRequest, res: Response) => {
    try {
        await categoryModel.findByIdAndDelete(req.params.id);
        broadcastUpdate("catalog_update");
        return res.status(200).json({ success: true, message: "Category deleted" });
    } catch (e) { return err500(res, e); }
};


// ══════════════════════════════════════════════════════════════════════════════
//  UNITS
// ══════════════════════════════════════════════════════════════════════════════
export const createUnit = async (req: AuthRequest, res: Response) => {
    try {
        const { name, abbreviation, description } = req.body;
        const scope = getScope(req);
        const existing = await unitModel.findOne({ name: { $regex: new RegExp(`^${name}$`, "i") }, createdBy: scope.createdBy });
        if (existing) return res.status(200).json({ success: true, message: "Unit already exists", unit: existing });
        const unit = await unitModel.create({ name, abbreviation, description, ...scope });
        broadcastUpdate("catalog_update", scope.createdBy?.toString());
        return res.status(201).json({ success: true, message: "Unit created", unit });
    } catch (e) { return err500(res, e); }
};

export const getAllUnits = async (_req: AuthRequest, res: Response) => {
    try {
        const units = await unitModel.find().sort({ name: 1 });
        return res.status(200).json({ success: true, units });
    } catch (e) { return err500(res, e); }
};

export const updateUnit = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, abbreviation, description, isActive } = req.body;
        const unit = await unitModel.findByIdAndUpdate(id, { $set: { name, abbreviation, description, isActive } }, { new: true, runValidators: true });
        if (!unit) return res.status(404).json({ success: false, message: "Unit not found" });
        broadcastUpdate("catalog_update");
        return res.status(200).json({ success: true, message: "Unit updated", unit });
    } catch (e) { return err500(res, e); }
};

export const deleteUnit = async (req: AuthRequest, res: Response) => {
    try {
        await unitModel.findByIdAndDelete(req.params.id);
        broadcastUpdate("catalog_update");
        return res.status(200).json({ success: true, message: "Unit deleted" });
    } catch (e) { return err500(res, e); }
};


// ══════════════════════════════════════════════════════════════════════════════
//  SIZES
// ══════════════════════════════════════════════════════════════════════════════
export const createSize = async (req: AuthRequest, res: Response) => {
    try {
        const { name, category, sortOrder } = req.body;
        const scope = getScope(req);
        const existing = await sizeModel.findOne({ name: { $regex: new RegExp(`^${name}$`, "i") }, createdBy: scope.createdBy });
        if (existing) return res.status(200).json({ success: true, message: "Size already exists", size: existing });
        const size = await sizeModel.create({ name, category: category || null, sortOrder: sortOrder || 0, ...scope });
        broadcastUpdate("catalog_update", scope.createdBy?.toString());
        return res.status(201).json({ success: true, message: "Size created", size });
    } catch (e) { return err500(res, e); }
};

export const getAllSizes = async (_req: AuthRequest, res: Response) => {
    try {
        const sizes = await sizeModel.find().populate("category", "name").sort({ sortOrder: 1, name: 1 });
        return res.status(200).json({ success: true, sizes });
    } catch (e) { return err500(res, e); }
};

export const updateSize = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, category, sortOrder, isActive } = req.body;
        const size = await sizeModel.findByIdAndUpdate(id, { $set: { name, category, sortOrder, isActive } }, { new: true });
        if (!size) return res.status(404).json({ success: false, message: "Size not found" });
        broadcastUpdate("catalog_update");
        return res.status(200).json({ success: true, message: "Size updated", size });
    } catch (e) { return err500(res, e); }
};

export const deleteSize = async (req: AuthRequest, res: Response) => {
    try {
        await sizeModel.findByIdAndDelete(req.params.id);
        broadcastUpdate("catalog_update");
        return res.status(200).json({ success: true, message: "Size deleted" });
    } catch (e) { return err500(res, e); }
};


// ══════════════════════════════════════════════════════════════════════════════
//  COLORS
// ══════════════════════════════════════════════════════════════════════════════
export const createColor = async (req: AuthRequest, res: Response) => {
    try {
        const { name, hexCode } = req.body;
        const scope = getScope(req);
        const existing = await colorModel.findOne({ name: { $regex: new RegExp(`^${name}$`, "i") }, createdBy: scope.createdBy });
        if (existing) return res.status(200).json({ success: true, message: "Color already exists", color: existing });
        const color = await colorModel.create({ name, hexCode, ...scope });
        broadcastUpdate("catalog_update", scope.createdBy?.toString());
        return res.status(201).json({ success: true, message: "Color created", color });
    } catch (e) { return err500(res, e); }
};

export const getAllColors = async (_req: AuthRequest, res: Response) => {
    try {
        const colors = await colorModel.find().sort({ name: 1 });
        return res.status(200).json({ success: true, colors });
    } catch (e) { return err500(res, e); }
};

export const updateColor = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, hexCode, isActive } = req.body;
        const color = await colorModel.findByIdAndUpdate(id, { $set: { name, hexCode, isActive } }, { new: true, runValidators: true });
        if (!color) return res.status(404).json({ success: false, message: "Color not found" });
        broadcastUpdate("catalog_update");
        return res.status(200).json({ success: true, message: "Color updated", color });
    } catch (e) { return err500(res, e); }
};

export const deleteColor = async (req: AuthRequest, res: Response) => {
    try {
        await colorModel.findByIdAndDelete(req.params.id);
        broadcastUpdate("catalog_update");
        return res.status(200).json({ success: true, message: "Color deleted" });
    } catch (e) { return err500(res, e); }
};


// ══════════════════════════════════════════════════════════════════════════════
//  BRANDS
// ══════════════════════════════════════════════════════════════════════════════
export const createBrand = async (req: AuthRequest, res: Response) => {
    try {
        const { name, description, website } = req.body;
        const file = req.file as any;
        const scope = getScope(req);

        const existing = await brandModel.findOne({ name: { $regex: new RegExp(`^${name}$`, "i") }, createdBy: scope.createdBy });
        if (existing) return res.status(200).json({ success: true, message: "Brand already exists", brand: existing });

        let logo: string | undefined;
        if (file) {
            const uploaded = await uploadFile({ file: file.buffer, filename: file.originalname, folder: "/snitch/brands" });
            logo = uploaded.url;
        }

        const brandData: any = { name, description, website, ...scope };
        if (logo) brandData.logo = logo;

        const brand = await brandModel.create(brandData);
        broadcastUpdate("catalog_update", scope.createdBy?.toString());
        return res.status(201).json({ success: true, message: "Brand created", brand });
    } catch (e) { return err500(res, e); }
};

export const getAllBrands = async (_req: AuthRequest, res: Response) => {
    try {
        const brands = await brandModel.find().sort({ name: 1 });
        return res.status(200).json({ success: true, brands });
    } catch (e) { return err500(res, e); }
};

export const updateBrand = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, description, website, isActive } = req.body;
        const file = req.file as any;
        const update: any = { name, description, website, isActive };
        if (file) {
            const uploaded = await uploadFile({ file: file.buffer, filename: file.originalname, folder: "/snitch/brands" });
            update.logo = uploaded.url;
        }
        const brand = await brandModel.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true });
        if (!brand) return res.status(404).json({ success: false, message: "Brand not found" });
        broadcastUpdate("catalog_update");
        return res.status(200).json({ success: true, message: "Brand updated", brand });
    } catch (e) { return err500(res, e); }
};

export const deleteBrand = async (req: AuthRequest, res: Response) => {
    try {
        await brandModel.findByIdAndDelete(req.params.id);
        broadcastUpdate("catalog_update");
        return res.status(200).json({ success: true, message: "Brand deleted" });
    } catch (e) { return err500(res, e); }
};


// ══════════════════════════════════════════════════════════════════════════════
//  PATTERNS
// ══════════════════════════════════════════════════════════════════════════════
export const createPattern = async (req: AuthRequest, res: Response) => {
    try {
        const { name } = req.body;
        const scope = getScope(req);
        const existing = await patternModel.findOne({ name: { $regex: new RegExp(`^${name}$`, "i") }, createdBy: scope.createdBy });
        if (existing) return res.status(200).json({ success: true, message: "Pattern already exists", pattern: existing });
        const pattern = await patternModel.create({ name, ...scope });
        broadcastUpdate("catalog_update", scope.createdBy?.toString());
        return res.status(201).json({ success: true, message: "Pattern created", pattern });
    } catch (e) { return err500(res, e); }
};

export const getAllPatterns = async (_req: AuthRequest, res: Response) => {
    try {
        const patterns = await patternModel.find().sort({ name: 1 });
        return res.status(200).json({ success: true, patterns });
    } catch (e) { return err500(res, e); }
};

export const updatePattern = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, isActive } = req.body;
        const pattern = await patternModel.findByIdAndUpdate(id, { $set: { name, isActive } }, { new: true, runValidators: true });
        if (!pattern) return res.status(404).json({ success: false, message: "Pattern not found" });
        broadcastUpdate("catalog_update");
        return res.status(200).json({ success: true, message: "Pattern updated", pattern });
    } catch (e) { return err500(res, e); }
};

export const deletePattern = async (req: AuthRequest, res: Response) => {
    try {
        await patternModel.findByIdAndDelete(req.params.id);
        broadcastUpdate("catalog_update");
        return res.status(200).json({ success: true, message: "Pattern deleted" });
    } catch (e) { return err500(res, e); }
};


// ══════════════════════════════════════════════════════════════════════════════
//  FITS
// ══════════════════════════════════════════════════════════════════════════════
export const createFit = async (req: AuthRequest, res: Response) => {
    try {
        const { name } = req.body;
        const scope = getScope(req);
        const existing = await fitModel.findOne({ name: { $regex: new RegExp(`^${name}$`, "i") }, createdBy: scope.createdBy });
        if (existing) return res.status(200).json({ success: true, message: "Fit already exists", fit: existing });
        const fit = await fitModel.create({ name, ...scope });
        broadcastUpdate("catalog_update", scope.createdBy?.toString());
        return res.status(201).json({ success: true, message: "Fit created", fit });
    } catch (e) { return err500(res, e); }
};

export const getAllFits = async (_req: AuthRequest, res: Response) => {
    try {
        const fits = await fitModel.find().sort({ name: 1 });
        return res.status(200).json({ success: true, fits });
    } catch (e) { return err500(res, e); }
};

export const updateFit = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, isActive } = req.body;
        const fit = await fitModel.findByIdAndUpdate(id, { $set: { name, isActive } }, { new: true, runValidators: true });
        if (!fit) return res.status(404).json({ success: false, message: "Fit not found" });
        broadcastUpdate("catalog_update");
        return res.status(200).json({ success: true, message: "Fit updated", fit });
    } catch (e) { return err500(res, e); }
};

export const deleteFit = async (req: AuthRequest, res: Response) => {
    try {
        await fitModel.findByIdAndDelete(req.params.id);
        broadcastUpdate("catalog_update");
        return res.status(200).json({ success: true, message: "Fit deleted" });
    } catch (e) { return err500(res, e); }
};


// ══════════════════════════════════════════════════════════════════════════════
//  MATERIALS
// ══════════════════════════════════════════════════════════════════════════════
export const createMaterial = async (req: AuthRequest, res: Response) => {
    try {
        const { name } = req.body;
        const scope = getScope(req);
        const existing = await materialModel.findOne({ name: { $regex: new RegExp(`^${name}$`, "i") }, createdBy: scope.createdBy });
        if (existing) return res.status(200).json({ success: true, message: "Material already exists", material: existing });
        const material = await materialModel.create({ name, ...scope });
        broadcastUpdate("catalog_update", scope.createdBy?.toString());
        return res.status(201).json({ success: true, message: "Material created", material });
    } catch (e) { return err500(res, e); }
};

export const getAllMaterials = async (_req: AuthRequest, res: Response) => {
    try {
        const materials = await materialModel.find().sort({ name: 1 });
        return res.status(200).json({ success: true, materials });
    } catch (e) { return err500(res, e); }
};

export const updateMaterial = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, isActive } = req.body;
        const material = await materialModel.findByIdAndUpdate(id, { $set: { name, isActive } }, { new: true, runValidators: true });
        if (!material) return res.status(404).json({ success: false, message: "Material not found" });
        broadcastUpdate("catalog_update");
        return res.status(200).json({ success: true, message: "Material updated", material });
    } catch (e) { return err500(res, e); }
};

export const deleteMaterial = async (req: AuthRequest, res: Response) => {
    try {
        await materialModel.findByIdAndDelete(req.params.id);
        broadcastUpdate("catalog_update");
        return res.status(200).json({ success: true, message: "Material deleted" });
    } catch (e) { return err500(res, e); }
};


// ══════════════════════════════════════════════════════════════════════════════
//  COLLARS
// ══════════════════════════════════════════════════════════════════════════════
export const createCollar = async (req: AuthRequest, res: Response) => {
    try {
        const { name } = req.body;
        const scope = getScope(req);
        const existing = await collarModel.findOne({ name: { $regex: new RegExp(`^${name}$`, "i") }, createdBy: scope.createdBy });
        if (existing) return res.status(200).json({ success: true, message: "Collar already exists", collar: existing });
        const collar = await collarModel.create({ name, ...scope });
        broadcastUpdate("catalog_update", scope.createdBy?.toString());
        return res.status(201).json({ success: true, message: "Collar created", collar });
    } catch (e) { return err500(res, e); }
};

export const getAllCollars = async (_req: AuthRequest, res: Response) => {
    try {
        const collars = await collarModel.find().sort({ name: 1 });
        return res.status(200).json({ success: true, collars });
    } catch (e) { return err500(res, e); }
};

export const updateCollar = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { name, isActive } = req.body;
        const collar = await collarModel.findByIdAndUpdate(id, { $set: { name, isActive } }, { new: true, runValidators: true });
        if (!collar) return res.status(404).json({ success: false, message: "Collar not found" });
        broadcastUpdate("catalog_update");
        return res.status(200).json({ success: true, message: "Collar updated", collar });
    } catch (e) { return err500(res, e); }
};

export const deleteCollar = async (req: AuthRequest, res: Response) => {
    try {
        await collarModel.findByIdAndDelete(req.params.id);
        broadcastUpdate("catalog_update");
        return res.status(200).json({ success: true, message: "Collar deleted" });
    } catch (e) { return err500(res, e); }
};


// ══════════════════════════════════════════════════════════════════════════════
//  SELLER SIZE CHART
// ══════════════════════════════════════════════════════════════════════════════
export const upsertSellerSizeChart = async (req: AuthRequest, res: Response) => {
    try {
        const sellerId = req.user!.id;
        const file = req.file as any;
        const { label } = req.body;

        if (!file) return res.status(400).json({ success: false, message: "Size chart image is required" });

        const uploaded = await uploadFile({
            file: file.buffer,
            filename: file.originalname,
            folder: "/snitch/size-charts",
        });

        const chart = await sellerSizeChartModel.findOneAndUpdate(
            { seller: sellerId },
            { $set: { imageUrl: uploaded.url, label: label || "Size Chart" } },
            { new: true, upsert: true }
        );

        return res.status(200).json({ success: true, message: "Size chart saved", chart });
    } catch (e) { return err500(res, e); }
};

export const getSellerSizeChart = async (req: AuthRequest, res: Response) => {
    try {
        const sellerId = req.user!.id;
        const chart = await sellerSizeChartModel.findOne({ seller: sellerId });
        return res.status(200).json({ success: true, chart: chart || null });
    } catch (e) { return err500(res, e); }
};

export const deleteSellerSizeChart = async (req: AuthRequest, res: Response) => {
    try {
        const sellerId = req.user!.id;
        await sellerSizeChartModel.findOneAndDelete({ seller: sellerId });
        return res.status(200).json({ success: true, message: "Size chart deleted" });
    } catch (e) { return err500(res, e); }
};
