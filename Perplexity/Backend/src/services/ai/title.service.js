// ============================================================
// CHAT TITLE GENERATOR — GEMINI POWERED
// ============================================================
// Kaam:
//   → Pehle user message se Gemini AI se 2-4 word title generate karo
//   → Gemini use karne ki wajah: Mistral ka quota bachana!
//     Warna title + followup message dono Mistral ko ek saath hit karte
//     hain jisse 429 Rate Limit error aata hai.
//   → Agar Gemini bhi fail ho → word-slice fallback (zero cost)
// ============================================================

import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { geminiTextModel } from "./models.js";

export async function generateChatTitle(message) {
  if (!message || typeof message !== 'string') return "New Chat";

  try {
    // Gemini se short 2-4 word title banana (Mistral quota bachane ke liye)
    const response = await geminiTextModel.invoke([
      new SystemMessage({
        content: "Generate a short 2 to 4 word title for this chat based on the user's first message. Reply with ONLY the title, nothing else, no quotes, no punctuation."
      }),
      new HumanMessage({ content: message })
    ]);

    const title = response.content?.replace(/['"]/g, '').trim();
    return title || fallbackTitle(message);

  } catch (error) {
    // Gemini fail (quota/region issue) → word-slice fallback
    console.warn("⚠️ Title generation fallback (Gemini failed):", error.message);
    return fallbackTitle(message);
  }
}

// Fallback: Pehle 5 words se title (Zero API cost, instant)
function fallbackTitle(message) {
  const words = message.trim().split(/\s+/);
  return words.length > 5
    ? words.slice(0, 5).join(" ") + "..."
    : message;
}
