import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import { uploadFile } from "../services/imagekit.service.js";
import { broadcastUpdate } from "../services/socket.service.js";
import categoryModel from "../models/category.model.js";
import unitModel from "../models/unit.model.js";
import sizeModel from "../models/size.model.js";
import colorModel from "../models/color.model.js";
import brandModel from "../models/brand.model.js";
import patternModel from "../models/pattern.model.js";
import fitModel from "../models/fit.model.js";
import materialModel from "../models/material.model.js";
import collarModel from "../models/collar.model.js";

// ─── Helper ────────────────────────────────────────────────────────────────
const err500 = (res: Response, e: unknown) => {
    console.error(e);
    return res.status(500).json({ success: false, message: "Server error" });
};

// ══════════════════════════════════════════════════════════════════════════
//  CATEGORIES
// ══════════════════════════════════════════════════════════════════════════
export const createCategory = async (req: AuthRequest, res: Response) => {
    try {
        const { name, description } = req.body;
        const file = req.file as any;

        let image: string | undefined;
        if (file) {
            const uploaded = await uploadFile({
                file: file.buffer,
                filename: file.originalname,
                folder: "/snitch/categories",
            });
            image = uploaded.url;
        }

        const categoryData: any = { name, description };
        if (image) categoryData.image = image;

        const category = await categoryModel.create(categoryData);
        broadcastUpdate("catalog_update");
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

        const update: any = { ...(name && { name }), ...(description !== undefined && { description }), ...(isActive !== undefined && { isActive }) };

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
        const { id } = req.params;
        await categoryModel.findByIdAndDelete(id);
        broadcastUpdate("catalog_update");
        return res.status(200).json({ success: true, message: "Category deleted" });
    } catch (e) { return err500(res, e); }
};


// ══════════════════════════════════════════════════════════════════════════
//  UNITS
// ══════════════════════════════════════════════════════════════════════════
export const createUnit = async (req: AuthRequest, res: Response) => {
    try {
        const { name, abbreviation, description } = req.body;
        const unit = await unitModel.create({ name, abbreviation, description });
        broadcastUpdate("catalog_update");
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


// ══════════════════════════════════════════════════════════════════════════
//  SIZES
// ══════════════════════════════════════════════════════════════════════════
export const createSize = async (req: AuthRequest, res: Response) => {
    try {
        const { name, category, sortOrder } = req.body;
        const size = await sizeModel.create({ name, category: category || null, sortOrder: sortOrder || 0 });
        broadcastUpdate("catalog_update");
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


// ══════════════════════════════════════════════════════════════════════════
//  COLORS
// ══════════════════════════════════════════════════════════════════════════
export const createColor = async (req: AuthRequest, res: Response) => {
    try {
        const { name, hexCode } = req.body;
        const color = await colorModel.create({ name, hexCode });
        broadcastUpdate("catalog_update");
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


// ══════════════════════════════════════════════════════════════════════════
//  BRANDS
// ══════════════════════════════════════════════════════════════════════════
export const createBrand = async (req: AuthRequest, res: Response) => {
    try {
        const { name, description, website } = req.body;
        const file = req.file as any;

        let logo: string | undefined;
        if (file) {
            const uploaded = await uploadFile({ file: file.buffer, filename: file.originalname, folder: "/snitch/brands" });
            logo = uploaded.url;
        }

        const brandData: any = { name, description, website };
        if (logo) brandData.logo = logo;

        const brand = await brandModel.create(brandData);
        broadcastUpdate("catalog_update");
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


// ══════════════════════════════════════════════════════════════════════════
//  PATTERNS
// ══════════════════════════════════════════════════════════════════════════
export const createPattern = async (req: AuthRequest, res: Response) => {
    try {
        const { name } = req.body;
        const pattern = await patternModel.create({ name });
        broadcastUpdate("catalog_update");
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


// ══════════════════════════════════════════════════════════════════════════
//  FITS
// ══════════════════════════════════════════════════════════════════════════
export const createFit = async (req: AuthRequest, res: Response) => {
    try {
        const { name } = req.body;
        const fit = await fitModel.create({ name });
        broadcastUpdate("catalog_update");
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


// ══════════════════════════════════════════════════════════════════════════
//  MATERIALS
// ══════════════════════════════════════════════════════════════════════════
export const createMaterial = async (req: AuthRequest, res: Response) => {
    try {
        const { name } = req.body;
        const material = await materialModel.create({ name });
        broadcastUpdate("catalog_update");
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


// ══════════════════════════════════════════════════════════════════════════
//  COLLARS
// ══════════════════════════════════════════════════════════════════════════
export const createCollar = async (req: AuthRequest, res: Response) => {
    try {
        const { name } = req.body;
        const collar = await collarModel.create({ name });
        broadcastUpdate("catalog_update");
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
