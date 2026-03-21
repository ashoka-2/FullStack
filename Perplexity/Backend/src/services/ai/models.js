// ============================================================
// AI MODELS CONFIGURATION — GEMINI-FIRST (v1beta)
// ============================================================

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatMistralAI } from "@langchain/mistralai";

// ⚠️ IMPORTANT: Hamesha "v1beta" use karo tools/system instructions ke liye!

// ── 1. PRIMARY TEXT CHAT (Quota: 500 RPD) ──────────────────
// Ab hum Gemini 3.1 Flash Lite ko primary rakh rahe hain taki Mistral ka 429 na aaye.
export const geminiChatPrimary = new ChatGoogleGenerativeAI({
  model: "gemini-3.1-flash-lite-preview",
  apiKey: process.env.GEMINI_API_KEY,
  apiVersion: "v1beta", // ✅ Fixed: v1beta required for tools
  maxRetries: 2,
  temperature: 0,
});

// ── 2. VISION CASCADE (Quota: 20 + 20 = 40 Images/day) ─────

// Vision Tier 1: 2.5-Flash-Lite
export const geminiVision1 = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash-lite",
  apiKey: process.env.GEMINI_API_KEY,
  apiVersion: "v1beta",
  maxRetries: 0,
});

// Vision Tier 2: 1.5-Flash
export const geminiVision2 = new ChatGoogleGenerativeAI({
  model: "gemini-1.5-flash", 
  apiKey: process.env.GEMINI_API_KEY,
  apiVersion: "v1beta", // ✅ Fixed: v1beta required
  maxRetries: 1,
});


// ── 3. BACKUP MODELS ───────────────────────────────────────

// Mistral: Ab Backup route mein jayega (Last resort)
export const mistralModel = new ChatMistralAI({
  model: "mistral-small-latest",
  apiKey: process.env.MISTRAL_API_KEY,
  temperature: 0,
});

// title.service.js ke liye
export const geminiTextModel = geminiChatPrimary;
