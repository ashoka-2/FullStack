// ============================================================
// CHAT RESPONSE GENERATOR — GEMINI-FIRST ROUTING
// ============================================================

import { HumanMessage, SystemMessage, AIMessage, ToolMessage } from "@langchain/core/messages";
import axios from "axios";
import { geminiChatPrimary, geminiVision1, geminiVision2, mistralModel } from "./models.js";
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

async function runModelLoop(currentMessages, onChunk, modelWithTools, toolsMap, label = "AI") {
  let iterations = 0;
  const maxIterations = 5;

  while (iterations < maxIterations) {
    console.log(`🤖 [${label}] Invoking (Iteration: ${iterations + 1})...`);
    const response = await modelWithTools.invoke(currentMessages);

    if (!response.tool_calls || response.tool_calls.length === 0) break;

    console.log(`🛠️ [${label}] Tool Call: ${response.tool_calls.map(t => t.name).join(", ")}`);
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
            content: `Tool error: ${err.message}`,
            tool_call_id: toolCall.id
          });
        }
      })
    );

    currentMessages.push(...toolResults.filter(Boolean));
    iterations++;
  }

  console.log(`📡 [${label}] Final streaming...`);
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
  const lastUserMsg = [...messages].reverse().find(msg => msg.role === "user" || msg.role === "human");
  const hasImage = lastUserMsg?.file?.url;

  const history = await Promise.all(messages.map(async (msg) => {
    let content = msg.content || "";
    if (msg.file?.url) {
      try {
        const imageRes = await axios.get(msg.file.url, { responseType: 'arraybuffer', timeout: 8000 });
        const base64 = Buffer.from(imageRes.data).toString('base64');
        const mimeType = imageRes.headers['content-type'] || 'image/jpeg';
        content = [
          { type: "text", text: `User uploaded: [\nQuestion: ${msg.content || "Analyze this."}` },
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
        ];
      } catch (error) {
        content = `${msg.content || ""}\n[Note: Image load failed.]`;
      }
    }
    return msg.role === "ai" ? new AIMessage({ content }) : new HumanMessage({ content });
  }));

  const systemContent = `You are a highly advanced AI. Current Date: ${today}.
    
    CRITICAL INSTRUCTIONS:
    1. Information: Your knowledge is old. ALWAYS hit 'searchInternet' for current events.
    2. Social Media Automation:
       - Use 'post_to_instagram' ONLY if the user explicitly asks to post.
       - IMPORTANT: For 'post_to_instagram', you MUST look through the chat history and provide the EXACT image URL from ImageKit (ik.imagekit.io). Do NOT call the tool with an empty imageUrl.
       - AIM FOR VIRAL VIRALITY: If the user does not provide a caption, automatically generate a highly engaging, viral caption with relevant emojis and 3-5 trending hashtags BEFORE calling the post_to_instagram tool.
       - If you posted a mediaId already, do not post it again unless asked.
    3. Formatting: Output in clean Markdown.`;

  if (hasImage) {
    const geminiMessages = history.map((msg, idx) => {
      if (idx === 0 && msg instanceof HumanMessage) {
        const originalContent = msg.content;
        const newContent = Array.isArray(originalContent) ? [{ type: "text", text: systemContent }, ...originalContent] : `${systemContent}\n\nUser Question: ${originalContent}`;
        return new HumanMessage({ content: newContent });
      }
      return msg;
    });
    if (!(geminiMessages[0] instanceof HumanMessage)) geminiMessages.unshift(new HumanMessage({ content: systemContent }));

    const visionModels = [
      { model: geminiVision1, name: "Gemini 2.5-Flash-Lite" },
      { model: geminiVision2, name: "Gemini 1.5-Flash" },
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
        return fullContent;
      } catch (err) {
        console.warn(`⚠️ [Vision] ${name} failed: ${err.message?.substring(0, 50)}...`);
      }
    }
    
    // No Vision models worked → Fallback to Text-only Mistral
    const { tools, map } = getTools(userContext);
    const sanitizedHistory = history.map(msg => {
      if (Array.isArray(msg.content)) {
        const textOnly = msg.content.filter(i => i.type === "text").map(i => i.text).join("\n");
        return msg instanceof AIMessage ? new AIMessage({ content: textOnly }) : new HumanMessage({ content: textOnly });
      }
      return msg;
    });
    return await runModelLoop([new SystemMessage({ content: systemContent }), ...sanitizedHistory], onChunk, mistralModel.bindTools(tools), map, "Mistral-Image-Fallback");
  }

  // ── TEXT ROUTE: 3.1 FLASH-LITE PRIMARY ───────────────────────
  console.log("📝 [Text] Attempting with Gemini 3.1 Flash-Lite (Primary)...");
  const textMessages = [new SystemMessage({ content: systemContent }), ...history];
  const { tools, map } = getTools(userContext);
  
  try {
    // Gemini 3.1 Primary (with Tools) 
    const geminiWithTools = geminiChatPrimary.bindTools(tools);
    return await runModelLoop(textMessages, onChunk, geminiWithTools, map, "Gemini-Primary");
  } catch (err) {
    // If Gemini 3.1 fails or 429s → Fallback to Mistral
    console.warn("⏳ [Text] Gemini Primary failed. Falling back to Mistral...");
    try {
      const mistralWithTools = mistralModel.bindTools(tools);
      return await runModelLoop(textMessages, onChunk, mistralWithTools, map, "Mistral-Fallback");
    } catch (err2) {
      throw err2;
    }
  }
}
