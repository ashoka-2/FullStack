import mongoose, { Schema, Document } from "mongoose";

// Default content constants for Legal Pages
export const DEFAULT_PRIVACY_POLICY = `<h2><strong>1. Information We Collect</strong></h2>
<p>We collect personal information that you provide to us, such as your name, shipping address, email address, phone number, and payment information when you make a purchase on Snitch.</p>

<h2><strong>2. How We Use Your Information</strong></h2>
<p>We use your information to process transactions, manage your account, deliver products, communicate with you about orders and promotions, and improve our website and services.</p>

<h2><strong>3. Data Security</strong></h2>
<p>We implement a variety of security measures, including SSL encryption and secure payment gateways, to maintain the safety of your personal information.</p>

<h2><strong>4. Cookies</strong></h2>
<p>We use cookies to enhance your browsing experience, analyze site traffic, and understand user behavior to deliver personalized recommendations.</p>

<h2><strong>5. Third-Party Disclosures</strong></h2>
<p>We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties except to trusted partners who assist us in operating our website and processing payments.</p>`;

export const DEFAULT_RETURN_POLICY = `<h2><strong>1. Return & Exchange Window</strong></h2>
<p>We offer a hassle-free 15-day return and exchange policy from the date of delivery. Items must be unworn, unwashed, and in their original packaging with all tags intact.</p>

<h2><strong>2. Refund Process</strong></h2>
<p>Once we receive and inspect your returned items, we will notify you of the approval or rejection of your refund. Approved refunds will be credited back to your original payment method within 5-7 business days.</p>

<h2><strong>3. Return Shipping</strong></h2>
<p>For convenience, we offer free reverse pickups in major locations. If your pin code is not eligible for reverse pickup, you will need to ship the item back to us, and we will reimburse shipping costs up to a specified limit.</p>

<h2><strong>4. Non-Returnable Items</strong></h2>
<p>For hygiene reasons, certain products such as innerwear, socks, and custom-tailored apparel are non-returnable unless they arrive damaged or defective.</p>`;

export const DEFAULT_TERMS_OF_SERVICE = `<h2><strong>1. Agreement to Terms</strong></h2>
<p>By accessing and shopping at Snitch, you agree to be bound by these Terms of Service. If you do not agree, please do not use our website or services.</p>

<h2><strong>2. Account & Eligibility</strong></h2>
<p>You must be at least 18 years old or browsing under parent supervision to create an account and shop. You are responsible for maintaining the confidentiality of your account credentials.</p>

<h2><strong>3. Pricing & Product Details</strong></h2>
<p>We strive to display product colors and prices as accurately as possible. However, we reserve the right to correct any pricing errors and update product availability without prior notice.</p>

<h2><strong>4. Intellectual Property</strong></h2>
<p>All content on this website, including text, graphics, logos, images, and software, is the property of Snitch and is protected by copyright and intellectual property laws.</p>

<h2><strong>5. Limitation of Liability</strong></h2>
<p>Snitch shall not be liable for any indirect, incidental, or consequential damages resulting from your use or inability to use our website or products.</p>`;

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

// Normalized interfaces
export interface IAboutSetting extends Document {
    title: string;
    content: string;
    missionStatement: string;
}

export interface IContactSetting extends Document {
    email: string;
    phone: string;
    address: string;
    mapLat: number;
    mapLng: number;
    mapZoom: number;
}

export interface IFooterSetting extends Document {
    blocks: IFooterBlock[];
    socialLinks: ISocialLink[];
    privacyPolicyLink: string;
    returnPolicyLink: string;
}

export interface ILegalSetting extends Document {
    privacyPolicy: string;
    returnPolicy: string;
    termsOfService: string;
}

// Coordinator settings interface
export interface ISiteSettings extends Document {
    about: mongoose.Types.ObjectId | IAboutSetting;
    contact: mongoose.Types.ObjectId | IContactSetting;
    footer: mongoose.Types.ObjectId | IFooterSetting;
    legal: mongoose.Types.ObjectId | ILegalSetting;
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

// Normalized Schemas
const AboutSettingSchema = new Schema(
    {
        title: { type: String, default: "Our Vision" },
        content: { type: String, default: "Snitch is a brand dedicated to redefining modern fashion." },
        missionStatement: { type: String, default: "To deliver high-quality, sustainable fashion to everyone." },
    },
    { timestamps: true }
);

const ContactSettingSchema = new Schema(
    {
        email: { type: String, default: "hello@snitch.co" },
        phone: { type: String, default: "+91 98765 43210" },
        address: { type: String, default: "123 Fashion Street, Mumbai 400001" },
        mapLat: { type: Number, default: 19.0760 },
        mapLng: { type: Number, default: 72.8777 },
        mapZoom: { type: Number, default: 14 },
    },
    { timestamps: true }
);

const FooterSettingSchema = new Schema(
    {
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
    { timestamps: true }
);

const LegalSettingSchema = new Schema(
    {
        privacyPolicy: { type: String, default: DEFAULT_PRIVACY_POLICY },
        returnPolicy: { type: String, default: DEFAULT_RETURN_POLICY },
        termsOfService: { type: String, default: DEFAULT_TERMS_OF_SERVICE },
    },
    { timestamps: true }
);

// Coordinator Schema
const SiteSettingsSchema: Schema = new Schema(
    {
        about: { type: Schema.Types.ObjectId, ref: "AboutSetting", required: true },
        contact: { type: Schema.Types.ObjectId, ref: "ContactSetting", required: true },
        footer: { type: Schema.Types.ObjectId, ref: "FooterSetting", required: true },
        legal: { type: Schema.Types.ObjectId, ref: "LegalSetting", required: true }
    },
    { timestamps: true }
);

export const AboutSetting = mongoose.model<IAboutSetting>("AboutSetting", AboutSettingSchema);
export const ContactSetting = mongoose.model<IContactSetting>("ContactSetting", ContactSettingSchema);
export const FooterSetting = mongoose.model<IFooterSetting>("FooterSetting", FooterSettingSchema);
export const LegalSetting = mongoose.model<ILegalSetting>("LegalSetting", LegalSettingSchema);

const SiteSettings = mongoose.model<ISiteSettings>("SiteSettings", SiteSettingsSchema);
export default SiteSettings;

