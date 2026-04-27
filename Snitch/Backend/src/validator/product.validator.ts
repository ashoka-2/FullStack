import { body, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

function validateRequest(req: Request, res: Response, next: NextFunction) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: "Validation error", errors: errors.array() });
    }
    next();
}

export const createProductValidator = [
    body("title")
        .notEmpty().withMessage("Title is required")
        .trim(),

    body("description")
        .notEmpty().withMessage("Description is required"),

    body("priceAmount")
        .notEmpty().withMessage("Price amount is required")
        .isNumeric().withMessage("Price amount must be a number")
        .custom((val) => Number(val) >= 0).withMessage("Price cannot be negative"),

    body("priceCurrency")
        .notEmpty().withMessage("Price currency is required")
        .isIn(["USD", "EUR", "GBP", "JPY", "INR"]).withMessage("Invalid currency"),

    body("category")
        .notEmpty().withMessage("Category is required")
        .trim(),

    body("stock")
        .notEmpty().withMessage("Stock quantity is required")
        .isInt({ min: 0 }).withMessage("Stock must be a non-negative integer"),

    // Optional fields — validate only if present
    body("saleAmount")
        .optional()
        .isNumeric().withMessage("Sale price must be a number")
        .custom((val) => Number(val) >= 0).withMessage("Sale price cannot be negative"),

    body("brand")
        .optional()
        .trim(),

    body("sku")
        .optional()
        .trim(),

    body("weight")
        .optional()
        .isNumeric().withMessage("Weight must be a number")
        .custom((val) => Number(val) >= 0).withMessage("Weight cannot be negative"),

    body("status")
        .optional()
        .isIn(["draft", "active"]).withMessage("Status must be 'draft' or 'active'"),

    validateRequest,
];