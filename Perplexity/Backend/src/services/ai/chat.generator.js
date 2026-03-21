// ============================================================
// CHAT RESPONSE GENERATOR — LOGGING & ROUTING
// ============================================================

import { HumanMessage, SystemMessage, AIMessage, ToolMessage } from "@langchain/core/messages";
import axios from "axios";
import { geminiVision1, geminiVision2, mistralModel, geminiChatFallback } from "./models.js";
import { searchInternetTool } from "../Tools/search.tool.js";
import { emailTool } from "../Tools/email.tool.js";
import { postToInstagramTool } from "../Tools/instagram.tool.js";

// Aaj ki date aur time Indian timezone mein
const getCurrentTimeContext = () => {
  return new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
  });
};

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

async function runMistralLoop(currentMessages, onChunk, modelWithTools, toolsMap, modelLabel = "Mistral") {
  let iterations = 0;
  const maxIterations = 5;

  while (iterations < maxIterations) {
    console.log(`🤖 [${modelLabel}] Invoking with Tools (Iteration: ${iterations + 1})...`);
    const response = await modelWithTools.invoke(currentMessages);

    if (!response.tool_calls || response.tool_calls.length === 0) break;

    console.log(`🛠️ [${modelLabel}] Tool Call Detected: ${response.tool_calls.map(t => t.name).join(", ")}`);
    currentMessages.push(response);

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

  console.log(`📡 [${modelLabel}] Final response streaming...`);
  const stream = await modelWithTools.stream(currentMessages);
  let fullContent = "";
  for await (const chunk of stream) {
    fullContent += chunk.content;
    if (onChunk) onChunk(chunk.content);
  }
  return fullContent;
}

export async function generateResponse(messages, onChunk, userContext) {
  const today = getCurrentTimeContext();

  const lastUserMsg = [...messages].reverse().find(
    msg => msg.role === "user" || msg.role === "human"
  );
  const hasImage = lastUserMsg?.file?.url;

  const history = await Promise.all(messages.map(async (msg) => {
    let content = msg.content || "";
    if (msg.file?.url) {
      try {
        const imageRes = await axios.get(msg.file.url, { responseType: 'arraybuffer', timeout: 8000 });
        const base64 = Buffer.from(imageRes.data).toString('base64');
        const mimeType = imageRes.headers['content-type'] || 'image/jpeg';
        content = [
          { type: "text", text: `User uploaded an image. [\nQuestion: ${msg.content || "Analyze this."}` },
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
        ];
      } catch (error) {
        content = `${msg.content || ""}\n[Note: Image load failed.]`;
      }
    }
    return msg.role === "ai" ? new AIMessage({ content }) : new HumanMessage({ content });
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

    const visionModels = [
      { model: geminiVision1, name: "Gemini 2.5-Flash-Lite (Tier 1)" },
      { model: geminiVision2, name: "Gemini 1.5-Flash (Tier 2)" },
    ];

    for (const { model, name } of visionModels) {
      try {
        console.log(`📸 [Vision] Attempting with ${name}...`);
        const stream = await model.stream(geminiMessages);
        let fullContent = "";
        for await (const chunk of stream) {
          fullContent += chunk.content;
          if (onChunk) onChunk(chunk.content);
        }
        console.log(`✅ [Vision] Success with ${name}!`);
        return fullContent;
      } catch (err) {
        console.warn(`⚠️ [Vision] ${name} failed: ${err.message?.substring(0, 50)}...`);
      }
    }

    // Mistral Fallback for Images
    const sanitizedHistory = history.map(msg => {
      if (Array.isArray(msg.content)) {
        const textOnly = msg.content.filter(i => i.type === "text").map(i => i.text).join("\n");
        return msg instanceof AIMessage ? new AIMessage({ content: textOnly }) : new HumanMessage({ content: textOnly });
      }
      return msg;
    });
    const { tools, map } = getTools(userContext);
    console.log("⚠️ [Vision] All Gemini Vision tiers exhausted. Using Mistral (text-only).");
    return await runMistralLoop([new SystemMessage({ content: `[VISION UNAVAILABLE]\n${systemContent}` }), ...sanitizedHistory], onChunk, mistralModel.bindTools(tools), map, "Mistral-Fallback");
  }

  // TEXT ROUTE
  console.log("📝 [Text] Request detected. Starting Mistral flow...");
  const textMessages = [new SystemMessage({ content: systemContent }), ...history];
  const { tools, map } = getTools(userContext);
  try {
    return await runMistralLoop(textMessages, onChunk, mistralModel.bindTools(tools), map, "Mistral-Primary");
  } catch (err) {
    if (err.statusCode === 429 || err.message?.includes('429')) {
      console.warn("⏳ [Text] Mistral Rate Limited. Switching to Gemini Fallback (gemini-1.5-flash)...");
      const geminiWithTools = geminiChatFallback.bindTools(tools);
      return await runMistralLoop(textMessages, onChunk, geminiWithTools, map, "Gemini-Fallback");
    }
    throw err;
  }
}
