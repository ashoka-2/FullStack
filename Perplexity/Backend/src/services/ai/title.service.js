// ============================================================
// CHAT TITLE GENERATOR — AI POWERED
// ============================================================
// Kaam:
//   → Pehle user message se Mistral AI ke zariye
//     ek short 2-4 word title generate karta hai
//   → Agar AI fail ho (timeout/rate limit) toh
//     pehle 5 words ka fallback use hota hai
// ============================================================

import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { mistralModel } from "./models.js";

export async function generateChatTitle(message) {
  if (!message || typeof message !== 'string') return "New Chat";

  try {
    // Mistral se short 2-4 word title banana
    const response = await mistralModel.invoke([
      new SystemMessage({
        content: "Generate a short 2 to 4 word title for this chat based on the user's first message. Reply with ONLY the title, no quotes, no punctuation."
      }),
      new HumanMessage({ content: message })
    ]);

    const title = response.content?.replace(/['"]/g, '').trim();

    // Agar AI ne kuch bhi return kiya toh use karo
    return title || fallbackTitle(message);

  } catch (error) {
    // Rate limit ya timeout → wordslice fallback
    console.warn("⚠️ Title generation fallback triggered:", error.message);
    return fallbackTitle(message);
  }
}

// Fallback: Pehle 5 words se title banana (Zero API cost)
function fallbackTitle(message) {
  const words = message.trim().split(/\s+/);
  return words.length > 5
    ? words.slice(0, 5).join(" ") + "..."
    : message;
}
