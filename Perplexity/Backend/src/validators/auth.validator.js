import {body,validationResult} from "express-validator";


export function validate(req,res,next){

    const errors = validationResult(req);

if(!errors.isEmpty()){
    return res.status(400).json({
        success:false,
        errors:errors.array()
    })
}

next();
}


export const registerValidator = [
    body("username")
        .trim()
        .notEmpty().withMessage("Username is required")
        .isLength({min:3,max:30}).withMessage("Username must be between 3 and 30 characters")
        .matches(/^[a-zA-Z0-9_]+$/).withMessage("Username can only contain letters, numbers, and underscores"),
    body("email")
        .trim()
        .notEmpty().withMessage("Email is required")
        .isEmail().withMessage("Invalid email format"),
    
    body("password")
        .notEmpty().withMessage("Password is required")
        .isLength({min:6}).withMessage("Password must be at least 6 characters long")
        .matches(/[A-Z]/).withMessage("Password must contain at least one uppercase letter")
        .matches(/[0-9]/).withMessage("Password must contain at least one number"),

        validate
];



export const loginValidator = [
    body("email")
        .trim()
        .notEmpty().withMessage("Email is required")
        .isEmail().withMessage("Invalid email format"),
    body("password")
        .notEmpty().withMessage("Password is required"),

        
        validate
]