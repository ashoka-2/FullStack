// // import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
// // import { ChatMistralAI } from "@langchain/mistralai";
// // import { HumanMessage, SystemMessage, AIMessage, ToolMessage } from "@langchain/core/messages";
// // import { tool } from "@langchain/core/tools";
// // import { tavily } from "@tavily/core";
// // import { sendEmail } from "./mail.service.js";
// // import axios from "axios";
// // import * as z from "zod";

// // // ==========================================
// // // 1. AI MODELS INITIALIZATION (Crash-Proof)
// // // ==========================================

// // const geminiModel = new ChatGoogleGenerativeAI({
// //     model: "gemini-2.5-flash-lite", 
// //     apiKey: process.env.GEMINI_API_KEY,
// //     apiVersion: "v1beta",
// //     maxRetries: 3,
// //     temperature: 0.1,
// // });

// // const mistralModel = new ChatMistralAI({
// //     model: "mistral-small-latest",
// //     apiKey: process.env.MISTRAL_API_KEY,
// //     temperature: 0,
// //     maxRetries: 2,
// // });

// // const tvly = new tavily(process.env.TAVILY_API_KEY);

// // // Dynamically fetch accurate time for context
// // const getCurrentTimeContext = () => {
// //     return new Date().toLocaleString('en-IN', { 
// //         timeZone: 'Asia/Kolkata',
// //         weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
// //         hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
// //     });
// // };

// // // ==========================================
// // // 2. TOOLS DEFINITION
// // // ==========================================

// // const searchInternetTool = tool(
// //     async ({ query }) => {
// //         try {
// //             const data = await tvly.search(query, { searchDepth: "basic", maxResults: 3 });
// //             return data.results.map(r => `Title: ${r.title}\nDetails: ${r.content}`).join("\n\n");
// //         } catch (error) {
// //             console.error("Search Tool Error:", error.message);
// //             return "Search temporarily unavailable. Proceed with internal knowledge or inform the user.";
// //         }
// //     },
// //     {
// //         name: "searchInternet",
// //         description: "CRITICAL: Use this tool to search the internet for current events, news, dates, and real-time facts.",
// //         schema: z.object({ query: z.string().describe("The search query") })
// //     }
// // );

// // const emailTool = tool(
// //     async ({ to, subject, html }) => {
// //         try {
// //             await sendEmail({ to, subject, html });
// //             return `Email successfully sent to ${to}.`;
// //         } catch (error) {
// //             return `Failed to send email: ${error.message}`;
// //         }
// //     },
// //     {
// //         name: "emailTool",
// //         description: "Use this tool to send emails on behalf of the user.",
// //         schema: z.object({
// //             to: z.string().describe("Recipient email address"),
// //             subject: z.string().describe("Subject of the email"),
// //             html: z.string().describe("HTML content of the email")
// //         })
// //     }
// // );

// // const toolsMap = { searchInternet: searchInternetTool, emailTool };
// // const modelWithTools = mistralModel.bindTools([searchInternetTool, emailTool]);

// // // ==========================================
// // // 3. MAIN CHAT LOGIC (Perplexity Core)
// // // ==========================================

// // export async function generateResponse(messages) {
// //     const hasImage = messages.some(msg => msg.file && msg.file.url);
// //     const today = getCurrentTimeContext();

// //     // SUPER FEATURE: Secure Image Fetching with Base64 transformation
// //     const history = await Promise.all(messages.map(async (msg) => {
// //         let content = msg.content || "";

// //         if (msg.file && msg.file.url) {
// //             try {
// //                 // Fetch the image and convert to base64
// //                 const imageRes = await axios.get(msg.file.url, { 
// //                     responseType: 'arraybuffer',
// //                     timeout: 8000
// //                 });
// //                 const base64 = Buffer.from(imageRes.data).toString('base64');
// //                 const mimeType = imageRes.headers['content-type'] || 'image/jpeg';

// //                 // For Gemini Vision, we provide a clearer multimodal structure
// //                 content = [
// //                     { 
// //                         type: "text", 
// //                         text: `Attached Image: [${msg.file.url}]\n\nQuestion: ${msg.content || "Please analyze this image and explain what is in it."}` 
// //                     },
// //                     { 
// //                         type: "image_url", 
// //                         image_url: {
// //                             url: `data:${mimeType};base64,${base64}`
// //                         } 
// //                     },
// //                 ];
// //             } catch (error) {
// //                 console.error("⚠️ Image processing failed:", error.message);
// //                 content = `${msg.content || ""}\n[Note: Image analysis failed. Internal URL: ${msg.file.url}]`;
// //             }
// //         }

// //         // Standardized message construction
// //         if (msg.role === "ai") return new AIMessage(content);
// //         return new HumanMessage(content);
// //     }));
// //     const systemContent = `You are an advanced AI assistant. Current Date and Time: ${today}.
// //     CRITICAL INSTRUCTIONS:
// //     1. Your internal data ends in 2023. You MUST use 'searchInternet' for ANY facts, news, or current events.
// //     2. Provide highly accurate, detailed, and well-structured answers.
// //     3. If an image is presented, describe it and answer related questions precisely.`;

// //     // Multimodal Routing with Error Handling Fallback
// //     if (hasImage) {
// //         try {
// //             // For Gemini, move system content into the first human message to avoid "systemInstruction" errors
// //             const geminiMessages = history.map((msg, idx) => {
// //                 if (idx === 0 && msg instanceof HumanMessage) {
// //                     const originalContent = msg.content;
// //                     const newContent = Array.isArray(originalContent) 
// //                         ? [{ type: "text", text: systemContent }, ...originalContent]
// //                         : `${systemContent}\n\nUser Question: ${originalContent}`;
// //                     return new HumanMessage(newContent);
// //                 }
// //                 return msg;
// //             });

// //             // If history didn't start with a human message (unlikely), prepend one
// //             if (!(geminiMessages[0] instanceof HumanMessage)) {
// //                 geminiMessages.unshift(new HumanMessage(systemContent));
// //             }

// //             const response = await geminiModel.invoke(geminiMessages);
// //             return response.content;
// //         } catch (error) {
// //             console.error("⚠️ Gemini Vision failed:", error.message);

// //             // Prefix a system note for Mistral fallback
// //             const fallbackInstruction = `[SYSTEM NOTE: Gemini Vision failed to analyze the image. Proceed with text-only analysis based strictly on the user's text.]\n\n${systemContent}`;

// //             // Re-construct messages for Mistral: CRITICAL - convert multimodal blocks to plain text
// //             const sanitizedHistory = history.map(msg => {
// //                 if (msg instanceof HumanMessage && Array.isArray(msg.content)) {
// //                     // Extract only the text part from multimodal content
// //                     const textContent = msg.content
// //                         .filter(item => item.type === "text")
// //                         .map(item => item.text)
// //                         .join("\n");
// //                     return new HumanMessage(textContent);
// //                 }
// //                 return msg;
// //             });

// //             const mistralMessages = [
// //                 new SystemMessage(fallbackInstruction),
// //                 ...sanitizedHistory
// //             ];

// //             return await runMistralLoop(mistralMessages);
// //         }
// //     }

// //     // Default routing: Mistral + Parallel Tools Loop
// //     const mistralMessages = [
// //         new SystemMessage(systemContent),
// //         ...history
// //     ];

// //     return await runMistralLoop(mistralMessages);
// // }

// // // Extracted Mistral Loop for cleaner fallback logic
// // async function runMistralLoop(currentMessages) {
// //     let iterations = 0;
// //     const maxIterations = 5;
// //     let response;

// //     while (iterations < maxIterations) {
// //         try {
// //             response = await modelWithTools.invoke(currentMessages);

// //             if (!response.tool_calls || response.tool_calls.length === 0) {
// //                 break;
// //             }

// //             currentMessages.push(response);

// //             // Execute all requested tools in parallel 
// //             const toolPromises = response.tool_calls.map(async (toolCall) => {
// //                 const toolInstance = toolsMap[toolCall.name];
// //                 if (toolInstance) {
// //                     try {
// //                         const result = await toolInstance.invoke(toolCall.args);
// //                         return new ToolMessage({
// //                             content: typeof result === 'string' ? result : JSON.stringify(result),
// //                             tool_call_id: toolCall.id
// //                         });
// //                     } catch (err) {
// //                         return new ToolMessage({
// //                             content: `Tool error: ${err.message}`,
// //                             tool_call_id: toolCall.id
// //                         });
// //                     }
// //                 }
// //                 return null;
// //             });

// //             const toolResults = await Promise.all(toolPromises);
// //             currentMessages.push(...toolResults.filter(Boolean));

// //             iterations++;
// //         } catch (error) {
// //             console.error("Mistral/Tool Execution Error:", error.message);
// //             return "I encountered an error while processing your request. Please try again or refine your query.";
// //         }
// //     }

// //     return response.content;
// // }

// // // ==========================================
// // // 4. HELPER FUNCTIONS
// // // ==========================================

// // export async function generateChatTitle(message) {
// //     try {
// //         const response = await mistralModel.invoke([
// //             new SystemMessage("Generate a 2 to 4 word title for this chat based on the user's first message. Reply with ONLY the title, no quotes."),
// //             new HumanMessage(message)
// //         ]);
// //         return response.content.replace(/['"]/g, '').trim();
// //     } catch (error) {
// //         return "New Research";
// //     }
// // }

// // export async function generateSuggestions(userContext = "advanced MERN stack, LangChain AI, and modern web development") {
// //     const today = getCurrentTimeContext();
// //     const prompt = `You are a personalized search engine AI. Today is ${today}.
// //     Context: ${userContext}.
// //     Generate a JSON object with exactly:
// //     - "pills": 4 short tech categories.
// //     - "queries": query questions.
// //     - "topics": 4 objects { "label", "desc", "iconType" (global, robot, file, magic, compass) }.
// //     Return ONLY raw JSON.`;

// //     try {
// //         const response = await geminiModel.invoke([new HumanMessage(prompt)]);
// //         const text = response.content;
// //         const startIndex = text.indexOf('{');
// //         const endIndex = text.lastIndexOf('}');

// //         if (startIndex !== -1 && endIndex !== -1) {
// //             const cleanJson = text.substring(startIndex, endIndex + 1);
// //             return JSON.parse(cleanJson);
// //         }
// //         throw new Error("Invalid format from AI");
// //     } catch (error) {
// //         console.error("AI Suggestions Fallback:", error.message);
// //         // Fallback to Mistral for live but safer suggestions if Gemini is struggling
// //         try {
// //             const mResponse = await mistralModel.invoke([new HumanMessage(prompt + " Return only the JSON and nothing else.")]);
// //             const mText = mResponse.content;
// //             const s = mText.indexOf('{');
// //             const e = mText.lastIndexOf('}');
// //             if (s !== -1 && e !== -1) return JSON.parse(mText.substring(s, e + 1));
// //         } catch (mErr) {
// //             console.error("Mistral Fallback also failed");
// //         }

// //         return {
// //             pills: ["AI Agents", "MERN Stack", "WebRTC", "System Design"],
// //             queries: ["How to build a Perplexity clone?", "React 19 vs React 18", "Gemini 1.5 Vision tutorial", "Optimizing MongoDB queries", "LangChain tool calling guide"],
// //             topics: [
// //                 { label: "LangChain Updates", desc: "AI · Live", iconType: "robot" },
// //                 { label: "Modern Web Trends 2026", desc: "Code · Trending", iconType: "global" },
// //                 { label: "Gemini 1.5 Breakthroughs", desc: "Google · Today", iconType: "magic" },
// //                 { label: "Full-Stack Roadmap", desc: "Career · 2h ago", iconType: "file" }
// //             ]
// //         };
// //     }
// // }

// import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
// import { ChatMistralAI } from "@langchain/mistralai";
// import { HumanMessage, SystemMessage, AIMessage, ToolMessage } from "@langchain/core/messages";
// import { tool } from "@langchain/core/tools";
// import { tavily } from "@tavily/core";
// import { sendEmail } from "./mail.service.js";
// import axios from "axios";
// import * as z from "zod";

// // ==========================================
// // 1. AI MODELS INITIALIZATION (Multi-Tier)
// // ==========================================

// // Tier 1: Best for Images & Speed
// const geminiVisionModel = new ChatGoogleGenerativeAI({
//     model: "gemini-2.5-flash-lite", 
//     apiKey: process.env.GEMINI_API_KEY,
//     apiVersion: "v1beta",
//     maxRetries: 1, // Kam retries taaki turant fallback trigger ho
//     temperature: 0.1,
// });

// // Tier 2: Solid Backup for Text & Images
// const geminiTextModel = new ChatGoogleGenerativeAI({
//     model: "gemini-1.5-flash", 
//     apiKey: process.env.GEMINI_API_KEY,
//     apiVersion: "v1beta",
//     maxRetries: 1,
//     temperature: 0.1,
// });

// // Tier 3: Best for Tool Calling & Reasoning
// const mistralModel = new ChatMistralAI({
//     model: "mistral-small-latest",
//     apiKey: process.env.MISTRAL_API_KEY,
//     temperature: 0,
//     maxRetries: 1,
// });

// const tvly = new tavily(process.env.TAVILY_API_KEY);

// const getCurrentTimeContext = () => {
//     return new Date().toLocaleString('en-IN', { 
//         timeZone: 'Asia/Kolkata',
//         weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
//         hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
//     });
// };

// // ==========================================
// // 2. TOOLS DEFINITION
// // ==========================================

// const searchInternetTool = tool(
//     async ({ query }) => {
//         try {
//             const data = await tvly.search(query, { searchDepth: "basic", maxResults: 3 });
//             return data.results.map(r => `Title: ${r.title}\nDetails: ${r.content}`).join("\n\n");
//         } catch (error) {
//             console.error("Search Tool Error:", error.message);
//             return "Search temporarily unavailable. Proceed with internal knowledge.";
//         }
//     },
//     {
//         name: "searchInternet",
//         description: "CRITICAL: Search the internet for current events, news, dates, and real-time facts.",
//         schema: z.object({ query: z.string().describe("The search query") })
//     }
// );

// const emailTool = tool(
//     async ({ to, subject, html }) => {
//         try {
//             await sendEmail({ to, subject, html });
//             return `Email successfully sent to ${to}.`;
//         } catch (error) {
//             return `Failed to send email: ${error.message}`;
//         }
//     },
//     {
//         name: "emailTool",
//         description: "Send emails on behalf of the user.",
//         schema: z.object({
//             to: z.string().describe("Recipient email address"),
//             subject: z.string().describe("Subject of the email"),
//             html: z.string().describe("HTML content of the email")
//         })
//     }
// );

// const toolsMap = { searchInternet: searchInternetTool, emailTool };
// const modelWithTools = mistralModel.bindTools([searchInternetTool, emailTool]);

// // ==========================================
// // 3. MAIN CHAT LOGIC (Unbreakable Router)
// // ==========================================

// export async function generateResponse(messages) {
//     const hasImage = messages.some(msg => msg.file && msg.file.url);
//     const today = getCurrentTimeContext();

//     const history = await Promise.all(messages.map(async (msg) => {
//         let content = msg.content || "";

//         if (msg.file && msg.file.url) {
//             try {
//                 const imageRes = await axios.get(msg.file.url, { responseType: 'arraybuffer', timeout: 8000 });
//                 const base64 = Buffer.from(imageRes.data).toString('base64');
//                 const mimeType = imageRes.headers['content-type'] || 'image/jpeg';

//                 content = [
//                     { type: "text", text: `Attached Image: [${msg.file.url}]\n\nQuestion: ${msg.content || "Analyze this image."}` },
//                     { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
//                 ];
//             } catch (error) {
//                 console.error("⚠️ Image processing failed:", error.message);
//                 content = `${msg.content || ""}\n[Note: Image analysis failed to load.]`;
//             }
//         }
//         if (msg.role === "ai") return new AIMessage(content);
//         return new HumanMessage(content);
//     }));

//     const systemContent = `You are an advanced AI assistant. Current Date: ${today}.
//     CRITICAL INSTRUCTIONS:
//     1. Your internal data ends in 2023. You MUST use 'searchInternet' for ANY facts, news, or current events.
//     2. Provide highly accurate, detailed, and well-structured answers.`;

//     // ----------------------------------------------------------------
//     // ROUTE A: IMAGE WORKFLOW (Vision Priority)
//     // ----------------------------------------------------------------
//     if (hasImage) {
//         // Setup multimodal format
//         const geminiMessages = history.map((msg, idx) => {
//             if (idx === 0 && msg instanceof HumanMessage) {
//                 const originalContent = msg.content;
//                 const newContent = Array.isArray(originalContent) 
//                     ? [{ type: "text", text: systemContent }, ...originalContent]
//                     : `${systemContent}\n\nUser Question: ${originalContent}`;
//                 return new HumanMessage(newContent);
//             }
//             return msg;
//         });
//         if (!(geminiMessages[0] instanceof HumanMessage)) geminiMessages.unshift(new HumanMessage(systemContent));

//         try {
//             // Attempt 1: Gemini 2.5 Flash Lite
//             const response = await geminiVisionModel.invoke(geminiMessages);
//             return response.content;
//         } catch (error1) {
//             console.error("⚠️ 2.5-Lite Vision failed, falling back to 1.5-Flash...", error1.message);

//             try {
//                 // Attempt 2: Gemini 1.5 Flash
//                 const response2 = await geminiTextModel.invoke(geminiMessages);
//                 return response2.content;
//             } catch (error2) {
//                 console.error("⚠️ 1.5-Flash Vision also failed, falling back to Mistral (Text Only)...", error2.message);

//                 // Attempt 3: Mistral (Text Only)
//                 const fallbackInstruction = `[SYSTEM NOTE: Vision models are down. Proceed with text-only analysis.]\n\n${systemContent}`;
//                 const sanitizedHistory = history.map(msg => {
//                     if (msg instanceof HumanMessage && Array.isArray(msg.content)) {
//                         const textContent = msg.content.filter(item => item.type === "text").map(item => item.text).join("\n");
//                         return new HumanMessage(textContent);
//                     }
//                     return msg;
//                 });

//                 try {
//                     return await runMistralLoop([new SystemMessage(fallbackInstruction), ...sanitizedHistory]);
//                 } catch (error3) {
//                     return "Sorry, all AI models are currently overwhelmed. Please try again in a few seconds.";
//                 }
//             }
//         }
//     }

//     // ----------------------------------------------------------------
//     // ROUTE B: TEXT WORKFLOW (Tool Priority)
//     // ----------------------------------------------------------------
//     const textMessages = [new SystemMessage(systemContent), ...history];

//     try {
//         // Attempt 1: Mistral + Tools
//         return await runMistralLoop(textMessages);
//     } catch (error1) {
//         console.error("⚠️ Mistral Tools failed, falling back to Gemini Text Backup...", error1.message);

//         try {
//             // Attempt 2: Gemini 1.5 Flash Backup (No tools, just answer)
//             const response = await geminiTextModel.invoke(textMessages);
//             return response.content;
//         } catch (error2) {
//             return "Sorry, I am having trouble connecting to my servers right now. Please try again.";
//         }
//     }
// }

// // Extracted Mistral Loop
// async function runMistralLoop(currentMessages) {
//     let iterations = 0;
//     const maxIterations = 5;
//     let response;

//     while (iterations < maxIterations) {
//         response = await modelWithTools.invoke(currentMessages);

//         if (!response.tool_calls || response.tool_calls.length === 0) {
//             break;
//         }

//         currentMessages.push(response);

//         const toolPromises = response.tool_calls.map(async (toolCall) => {
//             const toolInstance = toolsMap[toolCall.name];
//             if (toolInstance) {
//                 try {
//                     const result = await toolInstance.invoke(toolCall.args);
//                     return new ToolMessage({
//                         content: typeof result === 'string' ? result : JSON.stringify(result),
//                         tool_call_id: toolCall.id
//                     });
//                 } catch (err) {
//                     return new ToolMessage({ content: `Tool error: ${err.message}`, tool_call_id: toolCall.id });
//                 }
//             }
//             return null;
//         });

//         const toolResults = await Promise.all(toolPromises);
//         currentMessages.push(...toolResults.filter(Boolean));
//         iterations++;
//     }

//     return response.content;
// }

// // ==========================================
// // 4. HELPER FUNCTIONS
// // ==========================================

// export async function generateChatTitle(message) {
//     try {
//         const response = await mistralModel.invoke([
//             new SystemMessage("Generate a 2 to 4 word title for this chat based on the user's first message. Reply with ONLY the title, no quotes."),
//             new HumanMessage(message)
//         ]);
//         return response.content.replace(/['"]/g, '').trim();
//     } catch (error) {
//         return "New Research";
//     }
// }

// export async function generateSuggestions(userContext = "advanced MERN stack, LangChain AI, and modern web development") {
//     const today = getCurrentTimeContext();
//     const prompt = `You are a personalized search engine AI. Today is ${today}.
//     Context: ${userContext}.
//     Generate a JSON object with exactly:
//     - "pills": 4 short tech categories.
//     - "queries": query questions.
//     - "topics": 4 objects { "label", "desc", "iconType" (global, robot, file, magic, compass) }.
//     Return ONLY raw JSON.`;

//     try {
//         // Use 2.5 Lite for fastest suggestions
//         const response = await geminiVisionModel.invoke([new HumanMessage(prompt)]);
//         const text = response.content;
//         const startIndex = text.indexOf('{');
//         const endIndex = text.lastIndexOf('}');

//         if (startIndex !== -1 && endIndex !== -1) {
//             return JSON.parse(text.substring(startIndex, endIndex + 1));
//         }
//         throw new Error("Invalid format from AI");
//     } catch (error) {
//         console.error("AI Suggestions Fallback:", error.message);
//         try {
//             const mResponse = await mistralModel.invoke([new HumanMessage(prompt + " Return only the JSON and nothing else.")]);
//             const mText = mResponse.content;
//             const s = mText.indexOf('{');
//             const e = mText.lastIndexOf('}');
//             if (s !== -1 && e !== -1) return JSON.parse(mText.substring(s, e + 1));
//         } catch (mErr) {
//             console.error("Mistral Fallback also failed");
//         }

//         return {
//             pills: ["AI Agents", "MERN Stack", "WebRTC", "System Design"],
//             queries: ["How to build a Perplexity clone?", "React 19 vs React 18", "Gemini Vision tutorial", "Optimizing MongoDB queries", "LangChain tool calling guide"],
//             topics: [
//                 { label: "LangChain Updates", desc: "AI · Live", iconType: "robot" },
//                 { label: "Modern Web Trends", desc: "Code · Trending", iconType: "global" },
//                 { label: "AI Breakthroughs", desc: "Tech · Today", iconType: "magic" },
//                 { label: "Full-Stack Roadmap", desc: "Career · 2h ago", iconType: "file" }
//             ]
//         };
//     }
// }

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatMistralAI } from "@langchain/mistralai";
import { HumanMessage, SystemMessage, AIMessage, ToolMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { tavily } from "@tavily/core";
import { sendEmail } from "./mail.service.js";
import axios from "axios";
import * as z from "zod";

// ==========================================
// 1. AI MODELS INITIALIZATION (Smart Quota Management)
// ==========================================

// Tier 1: Primary Vision Model (Used ONLY for images - 20 req/day)
const geminiVisionModel = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash-lite",
  apiKey: process.env.GEMINI_API_KEY,
  apiVersion: "v1beta",
  maxRetries: 0, // No retry, fail fast to fallback
  temperature: 0.1,
});

// Tier 2: Backup Vision Model (If Tier 1 quota is exhausted)
const geminiTextModel = new ChatGoogleGenerativeAI({
  model: "gemini-1.5-flash-lite",
  apiKey: process.env.GEMINI_API_KEY,
  apiVersion: "v1beta",
  maxRetries: 1,
  temperature: 0.1,
});

// Tier 3: Workhorse Model (Used for ALL text, tools, and suggestions)
const mistralModel = new ChatMistralAI({
  model: "mistral-small-latest",
  apiKey: process.env.MISTRAL_API_KEY,
  temperature: 0,
  maxRetries: 2,
});

const tvly = new tavily(process.env.TAVILY_API_KEY);

const getCurrentTimeContext = () => {
  return new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
  });
};

// ==========================================
// 2. TOOLS DEFINITION (Web Search & Email)
// ==========================================

const searchInternetTool = tool(
  async ({ query }) => {
    try {
      const data = await tvly.search(query, { searchDepth: "basic", maxResults: 3 });
      return data.results.map(r => `Title: ${r.title}\nDetails: ${r.content}`).join("\n\n");
    } catch (error) {
      console.error("Search Tool Error:", error.message);
      return "Search is temporarily unavailable. Answer based on your knowledge.";
    }
  },
  {
    name: "searchInternet",
    description: "CRITICAL: Search the internet for the latest news, events, and real-time facts.",
    schema: z.object({ query: z.string().describe("The search query") })
  }
);

const emailTool = tool(
  async ({ to, subject, html }) => {
    const result = await sendEmail({ to, subject, html });
    if (result.success) {
      return `Email successfully sent to ${to}.`;
    }
    return `Failed to send email: ${result.error}`;
  },
  {
    name: "emailTool",
    description: "Send an email on behalf of the user.",
    schema: z.object({
      to: z.string().describe("Recipient email address"),
      subject: z.string().describe("Subject of the email"),
      html: z.string().describe("HTML content")
    })
  }
);

const toolsMap = { searchInternet: searchInternetTool, emailTool };
const modelWithTools = mistralModel.bindTools([searchInternetTool, emailTool]);

// ==========================================
// 3. MAIN CHAT LOGIC (Dynamic Router)
// ==========================================

export async function generateResponse(messages) {
  const hasImage = messages.some(msg => msg.file && msg.file.url);
  const today = getCurrentTimeContext();

  // Safely process message history & fetch images if present
  const history = await Promise.all(messages.map(async (msg) => {
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
    2. Provide accurate, detailed, and well-structured answers in Markdown format.`;

  // ----------------------------------------------------------------
  // ROUTE A: IMAGE WORKFLOW (Gemini)
  // ----------------------------------------------------------------
  if (hasImage) {
    // Setup Gemini messages (moving system prompt to first human message)
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
      console.log("📸 Processing Image with Gemini 2.5 Lite...");
      const response = await geminiVisionModel.invoke(geminiMessages);
      return response.content;
    } catch (error1) {
      console.warn("⚠️ 2.5-Lite failed (Quota full/429). Switching to 1.5-Flash backup...");
      try {
        const response2 = await geminiTextModel.invoke(geminiMessages);
        return response2.content;
      } catch (error2) {
        console.error("⚠️ 1.5-Flash also failed. Final fallback to Mistral (Text-only).");
        // Convert multimodal content to text-only for Mistral
        const sanitizedHistory = history.map(msg => {
          if (Array.isArray(msg.content)) {
            const textContent = msg.content.filter(item => item.type === "text").map(item => item.text).join("\n");
            return msg instanceof AIMessage ? new AIMessage({ content: textContent }) : new HumanMessage({ content: textContent });
          }
          return msg;
        });
        return await runMistralLoop([new SystemMessage({ content: `[VISION UNAVAILABLE: Answer only using text context]\n${systemContent}` }), ...sanitizedHistory]);
      }
    }
  }

  // ----------------------------------------------------------------
  // ROUTE B: TEXT-ONLY WORKFLOW (Mistral + Tools)
  // ----------------------------------------------------------------
  // Saving Gemini Quota! Directing all text to Mistral.
  console.log("📝 Text Query detected. Processing with Mistral + Tools...");
  const textMessages = [new SystemMessage({ content: systemContent }), ...history];
  return await runMistralLoop(textMessages);
}

// Extracted Tool Loop for Mistral
async function runMistralLoop(currentMessages) {
  let iterations = 0;
  const maxIterations = 5;
  let response;

  while (iterations < maxIterations) {
    response = await modelWithTools.invoke(currentMessages);

    if (!response.tool_calls || response.tool_calls.length === 0) {
      break; // No more tools to call, exit loop
    }

    currentMessages.push(response);

    // Run tools in parallel for speed
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

  return response.content;
}

// ==========================================
// 4. HELPER FUNCTIONS (Titles & Suggestions)
// ==========================================

export async function generateChatTitle(message) {
  try {
    const response = await mistralModel.invoke([
      new SystemMessage({ content: "Generate a 2 to 4 word title for this chat based on the user's first message. Reply with ONLY the title, no quotes." }),
      new HumanMessage({ content: message })
    ]);
    return response.content.replace(/['"]/g, '').trim();
  } catch (error) {
    return "New Research Chat";
  }
}

export async function generateSuggestions(userContext = "advanced MERN stack development, LangChain AI agents, WebRTC") {
  const today = getCurrentTimeContext();
  const prompt = `You are a personalized search engine AI. Today is ${today}.
    Context: The user is interested in ${userContext}.
    Generate a JSON object with exactly:
    - "pills": 4 short tech categories (strings).
    - "queries": 5 engaging search questions (strings).
    - "topics": 4 objects with "label" (title), "desc" (category/time), "iconType" (one of: global, robot, file, magic, compass).
    Return ONLY raw JSON formatting without backticks or markdown blocks.`;

  try {
    // MISTRAL IS USED HERE TO SAVE GEMINI QUOTA
    const response = await mistralModel.invoke([new HumanMessage({ content: prompt })]);
    const text = response.content;

    // Robust JSON Extractor Regex
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error("No JSON object found in response");
  } catch (error) {
    console.error("⚠️ AI Suggestions Fallback triggered:", error.message);

    // Static intelligent fallback so UI never breaks
    return {
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
  }
}