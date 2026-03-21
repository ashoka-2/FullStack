// ============================================================
// AI MODELS CONFIGURATION — MULTI-TIER SMART CASCADE
// ============================================================
// Strategy: Multiple Gemini models use karke quota spread karo
// Ek model ki limit khatam ho → Seamlessly next pe jump karo
//
// VISION CASCADE (Image Processing):
//   Tier 1 → gemini-2.5-flash-lite   (20 RPD)
//   Tier 2 → gemini-2.0-flash        (20 RPD)
//   Tier 3 → gemini-2.5-flash        (20 RPD)
//   Total  → 60 images/day!
//
// TEXT CASCADE:
//   Title  → gemini-3.1-flash-lite-preview (500 RPD) ← Alag quota!
//   Chat   → mistral-small-latest          (30 RPM)
//   Backup → gemma-3-12b-it               (14,400 RPD)
// ============================================================

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatMistralAI } from "@langchain/mistralai";

// ── VISION MODELS (Images ke liye — 60 req/day combined) ────

// Tier 1: Primary vision
export const geminiVision1 = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash-lite",
  apiKey: process.env.GEMINI_API_KEY,
  apiVersion: "v1beta",
  maxRetries: 0,
  temperature: 0.1,
});

// Tier 2: Secondary vision
export const geminiVision2 = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash",
  apiKey: process.env.GEMINI_API_KEY,
  apiVersion: "v1beta",
  maxRetries: 0,
  temperature: 0.1,
});

// Tier 3: Tertiary vision
export const geminiVision3 = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  apiKey: process.env.GEMINI_API_KEY,
  apiVersion: "v1beta",
  maxRetries: 0,
  temperature: 0.1,
});

// ── TEXT MODELS ──────────────────────────────────────────────

// Title generation Model: 500 RPD — Mistral se bilkul alag quota!
// geminiTextModel → Title banata hai (Mistral chat call se clash nahi → No 429!)
export const geminiTextModel = new ChatGoogleGenerativeAI({
  model: "gemini-3.1-flash-lite-preview",
  apiKey: process.env.GEMINI_API_KEY,
  apiVersion: "v1beta",
  maxRetries: 1,
  temperature: 0.3,
});

// Primary Chat: Mistral — Tool calling ke liye best (Search/Email/Instagram)
export const mistralModel = new ChatMistralAI({
  model: "mistral-small-latest",
  apiKey: process.env.MISTRAL_API_KEY,
  temperature: 0,
  maxRetries: 2,
});

// Ultimate Fallback: Gemma 3 12B — 14,400 RPD!
// Mistral 429 hit kare tab seedha yahan aa jao
export const gemmaFallbackModel = new ChatGoogleGenerativeAI({
  model: "gemma-3-12b-it",
  apiKey: process.env.GEMINI_API_KEY,
  apiVersion: "v1beta",
  maxRetries: 1,
  temperature: 0.1,
});


