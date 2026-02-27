const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: [true, "Username already exists"],
        required: [true, "Username is required"],
        trim: true 
    },
    fullName: {
        type: String,
        default: "" 
    },
    email: {
        type: String,
        unique: [true, "Email already exists"],
        required: [true, "Email is required"],
        lowercase: true
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        select: false,
    },
    bio: {
        type: String,
        default: ""
    },
    profilePic: {
        type: String,
        default: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"
    },
    
}, { timestamps: true }); 

const userModel = mongoose.model("users", userSchema);

module.exports = userModel;