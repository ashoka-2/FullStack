const mongoose = require('mongoose');



const userSchema = new mongoose.Schema({
    username:{
        type:String,
        unique:[true,"Username already Exists"],
        required:[true,"Username is required"]
    },
    email:{
        type:String,
        unique:[true,"Email already Exists"],
        required:[true,"Email is required"]
    },
    password:{
        type:String,
        required:[true,"Password is required"]
    },
    bio:String,
    profilePic:{
        type:String,
        default:"https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"
    },

})

const user = mongoose.model("user",userSchema);

module.exports = user;

