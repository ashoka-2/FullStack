import mongoose from "mongoose";
import { generateChatTitle, generateResponse, generateSuggestions } from "../services/ai.service.js";
import chatModel from "../models/chat.model.js";
import userModel from "../models/user.model.js";
import messageModel from "../models/message.model.js";
import documentModel from "../models/document.model.js";
import { uploadFile } from "../services/imagekit.service.js";
import { getIO } from "../sockets/server.socket.js";
import { executeModelChatStream, doesModelSupportVision, getModelDisplayName } from "../services/model.service.js";
import { decryptKey } from "../utils/encryption.utils.js";
import { generateEmbedding, generateEmbeddings, chunkText, cosineSimilarity } from "../services/embedding.service.js";
import { extractTextFromPdf } from "../services/pdf.service.js";
import { extractAndStoreMemory } from "../services/memory.service.js";
import fs from "fs";
import path from "path";

// Cached workspace skills from .agents/skills
let cachedWorkspaceSkills = null;
let lastSkillsReadTime = 0;

function getWorkspaceSkills() {
    const now = Date.now();
    if (cachedWorkspaceSkills && (now - lastSkillsReadTime < 60000)) {
        return cachedWorkspaceSkills;
    }

    const candidateDirs = [
        path.resolve(process.cwd(), ".agents/skills"),
        path.resolve(process.cwd(), "../.agents/skills"),
        "d:/FullStack/Parsu/.agents/skills"
    ];

    let skillsDir = null;
    for (const dir of candidateDirs) {
        try {
            if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
                skillsDir = dir;
                break;
            }
        } catch (e) {}
    }

    if (!skillsDir) {
        cachedWorkspaceSkills = [];
        return [];
    }

    try {
        const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
        const skills = [];

        for (const entry of entries) {
            if (!entry.isDirectory()) continue;
            const skillPath = path.join(skillsDir, entry.name);
            const skillMdPath = path.join(skillPath, "SKILL.md");

            if (fs.existsSync(skillMdPath)) {
                try {
                    const content = fs.readFileSync(skillMdPath, "utf-8");
                    let name = entry.name;
                    let description = "";
                    let triggers = [entry.name, entry.name.replace(/[-_]/g, " ")];
                    let instructions = content;

                    if (content.startsWith("---")) {
                        const parts = content.split("---");
                        if (parts.length >= 3) {
                            const frontmatter = parts[1];
                            instructions = parts.slice(2).join("---").trim();
                            const nameMatch = frontmatter.match(/name:\s*([^\n]+)/);
                            if (nameMatch) name = nameMatch[1].trim();
                            const descMatch = frontmatter.match(/description:\s*([^\n]+)/);
                            if (descMatch) description = descMatch[1].trim();
                        }
                    }

                    const files = [];
                    try {
                        const subFiles = fs.readdirSync(skillPath, { withFileTypes: true });
                        for (const sf of subFiles) {
                            if (sf.isFile() && sf.name !== "SKILL.md") {
                                const fileText = fs.readFileSync(path.join(skillPath, sf.name), "utf-8");
                                if (fileText.length < 50000) {
                                    files.push({ name: sf.name, path: sf.name, content: fileText, size: fileText.length });
                                }
                            }
                        }
                    } catch (e) {}

                    skills.push({
                        _id: `ws-${name}`,
                        name,
                        description: description || `Built-in skill: ${name}`,
                        triggers,
                        instructions: instructions.slice(0, 20000),
                        files,
                        enabled: true,
                        isWorkspaceSkill: true
                    });
                } catch (e) {
                    console.warn(`[Skills] Error reading SKILL.md in ${entry.name}:`, e.message);
                }
            }
        }

        cachedWorkspaceSkills = skills;
        lastSkillsReadTime = now;
        return skills;
    } catch (err) {
        console.warn("[Skills] Error scanning workspace skills directory:", err.message);
        return [];
    }
}

// Global deduplication registry to prevent duplicate chats/messages from rapid multi-clicks or network retries
const inFlightRequests = new Map();

export async function sendMessage(req, res) {
    let dedupKey = null;
    let resolveInFlight = null;
    let rejectInFlight = null;
    try {
        const { message, chat: rawChatId } = req.body;
        let chatId = rawChatId;
        if (!chatId || chatId === "new" || chatId === "null" || chatId === "undefined" || !mongoose.Types.ObjectId.isValid(chatId)) {
            chatId = null;
        }

        const normalizedMsg = (message || "").trim();
        dedupKey = `${req.user.id}:${chatId || 'new'}:${normalizedMsg}`;

        // If an identical request from this user is already in-flight, await its result rather than spawning a duplicate chat
        if (inFlightRequests.has(dedupKey)) {
            console.warn(`[sendMessage Deduplication] Duplicate in-flight request detected for key: ${dedupKey}. Awaiting existing response...`);
            try {
                const responseData = await inFlightRequests.get(dedupKey);
                return res.status(200).json(responseData);
            } catch (err) {
                return res.status(500).json({ message: err.message || "Request failed" });
            }
        }

        const inFlightPromise = new Promise((resolve, reject) => {
            resolveInFlight = resolve;
            rejectInFlight = reject;
        });
        inFlightRequests.set(dedupKey, inFlightPromise);

        const io = getIO();
        const socketId = req.body.socketId;

        // Fetch full user record including custom keys and memory
        const fullUser = await userModel.findById(req.user.id).select("+customApiKeys.apiKey");
        if (!fullUser) {
            return res.status(404).json({ message: "User account not found." });
        }

        let targetProvider = req.body.provider || fullUser?.selectedModel?.provider || "gemini";
        let targetModelId = req.body.modelId || fullUser?.selectedModel?.modelId || "gemini-3.6-flash";
        const keyId = req.body.keyId;

        // Check if user has a custom API key for this provider (BYOK)
        let customKeyEntry = null;
        if (fullUser && fullUser.customApiKeys && fullUser.customApiKeys.length > 0) {
            customKeyEntry = fullUser.customApiKeys.find(k => 
                (keyId && k._id.toString() === keyId.toString()) ||
                (k.provider === targetProvider && (!req.body.keyName || k.name === req.body.keyName))
            );
        }

        // True if user is providing their own key for this request
        const isUsingCustomKey = Boolean(
            (customKeyEntry && customKeyEntry.apiKey && customKeyEntry.isActive !== false) ||
            (targetProvider === "gemini" && fullUser.geminiApiKey)
        );

        // General indicator if user has any active custom API key configured
        const hasActiveCustomKeys = Boolean(
            (fullUser.customApiKeys && fullUser.customApiKeys.some(k => k.isActive !== false && k.apiKey)) ||
            fullUser.geminiApiKey
        );

        // ── Free Tier Message Limit Enforcement ──
        // If a user is using their own custom API key, they can send unlimited messages without quota limits!
        const isFreeTier = fullUser.subscription?.plan === "free" && fullUser.role !== "admin";

        if (isFreeTier && !isUsingCustomKey) {
            const now = new Date();
            const lastReset = fullUser.usageQuotas?.lastQueryReset ? new Date(fullUser.usageQuotas.lastQueryReset) : new Date(0);
            const isDifferentDay = now.toDateString() !== lastReset.toDateString();

            let queriesToday = fullUser.usageQuotas?.queriesToday || 0;
            if (isDifferentDay) {
                queriesToday = 0;
                await userModel.updateOne(
                    { _id: fullUser._id },
                    { $set: { "usageQuotas.queriesToday": 0, "usageQuotas.lastQueryReset": now } }
                );
            }

            const limit = fullUser.usageQuotas?.queriesLimit || 50;
            if (queriesToday >= limit) {
                return res.status(429).json({
                    message: `Daily message quota reached (${limit}/${limit} messages used today on Free tier). Add your own custom AI model API keys in Settings to enjoy unlimited messaging, or upgrade to Pro!`,
                    limitReached: true,
                    quotaType: "messages"
                });
            }

            userModel.updateOne(
                { _id: fullUser._id },
                { $inc: { "usageQuotas.queriesToday": 1 } }
            ).catch(() => {});
        } else {
            // User is using custom API keys or paid plan: track queries for analytics without blocking
            userModel.updateOne(
                { _id: fullUser._id },
                { $inc: { "usageQuotas.queriesToday": 1 } }
            ).catch(() => {});
        }

        // Support both req.files (array) and req.file (single)
        const rawFiles = req.files && req.files.length > 0 ? req.files : (req.file ? [req.file] : []);
        const uploadedFiles = [];
        let newlyIndexedDocument = null;

        if (rawFiles.length > 0) {
            for (const f of rawFiles) {
                try {
                    let folder = "perplexity/chats";
                    const isPdf = f.mimetype === "application/pdf" || (f.originalname && f.originalname.toLowerCase().endsWith(".pdf"));
                    const isImage = f.mimetype?.startsWith("image/");
                    const isVideo = f.mimetype?.startsWith("video/");

                    if (isImage) {
                        folder = "perplexity/photos";
                    } else if (isVideo) {
                        folder = "perplexity/videos";
                    } else if (isPdf || f.mimetype?.startsWith("text/")) {
                        folder = "perplexity/documents";
                    }

                    // 1. Upload to ImageKit CDN
                    const uploaded = await uploadFile({
                        buffer: f.buffer,
                        filename: f.originalname,
                        folder
                    });

                    if (uploaded) {
                        uploaded.fileType = isImage ? "image" : isVideo ? "video" : "document";
                        uploaded.mimetype = f.mimetype;

                        // 2. If PDF, enforce RAG document quota and extract vector embeddings
                        if (isPdf) {
                            const userPlan = fullUser.subscription?.plan || "free";
                            const isUltraUser = userPlan === "ultra" || userPlan === "enterprise" || fullUser.role === "admin";
                            const isProUser = userPlan === "pro";

                            let docLimit = 2;
                            if (isUltraUser) {
                                docLimit = -1;
                            } else if (isProUser) {
                                docLimit = hasActiveCustomKeys ? 15 : 10;
                            } else {
                                docLimit = hasActiveCustomKeys ? 5 : 2;
                            }

                            if (docLimit !== -1) {
                                const now = new Date();
                                const lastReset = fullUser.usageQuotas?.lastQueryReset ? new Date(fullUser.usageQuotas.lastQueryReset) : new Date(0);
                                const isDifferentDay = now.toDateString() !== lastReset.toDateString();
                                let docsToday = isDifferentDay ? 0 : (fullUser.usageQuotas?.documentUploadsToday || 0);

                                if (docsToday >= docLimit) {
                                    return res.status(429).json({
                                        message: `Daily RAG document upload limit reached (${docsToday}/${docLimit} documents uploaded today). ${!hasActiveCustomKeys ? 'Add your custom API key in Settings to increase to ' + (isProUser ? '15' : '5') + ' uploads/day, or upgrade plan!' : 'Upgrade to Pro or Ultra for expanded upload limits!'}`,
                                        limitReached: true,
                                        quotaType: "documents"
                                    });
                                }

                                await userModel.updateOne(
                                    { _id: fullUser._id },
                                    { 
                                        $set: isDifferentDay ? { "usageQuotas.documentUploadsToday": 1, "usageQuotas.lastQueryReset": now } : {},
                                        $inc: isDifferentDay ? {} : { "usageQuotas.documentUploadsToday": 1 }
                                    }
                                );
                            }

                            try {
                                const extractedText = await extractTextFromPdf(f.buffer);
                                if (extractedText && extractedText.trim()) {
                                    const textChunks = chunkText(extractedText, 1500, 200);
                                    const embeddings = await generateEmbeddings(textChunks);

                                    const chunkDocs = textChunks.map((txt, idx) => ({
                                        text: txt,
                                        embedding: embeddings[idx] || []
                                    })).filter(c => c.embedding && c.embedding.length > 0);

                                    newlyIndexedDocument = await documentModel.create({
                                        user: req.user.id,
                                        chat: chatId || null,
                                        filename: f.originalname,
                                        originalSize: f.size,
                                        mimeType: "application/pdf",
                                        file: {
                                            url: uploaded.url,
                                            fileId: uploaded.fileId,
                                            thumbnailUrl: uploaded.thumbnailUrl || null
                                        },
                                        chunks: chunkDocs,
                                        totalChunks: chunkDocs.length
                                    });

                                    uploaded.documentId = newlyIndexedDocument._id;
                                    console.log(`📄 [PDF RAG System] Successfully indexed PDF "${f.originalname}" with ${chunkDocs.length} vector embeddings into MongoDB.`);
                                }
                            } catch (pdfErr) {
                                console.warn("⚠️ PDF text extraction/vector indexing error:", pdfErr.message);
                            }
                        }

                        uploadedFiles.push(uploaded);
                    }
                } catch (error) {
                    console.error("Individual file upload failed for", f.originalname, error);
                }
            }

            if (uploadedFiles.length === 0 && !message) {
                return res.status(500).json({ message: "File uploads failed" });
            }
        }

        const primaryFile = uploadedFiles[0] || null;
        const isIncognito = req.body.incognito === 'true' || req.body.incognito === true;
        let title = null, chat = null;

        if (chatId) {
            chat = await chatModel.findOne({ _id: chatId, user: req.user.id });
            if (!chat) {
                return res.status(404).json({ message: "Chat not found or access denied." });
            }
        } else {
            // Check if user recently submitted the exact same query in a brand-new chat within last 6s (idempotency guard)
            const recentChat = await chatModel.findOne({
                user: req.user.id,
                createdAt: { $gte: new Date(Date.now() - 6000) }
            }).sort({ createdAt: -1 });

            if (recentChat) {
                const recentFirstMsg = await messageModel.findOne({
                    chat: recentChat._id,
                    role: "user"
                }).sort({ createdAt: 1 });

                if (recentFirstMsg && recentFirstMsg.content?.trim() === normalizedMsg) {
                    console.warn(`[Backend Deduplication] Blocked duplicate chat creation for user ${req.user.id}: "${normalizedMsg}". Reusing recent chat ${recentChat._id}.`);
                    chat = recentChat;
                    chatId = recentChat._id;
                }
            }

            if (!chat) {
                const fallbackTitle = primaryFile?.fileType === "video" ? "Video Analysis" 
                    : primaryFile?.fileType === "image" ? (uploadedFiles.length > 1 ? `Album (${uploadedFiles.length} photos)` : "Image Upload")
                    : (primaryFile?.fileType === "document" ? `Doc: ${primaryFile.name}` : "New Chat");
                let titleApiKey = "";
                let titleProvider = targetProvider;
                let titleModelId = targetModelId;

                if (customKeyEntry && customKeyEntry.apiKey) {
                    titleApiKey = decryptKey(customKeyEntry.apiKey);
                } else if (targetProvider === "gemini" && fullUser?.geminiApiKey) {
                    titleApiKey = decryptKey(fullUser.geminiApiKey);
                } else if (fullUser?.customApiKeys && fullUser.customApiKeys.length > 0) {
                    const anyActiveKey = fullUser.customApiKeys.find(k => k.isActive !== false && k.apiKey);
                    if (anyActiveKey) {
                        titleApiKey = decryptKey(anyActiveKey.apiKey);
                        titleProvider = anyActiveKey.provider;
                        titleModelId = anyActiveKey.models?.[0]?.id || (anyActiveKey.provider === "gemini" ? "gemini-3.6-flash" : anyActiveKey.provider === "groq" ? "llama-3.1-8b-instant" : "gpt-4o-mini");
                    }
                }

                title = await generateChatTitle(message || fallbackTitle, {
                    userApiKey: titleApiKey,
                    provider: titleProvider,
                    modelId: titleModelId
                });
                chat = await chatModel.create({
                    user: req.user.id,
                    title,
                    incognito: isIncognito
                });
                chatId = chat._id;

                // Link newly indexed document to chat if created
                if (newlyIndexedDocument && chat) {
                    await documentModel.updateOne({ _id: newlyIndexedDocument._id }, { $set: { chat: chat._id } });
                }
            }
        }

        const defaultContent = primaryFile?.fileType === "video" ? "Sent a video" 
            : primaryFile?.fileType === "image" ? (uploadedFiles.length > 1 ? `Sent ${uploadedFiles.length} photos` : "Sent an image")
            : (primaryFile?.fileType === "document" ? `Uploaded PDF: ${primaryFile.name || "Document"}` : "Sent an attachment");

        const userMessage = await messageModel.create({
            chat: chatId || chat._id,
            content: message || defaultContent,
            role: "user",
            file: primaryFile,
            files: uploadedFiles
        });

        const recentMessages = await messageModel.find({ chat: chatId || chat._id })
            .sort({ createdAt: -1 })
            .limit(20);
        const messages = recentMessages.reverse();
        
        // Collect multimodal images for model execution (from current upload or attachments)
        const imagesForModel = [];
        if (rawFiles && rawFiles.length > 0) {
            for (const f of rawFiles) {
                if (f.mimetype?.startsWith("image/")) {
                    imagesForModel.push({
                        name: f.originalname,
                        mimeType: f.mimetype,
                        base64: f.buffer ? f.buffer.toString("base64") : null
                    });
                }
            }
        }
        if (uploadedFiles && uploadedFiles.length > 0) {
            for (const up of uploadedFiles) {
                if (up.fileType === "image" && !imagesForModel.some(img => img.url === up.url)) {
                    imagesForModel.push({
                        name: up.name,
                        mimeType: up.mimetype || "image/jpeg",
                        url: up.url
                    });
                }
            }
        }
        const hasImageInRequest = imagesForModel.length > 0;

        let activeSwitchedModel = null;

        // SMART TASK ROUTING & MODEL SELECTION:
        // 1. If user provided an image, prioritize their custom API key's vision model,
        // and if non-available, fallback to system built-in .env API model (gemini-3.6-flash).
        if (hasImageInRequest) {
            let chosenVisionKey = null;
            let chosenVisionModelId = null;
            let chosenVisionProvider = null;

            // Check if user has connected a custom API key for a vision-capable model
            if (fullUser.customApiKeys && fullUser.customApiKeys.length > 0) {
                for (const k of fullUser.customApiKeys) {
                    if (!k.apiKey || k.isActive === false) continue;
                    const vModel = (k.models || []).find(m => doesModelSupportVision(m.id, k.provider));
                    if (vModel) {
                        chosenVisionKey = k;
                        chosenVisionModelId = vModel.id;
                        chosenVisionProvider = k.provider;
                        break;
                    } else if (doesModelSupportVision(k.provider === "gemini" ? "gemini-3.6-flash" : "gpt-4o", k.provider)) {
                        chosenVisionKey = k;
                        chosenVisionModelId = k.provider === "gemini" ? "gemini-3.6-flash" : "gpt-4o";
                        chosenVisionProvider = k.provider;
                        break;
                    }
                }
            }

            if (chosenVisionKey) {
                // Found active custom vision model from user's custom key!
                targetProvider = chosenVisionProvider;
                targetModelId = chosenVisionModelId;
                customKeyEntry = chosenVisionKey;
            } else {
                // Non available from custom keys: fallback to server's built-in .env API model
                targetProvider = "gemini";
                targetModelId = "gemini-3.6-flash";
                customKeyEntry = null;
            }

            const newDisplayName = getModelDisplayName(targetModelId, targetProvider);
            activeSwitchedModel = {
                modelId: targetModelId,
                provider: targetProvider,
                name: newDisplayName,
                badge: "Vision",
                isCustom: Boolean(customKeyEntry && customKeyEntry.apiKey),
                reason: customKeyEntry
                    ? `Auto-routed to your connected ${newDisplayName} vision model for image processing`
                    : `Auto-routed to built-in ${newDisplayName} vision model for image processing`
            };

            if (socketId) {
                io.to(socketId).emit("model:switched", activeSwitchedModel);
            }

            await userModel.updateOne(
                { _id: fullUser._id },
                { $set: { selectedModel: { provider: targetProvider, modelId: targetModelId, modelName: newDisplayName } } }
            ).catch(() => {});
        } else {
            // 2. Text message: If user has connected custom API key(s) and is currently on built-in model,
            // automatically route prompts to their custom model (free or paid) and reflect this in UI
            const isUsingBuiltInModel = !customKeyEntry || !customKeyEntry.apiKey;
            if (hasActiveCustomKeys && isUsingBuiltInModel && fullUser.customApiKeys && fullUser.customApiKeys.length > 0) {
                const activeCustomKey = fullUser.customApiKeys.find(k => k.isActive !== false && k.apiKey);
                if (activeCustomKey) {
                    const chosenCustomModel = activeCustomKey.models?.[0]?.id || 
                        (activeCustomKey.provider === "gemini" ? "gemini-3.6-flash" 
                            : activeCustomKey.provider === "groq" ? "llama-3.3-70b-versatile"
                            : activeCustomKey.provider === "mistral" ? "open-mistral-nemo"
                            : activeCustomKey.provider === "anthropic" ? "claude-3-5-sonnet-20241022" 
                            : "gpt-4o");

                    targetProvider = activeCustomKey.provider;
                    targetModelId = chosenCustomModel;
                    customKeyEntry = activeCustomKey;

                    const newDisplayName = getModelDisplayName(targetModelId, targetProvider);
                    activeSwitchedModel = {
                        modelId: targetModelId,
                        provider: targetProvider,
                        name: newDisplayName,
                        badge: "Custom",
                        isCustom: true,
                        reason: `Auto-switched to your connected ${newDisplayName} custom model`
                    };

                    if (socketId) {
                        io.to(socketId).emit("model:switched", activeSwitchedModel);
                    }

                    await userModel.updateOne(
                        { _id: fullUser._id },
                        { $set: { selectedModel: { provider: targetProvider, modelId: targetModelId, modelName: newDisplayName } } }
                    ).catch(() => {});
                }
            }
        }

        let result = "";

        // Web Search evaluation (Tavily live search vs pure AI model knowledge)
        const explicitWebSearch = req.body.webSearch === 'true' || req.body.webSearch === true;
        const promptRaw = (message || userMessage.content || "").toLowerCase();
        const newsLikePattern = /\b(today|current|update)\b.{0,30}\b(news|weather|price|stock|score|headline|info|rate|event|report)\b|\b(news|weather|price|stock|score|headline|info|rate|event|report)\b.{0,30}\b(today|current|update)\b/i;
        const autoTriggerKeywords = ["latest", "recent", "news", "latest info", "right now", "live score"];
        const autoTriggerWebSearch = autoTriggerKeywords.some(kw => promptRaw.includes(kw)) || newsLikePattern.test(promptRaw);
        const shouldExecuteWebSearch = explicitWebSearch || autoTriggerWebSearch;
        const sendActivityStep = (id, label, status = 'active') => {
            if (socketId) io.to(socketId).emit('activity:update', { id, label, status });
        };
        sendActivityStep('request', 'Understanding your request', 'active');

        // Small talk detection: avoid web search, RAG, and memory recall for greetings / short chat
        const isCapabilityInquiry = /\b(what (can|do) you do|what are your (skills|capabilities|features|tools)|do you have (any )?skills?|list (your )?skills?|tell me (about )?your skills?|show (me )?skills?|who are you)\b/i.test(message || "");
        const isSmallTalk = (t) => !isCapabilityInquiry && /^\s*((hi+|hello+|hey+|heya|hola)(\s+(there|parsu|bro|buddy|everyone|friend|ai))?|yo|sup|namaste|good\s*(morning|afternoon|evening|night)|thanks?( you)?|thx|ok(ay)?|cool|nice|bye|how are you( doing)?|what'?s up)\s*[!.?]*\s*$/i.test(t || "");
        const smallTalk = isSmallTalk((message || "").trim()) && uploadedFiles.length === 0;
        const wordCount = (message || "").trim().split(/\s+/).filter(Boolean).length;
        const imageSearchRequest = /\b(show|see|display|give|send|find|look for)\b.{0,50}\b(images?|photos?|pictures?|pics?)\b|\b(images?|photos?|pictures?|pics?)\s+of\b/i.test(message || "")
            && !/\b(create|make|generate|draw|design)\b.{0,40}\b(image|picture|photo|artwork)\b/i.test(message || "");
        const tripImageRequest = /\bitinerary\b|\bplaces? to (visit|see)\b|\btravel plan\b|\b(plan|planning).{0,35}\btrip\b|\btrip\b.{0,35}\b(plan|itinerary)\b/i.test(message || "");
        const imageQuery = String(message || "")
            .replace(/^\s*(please\s+)?(show|see|display|give|send|find|look for)\s+(me\s+)?/i, "")
            .replace(/\b(a few|few|some|a|an)\s+(images?|photos?|pictures?|pics?)\s+(of\s+)?/i, "")
            .replace(/\s+(so i can visit|that i can visit|please)\s*[?.!]*$/i, "")
            .replace(/^\s*(?:a|an|the)\s+/i, "")
            .replace(/\s+(?:images?|photos?|pictures?|pics?)\s*[?.!]*$/i, "")
            .trim() || String(message || "").trim();
        const destinationMatch = String(message || "").match(/\bto\s+([^,.?!]+?)(?=\s+(?:for|from|with|on|during|itinerary|trip|travel|route)\b|[,.?!]|$)/i)
            || String(message || "").match(/\b(?:in|around|near)\s+([^,.?!]+?)(?=\s+(?:for|from|with|on|during|itinerary|trip|travel|route)\b|[,.?!]|$)/i);
        const tripDestination = destinationMatch?.[1]?.trim()
            .replace(/\b(?:places? to (?:visit|see)|itinerary|travel plan|trip|route)\b.*$/i, "")
            .trim();
        const tripGalleryQuery = tripDestination
            ? `${tripDestination} places to visit`
            : `${imageQuery} places to visit`;

        // Uploaded media & social media link context
        let uploadedMediaContext = "";
        if (uploadedFiles && uploadedFiles.length > 0) {
            uploadedMediaContext = `\n\n--- UPLOADED ATTACHMENTS & SOCIAL MEDIA LINKS ---\n` +
                uploadedFiles.map(f => `• ${f.fileType ? f.fileType.toUpperCase() : 'FILE'}: "${f.name || 'Attachment'}" -> Direct Link: ${f.url}`).join("\n") +
                `\n-------------------------------------------------\n` +
                `When referencing or confirming the user's uploaded files or social media content, always provide the clickable markdown link [filename](URL) so the user can easily view or download it.\n`;
        }

        // ── User Feedback Adaptation ──────────────────────────────────────────
        // Inspect historical messages in this chat to adapt response based on user like/dislike feedback
        let feedbackInstruction = "";
        const dislikedMessages = messages.filter(m => m.role === 'ai' && m.feedback === 'dislike');
        const likedMessages = messages.filter(m => m.role === 'ai' && m.feedback === 'like');

        if (dislikedMessages.length > 0) {
            feedbackInstruction += `\n\n[USER PREFERENCE - DISLIKED PRIOR RESPONSE]: The user disliked previous response(s) in this chat. Avoid what caused their dissatisfaction: provide clearer explanations, be direct, accurate, well-structured, and eliminate fluff or inaccuracies.`;
        }
        if (likedMessages.length > 0) {
            feedbackInstruction += `\n\n[USER PREFERENCE - LIKED PRIOR RESPONSE]: The user liked previous response(s) in this chat. Maintain this clear, engaging, well-structured, and high-quality tone.`;
        }

        const isMemoryEnabled = !isIncognito && req.body.memory !== 'false' && req.body.memory !== false;
        const currentUserId = req.user?.id || req.user?._id;

        // ── Parallel Retrieval: Tavily Search, Cross-Chat Memory, and Document RAG ──
        const fetchWebSearchContext = async () => {
            if (smallTalk || !shouldExecuteWebSearch || !(message || userMessage.content)) return "";
            sendActivityStep('web-search', 'Searching the web', 'active');
            try {
                const { tavily } = await import("@tavily/core");
                const tvly = new tavily(process.env.TAVILY_API_KEY);
                const query = message || userMessage.content;
                const searchResults = await tvly.search(query, { searchDepth: "basic", maxResults: 5 });
                if (searchResults?.results?.length > 0) {
                    return `\n\n--- REAL-TIME INTERNET SEARCH RESULTS (via Tavily) ---\n` +
                        searchResults.results.map((r, i) => `[${i + 1}] Title: ${r.title}\n    URL: ${r.url}\n    Content: ${r.content}`).join("\n\n") +
                        `\n------------------------------------------------------\n` +
                        `INSTRUCTIONS FOR CITATIONS & ACCURACY:\n` +
                        `1. Use these live internet findings to deliver a comprehensive, up-to-date response.\n` +
                        `2. You MUST cite your sources! At the end of your answer, provide a dedicated '### Sources & Citations' section listing the clickable markdown links: [Title](URL) for every article or website you gathered facts from.\n`;
                }
            } catch (tavilyErr) {
                console.warn("⚠️ Tavily web search error in chat.controller:", tavilyErr.message);
            } finally {
                sendActivityStep('web-search', 'Searching the web', 'complete');
            }
            return "";
        };

        const fetchMemoryContext = async () => {
            if (!isMemoryEnabled || fullUser?.memory?.librarySearchEnabled !== true || !currentUserId || smallTalk || wordCount < 4) return "";
            sendActivityStep('memory-context', 'Checking relevant saved context', 'active');
            try {
                const currentChatId = chatId || chat._id;
                const otherChats = await chatModel.find({
                    user: currentUserId,
                    _id: { $ne: currentChatId }
                }).select('_id title').limit(20);

                if (otherChats.length > 0) {
                    const otherChatIds = otherChats.map(c => c._id);
                    const pastMessages = await messageModel.find({
                        chat: { $in: otherChatIds },
                        role: "user"
                    })
                    .select('+embedding content role chat createdAt')
                    .sort({ createdAt: -1 })
                    .limit(40);

                    if (pastMessages.length > 0) {
                        const promptText = message || userMessage.content;
                        const promptVector = await generateEmbedding(promptText);

                        let scored = [];
                        for (const pm of pastMessages) {
                            if (!pm.content || pm.content.trim().length < 20 || pm.role !== "user") continue;
                            let score = 0;
                            if (promptVector && pm.embedding && pm.embedding.length > 0) {
                                score = cosineSimilarity(promptVector, pm.embedding);
                            } else {
                                const words = promptText.toLowerCase().split(/\s+/).filter(w => w.length > 3);
                                let matches = 0;
                                const contentLower = pm.content.toLowerCase();
                                for (const w of words) {
                                    if (contentLower.includes(w)) matches++;
                                }
                                score = words.length > 0 ? (matches / words.length) * 0.5 : 0;
                            }
                            scored.push({ message: pm, score });
                        }

                        scored.sort((a, b) => b.score - a.score);
                        const topMemories = scored.filter(item => item.score > 0.55).slice(0, 2);

                        if (topMemories.length > 0) {
                            const chatTitleMap = new Map(otherChats.map(c => [c._id.toString(), c.title || 'Previous Chat']));
                            return `\n\n--- RECALLED CROSS-CHAT MEMORY (Across User's Other Chats) ---\n` +
                                `The user has enabled memory across chats. Relevant context and facts recalled from their previous conversations:\n` +
                                topMemories.map(({ message: pm }) => {
                                    const title = chatTitleMap.get(pm.chat.toString()) || 'Other Chat';
                                    const excerpt = pm.content.length > 180 ? pm.content.slice(0, 177) + '...' : pm.content;
                                    return `• [Chat: "${title}"]: ${excerpt}`;
                                }).join("\n") +
                                `\n--------------------------------------------------------------\nBACKGROUND ONLY. Use this silently and only if it directly helps answer the user's current message. Never greet with it, list it, summarize it, or say you remember past chats unless the user asks.`;
                        }
                    }
                }
            } catch (memErr) {
                console.warn("⚠️ Cross-chat memory retrieval warning:", memErr.message);
            } finally {
                sendActivityStep('memory-context', 'Checking relevant saved context', 'complete');
            }
            return "";
        };

        const fetchDocumentRagContext = async () => {
            if (smallTalk) return "";
            const targetDoc = newlyIndexedDocument || (chatId ? await documentModel.findOne({ chat: chatId }).sort({ createdAt: -1 }) : null);
            if (!targetDoc || !targetDoc.chunks || targetDoc.chunks.length === 0) return "";

            sendActivityStep('document', 'Reading your uploaded document', 'active');
            const userPrompt = (message || "").trim();
            try {
                if (!userPrompt) {
                    const previewChunks = targetDoc.chunks.slice(0, 4).map(c => c.text).join("\n\n---\n\n");
                    return `The user uploaded the PDF document "${targetDoc.filename}" (View URL: ${targetDoc.file?.url || ''}) without asking any specific question.\n\n` +
                        `PDF Content Excerpts:\n${previewChunks}\n\n` +
                        `TASK INSTRUCTIONS:\n` +
                        `1. Provide an executive summary of this document, mentioning key insights, topics, and important facts extracted from it.\n` +
                        `2. Provide a clickable link to view the document: [📄 View PDF: ${targetDoc.filename}](${targetDoc.file?.url || ''})\n` +
                        `3. Conclude by proactively asking the user: "What more would you like to know or explore about this document?" and suggest 3-4 specific follow-up questions they can ask based on its contents.\n`;
                }
                    const queryVector = await generateEmbedding(userPrompt);
                    let scoredChunks = [];
                    for (const chunk of targetDoc.chunks) {
                        if (!chunk.text) continue;
                        let score = 0;
                        if (queryVector && chunk.embedding && chunk.embedding.length > 0) {
                            score = cosineSimilarity(queryVector, chunk.embedding);
                        } else {
                            const words = userPrompt.toLowerCase().split(/\s+/).filter(w => w.length > 3);
                            let matches = 0;
                            const chunkLower = chunk.text.toLowerCase();
                            for (const w of words) {
                                if (chunkLower.includes(w)) matches++;
                            }
                            score = words.length > 0 ? (matches / words.length) * 0.5 : 0;
                        }
                        scoredChunks.push({ text: chunk.text, score });
                    }

                    scoredChunks.sort((a, b) => b.score - a.score);
                    const topChunks = scoredChunks.slice(0, 4);

                    return `Document: "${targetDoc.filename}" (View URL: ${targetDoc.file?.url || ''})\n\n` +
                        `Relevant Excerpts Retrieved via Vector Cosine Similarity Search in MongoDB:\n` +
                        topChunks.map((c, i) => `[Excerpt ${i + 1} - Relevance Score: ${(c.score * 100).toFixed(1)}%]:\n${c.text}`).join("\n\n") +
                        `\n\nINSTRUCTION: Ground your answer strictly and accurately in the retrieved document context above. If referencing the document, include the direct link [${targetDoc.filename}](${targetDoc.file?.url || ''}).\n`;
            } catch (ragErr) {
                console.warn("⚠️ Document RAG query error:", ragErr.message);
                return "";
            } finally {
                sendActivityStep('document', 'Reading your uploaded document', 'complete');
            }
        };

        const [webSearchContext, memoryContext, documentRagContext] = await Promise.all([
            fetchWebSearchContext(),
            fetchMemoryContext(),
            fetchDocumentRagContext()
        ]);
        sendActivityStep('context', 'Preparing the answer', 'active');

        // ── Thinking Level & Reasoning Budget (Default: low for fastest results) ──
        const rawThinking = req.body.thinkingLevel || fullUser?.preferences?.thinkingLevel || 'low';
        const thinkingLevel = (rawThinking === 'hard' || rawThinking === 'deep') ? 'high'
            : (rawThinking === 'normal' || rawThinking === 'fast') ? 'low'
            : rawThinking;

        const customInstructions = (fullUser?.memory?.customInstructions || fullUser?.customInstructions || "").trim();
        const normalizeText = (t) => String(t || "").toLowerCase().replace(/[-_./\\,:;]/g, " ").replace(/\s+/g, " ").trim();
        const rawSkillPrompt = String(message || userMessage?.content || "");
        const skillPrompt = rawSkillPrompt.toLowerCase();
        const normalizedSkillPrompt = normalizeText(rawSkillPrompt);
        const explicitSkillId = req.body?.selectedSkillId || req.body?.skillId;

        // Combine user's saved DB skills with workspace skills from .agents/skills
        const combinedSkills = [...(fullUser?.skills || [])];
        const existingNames = new Set(combinedSkills.map(s => normalizeText(s.name)));

        const workspaceSkills = getWorkspaceSkills();
        for (const ws of workspaceSkills) {
            if (!existingNames.has(normalizeText(ws.name))) {
                combinedSkills.push(ws);
                existingNames.add(normalizeText(ws.name));
            }
        }

        // Match skills using direct, normalized, and token-level intersection
        const matchedSkills = combinedSkills.filter(skill => {
            if (skill.enabled === false) return false;
            if (explicitSkillId && skill._id?.toString() === explicitSkillId.toString()) return true;

            const triggersList = Array.isArray(skill.triggers) 
                ? skill.triggers 
                : (typeof skill.triggers === 'string' ? skill.triggers.split(',') : []);

            const allTerms = [skill.name, ...triggersList]
                .map(t => String(t).trim())
                .filter(Boolean);

            return allTerms.some(term => {
                const termLower = term.toLowerCase();
                const termNorm = normalizeText(term);
                if (termLower.length < 2) return false;

                // 1. Direct or normalized substring match
                if (skillPrompt.includes(termLower) || normalizedSkillPrompt.includes(termNorm)) {
                    return true;
                }

                // 2. Word-level intersection (e.g. "minimal ai ui" matching "minimal-ai-ui")
                const termWords = termNorm.split(" ").filter(w => w.length >= 2);
                if (termWords.length >= 2) {
                    const allWordsPresent = termWords.every(w => normalizedSkillPrompt.includes(w));
                    if (allWordsPresent) return true;
                }

                return false;
            });
        }).slice(0, 5);

        if (matchedSkills.length > 0) {
            const skillNames = matchedSkills.map(s => s.name).join(", ");
            sendActivityStep('skill', `Applied skill: ${skillNames}`, 'done');
        }

        // Build active skill blocks
        const skillBlocks = matchedSkills.map(skill => {
            let block = `=== ACTIVE SKILL LOADED: ${skill.name} ===\n${skill.description ? `Description: ${skill.description}\n` : ''}Instructions:\n${skill.instructions}`;
            if (Array.isArray(skill.files) && skill.files.length > 0) {
                block += `\n\nBundled Skill Files:\n` + skill.files.map(f => `--- File: ${f.path || f.name} ---\n${f.content}`).join("\n\n");
            }
            return block;
        });

        // Build skills manifest listing all available skills
        const activeSkillsList = combinedSkills.filter(s => s.enabled !== false);
        const skillsManifest = activeSkillsList.length > 0
            ? "--- AVAILABLE & INSTALLED SKILLS IN PARSU AI ---\n" +
              activeSkillsList.slice(0, 20).map((s, idx) => {
                  const triggers = Array.isArray(s.triggers) ? s.triggers.join(", ") : (s.triggers || "");
                  return `${idx + 1}. Skill: "${s.name}"\n` +
                      (s.description ? `   Description: ${s.description}\n` : "") +
                      (triggers ? `   Triggers: ${triggers}\n` : "") +
                      (s.files?.length ? `   Files: ${s.files.length} bundled file(s)\n` : "");
              }).join("\n") +
              "\nCRITICAL DIRECTIVE ON SKILLS:\n" +
              "- When the user asks what skills you have or asks if you have a specific skill (e.g. 'minimal-ai-ui', 'apple-design', etc.), confirm that you have it installed and ready to use in Parsu AI, describe what it does, and offer to apply it!\n" +
              "- Never say you do not have or don't know a skill that is listed in your available skills above."
            : "--- AVAILABLE SKILLS ---\nNo custom skills installed yet. The user can add skills in Settings -> Custom Skills.";

        // Build MCP manifest
        const allMcpServers = (fullUser?.mcpServers || []).filter(m => m.enabled !== false);
        const mcpManifest = allMcpServers.length > 0
            ? "--- USER'S CONNECTED MCP SERVERS (MODEL CONTEXT PROTOCOL) ---\n" +
              allMcpServers.map((m, idx) => `${idx + 1}. Server: "${m.name}" (${m.transport}) - ${m.description || "Active"}`).join("\n") +
              "\nWhen asked about MCP capabilities, you can interface with these connected MCP servers."
            : "";

        const platformCapabilitiesDoc = 
`--- PARSU AI BUILT-IN CAPABILITIES & PLATFORM TOOLS ---
You are Parsu AI. When the user asks what you can do, what your capabilities are, what tools you have, or whether you support specific tasks, you MUST answer accurately based on your actual capabilities:
1. 🗺️ Interactive Maps & Navigation: Live Google Maps with driving/transit/walking routes, intermediate stops, and location pins using \`\`\`map ... \`\`\` codeblocks.
2. ✈️ Trip & Itinerary Planning: Full day-wise trip itineraries with stops, distances, costs, and destination photo galleries (\`\`\`gallery query: Place Name\`\`\`).
3. 📸 Real Photo Search & Visual Galleries: Live web photo grids for any place, topic, animal, or product (\`\`\`gallery query: ... \`\`\`) and visual product cards (\`\`\`cards [...] \`\`\`).
4. 🎨 AI Image Generation: Creating original images from text descriptions (\`\`\`imagegen prompt: ... \`\`\`).
5. 📢 Autonomous Social Media Publishing: Publishing and scheduling directly to connected accounts (YouTube videos/Shorts, Instagram photos/Reels/carousels, Facebook Pages, Pinterest Pins, X/Twitter, and LinkedIn).
6. 🧩 Custom Skills System: Users can add, edit, or upload custom skills (ZIP, Markdown, multi-file code folders). You read, execute, follow, and list all installed skills!
7. 🔌 Model Context Protocol (MCP): Connect to external MCP servers (SSE, STDIO, HTTP, local) to interface with third-party tools (Blender 3D, Figma, Local Filesystem, DBs, etc.).
8. 💻 Connected Devices: Cross-device control agent for Windows, macOS, Android.
9. 🧠 Long-Term Memory: Remembering facts, preferences, nickname, and custom instructions across chats.
10. 📄 Document PDF RAG: Uploading and analyzing documents, PDFs, images, and code with semantic search.
11. 🌐 Real-Time Web Search: Live internet fact-checking and news with clickable source citations.
12. 🎙️ Live Voice Talk: Hands-free voice chat with real-time speech captions.`;

        const fileRequestPrompt = String(message || userMessage?.content || "");
        const requestedDocumentFormat = /\b(pdf|markdown|md)\b|\.md\b/i.test(fileRequestPrompt)
            && /\b(create|generate|make|write|export|save|prepare|turn this into)\b/i.test(fileRequestPrompt)
            ? (/\bpdf\b/i.test(fileRequestPrompt) ? "PDF" : "Markdown")
            : "";
        const documentCreationInstruction = requestedDocumentFormat
            ? `The user asked you to create a ${requestedDocumentFormat} document. Write the complete document body and wrap it in exactly one fenced Markdown block (\`\`\`markdown ... \`\`\`). Do not return HTML or source code for document content. The app provides a Markdown download and a browser Print / Save as PDF action; do not claim a PDF file is attached unless you actually have a file URL.`
            : "";

        const effectiveInstructions = [
            customInstructions,
            platformCapabilitiesDoc,
            skillsManifest,
            mcpManifest,
            ...skillBlocks,
            documentCreationInstruction
        ].filter(Boolean).join("\n\n");

        const responseInstructions = effectiveInstructions;
        const userNickname = fullUser?.memory?.nickname || "";
        const userOccupation = fullUser?.memory?.occupation || "";
        const memorySummary = fullUser?.memory?.summary || "";
        const memoryFacts = Array.isArray(fullUser?.memory?.facts) ? fullUser.memory.facts : [];

        const promptForAction = (message || userMessage?.content || "").toLowerCase();
        const isActionIntent = /\b(upload|post|publish|share|tweet|schedule)\b.{0,80}\b(youtube|instagram|facebook|twitter|linkedin|pinterest|tiktok|all|everywhere)\b|\b(email|calendar)\b/i.test(promptForAction);

        const usedMemory = Boolean(!smallTalk && memoryContext && memoryContext.trim());

        const userContextWithSearch = {
            _id: fullUser._id,
            id: fullUser._id?.toString() || req.user.id,
            role: fullUser.role,
            subscription: fullUser.subscription,
            preferences: fullUser.preferences,
            memory: fullUser.memory,
            chatId: String(chatId || chat._id),
            uploadedFiles,
            files: uploadedFiles,
            isActionIntent,
            webSearch: shouldExecuteWebSearch,
            webSearchContext: smallTalk ? "" : webSearchContext,
            uploadedMediaContext,
            feedbackInstruction: smallTalk ? "" : feedbackInstruction,
            memoryContext: smallTalk ? "" : memoryContext,
            customInstructions: (smallTalk && !isCapabilityInquiry) ? "" : responseInstructions,
            skillsManifest,
            mcpManifest,
            platformCapabilitiesDoc,
            allUserSkills: combinedSkills,
            matchedSkills,
            userNickname,
            userOccupation,
            thinkingLevel,
            memorySummary,
            memoryFacts,
            documentRagContext: smallTalk ? "" : documentRagContext,
            usedMemory
        };

        // ── Multi-Model Execution & Automatic Limit Failover Cascade ──
        // 1. Build priority queue of candidate models (selected model -> other custom keys -> system built-in models)
        const candidates = [];

        // Primary selected candidate
        candidates.push({
            provider: targetProvider,
            modelId: targetModelId,
            keyEntry: customKeyEntry,
            isCustom: Boolean(customKeyEntry && customKeyEntry.apiKey)
        });

        // Other active custom keys added by the user
        if (fullUser.customApiKeys && fullUser.customApiKeys.length > 0) {
            for (const key of fullUser.customApiKeys) {
                if (!key.apiKey || key.isActive === false) continue;
                if (customKeyEntry && key._id.toString() === customKeyEntry._id.toString()) continue;

                let chosenModel = null;
                if (hasImageInRequest) {
                    chosenModel = (key.models || []).find(m => doesModelSupportVision(m.id, key.provider))?.id;
                    if (!chosenModel && doesModelSupportVision(key.provider === "gemini" ? "gemini-3.6-flash" : "gpt-4o", key.provider)) {
                        chosenModel = key.provider === "gemini" ? "gemini-3.6-flash" : "gpt-4o";
                    }
                } else {
                    chosenModel = key.models?.[0]?.id || (key.provider === "gemini" ? "gemini-3.6-flash" : key.provider === "mistral" ? "open-mistral-nemo" : "gpt-4o");
                }

                if (chosenModel) {
                    candidates.push({
                        provider: key.provider,
                        modelId: chosenModel,
                        keyEntry: key,
                        isCustom: true
                    });
                }
            }
        }

        // Built-in system models as final high-availability fallbacks
        const systemFallbacks = hasImageInRequest
            ? [{ provider: "gemini", modelId: "gemini-3.6-flash", isCustom: false }]
            : [
                { provider: "gemini", modelId: "gemini-3.6-flash", isCustom: false },
                { provider: "groq", modelId: "llama-3.3-70b-versatile", isCustom: false },
                { provider: "mistral", modelId: "open-mistral-nemo", isCustom: false }
            ];

        for (const sys of systemFallbacks) {
            if (!candidates.some(c => c.provider === sys.provider && c.modelId === sys.modelId)) {
                candidates.push({ ...sys, keyEntry: null });
            }
        }

        // Prepare message payload: inject real-time Tavily search context, media links, and feedback instruction
        const chatHistoryForModel = messages.map(m => ({ role: m.role, content: m.content }));
        const visualInstruction = imageSearchRequest
            ? `\n\nThe user explicitly requested photos. Answer briefly, then include a rendered image gallery using exactly this format:\n\`\`\`gallery\nquery: ${imageQuery}\n\`\`\`. Do not write HTML, CSS, JavaScript, code samples, Markdown image URLs, or raw image links. The app renders the gallery itself; never claim you cannot display images.`
            : tripImageRequest
                ? `\n\nThis is a trip or destination-planning request. Include one rendered photo gallery for each major place you recommend, after the itinerary. Use one exact place name per block:\n\`\`\`gallery\nquery: Tiger Hill, Darjeeling\n\`\`\`. Do not combine multiple places into one query. Do not write HTML, CSS, JavaScript, code samples, Markdown image URLs, or raw image links. The app renders the galleries itself.`
                : "";
        const extraContext = smallTalk
            ? (uploadedMediaContext || "")
            : ((webSearchContext ? webSearchContext : "") + 
               (uploadedMediaContext ? uploadedMediaContext : "") +
               (feedbackInstruction ? feedbackInstruction : "") + 
               (memoryContext ? memoryContext : "") +
               (documentRagContext ? `\n\n--- DOCUMENT CONTEXT ---\n${documentRagContext}` : "") + visualInstruction);
        if (extraContext && chatHistoryForModel.length > 0) {
            const lastUserIndex = chatHistoryForModel.map(m => m.role).lastIndexOf("user");
            if (lastUserIndex !== -1) {
                chatHistoryForModel[lastUserIndex].content += extraContext;
            }
        }

        let executedSuccessfully = false;
        let lastExecutionError = null;
        sendActivityStep('model', 'Generating a response', 'active');

        for (let idx = 0; idx < candidates.length; idx++) {
            const candidate = candidates[idx];
            const candidateDisplayName = getModelDisplayName(candidate.modelId, candidate.provider);

            try {
                let decryptedApiKey = "";
                let targetBaseUrl = "";
                if (candidate.keyEntry && candidate.keyEntry.apiKey) {
                    decryptedApiKey = decryptKey(candidate.keyEntry.apiKey);
                    targetBaseUrl = candidate.keyEntry.baseUrl;
                }

                const execStartTime = Date.now();

                // If candidate is Gemini OR if user requested an autonomous action (YouTube/social media upload, email):
                // execute the tools pipeline so post_to_social_media/email can actually execute!
                if (candidate.provider === "gemini" || isActionIntent) {
                    const ctx = {
                        ...userContextWithSearch,
                        chatId: String(chatId || chat._id),
                        modelId: candidate.modelId,
                        apiKey: (candidate.provider === "gemini" && decryptedApiKey) ? decryptedApiKey : undefined,
                        throwOnError: candidates.length > 1 && idx < candidates.length - 1,
                        onEvent: (e) => socketId && io.to(socketId).emit("tool:event", e)
                    };
                    result = await generateResponse(messages, (chunk) => {
                        if (socketId) {
                            io.to(socketId).emit("chunk", chunk);
                        }
                    }, ctx);
                } else {
                    result = await executeModelChatStream({
                        provider: candidate.provider,
                        modelId: candidate.modelId,
                        apiKey: decryptedApiKey,
                        baseUrl: targetBaseUrl,
                        messages: chatHistoryForModel,
                        images: imagesForModel,
                        customInstructions: (smallTalk && !isCapabilityInquiry) ? "" : responseInstructions,
                        thinkingLevel,
                        memorySummary,
                        memoryFacts,
                        documentRagContext,
                        onChunk: (chunk) => {
                            if (socketId) {
                                io.to(socketId).emit("chunk", chunk);
                            }
                        }
                    });
                }

                if (result && result.trim()) {
                    executedSuccessfully = true;
                    const durationMs = Date.now() - execStartTime;

                    // If failover chose a different model or ran successfully, record and notify UI
                    if (candidate.modelId !== targetModelId || candidate.provider !== targetProvider || !activeSwitchedModel) {
                        activeSwitchedModel = {
                            modelId: candidate.modelId,
                            provider: candidate.provider,
                            name: candidateDisplayName,
                            badge: doesModelSupportVision(candidate.modelId, candidate.provider) ? "Vision" : "Fast",
                            isCustom: Boolean(candidate.isCustom),
                            durationMs,
                            reason: (candidate.modelId !== targetModelId || candidate.provider !== targetProvider)
                                ? `Switched to faster model ${candidateDisplayName} (${(durationMs / 1000).toFixed(1)}s)`
                                : `Executed via ${candidateDisplayName} in ${(durationMs / 1000).toFixed(1)}s`
                        };

                        if (socketId) {
                            io.to(socketId).emit("model:switched", activeSwitchedModel);
                        }

                        // Remember and persist this fast model for the user's next messages and new chats
                        await userModel.updateOne(
                            { _id: fullUser._id },
                            { $set: { selectedModel: { provider: candidate.provider, modelId: candidate.modelId, modelName: candidateDisplayName } } }
                        ).catch(() => {});
                    }

                    break; // Model successfully generated output!
                }
            } catch (err) {
                lastExecutionError = err;
                console.warn(`⚠️ Candidate [${candidate.provider} - ${candidate.modelId}] failed:`, err.message);

                // If another candidate is available, notify client of failover and switch
                if (idx < candidates.length - 1) {
                    if (socketId) {
                        io.to(socketId).emit("chunk:reset");
                    }
                    const nextCandidate = candidates[idx + 1];
                    const nextDisplayName = getModelDisplayName(nextCandidate.modelId, nextCandidate.provider);

                    if (socketId) {
                        io.to(socketId).emit("model:switched", {
                            modelId: nextCandidate.modelId,
                            provider: nextCandidate.provider,
                            name: nextDisplayName,
                            badge: doesModelSupportVision(nextCandidate.modelId, nextCandidate.provider) ? "Vision" : "Fast",
                            reason: `Switched to faster available model: ${nextDisplayName}`
                        });
                    }
                }
            }
        }

        // Final safety net if all candidates encountered issues
        if (!executedSuccessfully) {
            console.warn("⚠️ All candidates failed. Invoking primary Gemini fallback pipeline...");
            if (socketId) {
                io.to(socketId).emit("chunk:reset");
            }
            const fallbackCtx = {
                ...userContextWithSearch,
                chatId: String(chatId || chat._id),
                modelId: targetModelId,
                onEvent: (e) => socketId && io.to(socketId).emit("tool:event", e)
            };
            result = await generateResponse(messages, (chunk) => {
                if (socketId) {
                    io.to(socketId).emit("chunk", chunk);
                }
            }, fallbackCtx);
        }

        // Normalize visual answers after generation. Models sometimes emit HTML examples or
        // combine every itinerary photo marker into one oversized gallery search query.
        if (imageSearchRequest || tripImageRequest) {
            const rawResult = String(result || "");
            const galleryBlocks = [...rawResult.matchAll(/```\s*gallery\b\s*([\s\S]*?)```/gi)].map(match => match[1]);
            const markerQueries = [...rawResult.matchAll(/\[Image:\s*([^\]]{2,140})\]/gi)].map(match => match[1]);
            const declaredQueries = galleryBlocks.flatMap(block => {
                const markers = [...block.matchAll(/\[Image:\s*([^\]]{2,140})\]/gi)].map(match => match[1]);
                if (markers.length) return markers;
                return [...block.matchAll(/(?:query|q|search)\s*:\s*([^\n\r]+)/gi)].map(match => match[1]);
            });
            const normalizeQuery = value => String(value || "")
                .replace(/^\s*(?:query|q|search)\s*:\s*/i, "")
                .replace(/[\[\]`*_]/g, " ")
                .replace(/\s+/g, " ")
                .trim()
                .slice(0, 120);
            let galleryPlaces;
            if (imageSearchRequest) {
                galleryPlaces = [{ query: normalizeQuery(imageQuery), title: normalizeQuery(imageQuery), details: "" }];
            } else {
                const placeDetails = [];
                for (const line of rawResult.split(/\r?\n/)) {
                    const match = line.match(/^\s*(?:(?:\d{1,2}[.)])\s*|[-*]\s*)?\*\*([^*]{2,100})\*\*\s*(?:[:—–-]\s*(.*))?$/)
                        || line.match(/^\s*(?:\d{1,2}[.)]|[-*])\s+([A-Z][^:—–-]{2,80})\s*[:—–-]\s*(.*)$/);
                    if (!match) continue;
                    let rawTitle = match[1];
                    let rawDetails = match[2] || "";
                    // Models often bold the complete list item, e.g. **Jaipur: The Pink City...**.
                    // Split that inline format so the search uses the place name, not its whole description.
                    if (!rawDetails && rawTitle.includes(":")) {
                        const splitAt = rawTitle.indexOf(":");
                        rawDetails = rawTitle.slice(splitAt + 1);
                        rawTitle = rawTitle.slice(0, splitAt);
                    }
                    const title = normalizeQuery(rawTitle).replace(/[:—–-]+$/, "").trim();
                    if (!title || /^(?:day\s*\d+|itinerary|getting around|where to stay|travel tips?)\b/i.test(title)) continue;
                    placeDetails.push({ title, details: normalizeQuery(rawDetails) });
                }

                const destinationName = normalizeQuery(tripDestination);
                const detailByName = new Map(placeDetails.map(place => [place.title.toLowerCase(), place]));
                const modelPlaces = [...markerQueries, ...declaredQueries]
                    .map(normalizeQuery)
                    .filter(Boolean)
                    .map(query => {
                        const title = query.split(",")[0].trim();
                        const detail = detailByName.get(title.toLowerCase())
                            || placeDetails.find(place => query.toLowerCase().includes(place.title.toLowerCase()));
                        return { query, title: detail?.title || title, details: detail?.details || "" };
                    });
                const places = [...placeDetails, ...modelPlaces];
                const seenPlaces = new Set();
                galleryPlaces = places
                    .map(place => {
                        const title = normalizeQuery(place.title);
                        let query = normalizeQuery(place.query || title);
                        if (destinationName && !query.toLowerCase().includes(destinationName.toLowerCase())) {
                            query = `${query}, ${destinationName}`;
                        }
                        return { query: query.slice(0, 170), title, details: normalizeQuery(place.details).slice(0, 260) };
                    })
                    .filter(place => {
                        const key = place.title.toLowerCase();
                        if (!place.title || seenPlaces.has(key)) return false;
                        seenPlaces.add(key);
                        return true;
                    })
                    .slice(0, 20);
                if (!galleryPlaces.length) {
                    const fallback = normalizeQuery(tripGalleryQuery);
                    galleryPlaces = fallback ? [{ query: fallback, title: destinationName || fallback, details: "" }] : [];
                }
            }

            const cleanAnswer = rawResult
                .replace(/\*{0,2}\s*`gallery\b[^`]*`\s*\*{0,2}/gi, "")
                .replace(/`gallery\s+(?:query|q|search)\s*:[^`]*`/gi, "")
                .replace(/^\s*gallery\s+(?:query|q|search)\s*:[^\r\n]*$/gim, "")
                .replace(/```(?:html|xhtml)\b[\s\S]*?```/gi, "")
                .replace(/<!doctype\s+html[\s\S]*?<\/html\s*>/gi, "")
                .replace(/```\s*gallery\b\s*[\s\S]*?```/gi, "")
                .replace(/^\s*(?:gallery\s+)?query\s*:\s*.+$/gim, "")
                .replace(/^\s*\[Image:\s*[^\]]+\]\s*$/gim, "")
                .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
                .replace(/[ \t]+\n/g, "\n")
                .replace(/\n{3,}/g, "\n\n")
                .trim();
            const safeAnswer = cleanAnswer || (tripImageRequest ? "Here are some places to explore." : "Here are some photos.");
            const normalizedGallery = galleryPlaces.filter(place => place.query)
                .map(place => `\`\`\`gallery\nquery: ${place.query}\ntitle: ${place.title}\ndetails: ${place.details}\nmode: ${imageSearchRequest ? "search" : "place"}\n\`\`\``)
                .join("\n\n");
            result = `${safeAnswer}\n\n${normalizedGallery}`;
            // Replace streamed provider output with the sanitized version so malformed image
            // code and oversized gallery queries cannot remain in the active chat transcript.
            if (socketId) {
                io.to(socketId).emit("chunk:reset");
                io.to(socketId).emit("chunk", result);
            }
        }

        const aiMessage = await messageModel.create({
            chat: chatId || chat._id,
            content: result,
            role: "ai",
            usedMemory
        });

        const chosenModelId = activeSwitchedModel?.modelId || targetModelId;
        const chosenProvider = activeSwitchedModel?.provider || targetProvider;
        const chosenDisplayName = activeSwitchedModel?.name || getModelDisplayName(chosenModelId, chosenProvider);

        const responsePayload = {
            title: title,
            chat: chat || await chatModel.findById(chatId),
            userMessage,
            aiMessage,
            usedMemory,
            switchedModel: activeSwitchedModel,
            modelUsed: {
                modelId: chosenModelId,
                provider: chosenProvider,
                name: chosenDisplayName,
                badge: doesModelSupportVision(chosenModelId, chosenProvider) ? "Vision" : "Fast",
                isCustom: Boolean(activeSwitchedModel?.isCustom || customKeyEntry)
            }
        };

        if (resolveInFlight) {
            resolveInFlight(responsePayload);
            // Retain for 3.5 seconds to absorb trailing rapid duplicate calls
            setTimeout(() => {
                if (dedupKey) inFlightRequests.delete(dedupKey);
            }, 3500);
        }

        res.status(201).json(responsePayload);

        // Fire-and-forget: Generate embeddings for both messages and learn user facts into memory
        if (!isIncognito && !smallTalk) {
            (async () => {
                try {
                    // 1. User memory and persona extractor (learn facts like "remember my friend name is Tez")
                    await extractAndStoreMemory(req.user.id, message || userMessage.content);

                    // 2. Vector embeddings for message search
                    const [userEmb, aiEmb] = await Promise.allSettled([
                        generateEmbedding(userMessage.content),
                        generateEmbedding(aiMessage.content)
                    ]);
                    if (userEmb.status === 'fulfilled' && userEmb.value) {
                        await messageModel.updateOne({ _id: userMessage._id }, { $set: { embedding: userEmb.value } });
                    }
                    if (aiEmb.status === 'fulfilled' && aiEmb.value) {
                        await messageModel.updateOne({ _id: aiMessage._id }, { $set: { embedding: aiEmb.value } });
                    }
                } catch (embErr) {
                    console.warn("⚠️ Background memory/embedding task warning:", embErr.message);
                }
            })();
        }
    } catch (error) {
        if (rejectInFlight) {
            rejectInFlight(error);
        }
        if (dedupKey) {
            inFlightRequests.delete(dedupKey);
        }
        console.error("Error in sendMessage controller:", error);
        const isOverload = /overload|429|503|quota|resource.*exhaust|high traffic|rate limit|capacity|failed to parse stream/i.test(error.message);
        const statusCode = isOverload ? 429 : 500;
        const message = isOverload
            ? "Gemini is experiencing high traffic right now and may take a moment to respond. Please try again shortly or switch to another model."
            : "The assistant could not complete this request. Please try again or choose another model.";

        res.status(statusCode).json({
            message,
            isOverloaded: isOverload,
            error: isOverload ? error.message : undefined
        });
    }
}



export async function getChats(req,res){
    const user = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const query = { user: user.id, incognito: { $ne: true } };
    const [totalChats, chats] = await Promise.all([
        chatModel.countDocuments(query),
        chatModel.find(query)
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean()
    ]);

    res.status(200).json({
        message: "Chats retrieved successfully",
        chats,
        totalChats,
        totalPages: Math.ceil(totalChats / limit),
        currentPage: page,
        hasMore: skip + chats.length < totalChats
    });
}


export async function getMessages(req,res){
    const { chatId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const chat = await chatModel.findById(chatId).select("user").lean();

    if(!chat){
        return res.status(404).json({
            message: "Chat not found"
        });
    }

    // Strict Authorization Guard: Ensure only the chat owner can access their messages
    if (chat.user.toString() !== req.user.id) {
        return res.status(403).json({
            message: "Access denied. You do not own this chat.",
            isOwner: false
        });
    }

    // Total messages count for pagination metadata
    const totalMessages = await messageModel.countDocuments({ chat: chatId });
    
    // Calculate how many to skip from the END (newest messages first loading)
    // Page 1 = last 10 messages, Page 2 = 10 before that, etc.
    const skip = Math.max(0, totalMessages - (page * limit));
    const actualLimit = page * limit > totalMessages ? totalMessages - ((page - 1) * limit) : limit;

    const messages = await messageModel.find({ chat: chatId })
        .sort({ createdAt: 1 }) // Chronological order
        .skip(skip)
        .limit(actualLimit)
        .lean();

    res.status(200).json({
        message: "Messages retrieved successfully",
        messages,
        isOwner: true,
        totalMessages,
        currentPage: page,
        hasMore: skip > 0
    });
}

export async function deleteChat(req,res){
    const { chatId } = req.params;

    const chat = await chatModel.findOneAndDelete({
        _id:chatId,
        user:req.user.id
    })
    if(!chat){
        return res.status(404).json({
            message: "Chat not found"
        })
    }

    await messageModel.deleteMany({
        chat: chatId
    })

    res.status(200).json({
        message: "Chat deleted successfully",
    });
}

export async function getSuggestions(req, res) {
    try {
        const { chatId } = req.query;
        let messages = [];

        // Verify that the requested chat belongs to the authenticated user before extracting messages
        if (chatId) {
            if (req.user?.id) {
                const chat = await chatModel.findOne({ _id: chatId, user: req.user.id }).select("_id").lean();
                if (chat) {
                    messages = await messageModel.find({ chat: chatId });
                }
            }
        }

        const suggestions = await generateSuggestions(messages);
        
        res.status(200).json({
            message: "Suggestions generated successfully",
            suggestions
        });
    } catch (error) {
        console.error("Error in getSuggestions controller:", error);
        res.status(500).json({
            message: "Failed to generate suggestions",
            error: error.message
        });
    }
}

// Controller for library/search page to search for specific words within chat messages
// Limit to 20 results across active user's chats for performance.
export async function searchMessages(req, res) {
    try {
        const { q } = req.query; // Search query string provided by the user
        if (!q) {
            return res.status(200).json({ results: [] });
        }

        // 1. First fetch all non-incognito chat IDs of the user
        const userChats = await chatModel.find({ user: req.user.id, incognito: { $ne: true } }).select('_id title');
        const chatMap = {};
        const chatIds = userChats.map(c => {
            chatMap[c._id.toString()] = c.title;
            return c._id;
        });

        if (chatIds.length === 0) {
            return res.status(200).json({ results: [] });
        }

        // 2. Query messages matching the keyword using sanitized regex in messageModel
        const safeQ = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const matchedMessages = await messageModel.find({
            chat: { $in: chatIds },
            content: { $regex: safeQ, $options: 'i' }
        })
        .sort({ createdAt: -1 }) // New messages appear at the top
        .limit(20) // Only top 20 to avoid slowing down app or DB (for performance)
        .lean(); // Faster JSON object

        // Format the response and add the chat title for better frontend UI
        const results = matchedMessages.map(msg => ({
            ...msg,
            chatTitle: chatMap[msg.chat.toString()] || "Untitled Chat"
        }));

        res.status(200).json({
            message: "Search completed successfully",
            results
        });

    } catch (error) {
        console.error("Error in searchMessages controller:", error);
        res.status(500).json({
            message: "Global search failed",
            error: error.message
        });
    }
}

// Controller to record user feedback ('like' | 'dislike' | null) on an AI message
export async function rateMessageFeedback(req, res) {
    try {
        const { messageId } = req.params;
        const { feedback } = req.body;

        if (feedback !== null && !['like', 'dislike'].includes(feedback)) {
            return res.status(400).json({ message: "Invalid feedback value. Must be 'like', 'dislike', or null." });
        }

        const message = await messageModel.findById(messageId).populate({
            path: 'chat',
            select: 'user'
        });

        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        // Verify that the user owns the chat containing this message
        if (message.chat && message.chat.user && message.chat.user.toString() !== req.user.id) {
            return res.status(403).json({ message: "Access denied. You do not own this chat." });
        }

        message.feedback = feedback;
        await message.save();

        res.status(200).json({
            success: true,
            feedback: message.feedback,
            messageId: message._id
        });
    } catch (error) {
        console.error("Error in rateMessageFeedback controller:", error);
        res.status(500).json({
            message: "Failed to record message feedback",
            error: error.message
        });
    }
}

// ─── Rename Chat ────────────────────────────────────────────────────────────
export async function renameChat(req, res) {
    try {
        const { chatId } = req.params;
        const { title } = req.body;
        if (!title || !title.trim()) {
            return res.status(400).json({ success: false, message: "Title is required" });
        }
        const chat = await chatModel.findOne({ _id: chatId, user: req.user.id });
        if (!chat) return res.status(404).json({ success: false, message: "Chat not found" });
        chat.title = title.trim().slice(0, 200);
        await chat.save();
        res.json({ success: true, chat: { id: chat._id, title: chat.title } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

// ─── Toggle Pin Chat ────────────────────────────────────────────────────────
export async function togglePinChat(req, res) {
    try {
        const { chatId } = req.params;
        const chat = await chatModel.findOne({ _id: chatId, user: req.user.id });
        if (!chat) return res.status(404).json({ success: false, message: "Chat not found" });
        chat.isPinned = !chat.isPinned;
        await chat.save();
        res.json({ success: true, isPinned: chat.isPinned });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

// ─── Update Message Code (Artifact Editor DB Persistence) ────────────────────
export async function updateMessageCode(req, res) {
    try {
        const { messageId } = req.params;
        const { code, content, language } = req.body;
        const newCode = typeof code === 'string' ? code : (typeof content === 'string' ? content : null);

        if (newCode === null) {
            return res.status(400).json({ success: false, message: "Code or content string is required" });
        }

        const message = await messageModel.findById(messageId).populate('chat');
        if (!message) {
            return res.status(404).json({ success: false, message: "Message not found" });
        }

        // Verify that the user owns the chat containing this message
        if (message.chat && message.chat.user && message.chat.user.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: "Access denied. You do not own this chat." });
        }

        const originalContent = message.content || '';
        const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/;

        if (codeBlockRegex.test(originalContent)) {
            const match = originalContent.match(codeBlockRegex);
            const lang = language || (match ? match[1] : '');
            message.content = originalContent.replace(codeBlockRegex, `\`\`\`${lang}\n${newCode}\n\`\`\``);
        } else {
            message.content = newCode;
        }

        await message.save();

        return res.status(200).json({
            success: true,
            message: "Code updated successfully in database",
            messageId: message._id,
            updatedCode: newCode,
            content: message.content
        });
    } catch (err) {
        console.error("Error in updateMessageCode controller:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to save code in database",
            error: err.message
        });
    }
}

