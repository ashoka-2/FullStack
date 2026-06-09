import mongoose, { Document, Model, Schema } from "mongoose";

export interface IPopup extends Document {
    title: string;
    imageUrl?: string;
    deviceImages?: {
        desktop?: string;
        tablet?: string;
        mobile?: string;
        tv?: string;
    };
    imageFilter: {
        blur: number;
        brightness: number;
        contrast: number;
        grayscale: number;
        sepia: number;
    };
    text?: string;
    textColor: string;
    fontSize: string;
    fontWeight: string;
    textAlign: string;
    backgroundColor: string;
    gradientColor?: string;
    gradientDirection: string;
    isGradient: boolean;
    size: string;
    borderRadius: string;
    linkUrl?: string;
    isActive: boolean;
    isDraft: boolean;
    metadata?: string;
    displayTime?: number;
    createdAt: Date;
    updatedAt: Date;
}

const popupSchema = new Schema<IPopup>(
    {
        title: {
            type: String,
            required: [true, "Popup title is required"],
            trim: true,
        },
        imageUrl: {
            type: String,
        },
        imageFilter: {
            blur: { type: Number, default: 0 },
            brightness: { type: Number, default: 100 },
            contrast: { type: Number, default: 100 },
            grayscale: { type: Number, default: 0 },
            sepia: { type: Number, default: 0 },
        },
        text: {
            type: String,
            trim: true,
        },
        textColor: {
            type: String,
            default: "#ffffff",
        },
        fontSize: {
            type: String,
            default: "lg", // sm, base, lg, xl, 2xl, 3xl, 4xl
        },
        fontWeight: {
            type: String,
            default: "normal", // normal, medium, bold, black
        },
        textAlign: {
            type: String,
            default: "center", // left, center, right
        },
        backgroundColor: {
            type: String,
            default: "#111111",
        },
        gradientColor: {
            type: String,
        },
        gradientDirection: {
            type: String,
            default: "to-r", // to-r, to-b, to-tr, radial
        },
        isGradient: {
            type: Boolean,
            default: false,
        },
        size: {
            type: String,
            default: "md", // sm, md, lg, xl, full
        },
        borderRadius: {
            type: String,
            default: "2xl", // none, md, lg, 2xl, full
        },
        linkUrl: {
            type: String,
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: false,
        },
        isDraft: {
            type: Boolean,
            default: true,
        },
        metadata: {
            type: String,
        },
        displayTime: {
            type: Number,
            default: 5,
        },
        deviceImages: {
            desktop: { type: String },
            tablet: { type: String },
            mobile: { type: String },
            tv: { type: String },
        },
    },
    { timestamps: true }
);

const popupModel: Model<IPopup> = mongoose.model<IPopup>("Popup", popupSchema);

export default popupModel;
