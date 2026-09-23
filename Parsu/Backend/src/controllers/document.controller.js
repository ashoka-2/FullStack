import documentModel from "../models/document.model.js";
import messageModel from "../models/message.model.js";
import chatModel from "../models/chat.model.js";
import { generateEmbedding, generateEmbeddings, chunkText, cosineSimilarity } from "../services/embedding.service.js";
import { uploadFile } from "../services/imagekit.service.js";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
let pdfModule = null;
try {
    pdfModule = require("pdf-parse");
} catch (e) {
    console.warn("Could not load pdf-parse:", e.message);
}

// ─── Upload Document ────────────────────────────────────────────────────────────
// Accepts PDF/text file, extracts text, chunks it, generates embeddings per chunk,
// and stores everything in the Document collection for semantic search
export async function uploadDocument(req, res) {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        // 1. Upload original file to ImageKit CDN (perplexity/documents folder)
        let imageKitFile = null;
        try {
            imageKitFile = await uploadFile({
                buffer: file.buffer,
                filename: file.originalname,
                folder: "perplexity/documents"
            });
        } catch (uploadErr) {
            console.error("ImageKit document upload failed:", uploadErr);
            // Continue without CDN storage — embeddings still work
        }

        // 2. Extract text based on file type
        let extractedText = "";

        if (file.mimetype === "application/pdf") {
            try {
                if (pdfModule?.PDFParse && typeof pdfModule.PDFParse === "function") {
                    const parser = new pdfModule.PDFParse({ data: file.buffer });
                    const pdfData = await parser.getText();
                    extractedText = pdfData?.text || "";
                    if (parser.destroy) await parser.destroy();
                } else if (typeof pdfModule === "function") {
                    const pdfData = await pdfModule(file.buffer);
                    extractedText = pdfData?.text || "";
                } else if (typeof pdfModule?.default === "function") {
                    const pdfData = await pdfModule.default(file.buffer);
                    extractedText = pdfData?.text || "";
                } else {
                    throw new Error("PDF parser not available");
                }
            } catch (pdfErr) {
                console.error("PDF text extraction error:", pdfErr);
                return res.status(400).json({ message: "Failed to extract text from PDF: " + pdfErr.message });
            }
        } else if (file.mimetype?.startsWith("text/") || file.originalname?.endsWith('.md') || file.originalname?.endsWith('.txt')) {
            extractedText = file.buffer.toString("utf-8");
        } else {
            return res.status(400).json({ message: "Unsupported file type. Please upload PDF, TXT, or MD files." });
        }

        if (!extractedText.trim()) {
            return res.status(400).json({ message: "No text content could be extracted from this file." });
        }

        // 3. Chunk the text into ~500-token passages with overlap
        const textChunks = chunkText(extractedText);

        // 4. Generate embeddings for all chunks
        const embeddings = await generateEmbeddings(textChunks.map(c => c));

        // Build chunk documents (only include chunks with successful embeddings)
        const chunks = textChunks
            .map((text, i) => ({
                text,
                embedding: embeddings[i]
            }))
            .filter(chunk => chunk.embedding !== null);

        if (chunks.length === 0) {
            return res.status(500).json({ message: "Failed to generate embeddings for document chunks." });
        }

        // 5. Save to database with ImageKit file details
        const document = await documentModel.create({
            user: req.user.id,
            chat: req.body.chatId || null,
            filename: file.originalname,
            originalSize: file.size,
            mimeType: file.mimetype,
            file: imageKitFile ? {
                url: imageKitFile.url,
                fileId: imageKitFile.fileId,
                thumbnailUrl: imageKitFile.thumbnailUrl
            } : null,
            chunks,
            totalChunks: chunks.length
        });

        res.status(201).json({
            message: "Document uploaded and indexed successfully",
            document: {
                _id: document._id,
                filename: document.filename,
                fileUrl: imageKitFile?.url || null,
                totalChunks: document.totalChunks,
                createdAt: document.createdAt
            }
        });

    } catch (error) {
        console.error("❌ Document upload failed:", error);
        res.status(500).json({
            message: "Document processing failed",
            error: error.message
        });
    }
}

// ─── Search Documents (Semantic / Vector Search) ────────────────────────────────
// Accepts a query, embeds it, then finds the most semantically similar chunks
// Uses in-memory cosine similarity (Atlas Vector Search can be added when available)
export async function searchDocuments(req, res) {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(200).json({ results: [] });
        }

        // Generate query embedding
        const queryEmbedding = await generateEmbedding(q);
        if (!queryEmbedding) {
            return res.status(500).json({ message: "Failed to generate query embedding" });
        }

        // Get all user's documents with their chunks
        const userDocs = await documentModel.find({ user: req.user.id })
            .select('filename chunks')
            .lean();

        if (userDocs.length === 0) {
            return res.status(200).json({ results: [] });
        }

        // Compute cosine similarity for each chunk against the query
        const scoredResults = [];
        for (const doc of userDocs) {
            for (const chunk of doc.chunks) {
                const score = cosineSimilarity(queryEmbedding, chunk.embedding);
                if (score > 0.3) { // Minimum relevance threshold
                    scoredResults.push({
                        text: chunk.text,
                        filename: doc.filename,
                        documentId: doc._id,
                        score
                    });
                }
            }
        }

        // Sort by score descending and return top 10
        scoredResults.sort((a, b) => b.score - a.score);
        const top = scoredResults.slice(0, 10);

        res.status(200).json({
            message: "Semantic search completed",
            results: top
        });

    } catch (error) {
        console.error("❌ Document search failed:", error);
        res.status(500).json({
            message: "Semantic search failed",
            error: error.message
        });
    }
}

// ─── Enhanced Message Search (Hybrid: Regex + Vector) ───────────────────────────
// Combines traditional regex search with vector similarity for richer results
export async function semanticMessageSearch(req, res) {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(200).json({ results: [] });
        }

        // 1. Get user's chats
        const userChats = await chatModel.find({ user: req.user.id }).select('_id title');
        const chatMap = {};
        const chatIds = userChats.map(c => {
            chatMap[c._id.toString()] = c.title;
            return c._id;
        });

        if (chatIds.length === 0) {
            return res.status(200).json({ results: [] });
        }

        // 2. Generate query embedding
        const queryEmbedding = await generateEmbedding(q);

        // 3. Regex search (fast, always available)
        const regexResults = await messageModel.find({
            chat: { $in: chatIds },
            content: { $regex: q, $options: 'i' }
        })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

        // 4. If we have a query embedding, also do vector search on messages that have embeddings
        let vectorResults = [];
        if (queryEmbedding) {
            const embeddedMessages = await messageModel.find({
                chat: { $in: chatIds },
                embedding: { $exists: true, $ne: [] }
            })
            .select('+embedding')
            .lean();

            vectorResults = embeddedMessages
                .map(msg => ({
                    ...msg,
                    score: cosineSimilarity(queryEmbedding, msg.embedding)
                }))
                .filter(msg => msg.score > 0.4)
                .sort((a, b) => b.score - a.score)
                .slice(0, 10);
        }

        // 5. Merge and deduplicate results (regex results first, then vector-only results)
        const seenIds = new Set(regexResults.map(r => r._id.toString()));
        const mergedResults = [
            ...regexResults.map(msg => ({
                ...msg,
                chatTitle: chatMap[msg.chat.toString()] || "Untitled Chat",
                matchType: 'text'
            })),
            ...vectorResults
                .filter(msg => !seenIds.has(msg._id.toString()))
                .map(msg => {
                    const { embedding, ...rest } = msg; // Remove embedding from response
                    return {
                        ...rest,
                        chatTitle: chatMap[msg.chat.toString()] || "Untitled Chat",
                        matchType: 'semantic',
                        score: msg.score
                    };
                })
        ];

        res.status(200).json({
            message: "Hybrid search completed",
            results: mergedResults.slice(0, 30)
        });

    } catch (error) {
        console.error("❌ Semantic message search failed:", error);
        res.status(500).json({
            message: "Search failed",
            error: error.message
        });
    }
}
