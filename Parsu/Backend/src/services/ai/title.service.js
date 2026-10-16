// ============================================================
// CHAT TITLE GENERATOR — HIGH SPEED & BYOK ADAPTIVE
// ============================================================
// Rules:
//   → If the user provided a custom API key, generate title using their key & preferred model
//   → Otherwise, use the fastest available model (Groq sub-150ms or Gemini Flash with maxOutputTokens: 25)
//   → Always strict 3-second timeout and instantaneous word-slice fallback
//   → 2 to 4 words, sentence case, no markdown/quotes
// ============================================================

import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";

const TITLE_SYSTEM_PROMPT = 
  "Generate a short 2 to 4 word title for this chat based on the user's message. Reply with ONLY the title. No quotes, no markdown, no punctuation.";

function cleanTitle(rawTitle, fallback) {
  if (!rawTitle || typeof rawTitle !== "string") return fallback;
  const sanitized = rawTitle
    .replace(/["'`*#_~]/g, "")
    .replace(/^Title:\s*/i, "")
    .replace(/[.!?]+$/, "")
    .trim();

  if (!sanitized) return fallback;
  // Limit to at most 50 characters
  return sanitized.length > 50 ? sanitized.substring(0, 50).trim() : sanitized;
}

export function fallbackTitle(message) {
  if (!message || typeof message !== "string") return "New Chat";
  const words = message.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "New Chat";
  return words.length > 4
    ? words.slice(0, 4).join(" ") + "..."
    : words.join(" ");
}

/**
 * Generate chat title using either the user's provided API key/model or a fast built-in engine.
 * @param {string} message - Initial user message or attachment name
 * @param {object} options - { userApiKey, provider, modelId }
 * @returns {Promise<string>}
 */
export async function generateChatTitle(message, options = {}) {
  const defaultFallback = fallbackTitle(message);
  if (!message || typeof message !== "string" || !message.trim()) {
    return defaultFallback;
  }

  const { userApiKey, provider, modelId } = options;
  const promptText = message.length > 300 ? message.substring(0, 300) : message;

  // ── A. USER PROVIDED CUSTOM API KEY (BYOK) ──────────────────────
  if (userApiKey && typeof userApiKey === "string" && userApiKey.trim()) {
    const cleanKey = userApiKey.trim();
    const userProvider = (provider || "gemini").toLowerCase();

    try {
      console.log(`📝 [Title] Generating title with user's custom API key (${userProvider} / ${modelId || "default"})...`);

      // 1. User Gemini
      if (userProvider === "gemini") {
        const genAI = new GoogleGenerativeAI(cleanKey);
        const resolvedModel = modelId || "gemini-3.6-flash";
        const model = genAI.getGenerativeModel({
          model: resolvedModel,
          generationConfig: { maxOutputTokens: 25, temperature: 0.1 }
        });

        const result = await Promise.race([
          model.generateContent(`${TITLE_SYSTEM_PROMPT}\n\nUser message: "${promptText}"`),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 3500))
        ]);

        const raw = result?.response?.text();
        const title = cleanTitle(raw, defaultFallback);
        console.log(`✅ [Title] Generated with custom Gemini: "${title}"`);
        return title;
      }

      // 2. User Groq (Ultra fast)
      if (userProvider === "groq") {
        const groqModel = modelId || "llama-3.1-8b-instant";
        const res = await axios.post(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            model: groqModel,
            messages: [
              { role: "system", content: TITLE_SYSTEM_PROMPT },
              { role: "user", content: promptText }
            ],
            max_tokens: 25,
            temperature: 0.1
          },
          {
            headers: { Authorization: `Bearer ${cleanKey}` },
            timeout: 3500
          }
        );
        const raw = res.data?.choices?.[0]?.message?.content;
        const title = cleanTitle(raw, defaultFallback);
        console.log(`✅ [Title] Generated with custom Groq: "${title}"`);
        return title;
      }

      // 3. User OpenAI
      if (userProvider === "openai") {
        const oaiModel = modelId || "gpt-4o-mini";
        const res = await axios.post(
          "https://api.openai.com/v1/chat/completions",
          {
            model: oaiModel,
            messages: [
              { role: "system", content: TITLE_SYSTEM_PROMPT },
              { role: "user", content: promptText }
            ],
            max_tokens: 25,
            temperature: 0.1
          },
          {
            headers: { Authorization: `Bearer ${cleanKey}` },
            timeout: 3500
          }
        );
        const raw = res.data?.choices?.[0]?.message?.content;
        const title = cleanTitle(raw, defaultFallback);
        console.log(`✅ [Title] Generated with custom OpenAI: "${title}"`);
        return title;
      }

      // 4. User OpenRouter
      if (userProvider === "openrouter") {
        const routerModel = modelId || "meta-llama/llama-3.1-8b-instruct";
        const res = await axios.post(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            model: routerModel,
            messages: [
              { role: "system", content: TITLE_SYSTEM_PROMPT },
              { role: "user", content: promptText }
            ],
            max_tokens: 25
          },
          {
            headers: { Authorization: `Bearer ${cleanKey}` },
            timeout: 3500
          }
        );
        const raw = res.data?.choices?.[0]?.message?.content;
        const title = cleanTitle(raw, defaultFallback);
        console.log(`✅ [Title] Generated with custom OpenRouter: "${title}"`);
        return title;
      }

      // 5. User Mistral
      if (userProvider === "mistral") {
        const mistralModel = modelId || "open-mistral-nemo";
        const res = await axios.post(
          "https://api.mistral.ai/v1/chat/completions",
          {
            model: mistralModel,
            messages: [
              { role: "system", content: TITLE_SYSTEM_PROMPT },
              { role: "user", content: promptText }
            ],
            max_tokens: 25
          },
          {
            headers: { Authorization: `Bearer ${cleanKey}` },
            timeout: 3500
          }
        );
        const raw = res.data?.choices?.[0]?.message?.content;
        const title = cleanTitle(raw, defaultFallback);
        console.log(`✅ [Title] Generated with custom Mistral: "${title}"`);
        return title;
      }
    } catch (err) {
      console.warn(`⚠️ [Title] Custom user model generation failed (${err.message?.substring(0, 50)}). Falling back to fast built-in model.`);
    }
  }

  // ── B. FAST BUILT-IN SYSTEM MODEL ────────────────────────────────
  try {
    // 1. Try Groq first if available in env (fastest inference, ~120ms)
    if (process.env.GROQ_API_KEY) {
      try {
        const res = await axios.post(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            model: "llama-3.1-8b-instant",
            messages: [
              { role: "system", content: TITLE_SYSTEM_PROMPT },
              { role: "user", content: promptText }
            ],
            max_tokens: 20,
            temperature: 0.1
          },
          {
            headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
            timeout: 2500
          }
        );
        const raw = res.data?.choices?.[0]?.message?.content;
        const title = cleanTitle(raw, defaultFallback);
        if (title) {
          console.log(`⚡ [Title] Generated with ultra-fast Groq: "${title}"`);
          return title;
        }
      } catch (groqErr) {
        // Fall through to Gemini
      }
    }

    // 2. High-speed Gemini Flash model
    if (process.env.GEMINI_API_KEY) {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: "gemini-3.6-flash",
        generationConfig: { maxOutputTokens: 25, temperature: 0.1 }
      });

      const result = await Promise.race([
        model.generateContent(`${TITLE_SYSTEM_PROMPT}\n\nUser message: "${promptText}"`),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 3000))
      ]);

      const raw = result?.response?.text();
      const title = cleanTitle(raw, defaultFallback);
      console.log(`⚡ [Title] Generated with fast Gemini Flash: "${title}"`);
      return title;
    }
  } catch (error) {
    console.warn(`⚠️ [Title] Fast title model failed (${error.message?.substring(0, 50)}). Using word-slice fallback.`);
  }

  return defaultFallback;
}
