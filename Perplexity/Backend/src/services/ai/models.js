// ============================================================
// AI MODELS CONFIGURATION
// ============================================================
// Yahan sirf AI model instances hain.
// Inhe baaki files import karke use karti hain.
// Naya model add karna ho toh sirf yahan ek jagah karo!
// ============================================================

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatMistralAI } from "@langchain/mistralai";

// Tier 1: Primary Vision Model — Images analyze karne ke liye
// Free tier: ~20 req/day on Railway hosting
// maxRetries: 0 → Fail fast karo taaki backup try ho sake
export const geminiVisionModel = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash-lite",
  apiKey: process.env.GEMINI_API_KEY,
  apiVersion: "v1beta",
  maxRetries: 0,
  temperature: 0.1,
});

// Tier 2: Backup Vision Model — Agar Tier 1 ka daily quota khatam ho
export const geminiTextModel = new ChatGoogleGenerativeAI({
  model: "gemini-1.5-flash-lite",
  apiKey: process.env.GEMINI_API_KEY,
  apiVersion: "v1beta",
  maxRetries: 1,
  temperature: 0.1,
});

// Tier 3: Mistral — Text queries, Tool calling (Search / Email / Instagram)
// Sabse zyada use hone wala model — text ke liye best hai
export const mistralModel = new ChatMistralAI({
  model: "mistral-small-latest",
  apiKey: process.env.MISTRAL_API_KEY,
  temperature: 0,
  maxRetries: 2,
});
