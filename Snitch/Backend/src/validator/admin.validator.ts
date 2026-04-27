import { body, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

function validateRequest(req: Request, res: Response, next: NextFunction) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: "Validation error", errors: errors.array() });
    }
    next();
}

// Returns the correct validation chain based on entity type
export function adminValidator(entity: "category" | "unit" | "size" | "color" | "brand") {
    const rules = {
        category: [
            body("name").notEmpty().withMessage("Category name is required").trim(),
            body("description").optional().trim(),
        ],
        unit: [
            body("name").notEmpty().withMessage("Unit name is required").trim(),
            body("abbreviation").notEmpty().withMessage("Abbreviation is required").trim(),
        ],
        size: [
            body("name").notEmpty().withMessage("Size name is required").trim(),
            body("sortOrder").optional().isInt({ min: 0 }).withMessage("Sort order must be a non-negative integer"),
        ],
        color: [
            body("name").notEmpty().withMessage("Color name is required").trim(),
            body("hexCode")
                .notEmpty().withMessage("Hex code is required")
                .matches(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/)
                .withMessage("Invalid hex code — must be #RGB or #RRGGBB"),
        ],
        brand: [
            body("name").notEmpty().withMessage("Brand name is required").trim(),
            body("website").optional({ checkFalsy: true }).isURL().withMessage("Invalid website URL"),
        ],
    };

    return [...(rules[entity] || []), validateRequest];
}
