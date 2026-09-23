import { GoogleGenerativeAI } from "@google/generative-ai";

// ─── Gemini Embedding Service ──────────────────────────────────────────────────
// Uses text-embedding-004 model for generating 768-dimension vectors
// Used by RAG pipeline for semantic search on chat messages and uploaded documents

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

/**
 * Generate embedding vector for a single text string
 * @param {string} text — Input text to embed
 * @returns {Promise<number[]>} — 768-dimension vector
 */
export async function generateEmbedding(text) {
    try {
        // Truncate to ~8000 chars to stay within token limits
        const truncated = text.slice(0, 8000);
        const result = await embeddingModel.embedContent(truncated);
        return result.embedding.values;
    } catch (error) {
        console.error("❌ Embedding generation failed:", error.message);
        return null;
    }
}

/**
 * Generate embeddings for multiple text strings in batch
 * @param {string[]} texts — Array of strings to embed
 * @returns {Promise<(number[] | null)[]>}
 */
export async function generateEmbeddings(texts) {
    const results = [];
    // Process in batches of 5 to avoid rate limiting
    for (let i = 0; i < texts.length; i += 5) {
        const batch = texts.slice(i, i + 5);
        const batchResults = await Promise.allSettled(
            batch.map(t => generateEmbedding(t))
        );
        results.push(...batchResults.map(r => r.status === 'fulfilled' ? r.value : null));
    }
    return results;
}

/**
 * Chunk a large text into ~500-token passages (~2000 chars each)
 * with 200 char overlap for context preservation
 * @param {string} text — Full document text
 * @returns {string[]} — Array of text chunks
 */
export function chunkText(text, chunkSize = 2000, overlap = 200) {
    const chunks = [];
    let start = 0;
    while (start < text.length) {
        const end = Math.min(start + chunkSize, text.length);
        chunks.push(text.slice(start, end));
        start = end - overlap;
        if (start >= text.length) break;
    }
    return chunks;
}

/**
 * Compute cosine similarity between two vectors
 * Fallback for environments without Atlas Vector Search
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number} — Similarity score between -1 and 1
 */
export function cosineSimilarity(a, b) {
    if (!a || !b || a.length !== b.length) return 0;
    let dotProduct = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
