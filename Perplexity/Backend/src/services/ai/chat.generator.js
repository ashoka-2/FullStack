// ============================================================
// CHAT RESPONSE GENERATOR
// ============================================================
// Is file ka kaam:
//   1. Decide karna ki request image wali hai ya text wali
//   2. Image → Gemini Vision pe route karna
//   3. Text → Mistral + Tools pe route karna
//   4. Mistral ka tool execution loop chalana
// ============================================================

import { HumanMessage, SystemMessage, AIMessage, ToolMessage } from "@langchain/core/messages";
import axios from "axios";
import { geminiVisionModel, geminiTextModel, mistralModel } from "./models.js";
import { searchInternetTool } from "../Tools/search.tool.js";
import { emailTool } from "../Tools/email.tool.js";
import { postToInstagramTool } from "../Tools/instagram.tool.js";

// Aaj ki date aur time Indian timezone mein — AI ke system prompt ke liye
const getCurrentTimeContext = () => {
  return new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
  });
};

// Saare tools ek jagah bundle karo — Mistral ke bindTools() ke liye
// userContext: logged-in user ki info (Instagram credentials wagera)
const getTools = (userContext) => {
  const instagramTool = postToInstagramTool(userContext);
  return {
    tools: [searchInternetTool, emailTool, instagramTool],
    map: {
      searchInternet: searchInternetTool,
      emailTool,
      post_to_instagram: instagramTool
    }
  };
};


// ── MISTRAL TOOL EXECUTION LOOP ──────────────────────────────
// Mistral jab tak tools call karta rahe (Search/Email/Instagram),
// hum results wapas feed karte hain.
// Jab tools khatam → final answer stream karo frontend pe.

async function runMistralLoop(currentMessages, onChunk, modelWithTools, toolsMap) {
  let iterations = 0;
  const maxIterations = 5; // Hard limit — infinite loop se bachne ke liye

  while (iterations < maxIterations) {
    const response = await modelWithTools.invoke(currentMessages);

    // Koi tool call nahi → seedha answer stream karo
    if (!response.tool_calls || response.tool_calls.length === 0) break;

    currentMessages.push(response);

    // Saare tool calls parallel mein chalao (speed ke liye)
    const toolResults = await Promise.all(
      response.tool_calls.map(async (toolCall) => {
        const toolInstance = toolsMap[toolCall.name];
        if (!toolInstance) return null;
        try {
          const result = await toolInstance.invoke(toolCall.args);
          return new ToolMessage({
            content: typeof result === 'string' ? result : JSON.stringify(result),
            tool_call_id: toolCall.id
          });
        } catch (err) {
          return new ToolMessage({
            content: `Tool execution failed: ${err.message}`,
            tool_call_id: toolCall.id
          });
        }
      })
    );

    currentMessages.push(...toolResults.filter(Boolean));
    iterations++;
  }

  // Final answer ko chunk-by-chunk stream karo (typing effect ke liye)
  const stream = await modelWithTools.stream(currentMessages);
  let fullContent = "";
  for await (const chunk of stream) {
    fullContent += chunk.content;
    if (onChunk) onChunk(chunk.content);
  }
  return fullContent;
}


// ── MAIN EXPORTED FUNCTION ───────────────────────────────────
// Controller yahan se call karta hai.
// messages: poori chat history
// onChunk: streaming callback (Socket.io ke liye)
// userContext: user ki info (Instagram credentials etc.)

export async function generateResponse(messages, onChunk, userContext) {
  const today = getCurrentTimeContext();

  // Sirf sabse latest user message mein image check karo
  // (Poori history scan karne se Gemini unnecessarily trigger hota tha)
  const lastUserMsg = [...messages].reverse().find(
    msg => msg.role === "user" || msg.role === "human"
  );
  const hasImage = lastUserMsg?.file?.url;

  // Poori chat history ko LangChain format mein convert karo
  // → Image wale messages ko Base64 mein convert karo Gemini ke liye
  const history = await Promise.all(messages.map(async (msg) => {
    let content = msg.content || "";

    if (msg.file?.url) {
      try {
        const imageRes = await axios.get(msg.file.url, { responseType: 'arraybuffer', timeout: 8000 });
        const base64 = Buffer.from(imageRes.data).toString('base64');
        const mimeType = imageRes.headers['content-type'] || 'image/jpeg';
        content = [
          { type: "text", text: `User uploaded an image. URL: [${msg.file.url}]\n\nQuestion: ${msg.content || "Please analyze this image."}` },
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
        ];
      } catch (error) {
        console.error("⚠️ Image fetch failed:", error.message);
        content = `${msg.content || ""}\n[Note: Image load failed, answer text only.]`;
      }
    }

    return msg.role === "ai"
      ? new AIMessage({ content })
      : new HumanMessage({ content });
  }));

  // AI ka system prompt — Role, Rules, aur Capabilities define karta hai
  const systemContent = `You are a highly advanced AI assistant. Current Date and Time: ${today}.
    CRITICAL INSTRUCTIONS:
    1. Your training data is old. ALWAYS use the 'searchInternet' tool for current events or facts.
    2. Provide accurate, detailed answers in Markdown format.
    3. You are also a Social Media Automation Agent:
       - Use 'post_to_instagram' ONLY when user explicitly asks to post.
       - If user gives a caption: use it verbatim + add 3-5 hashtags.
       - If no caption: generate one from image content, then post.
       - Only post images from ik.imagekit.io domain.
       - Warn user if they try to post more than 25 times in 24 hours.`;


  // ── ROUTE A: IMAGE REQUEST → GEMINI VISION ──────────────────
  if (hasImage) {
    // Gemini ke liye: systemContent ko pehle message mein inject karo
    const geminiMessages = history.map((msg, idx) => {
      if (idx === 0 && msg instanceof HumanMessage) {
        const originalContent = msg.content;
        const newContent = Array.isArray(originalContent)
          ? [{ type: "text", text: systemContent }, ...originalContent]
          : `${systemContent}\n\nUser Question: ${originalContent}`;
        return new HumanMessage({ content: newContent });
      }
      return msg;
    });
    if (!(geminiMessages[0] instanceof HumanMessage)) {
      geminiMessages.unshift(new HumanMessage({ content: systemContent }));
    }

    try {
      // Pehle Gemini 2.5 Lite try karo (seedha .stream(), no tools binding)
      console.log("📸 Processing Image with Gemini 2.5 Lite...");
      const stream = await geminiVisionModel.stream(geminiMessages);
      let fullContent = "";
      for await (const chunk of stream) {
        fullContent += chunk.content;
        if (onChunk) onChunk(chunk.content);
      }
      return fullContent;

    } catch (error1) {
      console.warn("⚠️ Gemini 2.5-Lite quota/fail. Switching to 1.5-Flash backup...");
      try {
        // Backup: Gemini 1.5 Flash Lite
        const stream2 = await geminiTextModel.stream(geminiMessages);
        let fullContent2 = "";
        for await (const chunk of stream2) {
          fullContent2 += chunk.content;
          if (onChunk) onChunk(chunk.content);
        }
        return fullContent2;

      } catch (error2) {
        // Dono Gemini fail → Mistral text-only fallback
        console.error("⚠️ Both Gemini models failed. Final fallback to Mistral (text-only).");
        const sanitizedHistory = history.map(msg => {
          if (Array.isArray(msg.content)) {
            const textOnly = msg.content.filter(i => i.type === "text").map(i => i.text).join("\n");
            return msg instanceof AIMessage
              ? new AIMessage({ content: textOnly })
              : new HumanMessage({ content: textOnly });
          }
          return msg;
        });
        const { tools, map } = getTools(userContext);
        const modelWithTools = mistralModel.bindTools(tools);
        return await runMistralLoop(
          [new SystemMessage({ content: `[VISION UNAVAILABLE]\n${systemContent}` }), ...sanitizedHistory],
          onChunk, modelWithTools, map
        );
      }
    }
  }

  // ── ROUTE B: TEXT REQUEST → MISTRAL + TOOLS ─────────────────
  console.log("📝 Text Query detected. Processing with Mistral + Tools...");
  const textMessages = [new SystemMessage({ content: systemContent }), ...history];
  const { tools, map } = getTools(userContext);
  const modelWithTools = mistralModel.bindTools(tools);
  return await runMistralLoop(textMessages, onChunk, modelWithTools, map);
}
