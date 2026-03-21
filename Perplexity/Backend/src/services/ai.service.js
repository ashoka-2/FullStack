// ============================================================
// AI SERVICE — BARREL EXPORT FILE
// ============================================================
// Yeh file sirf ek "gateway" hai.
// Actual logic ab alag files mein hai:
//
//   ai/models.js             → Gemini + Mistral instances
//   ai/chat.generator.js     → generateResponse (image/text routing)
//   ai/title.service.js      → generateChatTitle
//   ai/suggestions.service.js→ generateSuggestions (live news)
//
// Controller (chat.controller.js) yahan se import karta rehta hai,
// usmein koi change nahi karna padega!
// ============================================================

export { generateResponse } from "./ai/chat.generator.js";
export { generateChatTitle } from "./ai/title.service.js";
export { generateSuggestions } from "./ai/suggestions.service.js";