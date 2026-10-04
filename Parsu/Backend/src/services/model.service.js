import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Default Built-in Models supported by our site
export const DEFAULT_MODELS = [
  {
    id: "gemini-3.6-flash",
    name: "Gemini 3.6 Flash",
    provider: "gemini",
    badge: "Fast · Vision",
    description: "Google's ultra-fast multimodal flagship model",
    isBuiltIn: true,
    isDefault: true,
    category: "general",
    supportsVision: true
  },
  {
    id: "gemini-flash-latest",
    name: "Gemini Flash Latest",
    provider: "gemini",
    badge: "High Speed · Vision",
    description: "Ultra-fast generation with long context window",
    isBuiltIn: true,
    category: "fast",
    supportsVision: true
  },
  {
    id: "gemini-pro-latest",
    name: "Gemini Pro Latest",
    provider: "gemini",
    badge: "Reasoning · Vision",
    description: "Complex reasoning, coding & analysis",
    isBuiltIn: true,
    category: "reasoning",
    supportsVision: true
  },
  {
    id: "open-mistral-nemo",
    name: "Mistral NeMo",
    provider: "mistral",
    badge: "128k Context",
    description: "Mistral's powerful 12B reasoning model (free tier supported)",
    isBuiltIn: true,
    category: "fast",
    supportsVision: false
  },
  {
    id: "codestral-latest",
    name: "Codestral",
    provider: "mistral",
    badge: "Coding",
    description: "Mistral's code generation & software reasoning specialist",
    isBuiltIn: true,
    category: "reasoning",
    supportsVision: false
  },
  {
    id: "llama-3.3-70b-versatile",
    name: "Llama 3.3 70B",
    provider: "groq",
    badge: "Blazing Fast",
    description: "Meta Llama 3.3 running on ultra-fast Groq LPU",
    isBuiltIn: true,
    category: "fast",
    supportsVision: false
  },
  {
    id: "deepseek-chat",
    name: "DeepSeek V3",
    provider: "deepseek",
    badge: "Code & Chat",
    description: "State-of-the-art general purpose chat and coding",
    isBuiltIn: true,
    category: "general",
    supportsVision: false
  },
  {
    id: "deepseek-reasoner",
    name: "DeepSeek R1",
    provider: "deepseek",
    badge: "Chain of Thought",
    description: "Deep reasoning model with internal thought process",
    isBuiltIn: true,
    category: "reasoning",
    supportsVision: false
  }
];

/**
 * Check if a model supports multimodal vision (images)
 */
export function doesModelSupportVision(modelId, provider) {
  if (!modelId) return false;
  const m = (modelId || "").toLowerCase();
  const p = (provider || "").toLowerCase();

  // Check DEFAULT_MODELS first
  const known = DEFAULT_MODELS.find(dm => dm.id === modelId);
  if (known && typeof known.supportsVision === "boolean") {
    return known.supportsVision;
  }

  // Google Gemini models natively support vision
  if (p === "gemini" || m.includes("gemini")) return true;

  // Anthropic Claude 3 and 3.5 / 3.7 support vision
  if (p === "anthropic" || m.includes("claude-3") || m.includes("claude-3-5") || m.includes("claude-3-7")) return true;

  // OpenAI Vision models & open-weights multimodal models
  if (
    m.includes("gpt-4o") ||
    m.includes("gpt-4-turbo") ||
    m.includes("vision") ||
    m.includes("-vl") ||
    m.includes("pixtral") ||
    m.includes("llava") ||
    m.includes("qwen-vl")
  ) {
    return true;
  }

  return false;
}

/**
 * Get friendly display name for model
 */
export function getModelDisplayName(modelId, provider) {
  const builtIn = DEFAULT_MODELS.find(m => m.id === modelId);
  if (builtIn) return builtIn.name;
  if (!modelId) return "AI Model";
  return modelId
    .split(/[-_]/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export const PROVIDER_CONFIGS = {
  gemini: {
    name: "Google Gemini",
    defaultBaseUrl: "https://generativelanguage.googleapis.com",
    placeholderKey: "AIzaSy...",
    docsUrl: "https://aistudio.google.com/app/apikey",
    icon: "gemini"
  },
  openai: {
    name: "OpenAI",
    defaultBaseUrl: "https://api.openai.com/v1",
    placeholderKey: "sk-proj-...",
    docsUrl: "https://platform.openai.com/api-keys",
    icon: "openai"
  },
  anthropic: {
    name: "Anthropic Claude",
    defaultBaseUrl: "https://api.anthropic.com/v1",
    placeholderKey: "sk-ant-...",
    docsUrl: "https://console.anthropic.com/settings/keys",
    icon: "anthropic"
  },
  deepseek: {
    name: "DeepSeek",
    defaultBaseUrl: "https://api.deepseek.com/v1",
    placeholderKey: "sk-...",
    docsUrl: "https://platform.deepseek.com/api_keys",
    icon: "deepseek"
  },
  mistral: {
    name: "Mistral AI",
    defaultBaseUrl: "https://api.mistral.ai/v1",
    placeholderKey: "...",
    docsUrl: "https://console.mistral.ai/api-keys/",
    icon: "mistral"
  },
  groq: {
    name: "Groq",
    defaultBaseUrl: "https://api.groq.com/openai/v1",
    placeholderKey: "gsk_...",
    docsUrl: "https://console.groq.com/keys",
    icon: "groq"
  },
  nvidia: {
    name: "NVIDIA NIM",
    defaultBaseUrl: "https://integrate.api.nvidia.com/v1",
    placeholderKey: "nvapi-...",
    docsUrl: "https://build.nvidia.com/",
    icon: "nvidia"
  },
  openrouter: {
    name: "OpenRouter",
    defaultBaseUrl: "https://openrouter.ai/api/v1",
    placeholderKey: "sk-or-v1-...",
    docsUrl: "https://openrouter.ai/keys",
    icon: "openrouter"
  },
  custom: {
    name: "Custom (OmniRoute / OpenCode Go / Zen Extra / Agent Router)",
    defaultBaseUrl: "https://api.omniroute.ai/v1",
    placeholderKey: "custom-api-key...",
    docsUrl: "",
    icon: "custom"
  }
};

/**
 * Dynamically fetches models for a given provider and user-supplied API key
 */
export async function fetchModelsForProvider(provider, apiKey, customBaseUrl = "") {
  if (!apiKey) {
    throw new Error("API Key is required to fetch models");
  }

  const cleanKey = apiKey.trim();
  const baseUrl = (customBaseUrl || PROVIDER_CONFIGS[provider]?.defaultBaseUrl || "").replace(/\/$/, "");

  // 1. Google Gemini
  if (provider === "gemini") {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`;
      const res = await axios.get(url, { timeout: 10000 });
      const rawModels = res.data.models || [];
      const models = rawModels
        .filter(m => m.supportedGenerationMethods?.includes("generateContent"))
        .map(m => {
          const id = m.name.replace("models/", "");
          return {
            id,
            name: m.displayName || id,
            description: m.description || "Google Gemini Model",
            contextLength: m.inputTokenLimit || 32768
          };
        });

      return models.length > 0 ? models : [
        { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", description: "Default Gemini 2.5 Flash" },
        { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", description: "Gemini 1.5 Flash" },
        { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", description: "Gemini 1.5 Pro" }
      ];
    } catch (err) {
      console.error("Gemini model fetch error:", err.response?.data || err.message);
      throw new Error(err.response?.data?.error?.message || "Invalid Gemini API Key or connection error");
    }
  }

  // 2. Anthropic Claude
  if (provider === "anthropic") {
    try {
      const res = await axios.get("https://api.anthropic.com/v1/models", {
        headers: {
          "x-api-key": cleanKey,
          "anthropic-version": "2023-06-01"
        },
        timeout: 10000
      });

      if (res.data?.data && Array.isArray(res.data.data)) {
        return res.data.data.map(m => ({
          id: m.id,
          name: m.display_name || m.id,
          description: "Anthropic Claude Model",
          contextLength: 200000
        }));
      }
    } catch (err) {
      // If endpoint not accessible on some tiers, test auth and return curated Claude models
      try {
        await axios.post("https://api.anthropic.com/v1/messages", {
          model: "claude-3-5-haiku-20241022",
          max_tokens: 1,
          messages: [{ role: "user", content: "hi" }]
        }, {
          headers: {
            "x-api-key": cleanKey,
            "anthropic-version": "2023-06-01"
          },
          timeout: 8000
        });
      } catch (testErr) {
        if (testErr.response?.status === 401) {
          throw new Error("Invalid Anthropic Claude API Key");
        }
      }

      return [
        { id: "claude-3-7-sonnet-20250219", name: "Claude 3.7 Sonnet", description: "Hybrid reasoning and flagship intelligence", contextLength: 200000 },
        { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet", description: "Industry-leading intelligence and coding", contextLength: 200000 },
        { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku", description: "Fastest Claude model with near-Sonnet intelligence", contextLength: 200000 },
        { id: "claude-3-opus-20240229", name: "Claude 3 Opus", description: "Deep analysis and complex reasoning", contextLength: 200000 }
      ];
    }
  }

  // 3. OpenAI and all OpenAI-compatible providers:
  // (DeepSeek, Groq, Mistral, NVIDIA NIM, OpenRouter, OmniRoute, OpenCode Go, Zen Extra, Agent Router, Custom)
  try {
    const modelsEndpoint = `${baseUrl}/models`;
    const headers = {
      Authorization: `Bearer ${cleanKey}`,
      "Content-Type": "application/json"
    };

    if (provider === "openrouter") {
      headers["HTTP-Referer"] = "https://parsu.app";
      headers["X-Title"] = "Parsu AI";
    }

    const res = await axios.get(modelsEndpoint, { headers, timeout: 12000 });
    const rawList = res.data?.data || res.data || [];

    if (Array.isArray(rawList) && rawList.length > 0) {
      let models = rawList.map(m => ({
        id: m.id,
        name: m.name || m.id,
        description: m.description || `${provider.toUpperCase()} Model`,
        contextLength: m.context_length || m.max_model_len || 0
      }));

      // Filter and limit if provider has hundreds of fine-tuned/legacy models (like OpenAI or OpenRouter)
      if (provider === "openai") {
        const priorityModels = ["gpt-4o", "gpt-4o-mini", "o1", "o3-mini", "gpt-4-turbo", "gpt-3.5-turbo"];
        models = models.filter(m => 
          !m.id.includes("whisper") && 
          !m.id.includes("tts") && 
          !m.id.includes("dall-e") && 
          !m.id.includes("embedding") &&
          !m.id.includes("babbage") &&
          !m.id.includes("davinci")
        );
        models.sort((a, b) => {
          const aIdx = priorityModels.findIndex(p => a.id.startsWith(p));
          const bIdx = priorityModels.findIndex(p => b.id.startsWith(p));
          if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
          if (aIdx !== -1) return -1;
          if (bIdx !== -1) return 1;
          return a.id.localeCompare(b.id);
        });
      } else if (provider === "openrouter") {
        // Top 50 popular models
        models = models.slice(0, 50);
      } else if (provider === "nvidia") {
        const priorityNvidia = [
          "meta/llama-3.2-11b-vision-instruct",
          "nvidia/llama-3.1-nemotron-70b-instruct",
          "deepseek-ai/deepseek-r1",
          "01-ai/yi-large",
          "bigcode/starcoder2-15b"
        ];
        models = models.filter(m => 
          !m.id.includes("deepseek-coder-6.7b") &&
          !m.id.includes("llama-3.1-70b-instruct") &&
          !m.id.includes("llama-3.3-70b-instruct")
        );
        models.sort((a, b) => {
          const aIdx = priorityNvidia.findIndex(p => a.id === p);
          const bIdx = priorityNvidia.findIndex(p => b.id === p);
          if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
          if (aIdx !== -1) return -1;
          if (bIdx !== -1) return 1;
          return a.id.localeCompare(b.id);
        });
      }

      return models.slice(0, 40); // Cap at 40 top models for performance
    }

    throw new Error("No models returned by provider");
  } catch (err) {
    console.error(`Error fetching models for ${provider}:`, err.response?.data || err.message);
    const msg = err.response?.data?.error?.message || err.response?.data?.message || err.message;
    throw new Error(`Failed to fetch models from ${provider}: ${msg}`);
  }
}

/**
 * Universal Chat Stream Execution Engine
 * Handles streaming for Gemini, OpenAI, Claude, DeepSeek, Groq, Mistral, Nvidia, and Custom endpoints.
 */
export async function executeModelChatStream({
  provider = "gemini",
  modelId = "gemini-2.5-flash",
  apiKey = "",
  baseUrl = "",
  messages = [],
  images = [],
  customInstructions = "",
  thinkingLevel = "low",
  memorySummary = "",
  memoryFacts = [],
  documentRagContext = "",
  onChunk = () => {}
}) {
  let systemPrompt = `You are a world-class AI search assistant (Parsu AI). Provide comprehensive, accurate, well-structured, objective, and beautifully formatted markdown answers. Include clear headings, bullet points, and code blocks when applicable.
CRITICAL CITATION & LINK RULES:
1. When real-time web search findings are provided, cite facts clearly and ALWAYS provide a dedicated '### Sources & Citations' section with clickable markdown links [Source Title](URL) at the end of your response.
2. Whenever user uploaded files, attachments, or published social media links are provided in context, always prominently provide the direct clickable markdown link [Platform Post / File Name](URL) so the user can immediately click and view it.
3. CRITICAL AUTOMATIC ROAD TRIP & MULTI-STOP MAP EXTRACTION:
When the user asks for a map, directions, routes, trip plans, road trip itineraries, or minimum distance from one place to another (even with casual language or typos like "going to RJ by car through malabar visiting kasargod, manguluru, goa like conacona, baga, ratanagiri, mumbai, navi mumbai, gurjat surat, vapi, ahmedabad, sabrmati, palanpur then marvad bhinmal"):
- AUTOMATICALLY EXTRACT ALL LOCATIONS:
  1. from (Origin / Starting City): Identify starting place (e.g. "Malabar, Kerala" or "Thalassery, Kerala" or "My Location").
  2. to (Final Destination): Identify the user's final destination (e.g. "Bhinmal, Rajasthan").
  3. stops (Intermediate Waypoints): Extract and clean EVERY SINGLE city, beach, town, landmark, highway stop, or detour mentioned by the user or along the optimal route. Fix typos and add state/region context automatically:
     (e.g., "kasargod" -> "Kasaragod", "manguluru" -> "Mangaluru", "conacona" -> "Canacona Goa", "baga" -> "Baga Beach Goa", "ratanagiri" -> "Ratnagiri", "mumbai" -> "Mumbai", "navi mumbai" -> "Navi Mumbai", "vapi" -> "Vapi", "gurjat surat" -> "Surat", "ahmedabad" -> "Ahmedabad", "sabrmati" -> "Sabarmati Ahmedabad", "palanpur" -> "Palanpur", "marvad bhinmal" -> "Bhinmal Rajasthan").
- ALWAYS OUTPUT THE FULL MULTI-STOP MAP CODEBLOCK:
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
- For a single place:
\`\`\`map
Place Name, City, Country
\`\`\`
The frontend will automatically render an interactive, pannable and zoomable Google Map card with ALL intermediate stops pinned along the road, turn-by-turn navigation, and GPS detection directly in chat! In your text, mention distance (km/miles) and travel advice.`;

  // Thinking level directives
  const tLevel = (thinkingLevel || "low").toLowerCase();
  if (tLevel === "medium") {
    systemPrompt += `\n\n--- REASONING DIRECTIVE (MODE: MEDIUM / BALANCED) ---\nProvide a balanced and structured response. Offer clear step-by-step logic, practical examples, and well-organized explanations.`;
  } else if (tLevel === "high" || tLevel === "hard") {
    systemPrompt += `\n\n--- REASONING DIRECTIVE (MODE: HIGH / DEEP REASONING) ---\nEngage deep analytical thinking. Methodically explore edge cases, analyze subtleties, verify underlying principles, and deliver a comprehensive, highly thorough breakdown.`;
  } else {
    systemPrompt += `\n\n--- REASONING DIRECTIVE (MODE: FAST / LOW THINKING BUDGET) ---\nBe ultra-fast, direct, and concise. Deliver immediate, high-accuracy answers without conversational fluff, unnecessary preambles, or excessive step-by-step narration.`;
  }

  // Persistent user facts & memory
  if (memorySummary || (Array.isArray(memoryFacts) && memoryFacts.length > 0)) {
    const factsText = (memoryFacts || []).map(f => `• ${f}`).join("\n");
    systemPrompt += `\n\n--- USER'S STORED FACTS & PERSONAL MEMORY ---\n` +
      (memorySummary ? `Overall Summary: ${memorySummary}\n` : "") +
      (factsText ? `Learned Facts:\n${factsText}\n` : "") +
      `----------------------------------------------\n` +
      `CRITICAL MEMORY DIRECTIVE: When the user asks about personal details they previously told you to remember (such as friends' names, favorite things, hobbies, or life facts), accurately recall them from this memory and respond naturally.`;
  }

  // Attached Document RAG Context
  if (documentRagContext) {
    systemPrompt += `\n\n--- ATTACHED PDF / DOCUMENT RAG CONTEXT ---\n${documentRagContext}\n-------------------------------------------`;
  }

  if (customInstructions && customInstructions.trim()) {
    systemPrompt += `\n\n--- USER'S MANDATORY CUSTOM INSTRUCTIONS ---\nFollow the user's custom instructions:\n"${customInstructions.trim()}"\n---------------------------------------------`;
  }

  // 1. Google Gemini Provider
  if (provider === "gemini") {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) throw new Error("Missing Gemini API Key");

    // Automatically map deprecated model IDs to active ones
    let resolvedModelId = modelId || "gemini-3.6-flash";
    if (resolvedModelId === "gemini-2.5-flash" || resolvedModelId === "gemini-1.5-flash") {
      resolvedModelId = "gemini-3.6-flash";
    } else if (resolvedModelId === "gemini-1.5-pro" || resolvedModelId === "gemini-2.5-pro") {
      resolvedModelId = "gemini-pro-latest";
    }

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: resolvedModelId });

    // Format chat contents
    const contents = [];
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const isLastUser = (i === messages.length - 1 || i === messages.map(m => m.role).lastIndexOf("user")) && msg.role !== "assistant";
      const parts = [{ text: msg.content || "" }];

      // Attach multimodal images to the latest user message
      if (isLastUser && images && images.length > 0) {
        for (const img of images) {
          if (img.base64 && img.mimeType) {
            parts.push({
              inlineData: {
                mimeType: img.mimeType,
                data: img.base64
              }
            });
          }
        }
      }

      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts
      });
    }

    if (contents.length === 0) {
      contents.push({ role: "user", parts: [{ text: "Hello!" }] });
    }

    try {
      const streamingResp = await model.generateContentStream({
        contents,
        systemInstruction: systemPrompt
      });

      let fullText = "";
      for await (const chunk of streamingResp.stream) {
        const text = chunk.text();
        if (text) {
          fullText += text;
          onChunk(text);
        }
      }
      return fullText;
    } catch (geminiErr) {
      const errMsg = geminiErr?.message || String(geminiErr);
      const isOverloaded = /overload|429|503|quota|resource.*exhaust|high traffic|rate limit|failed to parse stream|capacity|temporarily unavailable/i.test(errMsg);
      if (isOverloaded) {
        const friendlyNotice = "Gemini is experiencing high traffic right now and may take a moment to respond. Please try again in a few moments, or select another model from the dropdown.";
        if (onChunk) onChunk(friendlyNotice);
        return friendlyNotice;
      }
      throw geminiErr;
    }
  }

  // 2. Anthropic Claude Provider
  if (provider === "anthropic") {
    const key = apiKey || process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error("Missing Anthropic API Key");

    const claudeMessages = messages.map((m, idx) => {
      const isLastUser = (idx === messages.length - 1 || idx === messages.map(x => x.role).lastIndexOf("user")) && m.role !== "assistant";
      if (isLastUser && images && images.length > 0) {
        const parts = [];
        for (const img of images) {
          if (img.base64 && img.mimeType) {
            parts.push({
              type: "image",
              source: {
                type: "base64",
                media_type: img.mimeType,
                data: img.base64
              }
            });
          }
        }
        parts.push({ type: "text", text: m.content || "Analyze this image." });
        return {
          role: "user",
          content: parts
        };
      }

      return {
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content || ""
      };
    });

    const response = await axios({
      method: "post",
      url: "https://api.anthropic.com/v1/messages",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json"
      },
      data: {
        model: modelId || "claude-3-5-sonnet-20241022",
        max_tokens: 4096,
        system: systemPrompt,
        messages: claudeMessages,
        stream: true
      },
      responseType: "stream"
    });

    let fullText = "";
    return new Promise((resolve, reject) => {
      response.data.on("data", (chunk) => {
        const lines = chunk.toString().split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.replace("data: ", "").trim();
            if (dataStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.type === "content_block_delta" && parsed.delta?.text) {
                fullText += parsed.delta.text;
                onChunk(parsed.delta.text);
              }
            } catch (e) {}
          }
        }
      });

      response.data.on("end", () => resolve(fullText));
      response.data.on("error", (err) => reject(err));
    });
  }

  // 3. OpenAI & OpenAI-Compatible Providers
  // (DeepSeek, Groq, Mistral, NVIDIA NIM, OpenRouter, OmniRoute, OpenCode Go, Zen Extra, Agent Router, Custom)
  const defaultUrls = {
    openai: "https://api.openai.com/v1",
    deepseek: "https://api.deepseek.com/v1",
    groq: "https://api.groq.com/openai/v1",
    mistral: "https://api.mistral.ai/v1",
    nvidia: "https://integrate.api.nvidia.com/v1",
    openrouter: "https://openrouter.ai/api/v1",
    custom: baseUrl || "https://api.omniroute.ai/v1"
  };

  const targetUrl = (baseUrl || defaultUrls[provider] || "https://api.openai.com/v1").replace(/\/$/, "");

  // Built-in API key fallbacks if user didn't supply custom key
  let resolvedKey = apiKey;
  if (!resolvedKey) {
    if (provider === "mistral") resolvedKey = process.env.MISTRAL_API_KEY;
    if (provider === "groq") resolvedKey = process.env.GROQ_API_KEY;
    if (provider === "deepseek") resolvedKey = process.env.DEEPSEEK_API_KEY;
    if (provider === "openai") resolvedKey = process.env.OPENAI_API_KEY;
    if (provider === "openrouter") resolvedKey = process.env.OPENROUTER_API_KEY;
    if (provider === "cohere") resolvedKey = process.env.COHERE_API_KEY;
    if (provider === "perplexity") resolvedKey = process.env.PERPLEXITY_API_KEY;
  }

  if (!resolvedKey) {
    throw new Error(`No API key available for ${provider}. Please add your key in Settings.`);
  }

  const formattedMessages = [
    { role: "system", content: systemPrompt },
    ...messages.map((m, idx) => {
      const isLastUser = (idx === messages.length - 1 || idx === messages.map(x => x.role).lastIndexOf("user")) && m.role !== "assistant";
      if (isLastUser && images && images.length > 0) {
        const parts = [{ type: "text", text: m.content || "Analyze this image." }];
        for (const img of images) {
          if (img.base64 && img.mimeType) {
            parts.push({
              type: "image_url",
              image_url: { url: `data:${img.mimeType};base64,${img.base64}` }
            });
          } else if (img.url) {
            parts.push({
              type: "image_url",
              image_url: { url: img.url }
            });
          }
        }
        return {
          role: "user",
          content: parts
        };
      }

      return {
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content || ""
      };
    })
  ];

  const headers = {
    Authorization: `Bearer ${resolvedKey.trim()}`,
    "Content-Type": "application/json"
  };

  if (provider === "openrouter") {
    headers["HTTP-Referer"] = "https://parsu.app";
    headers["X-Title"] = "Parsu AI";
  }

  // Resolve legacy or paywalled Mistral models to open-mistral-nemo (supported on free tier)
  let resolvedModelId = modelId;
  if (provider === "mistral") {
    if (!resolvedModelId || resolvedModelId === "mistral-small-latest" || resolvedModelId === "mistral-small") {
      resolvedModelId = "open-mistral-nemo";
    }
  }

  let response;
  let usedModel = resolvedModelId;

  // Helper to make streaming or non-streaming chat completions request
  const attemptChatRequest = async (targetModel, useStream = true, customTimeout = 14000) => {
    return await axios({
      method: "post",
      url: `${targetUrl}/chat/completions`,
      headers,
      data: {
        model: targetModel,
        messages: formattedMessages,
        stream: useStream,
        temperature: 0.7
      },
      responseType: useStream ? "stream" : "json",
      timeout: customTimeout
    });
  };

  try {
    response = await attemptChatRequest(usedModel, true, 14000);
  } catch (err) {
    const status = err.response?.status;
    const isTimeout = err.code === "ECONNABORTED" || /timeout/i.test(err.message);

    // 1. Mistral 429 rate limit fallback
    if (provider === "mistral" && usedModel !== "open-mistral-nemo" && status === 429) {
      console.warn("⚠️ Mistral model was rate limited (429), retrying with open-mistral-nemo...");
      usedModel = "open-mistral-nemo";
      response = await attemptChatRequest(usedModel, true, 14000);
    }
    // 2. NVIDIA model failure (404, 410, timeout, function not found, or unroutable model)
    else if (provider === "nvidia" && usedModel !== "meta/llama-3.2-11b-vision-instruct" && (status === 404 || status === 410 || isTimeout || !status)) {
      console.warn(`⚠️ NVIDIA model [${usedModel}] failed (${status || err.code || 'timeout'}), automatically falling back to active meta/llama-3.2-11b-vision-instruct...`);
      usedModel = "meta/llama-3.2-11b-vision-instruct";
      response = await attemptChatRequest(usedModel, true, 14000);
    }
    // 3. Fallback to non-streaming for custom/local endpoints that don't support SSE
    else if (!isTimeout) {
      try {
        console.warn(`⚠️ Streaming request failed (${status}), attempting non-streaming fallback for [${usedModel}]...`);
        const nonStreamRes = await attemptChatRequest(usedModel, false, 8000);
        const text = nonStreamRes.data?.choices?.[0]?.message?.content || 
                     nonStreamRes.data?.choices?.[0]?.text || "";
        if (text) {
          if (onChunk) onChunk(text);
          return text;
        }
      } catch (nonStreamErr) {
        throw err;
      }
      throw err;
    } else {
      throw err;
    }
  }

  let fullText = "";
  return new Promise((resolve, reject) => {
    response.data.on("data", (chunk) => {
      const lines = chunk.toString().split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("data: ")) {
          const dataStr = trimmed.replace("data: ", "").trim();
          if (dataStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(dataStr);
            const delta = parsed.choices?.[0]?.delta?.content || 
                          parsed.choices?.[0]?.delta?.reasoning_content || 
                          parsed.choices?.[0]?.delta?.text || 
                          parsed.choices?.[0]?.text || "";
            if (delta) {
              fullText += delta;
              onChunk(delta);
            }
          } catch (e) {}
        }
      }
    });

    response.data.on("end", () => resolve(fullText));
    response.data.on("error", (err) => reject(err));
  });
}
