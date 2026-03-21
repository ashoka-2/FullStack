// ============================================================
// AI MODELS CONFIGURATION — SMART QUOTA SPREAD
// ============================================================
// strategy: Alag-alag model IDs use kar rahe hain taaki 
// humein alag-alag daily quotas milein.
// ============================================================

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatMistralAI } from "@langchain/mistralai";

// ── 1. TITLE GENERATION (Huge Quota: 500 RPD) ──────────────
// Isse title calls clash nahi karenge chat calls se.
export const geminiTextModel = new ChatGoogleGenerativeAI({
  model: "gemini-3.1-flash-lite-preview",
  apiKey: process.env.GEMINI_API_KEY,
  apiVersion: "v1beta",
  maxRetries: 1,
});


// ── 2. VISION CASCADE (Quota: 20 + 20 = 40 Images/day) ─────

// Vision Tier 1 (Confirmed Working)
export const geminiVision1 = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash-lite",
  apiKey: process.env.GEMINI_API_KEY,
  apiVersion: "v1beta",
  maxRetries: 0,
});

// Vision Tier 2 (Stable Fallback - note: 'v1' version use kar rahe hain)
export const geminiVision2 = new ChatGoogleGenerativeAI({
  model: "gemini-1.5-flash", 
  apiKey: process.env.GEMINI_API_KEY,
  apiVersion: "v1", // ✅ 1.5 model usually v1 pe stable hai
  maxRetries: 1,
});


// ── 3. MAIN TEXT CHAT (Mistral 30 RPM) ─────────────────────
export const mistralModel = new ChatMistralAI({
  model: "mistral-small-latest",
  apiKey: process.env.MISTRAL_API_KEY,
  temperature: 0,
});


// ── 4. TEXT FALLBACK (Quota: 20 RPD) ────────────────────────
// Mistral 429 maarne lage toh ye model tool calling sambhal lega
export const geminiChatFallback = new ChatGoogleGenerativeAI({
  model: "gemini-1.5-flash",
  apiKey: process.env.GEMINI_API_KEY,
  apiVersion: "v1",
  maxRetries: 1,
});


// Note: gemma-3-12b-it ko hata diya hai kyunki wo tool calling support nahi karta (Instagram block ho raha tha)
