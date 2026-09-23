// ============================================================
// CHAT TITLE GENERATOR — GEMINI POWERED (WITH LOGGING)
// ============================================================

import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { geminiTextModel } from "./models.js";

export async function generateChatTitle(message) {
  if (!message || typeof message !== 'string') return "New Chat";

  try {
    console.log("📝 [Title] Generating title with gemini-3.1-flash-lite-preview...");
    
    const response = await geminiTextModel.invoke([
      new SystemMessage({
        content: "Generate a short 2 to 4 word title for this chat based on the user's first message. Reply with ONLY the title, no quotes, no punctuation."
      }),
      new HumanMessage({ content: message })
    ]);

    const title = response.content?.replace(/['"]/g, '').trim();
    console.log(`✅ [Title] Generated: "${title || "New Chat"}"`);
    return title || fallbackTitle(message);

  } catch (error) {
    console.warn(`⚠️ [Title] Gemini failed (${error.message?.substring(0, 50)}). Using word-slice fallback.`);
    return fallbackTitle(message);
  }
}

function fallbackTitle(message) {
  const words = message.trim().split(/\s+/);
  return words.length > 5
    ? words.slice(0, 5).join(" ") + "..."
    : message;
}
