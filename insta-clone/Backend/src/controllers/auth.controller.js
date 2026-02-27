const userModel = require('../model/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const followModel = require('../model/follow.model')

const ImageKit = require("@imagekit/nodejs");
const { toFile } = require("@imagekit/nodejs");

const imagekit = new ImageKit({
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
});

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

    const hash = await bcrypt.hash(password, 10);


    const user = await userModel.create({
        username,
        email,
        bio,
        profilePic,
        password: hash
    })




    const token = jwt.sign({
        id: user._id,
        username: user.username

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
    }).select("+password")

    if (!user) {
        return res.status(404).json({
            message: "User not found"
        })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
        return res.status(401).json({
            message: "Invalid Password"
        })
    }

    const token = jwt.sign({
        id: user._id,username: user.username
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


async function getMeController(req, res) {
    try {
        const userId = req.user.id;
        const user = await userModel.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const followersCount = await followModel.countDocuments({
            followee: user._id,
            status: "accepted"
        });

        const followingCount = await followModel.countDocuments({
            follower: user._id,
            status: "accepted"
        });

        res.status(200).json({
            message: "User retrieved successfully",
            user: {
                _id: user._id,
                username: user.username,
                fullName: user.fullName || "",
                email: user.email,
                bio: user.bio || "",
                profilePic: user.profilePic || "",
                followersCount: followersCount,
                followingCount: followingCount
            }
        });
        
    } catch (error) {
        res.status(500).json({ message: "Server error while fetching user details" });
    }
}


async function logoutController(req, res) {
    try {
        res.clearCookie('token');
        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        res.status(500).json({ message: "Logout failed" });
    }
}





async function editProfileController(req, res) {
    try {
        const userId = req.user.id;
        const { username, fullName, bio } = req.body; 
        
        let updateData = { fullName, bio };
        if (username) updateData.username = username;

        if (req.file) {
            const file = await imagekit.files.upload({
                file: await toFile(Buffer.from(req.file.buffer), 'file'),
                fileName: req.file.originalname,
                folder: "cohort/insta-clone/profiles" 
            });
            updateData.profilePic = file.url; 
        }

        const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        ).select("-password");

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            message: "Profile updated successfully",
            user: updatedUser
        });
    } catch (error) {
        console.error("Edit Profile Error:", error);
        if (error.code === 11000) {
            return res.status(400).json({ message: "Username already taken!" });
        }
        res.status(500).json({ message: "Error updating profile" });
    }
}




module.exports = {
    loginController,
    registerController,
    getMeController,
    logoutController,
    editProfileController
}