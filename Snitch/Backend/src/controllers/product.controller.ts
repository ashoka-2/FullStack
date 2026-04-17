import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import productModel from "../models/product.model.js";
import { uploadFile } from "../services/imagekit.service.js";
import { log } from "console";


export const createProduct = async (req: AuthRequest, res: Response) => {
    try {
        const { title, description, priceAmount, priceCurrency } = req.body;

        // Image upload logic
        const imageFiles = req.files as any[] || [];
        const uploadedImages = await Promise.all(
            imageFiles.map(async (file: any) => {
                return await uploadFile({
                    buffer: file.buffer,
                    filename: file.originalname,
                    folder: "/snitch/products",
                });
            })
        );

        if (!title || !description || !priceAmount || !priceCurrency) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const sellerId = req.user?.id;
        if (!sellerId) {
            return res.status(401).json({ message: "Not authenticated" });
        }

        const product = await productModel.create({
            title,
            description,
            price: {
                amount: Number(priceAmount),
                currency: priceCurrency || "INR",
            },
            seller: sellerId,
            images: uploadedImages.map((img: any) => ({ url: img.url })),
        });


        return res.status(201).json({
            success: true,
            message: "Product created successfully",
            product,
        });
    } catch (err) {
        console.error("Create Product Error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};



export const getAllProducts = async (req:Request,res:Response)=>{
    const products = await productModel.find();

    if(!products){
        return res.status(404).json({message:"No products found"});
    }

    return res.status(200).json({
        success: true,
        products,
    });
}


export const getSellersAllProducts = async (req:AuthRequest,res:Response)=>{
    const sellerId = req.user?.id;
    if(!sellerId){
        return res.status(401).json({
            message:"Not authenticated",
            success:false,
            err:"Not authenticated"
        })
    }

    const products = await productModel.find({seller:sellerId});

    if(!products){
        return res.status(404).json({
            message:"No products found",
            success:false,
            err:"No products found"
        })
    }

    return res.status(200).json({
        success: true,
        products,
    });

}