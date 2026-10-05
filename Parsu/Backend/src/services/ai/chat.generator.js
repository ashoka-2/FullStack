import { HumanMessage, SystemMessage, AIMessage, ToolMessage } from "@langchain/core/messages";
import axios from "axios";
import { geminiChatPrimary, geminiVision1, geminiVision2, geminiChatFallback, mistralModel } from "./models.js";
import { searchInternetTool } from "../Tools/search.tool.js";
import { emailTool, createEmailTool } from "../Tools/email.tool.js";
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
  const userEmailTool = createEmailTool(userContext);
  const socialTool = postToSocialMediaTool(userContext);
  const tools = [userEmailTool, socialTool];
  const map = {
    emailTool: userEmailTool,
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

    // If no tool calls were made:
    if (!response.tool_calls || response.tool_calls.length === 0) {
      const fullContent = typeof response.content === 'string' 
        ? response.content 
        : Array.isArray(response.content) 
          ? response.content.map(c => typeof c === 'string' ? c : c?.text || "").join("")
          : JSON.stringify(response.content);

      if (onChunk && fullContent) {
        // Stream out in rapid responsive chunks for smooth typing effect without a second roundtrip
        const chunkSize = 28;
        for (let i = 0; i < fullContent.length; i += chunkSize) {
          onChunk(fullContent.slice(i, i + chunkSize));
        }
      }
      return fullContent;
    }

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

  console.log(`📡 [${label}] Final streaming post-tools...`);
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
  const memoryNotes = userContext?.memoryContext ? `\n    ${userContext.memoryContext}` : "";
  const customInstructionsNote = (userContext?.customInstructions && userContext.customInstructions.trim())
    ? `\n\n--- USER'S MANDATORY CUSTOM INSTRUCTIONS ---\nThe user has configured the following personal instructions that you MUST adhere to across all your responses:\n"${userContext.customInstructions.trim()}"\n---------------------------------------------\n` 
    : "";
  const userPersonaNote = (userContext?.userNickname || userContext?.userOccupation)
    ? `User Profile: ${[userContext.userNickname ? `Name: ${userContext.userNickname}` : '', userContext.userOccupation ? `Role: ${userContext.userOccupation}` : ''].filter(Boolean).join(', ')}.\n`
    : "";

  // ── Thinking Level Directives (default: low for ultra-fast response) ──
  const thinkingLevel = (userContext?.thinkingLevel || 'low').toLowerCase();
  let thinkingInstruction = "\n--- REASONING DIRECTIVE (MODE: FAST / LOW THINKING BUDGET) ---\nBe ultra-fast, direct, and concise. Deliver immediate, high-accuracy answers without conversational fluff, unnecessary preambles, or excessive step-by-step narration.";
  if (thinkingLevel === 'medium') {
    thinkingInstruction = "\n--- REASONING DIRECTIVE (MODE: MEDIUM / BALANCED THINKING) ---\nProvide a balanced and structured response. Offer clear step-by-step logic, practical examples, and well-organized explanations.";
  } else if (thinkingLevel === 'high' || thinkingLevel === 'hard') {
    thinkingInstruction = "\n--- REASONING DIRECTIVE (MODE: HIGH / DEEP REASONING) ---\nEngage deep analytical thinking. Methodically explore edge cases, analyze subtleties, verify underlying principles, and deliver a comprehensive, highly thorough breakdown.";
  }

  // ── User Memory Facts & Persona (Learned facts from past statements) ──
  let persistentMemoryNote = "";
  if (userContext?.memorySummary || (Array.isArray(userContext?.memoryFacts) && userContext.memoryFacts.length > 0)) {
    const factsList = (userContext.memoryFacts || []).map(f => `• ${f}`).join("\n");
    persistentMemoryNote = `\n\n--- USER'S STORED FACTS & PERSONAL MEMORY ---\n` +
      (userContext.memorySummary ? `Overall Summary: ${userContext.memorySummary}\n` : '') +
      (factsList ? `Learned Facts:\n${factsList}\n` : '') +
      `----------------------------------------------\n` +
      `CRITICAL MEMORY DIRECTIVE: When the user asks about personal details they previously told you to remember (such as friends' names, favorite things, hobbies, or life facts), accurately recall them from this memory and respond naturally.\n`;
  }

  // ── Attached Document RAG Context (PDF / Docs) ──
  let documentRagNote = "";
  if (userContext?.documentRagContext) {
    documentRagNote = `\n\n--- ATTACHED PDF / DOCUMENT RAG CONTEXT ---\n${userContext.documentRagContext}\n-------------------------------------------\n`;
  }

  const systemContent = `You are a world-class AI assistant with supercharged multi-platform social media publishing capabilities and deep document intelligence. Current Date: ${today}.
    ${userPersonaNote}${customInstructionsNote}${thinkingInstruction}${persistentMemoryNote}${documentRagNote}
    CRITICAL INSTRUCTIONS:
    ${webSearchInstruction}${feedbackNotes}${memoryNotes}
    
    2. Universal Social Media Publishing ('post_to_social_media'):
       Users can connect and publish content to:
       - **Instagram** (Photos, Video Reels, Carousel Albums)
       - **Facebook** (Posts, Photos, Multi-Photo Albums, Videos)
       - **Twitter / X** (Tweets with single or up to 4 media attachments)
       - **LinkedIn** (Professional posts & media)
       - **Pinterest** (Pins to boards)
       - **TikTok** (Short-form videos)
       - **YouTube** (Videos & Shorts — Note: YouTube API supports video/shorts uploads with native scheduling; Community Tab text posts are not supported by YouTube's API)
       
       When the user asks to post or upload to social media:
       - Identify target platforms from their prompt (e.g., 'youtube', 'instagram', 'facebook', 'twitter', 'linkedin', or multiple platforms like ['youtube', 'twitter']).
       - If user says 'all my accounts' or 'everywhere', pass platforms: ['all_connected'].
       - ALWAYS call 'post_to_social_media'. The tool will automatically check which accounts are connected.
       - **Scheduling (Native Platform Scheduled Releases)**:
         - If the user specifies a future time or date to post (e.g., "post to YouTube tomorrow at 5pm", "schedule this video for Friday 10 AM"):
         - Parse the future time into an ISO 8601 string (e.g., "2026-09-24T17:00:00Z") and pass it as 'scheduledTime'.
         - For YouTube, this uses YouTube's native scheduled release feature: YouTube accepts the video upload right now and automatically publishes it publicly at that exact time.
       - **CRITICAL ANTI-HALLUCINATION & LIVE LINKS**:
         - NEVER claim a post or video was uploaded unless the tool returned 'SUCCESS'.
         - ALWAYS provide the exact clickable live link returned by the tool (e.g. https://www.youtube.com/watch?v=... or https://x.com/...) in your response so the user can verify their post immediately!
         - If any requested platform is NOT connected, the tool returns a clear explanation which you MUST relay to the user:
           "The {platform} account is not connected, so couldn't post to it. Please connect your {platform} account in Social Hub (/social-connections)."
         - If the platform IS connected, the tool publishes the post and returns the media ID, scheduled time (if any), and live link.

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

    5. ROAD TRIP, ROUTE & MAP EXTRACTION (ONLY WHEN ASKED FOR MAP / DIRECTIONS):
       - CRITICAL RULE: When the user asks to plan a trip, itinerary, or places to visit WITHOUT explicitly asking to see a map or directions, provide the full trip itinerary, travel tips, distances, and halts in regular markdown. DO NOT output a \`\`\`map codeblock unless requested.
       - ONLY output the \`\`\`map codeblock when the user explicitly asks for a map, directions, route visualization, or says 'show map', 'show me directions', 'yes show map', 'navigate to...', etc.
       - When a map is requested:
         1. from (Origin / Starting City): Identify where the user starts.
         2. to (Final Destination): Identify the user's destination.
         3. stops (Intermediate Waypoints): Extract and clean intermediate cities/stops.
       - OUTPUT THE MULTI-STOP MAP CODEBLOCK:
         \`\`\`map
         from: Starting City / Location
         stops: First Stop, Second Stop, Third Stop, Fourth Stop, ...
         to: Final Destination Place
         mode: driving
         \`\`\`
       - NEVER truncate or skip intermediate stops! Every single stop requested by the user MUST be placed in \`stops:\` so the interactive map plots them sequentially on the screen.
       - For direct 2-point routes without intermediate stops:
         \`\`\`map
         from: Starting Point / My Location
         to: Destination Place
         mode: driving
         \`\`\`
         (modes: driving, transit, walking)
       - For a single place visualization:
         \`\`\`map
         Place Name, City, Country
         \`\`\`
       - The frontend will automatically render an interactive, zoomable, pannable Google Map card with ALL intermediate stops mapped in sequence, live road turn-by-turn navigation, route swap, travel mode switcher (Car / Transit / Walk), and GPS Current Location detection right inside the message!
       - In your markdown response, provide the estimated driving/transit distance (km / miles), estimated travel time, shortest path highway details (e.g. NH66, NH48), scenic stops, food/fuel halts, and practical travel tips.

       - If the user asks to see images of this place/trip (e.g. "show me few images of this place in map or in chat"), ALSO output an image gallery block:
         \`\`\`gallery
         query: Place Name
         \`\`\`

    6. WEB SEARCH IMAGES & PRODUCT CARDS WITH DETAILS:
       - When a user asks to see photos, pictures, or images of anything (e.g. "show me few pictures/images of a mango", "show me photos of red roses", "show images of Tesla Model S"):
         ALWAYS output an image gallery block:
         \`\`\`gallery
         query: mango
         \`\`\`
         Add a warm, engaging markdown description of the subject above or below the gallery block.
       - When a user asks for product recommendations or items WITH photos and their details/uses (e.g. "show me some creams and with it details", "show me sunscreens with uses and details", "show me face washes with details"):
         ALWAYS output a structured cards codeblock in JSON format:
         \`\`\`cards
         [
           {
             "name": "Nivea Soft Light Moisturizing Cream",
             "imageQuery": "Nivea Soft Light Moisturizing Cream",
             "description": "A light, non-greasy refreshing daily moisturizing cream infused with Vitamin E and Jojoba Oil.",
             "uses": [
               "Instant skin hydration for face, hands, and body",
               "Quick absorption without sticky residue",
               "Suitable for daily use across all skin types"
             ]
           },
           {
             "name": "Cetaphil Moisturizing Cream",
             "imageQuery": "Cetaphil Moisturizing Cream tub",
             "description": "Rich, fragrance-free formula packed with sweet almond oil, niacinamide, and provitamin B5.",
             "uses": [
               "Intense 48-hour moisture barrier hydration",
               "Deep nourishment for dry to very dry sensitive skin",
               "Dermatologist tested and hypoallergenic"
             ]
           },
           {
             "name": "Neutrogena Hydro Boost Water Gel",
             "imageQuery": "Neutrogena Hydro Boost Water Gel moisturizer",
             "description": "Oil-free gel moisturizer powered by purified Hyaluronic Acid.",
             "uses": [
               "Deep hydration with an ultra-lightweight water-like feel",
               "Locks in moisture for 72 hours for a supple, dewy glow",
               "Ideal for oily and combination acne-prone skin"
             ]
           }
         ]
         \`\`\`
         Always provide 3 to 5 realistic items. Each item must have: "name", "imageQuery" (precise keyword for web image search), "description" (concise overview), and "uses" (array of 2-4 key benefits / instructions).
         The frontend will automatically fetch real web photos and present each product with its image on top and details & uses neatly organized underneath!

    7. INTERACTIVE AI GUIDED WALKTHROUGHS & APP TOURS:
       Whenever the user asks how to do something in the app, or where to find a setting, or asks for help navigating Parsu AI features:
       - Provide a warm, concise, friendly answer in markdown.
       - AT THE VERY END OF YOUR RESPONSE, append an automatic guide trigger codeblock:
         \`\`\`guide
         <guide_id>
         \`\`\`
       - The available guide IDs are:
         * add_gemini_key     -> Adding custom API keys (Gemini BYOK, OpenAI, Claude, DeepSeek, Groq, NVIDIA)
         * connect_instagram  -> Connecting Instagram account for automated publishing
         * connect_facebook   -> Linking Facebook pages
         * view_memory        -> Viewing & editing learned memory facts and custom persona instructions
         * change_model       -> Switching AI models and thinking depth
         * mascot_settings    -> Customizing the floating mascot companion (colors, eye tracking, flame, size)
         * voice_settings     -> Configuring TTS speech voice and recognition
         * plan_trip          -> Planning multi-stop road trips with interactive map
         * view_library       -> Searching through past chat history
         * post_social        -> Attaching media and posting to social platforms
       - The frontend will smoothly glide the user to the destination page without lag, showing a futuristic spotlight on each interactive button!

    8. Clean Markdown Output: Format your explanations with clean, readable Markdown, emojis, and clear status summaries.`;

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

