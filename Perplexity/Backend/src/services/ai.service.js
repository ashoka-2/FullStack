

// LangChain aur Google/Mistral models ko connect karne ke liye imports
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatMistralAI } from "@langchain/mistralai";
import { HumanMessage, SystemMessage, AIMessage, ToolMessage } from "@langchain/core/messages";
import axios from "axios";

// Alag se banaye गए tools ko import kar rahe hain (Modular approach)
import { searchInternetTool } from "./Tools/search.tool.js";
import { emailTool } from "./Tools/email.tool.js";
import { postToInstagramTool } from "./Tools/instagram.tool.js";


// Tier 1: Gemini 2.5 Flash lite (Khaas karke vision/images ke liye)
const geminiVisionModel = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash-lite",
  apiKey: process.env.GEMINI_API_KEY,
  apiVersion: "v1",
  maxRetries: 1,
  temperature: 0.1,
});

// Tier 2: Gemini Text Backup (Agar primary vision fail ho jaye)
const geminiTextModel = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash-lite",
  apiKey: process.env.GEMINI_API_KEY,
  apiVersion: "v1",
  maxRetries: 1,
  temperature: 0.1,
});

// Tier 3: Mistral Model (Common text tasks aur tools ke liye best hai)
const mistralModel = new ChatMistralAI({
  model: "mistral-small-latest",
  apiKey: process.env.MISTRAL_API_KEY,
  temperature: 0,
  maxRetries: 2,
});


// Aaj ka accurate Indian time nikalne ke liye context helper
const getCurrentTimeContext = () => {
  return new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
  });
};

// Saare active tools ko merge karke LangChain ko dene ke liye framework
const getTools = (userContext) => {
  const instagramTool = postToInstagramTool(userContext);
  return {
    tools: [searchInternetTool, emailTool, instagramTool],
    map: { searchInternet: searchInternetTool, emailTool, post_to_instagram: instagramTool }
  };
};



export async function generateResponse(messages, onChunk, userContext) {
  const cleanMessages = messages;

  // Ab hum poori history check nahi karenge, sirf "CURRENT" naye message ko check karenge
  // Taaki bina image wale normal text sawal seedha Mistral pass jayein aur Gemini faltu trigger na ho!
  const textCheckMessages = [...cleanMessages].reverse();
  const lastUserMsg = textCheckMessages.find(msg => msg.role === "user" || msg.role === "human");
  const hasImage = lastUserMsg && lastUserMsg.file && lastUserMsg.file.url;
  const today = getCurrentTimeContext();

  // History process kar rahe hain aur images ko Base64 mein convert kar rahe hain vision ke liye
  const history = await Promise.all(cleanMessages.map(async (msg) => {
    let content = msg.content || "";

    if (msg.file && msg.file.url) {
      try {
        const imageRes = await axios.get(msg.file.url, { responseType: 'arraybuffer', timeout: 8000 });
        const base64 = Buffer.from(imageRes.data).toString('base64');
        const mimeType = imageRes.headers['content-type'] || 'image/jpeg';

        content = [
          { type: "text", text: `User uploaded an image. Internal URL: [${msg.file.url}]\n\nQuestion: ${msg.content || "Please analyze this image."}` },
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
        ];
      } catch (error) {
        console.error("⚠️ Image processing failed:", error.message);
        content = `${msg.content || ""}\n[System Note: User tried to upload an image but the server failed to load it. Analyze purely based on text.]`;
      }
    }

    if (msg.role === "ai") return new AIMessage({ content });
    return new HumanMessage({ content });
  }));

  const systemContent = `You are a highly advanced AI assistant. Current Date and Time: ${today}.
    CRITICAL INSTRUCTIONS:
    1. Your training data is old. You MUST use the 'searchInternet' tool for ANY current events, news, or facts.
    2. Provide accurate, detailed, and well-structured answers in Markdown format.
    3. You are a Social Media Automation Agent.
       - Use 'post_to_instagram' ONLY on explicit user request.
       - Caption Handling: If user provides a caption, use it verbatim + 3-5 hashtags.
       - If AI caption requested: Generate one based on image content then call the tool.
       - Media Check: Only post ik.imagekit.io links.
       - Constraints: Warn if attempting >25 posts/24h.`;


  if (hasImage) {
    // Gemini Vision ke liye messages ko format kar rahe hain
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
    if (!(geminiMessages[0] instanceof HumanMessage)) geminiMessages.unshift(new HumanMessage({ content: systemContent }));

    try {
      // Step 1: Gemini Primary se image analyze karwane ki koshish (Google API)
      console.log("📸 Processing Image with Google Vision API (Gemini)...");
      const { tools, map } = getTools(userContext);
      const modelWithTools = geminiVisionModel.bindTools(tools);
      
      return await runMistralLoop(geminiMessages, onChunk, modelWithTools, map);
    } catch (error1) {
      // Agar Gemini Limit: 0 constraint pe phadta hai, toh wo pura console laal (red) nahi karega! 
      // Bas ek chota info display dekar seedha Mistral pe skip maar dega!
      console.warn("⚠️ Google Gemini Free Tier Blocked (Limit: 0) or Key failed. Seamlessly switched to Text-Only AI (Mistral).");
      
      // Convert multimodal content to text-only for Mistral jab Gemini ki aukaat khatam ho jaye
      const sanitizedHistory = history.map(msg => {
        if (Array.isArray(msg.content)) {
          const textContent = msg.content.filter(item => item.type === "text").map(item => item.text).join("\n");
          return msg instanceof AIMessage ? new AIMessage({ content: textContent }) : new HumanMessage({ content: textContent });
        }
        return msg;
      });
      
      const { tools, map } = getTools(userContext);
      const modelWithTools = mistralModel.bindTools(tools);
      // Fallback Seedha Mistral (No secondary gemini checks block)
      return await runMistralLoop([new SystemMessage({ content: `[VISION UNAVAILABLE: Answer purely using text context]\n${systemContent}` }), ...sanitizedHistory], onChunk, modelWithTools, map);
    }
  }

  // ----------------------------------------------------------------
  // ROUTE B: TEXT-ONLY WORKFLOW (Mistral + Tools)
  // ----------------------------------------------------------------
  // Gemini ka Quota bachane ke liye text-only queries seedha Mistral pe bhej rahe hain
  console.log("📝 Text Query detected. Processing with Mistral + Tools...");
  const textMessages = [new SystemMessage({ content: systemContent }), ...history];
  const { tools, map } = getTools(userContext);
  const modelWithTools = mistralModel.bindTools(tools);
  
  return await runMistralLoop(textMessages, onChunk, modelWithTools, map);
}

// Ek function jo normal text-only messages ko seedha answer karta hai
async function handleTextFallback(textMessages, onChunk, toolsMap) {
  try {
    const { tools } = getTools(""); 
    const modelWithTools = mistralModel.bindTools(tools);
    return await runMistralLoop(textMessages, onChunk, modelWithTools, toolsMap);
  } catch (err) {
    if (err.status === 429 || (err.message && err.message.includes('429'))) {
      console.warn("⚠️ Mistral Rate Limit Exceeded. Using Gemini Text Backup (gemini-flash-latest)...");
      try {
        const geminiFallback = new ChatGoogleGenerativeAI({
          model: "gemini-flash-latest",
          apiKey: process.env.GEMINI_API_KEY,
          temperature: 0.1,
        });
        const { tools } = getTools("");
        const modelWithToolsFallback = geminiFallback.bindTools(tools);
        return await runMistralLoop(textMessages, onChunk, modelWithToolsFallback, toolsMap);
      } catch(geminiErr) {
        throw new Error("All AI models are completely rate limited! Please wait a minute and try again.");
      }
    }
    throw err;
  }
}

// Mistral ka tool execution loop: jab tak AI tools call karega, hum results pass karenge
async function runMistralLoop(currentMessages, onChunk, modelWithTools, toolsMap) {
  let iterations = 0;
  const maxIterations = 5; 
  let response;

  while (iterations < maxIterations) {
    response = await modelWithTools.invoke(currentMessages);

    // Agar AI ne koi tool call nahi kiya, toh loop break karo
    if (!response.tool_calls || response.tool_calls.length === 0) {
      break; 
    }

    currentMessages.push(response);

    const toolPromises = response.tool_calls.map(async (toolCall) => {
      const toolInstance = toolsMap[toolCall.name];
      if (toolInstance) {
        try {
          const result = await toolInstance.invoke(toolCall.args);
          return new ToolMessage({
            content: typeof result === 'string' ? result : JSON.stringify(result),
            tool_call_id: toolCall.id
          });
        } catch (err) {
          return new ToolMessage({ content: `Tool execution failed: ${err.message}`, tool_call_id: toolCall.id });
        }
      }
      return null;
    });

    const toolResults = await Promise.all(toolPromises);
    currentMessages.push(...toolResults.filter(Boolean));
    iterations++;
  }

  const stream = await modelWithTools.stream(currentMessages);
  let fullContent = "";
  for await (const chunk of stream) {
    const content = chunk.content;
    fullContent += content;
    if (onChunk) onChunk(content);
  }

  return fullContent;
}

// ==========================================
// 4. HELPER FUNCTIONS (Titles & Suggestions)
// ==========================================

export async function generateChatTitle(message) {
  // 🚀 HIGH PERFORMANCE UPDATE:
  // Mistral API ki "1 Request/second" limit bacha kar rakhne ke liye ab hum Chat Title AI se nahi nikalwayenge.
  try {
    if (!message || typeof message !== 'string') return "New Chat";
    const words = message.trim().split(/\s+/);
    if (words.length > 5) {
      return words.slice(0, 5).join(" ") + "...";
    }
    return message;
  } catch (error) {
    return "New Chat";
  }
}

// Default suggestions (Fallback if internet/API fails)
const DEFAULT_SUGGESTIONS = {
  pills: ["AI Agents", "MERN Stack", "WebRTC", "System Design"],
  queries: [
    "How to build a Perplexity clone with LangChain?",
    "What's new in React 19?",
    "Mistral vs Gemini tool calling comparison",
    "Optimizing MongoDB indexing",
    "How to deploy MERN app on Vercel?"
  ],
  topics: [
    { label: "LangChain Updates", desc: "AI · Live", iconType: "robot" },
    { label: "Modern Web Trends 2026", desc: "Code · Trending", iconType: "global" },
    { label: "AI Breakthroughs", desc: "Tech · Today", iconType: "magic" },
    { label: "Full-Stack Roadmap", desc: "Career · 2h ago", iconType: "file" }
  ]
};

import { tavily } from "@tavily/core";

// Variables to store cached daily news (In-memory Store)
let cachedNewsSuggestions = null;
let lastNewsFetchTime = 0;

// Ye function Live News fetch karega Tavily se
async function getDynamicDefaultSuggestions() {
  const now = Date.now();
  if (cachedNewsSuggestions && (now - lastNewsFetchTime < 6 * 60 * 60 * 1000)) {
    return cachedNewsSuggestions;
  }

  try {
    const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
    const searchResponse = await tvly.search("Top 4 latest trending technology news headlines today", {
      searchDepth: "basic",
      includeImages: false
    });

    const results = searchResponse.results.slice(0, 4);

    if (results.length > 0) {
      cachedNewsSuggestions = {
        pills: ["Trending Tech", "Startups", "AI Tools", "Gadgets"],
        queries: [
          `Summarize this: ${results[0]?.title || "Latest update"}`,
          `Tell me more about ${results[1]?.title ? results[1].title.substring(0,30) + "..." : "tech market"}`,
          "What are the top 5 programming news today?",
          "Explain the latest tech market shifts",
          "Search for best developer tools 2026"
        ],
        topics: results.map((result, i) => {
          let domainName = "source";
          try { domainName = new URL(result.url).hostname.replace('www.', ''); } catch(e) {}
          return {
            label: result.title.substring(0, 55) + (result.title.length > 55 ? "..." : ""),
            desc: `News · ${domainName}`,
            iconType: ["global", "file", "magic", "compass"][i % 4]
          };
        })
      };
      
      lastNewsFetchTime = now; 
      console.log("📰 Fetched fresh live news successfully!");
      return cachedNewsSuggestions;
    }
  } catch (error) {
    console.error("⚠️ Failed to fetch live daily news, using static fallback...", error.message);
  }

  return DEFAULT_SUGGESTIONS;
}

// Suggestions generate karne ka main logic
export async function generateSuggestions(messages = []) {
  // 🚀 To save massive Mistral DB RPM (Rate Limits), we NO LONGER use AI models to guess chat-context.
  // Instead, ALWAYS return the Live News feed. Real Perplexity uses identical feed components globally!
  
  if (messages.length === 0) {
    console.log("ℹ️ Empty chat detected. Returning dynamic daily news...");
  } else {
    console.log("ℹ️ Active chat detected. Supplying context-free suggestions to save massive AI tokens...");
  }

  return await getDynamicDefaultSuggestions();
}