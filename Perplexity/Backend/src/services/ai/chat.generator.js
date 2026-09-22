import { HumanMessage, SystemMessage, AIMessage, ToolMessage } from "@langchain/core/messages";
import axios from "axios";
import { geminiChatPrimary, geminiVision1, geminiVision2, geminiChatFallback, mistralModel } from "./models.js";
import { searchInternetTool } from "../Tools/search.tool.js";
import { emailTool } from "../Tools/email.tool.js";
import { postToSocialMediaTool } from "../Tools/socialMedia.tool.js";

// Indian Standard Time context
const getCurrentTimeContext = () => {
  return new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
  });
};

const getTools = (userContext) => {
  const socialTool = postToSocialMediaTool(userContext);
  const tools = [emailTool, socialTool];
  const map = {
    emailTool,
    post_to_social_media: socialTool,
    post_to_instagram: socialTool // backward compatibility
  };

  // Only bind searchInternetTool if web search is enabled (default true)
  if (userContext?.webSearch !== false) {
    tools.unshift(searchInternetTool);
    map.searchInternet = searchInternetTool;
  }

  return { tools, map };
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
  let fullContent = "";
  try {
    const stream = await modelWithTools.stream(currentMessages);
    for await (const chunk of stream) {
      if (chunk.content) {
        fullContent += chunk.content;
        if (onChunk) onChunk(chunk.content);
      }
    }
  } catch (streamErr) {
    console.warn(`⚠️ [${label}] Stream iteration failed (${streamErr.message}), recovering via direct invoke...`);
    if (!fullContent) {
      try {
        const response = await modelWithTools.invoke(currentMessages);
        fullContent = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
        if (onChunk && fullContent) onChunk(fullContent);
      } catch (invokeErr) {
        console.error(`❌ [${label}] Direct invoke also failed:`, invokeErr.message);
        throw invokeErr;
      }
    }
  }
  return fullContent;
}

export async function generateResponse(messages, onChunk, userContext) {
  const today = getCurrentTimeContext();

  // Process message history and attach multimodal vision for ALL uploaded images
  let hasImage = false;

  const history = await Promise.all(messages.map(async (msg) => {
    let content = msg.content || "";

    // Extract all media items from the message
    const mediaList = [];
    if (msg.files && Array.isArray(msg.files) && msg.files.length > 0) {
      mediaList.push(...msg.files.filter(f => f?.url));
    } else if (msg.file?.url) {
      mediaList.push(msg.file);
    }

    if (mediaList.length > 0) {
      hasImage = true;
      const contentParts = [
        { type: "text", text: `[User attached ${mediaList.length} file(s)]\n${msg.content || "Analyze these files."}` }
      ];

      for (const media of mediaList) {
        const isVideo = media.fileType === 'video' || media.mimetype?.startsWith('video/') || /\.(mp4|mov|webm)(\?|$)/i.test(media.url);
        if (!isVideo) {
          try {
            const imageRes = await axios.get(media.url, { responseType: 'arraybuffer', timeout: 8000 });
            const base64 = Buffer.from(imageRes.data).toString('base64');
            const mimeType = imageRes.headers['content-type'] || 'image/jpeg';
            contentParts.push({
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${base64}` }
            });
          } catch (error) {
            contentParts.push({ type: "text", text: `[Image: ${media.name || 'attachment'}]` });
          }
        } else {
          contentParts.push({ type: "text", text: `[Video: ${media.name || 'video clip'}]` });
        }
      }

      if (contentParts.length > 1) {
        content = contentParts;
      }
    }

    return msg.role === "ai" ? new AIMessage({ content }) : new HumanMessage({ content });
  }));

  // If Tavily web search results were prefetched and provided in userContext, append to last user message
  if (userContext?.webSearchContext && history.length > 0) {
    const lastMsg = history[history.length - 1];
    if (lastMsg instanceof HumanMessage) {
      if (typeof lastMsg.content === 'string') {
        lastMsg.content += `\n\n${userContext.webSearchContext}`;
      } else if (Array.isArray(lastMsg.content)) {
        lastMsg.content.push({ type: "text", text: userContext.webSearchContext });
      }
    }
  }

  const isWebSearchEnabled = userContext?.webSearch !== false;
  const webSearchInstruction = isWebSearchEnabled
    ? "1. Real-Time Information (Web Search: ON): ALWAYS use 'searchInternet' for current events, news, stock quotes, or real-time data."
    : "1. Real-Time Information (Web Search: OFF): Web search is disabled by user preference. Answer directly using your internal knowledge without searching the internet.";

  const feedbackNotes = userContext?.feedbackInstruction ? `\n    ${userContext.feedbackInstruction}` : "";

  const systemContent = `You are a world-class AI assistant with supercharged multi-platform social media publishing capabilities. Current Date: ${today}.
    
    CRITICAL INSTRUCTIONS:
    ${webSearchInstruction}${feedbackNotes}
    
    2. Universal Social Media Publishing ('post_to_social_media'):
       Users can connect and publish content to:
       - **Instagram** (Photos, Video Reels, Carousel Albums)
       - **Facebook** (Posts, Photos, Multi-Photo Albums, Videos)
       - **Twitter / X** (Tweets with single or up to 4 media attachments)
       - **LinkedIn** (Professional posts & media)
       - **Pinterest** (Pins to boards)
       - **TikTok** (Short-form videos)
       - **YouTube** (Videos & Shorts)
       
       When the user asks to post or upload to social media:
       - Identify target platforms from their prompt (e.g., 'instagram', 'facebook', 'twitter', 'linkedin', or multiple platforms like ['instagram', 'twitter']).
       - If user says 'all my accounts' or 'everywhere', pass platforms: ['all_connected'].
       - ALWAYS call 'post_to_social_media'. The tool will automatically check which accounts are connected.
       - If any requested platform is NOT connected, the tool returns a clear explanation which you MUST relay to the user:
         "The {platform} account is not connected, so couldn't post to it. Please connect your {platform} account in Social Hub (/social-connections)."
       - If the platform IS connected, the tool publishes the post and returns the media ID and confirmation.

    3. Carousel (Together) vs Separate Posting Modes:
       - **Together / Carousel**: If user says "upload together", "as a carousel", "in an album", or attaches multiple images without specifying, set postMode: 'together'.
         - On Instagram: Publishes as a swipeable Carousel Album.
         - On Facebook: Publishes as a multi-photo post.
         - On Twitter: Attaches all photos into a single tweet.
       - **Separately / One by One**: If user says "upload separately", "one by one", or "individually", set postMode: 'separately'.
         - The tool uploads each media item as an individual post.

    4. AI Vision & Caption Intelligence:
       - **AI-Crafted Captions**: When user says "add captions/tags by your own" or doesn't specify a caption:
         - Inspect ALL uploaded images thoroughly using Vision.
         - Detect what the image is about (subjects, background, vibe, lighting, aesthetic).
         - Craft a highly engaging, viral caption tailored for the target platform(s) with 3-5 trending hashtags and appropriate emojis.
       - **User-Provided Captions**: If the user provides their OWN caption or hashtags, RESPECT them and use them directly.
       - **AI-Refined Captions**: If the user writes a draft caption and asks "enhance this", "improve my caption", or "look at this caption and create one using AI":
         - Read the user's caption, polish the tone, fix grammar, enhance the hook, add trending hashtags, and use that refined caption.

    5. Clean Markdown Output: Format your explanations with clean, readable Markdown, emojis, and clear status summaries.`;

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

// Detect if error is caused by model overload, rate limits, or capacity limits
function getModelOverloadNotice(error, modelName = "Gemini") {
  const errMsg = error?.message || String(error);
  const isHighLoad = /overload|429|503|quota|resource.*exhaust|high traffic|rate limit|failed to parse stream|capacity|temporarily unavailable/i.test(errMsg);
  if (isHighLoad) {
    return `${modelName} is experiencing high traffic right now and may take a moment to respond. Please try again in a few moments, or select another model from the dropdown.`;
  }
  return "I'm having trouble connecting to the AI services right now. Please try your request again in a few moments.";
}

    const primaryTools = getTools(userContext);
    const primaryModelWithTools = geminiVision1.bindTools(primaryTools.tools);

    try {
      return await runModelLoop(geminiMessages, onChunk, primaryModelWithTools, primaryTools.map, "Gemini Vision");
    } catch (visionErr) {
      console.warn("⚠️ Vision primary failed, falling back to geminiVision2:", visionErr.message);
      try {
        const fallbackTools = getTools(userContext);
        const fallbackModelWithTools = geminiVision2.bindTools(fallbackTools.tools);
        return await runModelLoop(geminiMessages, onChunk, fallbackModelWithTools, fallbackTools.map, "Gemini Vision Fallback");
      } catch (fallbackErr) {
        console.error("❌ Both Gemini Vision tiers failed:", fallbackErr.message);
        const safeMsg = getModelOverloadNotice(fallbackErr, "Gemini Vision");
        if (onChunk) onChunk(safeMsg);
        return safeMsg;
      }
    }
  }

  // Text-only pipeline
  const systemMessage = new SystemMessage(systemContent);
  const primaryTools = getTools(userContext);
  const primaryModelWithTools = geminiChatPrimary.bindTools(primaryTools.tools);

  try {
    return await runModelLoop([systemMessage, ...history], onChunk, primaryModelWithTools, primaryTools.map, "Primary");
  } catch (primaryError) {
    console.warn("⚠️ Primary Gemini failed, falling back to geminiChatFallback:", primaryError.message);
    try {
      const fallbackTools = getTools(userContext);
      const fallbackModelWithTools = geminiChatFallback.bindTools(fallbackTools.tools);
      return await runModelLoop([systemMessage, ...history], onChunk, fallbackModelWithTools, fallbackTools.map, "Gemini Flash Fallback");
    } catch (fallbackError) {
      console.warn("⚠️ Gemini Flash Fallback failed, attempting Mistral:", fallbackError.message);
      try {
        const mistralTools = getTools(userContext);
        const mistralModelWithTools = mistralModel.bindTools(mistralTools.tools);
        return await runModelLoop([systemMessage, ...history], onChunk, mistralModelWithTools, mistralTools.map, "Mistral Fallback");
      } catch (mistralError) {
        console.error("❌ All AI models failed:", mistralError.message);
        const safeMsg = getModelOverloadNotice(primaryError || fallbackError || mistralError, "Gemini");
        if (onChunk) onChunk(safeMsg);
        return safeMsg;
      }
    }
  }
}

