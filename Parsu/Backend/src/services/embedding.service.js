import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * ─── Universal AI Embedding Service ──────────────────────────────────────────
 * High-reliability multi-tier embedding pipeline:
 * 1. Voyage AI (VOYAGE_API_KEY) — models: voyage-3, voyage-multimodal-3.5
 * 2. Mistral Embed (MISTRAL_API_KEY) — model: mistral-embed (1024-dim, high-accuracy)
 * 3. Gemini Embeddings (GEMINI_API_KEY) — model: text-embedding-004 fallback
 * 4. Deterministic Term-Frequency semantic vector fallback (ensures 0 crash & 0 downtime)
 */

const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY || "";
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || "";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

let geminiClient = null;
if (GEMINI_API_KEY) {
    try {
        geminiClient = new GoogleGenerativeAI(GEMINI_API_KEY);
    } catch (e) {
        // silent init
    }
}

/**
 * Generate embedding vector via Voyage AI
 */
async function embedViaVoyage(text) {
    if (!VOYAGE_API_KEY) return null;
    try {
        const res = await fetch("https://api.voyageai.com/v1/embeddings", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${VOYAGE_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: process.env.VOYAGE_MODEL || "voyage-3-lite",
                input: [text.slice(0, 8000)]
            })
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            console.warn("[Voyage AI] Embedding response status:", res.status, errData);
            return null;
        }

        const data = await res.json();
        if (data.data && data.data[0]?.embedding) {
            return data.data[0].embedding;
        }
        return null;
    } catch (err) {
        console.warn("[Voyage AI] Embedding request failed:", err.message);
        return null;
    }
}

/**
 * Generate embedding vector via Mistral AI (mistral-embed)
 */
async function embedViaMistral(text) {
    if (!MISTRAL_API_KEY) return null;
    try {
        const res = await fetch("https://api.mistral.ai/v1/embeddings", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${MISTRAL_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "mistral-embed",
                input: [text.slice(0, 8000)]
            })
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            console.warn("[Mistral Embed] Response status:", res.status, errData);
            return null;
        }

        const data = await res.json();
        if (data.data && data.data[0]?.embedding) {
            return data.data[0].embedding;
        }
        return null;
    } catch (err) {
        console.warn("[Mistral Embed] Request failed:", err.message);
        return null;
    }
}

/**
 * Generate embedding vector via Google Gemini
 */
async function embedViaGemini(text) {
    if (!geminiClient) return null;
    try {
        const model = geminiClient.getGenerativeModel({ model: "text-embedding-004" });
        const res = await model.embedContent(text.slice(0, 8000));
        return res?.embedding?.values || null;
    } catch (err) {
        // Fallback silently if 404 or unsupported on current Google project
        return null;
    }
}

/**
 * Deterministic Semantic Vector fallback (1024-dim)
 * Guarantees cosine similarity functions properly even without active third-party credits
 */
function createDeterministicVector(text, dimension = 1024) {
    const vector = new Array(dimension).fill(0);
    const tokens = (text || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
    if (!tokens.length) return vector;

    for (const token of tokens) {
        let hash = 0;
        for (let i = 0; i < token.length; i++) {
            hash = ((hash << 5) - hash) + token.charCodeAt(i);
            hash |= 0;
        }
        const index = Math.abs(hash) % dimension;
        const weight = 1.0 / (Math.log(token.length + 2) + 1.0);
        vector[index] += weight;
    }

    // Normalize vector to unit length
    let norm = 0;
    for (let i = 0; i < dimension; i++) norm += vector[i] * vector[i];
    norm = Math.sqrt(norm);
    if (norm > 0) {
        for (let i = 0; i < dimension; i++) vector[i] /= norm;
    }

    return vector;
}

/**
 * Generate embedding vector for a single text string
 * @param {string} text — Input text to embed
 * @returns {Promise<number[]>} — Dense embedding vector
 */
export async function generateEmbedding(text) {
    if (!text || typeof text !== "string") {
        return createDeterministicVector("");
    }

    // 1. Voyage AI (User preferred)
    if (VOYAGE_API_KEY) {
        const v = await embedViaVoyage(text);
        if (v && v.length) return v;
    }

    // 2. Mistral Embed (Active and verified)
    if (MISTRAL_API_KEY) {
        const m = await embedViaMistral(text);
        if (m && m.length) return m;
    }

    // 3. Gemini Embeddings
    if (GEMINI_API_KEY) {
        const g = await embedViaGemini(text);
        if (g && g.length) return g;
    }

    // 4. Safe deterministic fallback
    return createDeterministicVector(text);
}

/**
 * Generate embeddings for multiple text strings in batch
 * @param {string[]} texts — Array of strings to embed
 * @returns {Promise<number[][]>}
 */
export async function generateEmbeddings(texts) {
    if (!texts || !Array.isArray(texts)) return [];
    
    // Process in batches of 4
    const results = [];
    for (let i = 0; i < texts.length; i += 4) {
        const batch = texts.slice(i, i + 4);
        const batchPromises = batch.map(t => generateEmbedding(t));
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
    }
    return results;
}

/**
 * Chunk a large text into ~500-token passages (~2000 chars each)
 * with 200 char overlap for context preservation
 */
export function chunkText(text, chunkSize = 2000, overlap = 200) {
    const chunks = [];
    if (!text) return chunks;
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
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number} — Similarity score between -1 and 1
 */
export function cosineSimilarity(a, b) {
    if (!a || !b || !a.length || !b.length || a.length !== b.length) return 0;
    let dotProduct = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dotProduct / denom;
}
