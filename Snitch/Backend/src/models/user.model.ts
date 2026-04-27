import mongoose, { Document, Model, Schema } from "mongoose";
import bcrypt from "bcryptjs";

// Define the User interface
export interface IUser extends Document {
    fullname: string;
    email: string;
    contact: string;
    password?: string;
    role: "buyer" | "seller" | "admin";
    isAdmin: boolean;        
    googleId?: string;
    profilePic: string;
    verified: boolean;
    comparePassword(password: string): Promise<boolean>;
}

// Define the Schema
const userSchema = new Schema<IUser>(
    {
        fullname: {
            type: String,
            required: [true, "Full name is required"],
            trim: true,
        },
        email: {
            type: String,
            unique: true,
            required: [true, "Email is required"],
            trim: true,
            lowercase: true,
        },
        contact: {
            type: String,
            unique: true,
            required: [true, "Contact is required"],
            trim: true,
        },
        password: {
            type: String,
            required: function (this: IUser) {
                return !this.googleId;
            },
            select: false,
        },
        role: {
            type: String,
            enum: ["buyer", "seller", "admin"],
            default: "buyer",
        },
        isAdmin: {
            type: Boolean,
            default: false,  // Sync with role === 'admin'
        },
        googleId: {
            type: String,
        },
        profilePic: {
            type: String,
            default: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png",
        },
        verified: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// Hash password before saving
userSchema.pre<IUser>("save", async function () {
    if (!this.isModified("password")) return;

    if (this.password) {
        this.password = await bcrypt.hash(this.password, 10);
    }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
    if (!this.password) return false;
    return await bcrypt.compare(password, this.password);
};

// Create the model
const userModel: Model<IUser> = mongoose.model<IUser>("User", userSchema);

export default userModel;