// ============================================================
// AI MODELS CONFIGURATION — GEMINI-FIRST (v1beta)
// ============================================================

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatMistralAI } from "@langchain/mistralai";

// ⚠️ IMPORTANT: Always use "v1beta" for tools and system instructions!

// ── 1. PRIMARY TEXT CHAT ─────────────────────────────────────
// Uses Gemini 3.6 Flash (latest production-ready multimodal model)
export const geminiChatPrimary = new ChatGoogleGenerativeAI({
  model: "gemini-3.6-flash",
  apiKey: process.env.GEMINI_API_KEY,
  apiVersion: "v1beta",
  maxRetries: 2,
  temperature: 0,
});

// ── 2. VISION CASCADE ────────────────────────────────────────

// Vision Tier 1: Gemini 3.6 Flash (Primary Vision Engine)
export const geminiVision1 = new ChatGoogleGenerativeAI({
  model: "gemini-3.6-flash",
  apiKey: process.env.GEMINI_API_KEY,
  apiVersion: "v1beta",
  maxRetries: 2,
});

// Vision Tier 2: Gemini Flash Latest (High-Speed Fallback)
export const geminiVision2 = new ChatGoogleGenerativeAI({
  model: "gemini-flash-latest", 
  apiKey: process.env.GEMINI_API_KEY,
  apiVersion: "v1beta",
  maxRetries: 2,
});

// ── 3. BACKUP MODELS ─────────────────────────────────────────

// Fast Gemini fallback
export const geminiChatFallback = new ChatGoogleGenerativeAI({
  model: "gemini-flash-latest",
  apiKey: process.env.GEMINI_API_KEY,
  apiVersion: "v1beta",
  maxRetries: 2,
  temperature: 0,
});

// Mistral: Fallback model (open-mistral-nemo is supported on free tier without 429 rate limit lockouts)
export const mistralModel = new ChatMistralAI({
  model: "open-mistral-nemo",
  apiKey: (process.env.MISTRAL_API_KEY || "").trim(),
  temperature: 0,
});

// Export for title.service.js
export const geminiTextModel = geminiChatPrimary;
