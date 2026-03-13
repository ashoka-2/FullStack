import userModel from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../services/mail.service.js";

export async function registerUser(req, res) {
    const { username, email, password } = req.body;


    const userExists = await userModel.findOne(
       { $or: [
        {username },
        {email }
            ]
    })

    if(userExists){
        return res.status(400).json({
            success: false,
            message: "User with the same username or email already exists",
            err:"user already exists"
        })
    }


   
    const user = await userModel.create({
        username,
        email,
        password
    })
     

    await sendEmail({
        to:email,
        subject:"Welcome to Perplexity - Please verify your email",
        html:`
        <h1>Hi ${username}</h1>
        <h1>Welcome to <strong>Perplexity</strong></h1>
        <p>
        Thank you for registering on our platform. Please verify your email to start using Perplexity and explore the amazing features we offer.
        </p>
        <p>Best regards,<br>The Perplexity Team</p>
        `
    })



    // if (!user) {
    //     return res.status(400).json({
    //         success: false,
    //         message: "User registration failed"
    //     })
    // }

    // const emailVerificationToken = jwt.sign({
    //     email:user.email
    // },process.env.JWT_SECRET,{
    //     expiresIn:"3d"
    // })






    res.status(200).json({
        success: true,
        message: "User registered successfully",
        user:{
            id:user._id,
            username:user.username,
            email:user.email,
        }
    })
}


export async function loginUser(req,res){
    const {username,email,password} = req.body;

    const user = await userModel.findOne({
        $or:[
            {username},
            {email}
        ]
    }).select("+password")

    if(!user){
        return res.status(400).json({
            success:false,
            message:"Invalid credentials",
            err:"user not found"
        })
    }

    const isPasswordMatched = await user.comparePassword(password)

    if(!isPasswordMatched){
        return res.status(400).json({
            success:false,
            message:"Invalid credentials",
            err:"incorrect password"
        })
    }


    if(!user.verified){
        return res.status(400).json({
            message:"Please verify your email to login",
            success:false,
            err:"email not verified"
        })
    }

    const token = jwt.sign({
        id:user._id,
        username:user.username,
        email:user.email
    },process.env.JWT_SECRET,{
        expiresIn:"7d"
    })

    res.cookie("token",token)

    res.status(200).json({
        success: true,
        message: "User logged in successfully",
        user
    })

}