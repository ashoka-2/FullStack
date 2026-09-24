import { generateChatTitle, generateResponse, generateSuggestions } from "../services/ai.service.js";
import chatModel from "../models/chat.model.js";
import userModel from "../models/user.model.js";
import messageModel from "../models/message.model.js";
import { uploadFile } from "../services/imagekit.service.js";
import { getIO } from "../sockets/server.socket.js";
import { executeModelChatStream } from "../services/model.service.js";
import { decryptKey } from "../utils/encryption.utils.js";
import { generateEmbedding, cosineSimilarity } from "../services/embedding.service.js";

export async function sendMessage(req, res) {
    try {
        const { message, chat: chatId } = req.body;
        // Support both req.files (array) and req.file (single)
        const rawFiles = req.files && req.files.length > 0 ? req.files : (req.file ? [req.file] : []);
        const uploadedFiles = [];

        if (rawFiles.length > 0) {
            for (const f of rawFiles) {
                try {
                    let folder = "perplexity/chats";
                    if (f.mimetype?.startsWith("image/")) {
                        folder = "perplexity/photos";
                    } else if (f.mimetype?.startsWith("video/")) {
                        folder = "perplexity/videos";
                    } else if (f.mimetype === "application/pdf" || f.mimetype?.startsWith("text/")) {
                        folder = "perplexity/documents";
                    }

                    const uploaded = await uploadFile({
                        buffer: f.buffer,
                        filename: f.originalname,
                        folder
                    });

                    if (uploaded) {
                        uploaded.fileType = f.mimetype?.startsWith("image/") ? "image"
                            : f.mimetype?.startsWith("video/") ? "video"
                            : "document";
                        uploaded.mimetype = f.mimetype;
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

        if (!chatId) {
            const fallbackTitle = primaryFile?.fileType === "video" ? "Video Analysis" 
                : primaryFile?.fileType === "image" ? (uploadedFiles.length > 1 ? `Album (${uploadedFiles.length} photos)` : "Image Upload")
                : "New Chat";
            title = await generateChatTitle(message || fallbackTitle);
            chat = await chatModel.create({
                user: req.user.id,
                title,
                incognito: isIncognito
            });
        }

        const defaultContent = primaryFile?.fileType === "video" ? "Sent a video" 
            : primaryFile?.fileType === "image" ? (uploadedFiles.length > 1 ? `Sent ${uploadedFiles.length} photos` : "Sent an image")
            : "Sent an attachment";

        const userMessage = await messageModel.create({
            chat: chatId || chat._id,
            content: message || defaultContent,
            role: "user",
            file: primaryFile,
            files: uploadedFiles
        });

        const messages = await messageModel.find({ chat: chatId || chat._id });
        
        const io = getIO();
        const socketId = req.body.socketId;

        const fullUser = await userModel.findById(req.user.id).select("+customApiKeys.apiKey");

        const targetProvider = req.body.provider || fullUser?.selectedModel?.provider || "gemini";
        const targetModelId = req.body.modelId || fullUser?.selectedModel?.modelId || "gemini-2.5-flash";
        const isCustom = req.body.isCustom || false;
        const keyId = req.body.keyId;

        let result = "";

        // Check if user has a custom key for this provider
        let customKeyEntry = null;
        if (fullUser && fullUser.customApiKeys && fullUser.customApiKeys.length > 0) {
            customKeyEntry = fullUser.customApiKeys.find(k => 
                (keyId && k._id.toString() === keyId.toString()) ||
                (k.provider === targetProvider && (!req.body.keyName || k.name === req.body.keyName))
            );
        }

        // Web Search evaluation (Tavily live search vs pure AI model knowledge)
        const explicitWebSearch = req.body.webSearch === 'true' || req.body.webSearch === true;
        const promptRaw = (message || userMessage.content || "").toLowerCase();
        const autoTriggerKeywords = ["latest", "recent", "news", "today", "current", "latest info", "update", "right now", "live score"];
        const autoTriggerWebSearch = autoTriggerKeywords.some(kw => promptRaw.includes(kw));
        const shouldExecuteWebSearch = explicitWebSearch || autoTriggerWebSearch;

        let webSearchContext = "";

        if (shouldExecuteWebSearch && (message || userMessage.content)) {
            try {
                const { tavily } = await import("@tavily/core");
                const tvly = new tavily(process.env.TAVILY_API_KEY);
                const query = message || userMessage.content;
                const searchResults = await tvly.search(query, { searchDepth: "basic", maxResults: 5 });
                if (searchResults?.results?.length > 0) {
                    webSearchContext = `\n\n--- REAL-TIME INTERNET SEARCH RESULTS (via Tavily) ---\n` +
                        searchResults.results.map((r, i) => `[${i + 1}] Title: ${r.title}\n    URL: ${r.url}\n    Content: ${r.content}`).join("\n\n") +
                        `\n------------------------------------------------------\n` +
                        `INSTRUCTIONS FOR CITATIONS & ACCURACY:\n` +
                        `1. Use these live internet findings to deliver a comprehensive, up-to-date response.\n` +
                        `2. You MUST cite your sources! At the end of your answer, provide a dedicated '### Sources & Citations' section listing the clickable markdown links: [Title](URL) for every article or website you gathered facts from.\n`;
                }
            } catch (tavilyErr) {
                console.warn("⚠️ Tavily web search error in chat.controller:", tavilyErr.message);
            }
        }

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

        // ── Cross-Chat Memory (Vector Semantic Retrieval) ─────────────────────
        const isMemoryEnabled = !isIncognito && req.body.memory !== 'false' && req.body.memory !== false;
        let memoryContext = "";

        if (isMemoryEnabled && req.user?._id) {
            try {
                const currentChatId = chatId || chat._id;
                const otherChats = await chatModel.find({
                    user: req.user._id,
                    _id: { $ne: currentChatId }
                }).select('_id title').limit(20);

                if (otherChats.length > 0) {
                    const otherChatIds = otherChats.map(c => c._id);
                    const pastMessages = await messageModel.find({
                        chat: { $in: otherChatIds }
                    })
                    .select('+embedding content role chat createdAt')
                    .sort({ createdAt: -1 })
                    .limit(40);

                    if (pastMessages.length > 0) {
                        const promptText = message || userMessage.content;
                        const promptVector = await generateEmbedding(promptText);

                        let scored = [];
                        for (const pm of pastMessages) {
                            if (!pm.content || pm.content.length < 5) continue;
                            let score = 0;
                            if (promptVector && pm.embedding && pm.embedding.length > 0) {
                                score = cosineSimilarity(promptVector, pm.embedding);
                            } else {
                                // Fast keyword fallback if embedding not yet generated
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
                        const topMemories = scored.filter(item => item.score > 0.4).slice(0, 3);

                        if (topMemories.length > 0) {
                            const chatTitleMap = new Map(otherChats.map(c => [c._id.toString(), c.title || 'Previous Chat']));
                            memoryContext = `\n\n--- RECALLED CROSS-CHAT MEMORY (Across User's Other Chats) ---\n` +
                                `The user has enabled memory across chats. Relevant context and facts recalled from their previous conversations:\n` +
                                topMemories.map(({ message: pm }) => {
                                    const title = chatTitleMap.get(pm.chat.toString()) || 'Other Chat';
                                    const excerpt = pm.content.length > 180 ? pm.content.slice(0, 177) + '...' : pm.content;
                                    return `• [Chat: "${title}"]: ${excerpt}`;
                                }).join("\n") +
                                `\n--------------------------------------------------------------\nUse this context naturally to answer smartly without explicitly saying "According to your other chat" unless asked.`;
                        }
                    }
                }
            } catch (memErr) {
                console.warn("⚠️ Cross-chat memory retrieval warning:", memErr.message);
            }
        }

        const userContextWithSearch = {
            ...(fullUser?.toObject ? fullUser.toObject() : fullUser),
            webSearch: shouldExecuteWebSearch,
            webSearchContext,
            uploadedMediaContext,
            feedbackInstruction,
            memoryContext
        };

        const isNonGeminiProvider = targetProvider !== "gemini";
        const hasCustomKey = Boolean(customKeyEntry && customKeyEntry.apiKey);

        if (hasCustomKey || isNonGeminiProvider) {
            let decryptedApiKey = "";
            let targetBaseUrl = "";
            if (customKeyEntry) {
                decryptedApiKey = decryptKey(customKeyEntry.apiKey);
                targetBaseUrl = customKeyEntry.baseUrl;
            }

            try {
                // Prepare message payload: inject real-time Tavily search context, media links, and feedback instruction into latest user message
                const chatHistoryForModel = messages.map(m => ({ role: m.role, content: m.content }));
                const extraContext = (webSearchContext ? webSearchContext : "") + 
                    (uploadedMediaContext ? uploadedMediaContext : "") +
                    (feedbackInstruction ? feedbackInstruction : "") + 
                    (memoryContext ? memoryContext : "");
                if (extraContext && chatHistoryForModel.length > 0) {
                    const lastUserIndex = chatHistoryForModel.map(m => m.role).lastIndexOf("user");
                    if (lastUserIndex !== -1) {
                        chatHistoryForModel[lastUserIndex].content += extraContext;
                    }
                }

                // Execute using universal stream engine
                result = await executeModelChatStream({
                    provider: targetProvider,
                    modelId: targetModelId,
                    apiKey: decryptedApiKey,
                    baseUrl: targetBaseUrl,
                    messages: chatHistoryForModel,
                    onChunk: (chunk) => {
                        if (socketId) {
                            io.to(socketId).emit("chunk", chunk);
                        }
                    }
                });
            } catch (modelErr) {
                console.warn(`⚠️ Custom/Provider [${targetProvider} - ${targetModelId}] execution failed:`, modelErr.message);
                const isOverload = /overload|429|503|quota|resource.*exhaust|high traffic|rate limit|capacity/i.test(modelErr.message);
                const switchNotice = isOverload
                    ? `\n\n*(Notice: ${targetProvider} is experiencing high traffic right now. Seamlessly switching to Gemini search...)*\n\n`
                    : `\n\n*(Notice: ${targetProvider} model returned: "${modelErr.message}". Defaulting to Gemini search)*\n\n`;
                if (socketId) {
                    io.to(socketId).emit("chunk", switchNotice);
                }
                result = await generateResponse(messages, (chunk) => {
                    if (socketId) {
                        io.to(socketId).emit("chunk", chunk);
                    }
                }, userContextWithSearch);
            }
        } else {
            // Default Gemini pipeline with internet search and LangChain tools
            result = await generateResponse(messages, (chunk) => {
                if (socketId) {
                    io.to(socketId).emit("chunk", chunk);
                }
            }, userContextWithSearch);
        }

        const aiMessage = await messageModel.create({
            chat: chatId || chat._id,
            content: result,
            role: "ai"
        })

        res.status(201).json({
            title: title,
            chat: chat || await chatModel.findById(chatId),
            userMessage,
            aiMessage
        })

        // Fire-and-forget: Generate embeddings for both messages (won't slow down response, skip if incognito)
        if (!isIncognito) {
            (async () => {
                try {
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
                    console.warn("⚠️ Embedding generation skipped:", embErr.message);
                }
            })();
        }
    } catch (error) {
        console.error("Error in sendMessage controller:", error);
        const isOverload = /overload|429|503|quota|resource.*exhaust|high traffic|rate limit|capacity|failed to parse stream/i.test(error.message);
        const statusCode = isOverload ? 429 : 500;
        const message = isOverload
            ? "Gemini is experiencing high traffic right now and may take a moment to respond. Please try again shortly or switch to another model."
            : (error.message || "Internal server error");

        res.status(statusCode).json({
            message,
            isOverloaded: isOverload,
            error: error.message
        });
    }
}



export async function getChats(req,res){
    const user = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const query = { user: user.id, incognito: { $ne: true } };
    const totalChats = await chatModel.countDocuments(query);
    const chats = await chatModel.find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit);

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

    const chat = await chatModel.findById(chatId);

    if(!chat){
        return res.status(404).json({
            message: "Chat not found"
        })
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
        .limit(actualLimit);

    res.status(200).json({
        message: "Messages retrieved successfully",
        messages,
        isOwner: chat.user.toString() === req.user.id,
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

        // Agar chatId query context mein hai, toh wahan se messages nikalo
        if (chatId) {
            messages = await messageModel.find({ chat: chatId });
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

        // 2. Query messages matching the keyword using regex in messageModel
        // 'i' in regex means case-insensitive (matches both uppercase and lowercase)
        const matchedMessages = await messageModel.find({
            chat: { $in: chatIds },
            content: { $regex: q, $options: 'i' }
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

        const message = await messageModel.findByIdAndUpdate(
            messageId,
            { feedback },
            { new: true }
        );

        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

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