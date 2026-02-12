const userModel = require('../model/user.model');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');



async function registerController(req, res) {
    const { username, email, password, bio, profilePic } = req.body;

    const isUserAlreadyExists = await userModel.findOne({
        $or: [
            { email },
            { username }
        ]
    })

    if (isUserAlreadyExists) {
        return res.status(409).json({
            message: "User already exists , " + (isUserAlreadyExists.email == email ? "Email already exists" : "Username already Exists"),
        })
    }

    const hash = crypto.createHash('sha256').update(password).digest('hex');


    const user = await userModel.create({
        username,
        email,
        bio,
        profilePic,
        password: hash
    })




    const token = jwt.sign({
        id: user._id,

    }, process.env.JWT_SECRET, {
        expiresIn: '1d'
    })

    res.cookie("token", token)

    res.status(201).json({
        message: "User registered successfully",
        user: {
            username: user.username,
            email: user.email,
            bio: user.bio,
            profilePic: user.profilePic
        }
    })

}


async function loginController(req, res) {
    const { username, email, password } = req.body;

    const user = await userModel.findOne({
        $or: [
            { email: email },
            { username: username }
        ]
    })

    if (!user) {
        return res.status(404).json({
            message: "User not found"
        })
    }

    const hash = crypto.createHash('sha256').update(password).digest('hex');

    const isPasswordValid = hash == user.password;

    if (!isPasswordValid) {
        return res.status(401).json({
            message: "Invalid Password"
        })
    }

    const token = jwt.sign({
        id: user._id
    }, process.env.JWT_SECRET, { expiresIn: '1d' })

    res.cookie("token", token)


    res.status(200).json({
        message: "Login successfull",
        user: {
            username: user.username,
            email: user.email,
            bio: user.bio,
            profilePic: user.profilePic
        }
    })


}







module.exports = {
    loginController,
    registerController
}