import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
    username:{
        type:String,
        required:[true,"Username is required"],
        unique:[true,"Username already exists"],
        trim:true,
    },
    email:{
        type:String,
        unique:[true,"Email already exists"],
        required:[true,"Email is required"],
        trim:true,
        lowercase:true
    },
    password:{
        type:String,
        required:[true,"Password is required"],
        select:false,
        
    },
    profilePic:{
        type:String,
        default:"https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png",
    },
    verified:{
        type:Boolean,
        default:false
    },
    instagram: {
        accessToken: { type: String, select: false }, // Sensitive data, not returned by default
        userId: String,
        isConnected: { type: Boolean, default: false }
    }
},{timestamps:true})

userSchema.pre('save',async function(){
    if(!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password,10);
})

userSchema.methods.comparePassword = async function(candidatePassword){
    return await bcrypt.compare(candidatePassword,this.password);
}

const userModel = mongoose.model("User",userSchema);


export default userModel;