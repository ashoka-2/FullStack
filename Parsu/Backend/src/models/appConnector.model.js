import mongoose from "mongoose";

/**
 * Master Registry of all apps & connectors created by developers.
 * Whenever developers create or integrate a new app, adding it here
 * automatically registers it in the database and makes it visible in
 * the Admin Console for instant locking/unlocking and status management.
 */
export const DEVELOPER_APPS = [
    {
        appId: "instagram",
        name: "Instagram",
        category: "Social Media",
        description: "Share photos, reels, and stories with automated publishing",
        developer: "Meta Platforms",
        setupUrl: "https://developers.facebook.com/",
        supportedActions: ["photos", "videos", "reels"],
        defaultStatus: "active"
    },
    {
        appId: "facebook",
        name: "Facebook",
        category: "Social Media",
        description: "Post updates, photos, and videos to pages and profiles",
        developer: "Meta Platforms",
        setupUrl: "https://developers.facebook.com/",
        supportedActions: ["photos", "videos", "posts"],
        defaultStatus: "active"
    },
    {
        appId: "pinterest",
        name: "Pinterest",
        category: "Social Media",
        description: "Pin images, graphics, and link boards to Pinterest",
        developer: "Pinterest Inc.",
        setupUrl: "https://developers.pinterest.com/",
        supportedActions: ["pins", "photos", "boards"],
        defaultStatus: "active"
    },
    {
        appId: "twitter",
        name: "X (Twitter)",
        category: "Social Media",
        description: "Publish tweets, threads, and media to your X profile",
        developer: "X Corp.",
        setupUrl: "https://developer.x.com/",
        supportedActions: ["tweets", "photos", "threads"],
        defaultStatus: "active"
    },
    {
        appId: "tiktok",
        name: "TikTok",
        category: "Social Media",
        description: "Publish short-form videos directly to your TikTok feed",
        developer: "ByteDance",
        setupUrl: "https://developers.tiktok.com/",
        supportedActions: ["videos", "short-form"],
        defaultStatus: "active"
    },
    {
        appId: "linkedin",
        name: "LinkedIn",
        category: "Professional Network",
        description: "Share professional articles, posts, and media updates",
        developer: "Microsoft Corp.",
        setupUrl: "https://www.linkedin.com/developers/",
        supportedActions: ["posts", "articles", "photos"],
        defaultStatus: "active"
    },
    {
        appId: "youtube",
        name: "YouTube",
        category: "Video & Streaming",
        description: "Upload long-form videos and short clips to YouTube channels",
        developer: "Google LLC",
        setupUrl: "https://console.cloud.google.com/",
        supportedActions: ["videos", "shorts"],
        defaultStatus: "active"
    },
    {
        appId: "gmail",
        name: "Gmail",
        category: "Productivity & Workspace",
        description: "Connect personal Gmail to send, draft, and automate emails",
        developer: "Google LLC",
        setupUrl: "https://console.cloud.google.com/",
        supportedActions: ["send emails", "read inbox", "drafts"],
        defaultStatus: "active"
    },
    {
        appId: "google_calendar",
        name: "Google Calendar",
        category: "Productivity & Workspace",
        description: "Schedule meetings, inspect events, and manage personal calendar",
        developer: "Google LLC",
        setupUrl: "https://console.cloud.google.com/",
        supportedActions: ["events", "meetings", "reminders"],
        defaultStatus: "active"
    },
    {
        appId: "google_drive",
        name: "Google Drive",
        category: "Cloud Storage & Workspace",
        description: "Access, upload, and organize cloud files on Google Drive",
        developer: "Google LLC",
        setupUrl: "https://console.cloud.google.com/",
        supportedActions: ["cloud files", "docs", "backups"],
        defaultStatus: "active"
    }
];

const appConnectorSchema = new mongoose.Schema({
    appId: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    name: {
        type: String,
        required: true
    },
    category: {
        type: String,
        default: "General"
    },
    description: {
        type: String,
        default: ""
    },
    developer: {
        type: String,
        default: "Parsu Ecosystem"
    },
    setupUrl: {
        type: String,
        default: ""
    },
    supportedActions: {
        type: [String],
        default: []
    },
    status: {
        type: String,
        enum: ["active", "locked", "coming_soon", "maintenance"],
        default: "active",
        index: true
    },
    isLocked: {
        type: Boolean,
        default: false,
        index: true
    },
    lockReason: {
        type: String,
        default: ""
    },
    badgeText: {
        type: String,
        default: ""
    },
    lockedAt: {
        type: Date
    },
    lockedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, { timestamps: true });

/**
 * Ensures all apps registered by developers exist in the database.
 * Preserves admin custom lock/unlock statuses, reasons, and badges.
 */
appConnectorSchema.statics.syncDeveloperApps = async function() {
    const results = [];
    for (const app of DEVELOPER_APPS) {
        const isDefaultLocked = app.defaultStatus !== "active";
        const doc = await this.findOneAndUpdate(
            { appId: app.appId },
            {
                $setOnInsert: {
                    appId: app.appId,
                    name: app.name,
                    category: app.category,
                    description: app.description,
                    developer: app.developer,
                    setupUrl: app.setupUrl,
                    supportedActions: app.supportedActions,
                    status: app.defaultStatus || "active",
                    isLocked: isDefaultLocked,
                    lockReason: isDefaultLocked ? "Coming Soon" : "",
                    badgeText: isDefaultLocked ? "Coming Soon" : ""
                }
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        results.push(doc);
    }
    return results;
};

const AppConnector = mongoose.model("AppConnector", appConnectorSchema);
export default AppConnector;
