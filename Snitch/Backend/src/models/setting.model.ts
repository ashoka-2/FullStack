import mongoose, { Schema, Document } from "mongoose";

export interface ISocialLink {
    id: string;
    platform: string;
    icon: string;
    url: string;
}

export interface IFooterBlock {
    id: string;
    type: "brand" | "links" | "socials" | "legal" | "newsletter";
    visible: boolean;
}

export interface ISiteSettings extends Document {
    about: {
        title: string;
        content: string;
        missionStatement: string;
    };
    contact: {
        email: string;
        phone: string;
        address: string;
        mapLat: number;
        mapLng: number;
        mapZoom: number;
    };
    footer: {
        blocks: IFooterBlock[];
        socialLinks: ISocialLink[];
        privacyPolicyLink: string;
        returnPolicyLink: string;
    };
}

const SocialLinkSchema = new Schema({
    id: { type: String, required: true },
    platform: { type: String, required: true },
    icon: { type: String, default: "ri-link" },
    url: { type: String, required: true },
}, { _id: false });

const FooterBlockSchema = new Schema({
    id: { type: String, required: true },
    type: { type: String, enum: ["brand", "links", "socials", "legal", "newsletter"], required: true },
    visible: { type: Boolean, default: true },
}, { _id: false });

const SiteSettingsSchema: Schema = new Schema(
    {
        about: {
            title: { type: String, default: "Our Vision" },
            content: { type: String, default: "Snitch is a brand dedicated to redefining modern fashion." },
            missionStatement: { type: String, default: "To deliver high-quality, sustainable fashion to everyone." },
        },
        contact: {
            email: { type: String, default: "hello@snitch.co" },
            phone: { type: String, default: "+91 98765 43210" },
            address: { type: String, default: "123 Fashion Street, Mumbai 400001" },
            mapLat: { type: Number, default: 19.0760 },
            mapLng: { type: Number, default: 72.8777 },
            mapZoom: { type: Number, default: 14 },
        },
        footer: {
            blocks: {
                type: [FooterBlockSchema],
                default: [
                    { id: "brand", type: "brand", visible: true },
                    { id: "links", type: "links", visible: true },
                    { id: "socials", type: "socials", visible: true },
                    { id: "legal", type: "legal", visible: true },
                ],
            },
            socialLinks: {
                type: [SocialLinkSchema],
                default: [
                    { id: "instagram", platform: "Instagram", icon: "ri-instagram-line", url: "https://instagram.com" },
                    { id: "twitter", platform: "X / Twitter", icon: "ri-twitter-x-line", url: "https://twitter.com" },
                    { id: "facebook", platform: "Facebook", icon: "ri-facebook-circle-line", url: "https://facebook.com" },
                ],
            },
            privacyPolicyLink: { type: String, default: "/privacy" },
            returnPolicyLink: { type: String, default: "/returns" },
        },
    },
    { timestamps: true }
);

const SiteSettings = mongoose.model<ISiteSettings>("SiteSettings", SiteSettingsSchema);
export default SiteSettings;
