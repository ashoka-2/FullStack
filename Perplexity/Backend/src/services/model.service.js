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
    category: "general"
  },
  {
    id: "gemini-flash-latest",
    name: "Gemini Flash Latest",
    provider: "gemini",
    badge: "High Speed",
    description: "Ultra-fast generation with long context window",
    isBuiltIn: true,
    category: "fast"
  },
  {
    id: "gemini-pro-latest",
    name: "Gemini Pro Latest",
    provider: "gemini",
    badge: "Reasoning",
    description: "Complex reasoning, coding & analysis",
    isBuiltIn: true,
    category: "reasoning"
  },
  {
    id: "open-mistral-nemo",
    name: "Mistral NeMo",
    provider: "mistral",
    badge: "128k Context",
    description: "Mistral's powerful 12B reasoning model (free tier supported)",
    isBuiltIn: true,
    category: "fast"
  },
  {
    id: "codestral-latest",
    name: "Codestral",
    provider: "mistral",
    badge: "Coding",
    description: "Mistral's code generation & software reasoning specialist",
    isBuiltIn: true,
    category: "reasoning"
  },
  {
    id: "llama-3.3-70b-versatile",
    name: "Llama 3.3 70B",
    provider: "groq",
    badge: "Blazing Fast",
    description: "Meta Llama 3.3 running on ultra-fast Groq LPU",
    isBuiltIn: true,
    category: "fast"
  },
  {
    id: "deepseek-chat",
    name: "DeepSeek V3",
    provider: "deepseek",
    badge: "Code & Chat",
    description: "State-of-the-art general purpose chat and coding",
    isBuiltIn: true,
    category: "general"
  },
  {
    id: "deepseek-reasoner",
    name: "DeepSeek R1",
    provider: "deepseek",
    badge: "Chain of Thought",
    description: "Deep reasoning model with internal thought process",
    isBuiltIn: true,
    category: "reasoning"
  }
];

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
      headers["HTTP-Referer"] = "https://perplexity-clone.com";
      headers["X-Title"] = "Perplexity Clone";
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
  onChunk = () => {}
}) {
  // Format message history
  const systemPrompt = `You are a world-class AI search assistant (like Perplexity AI). Provide comprehensive, accurate, well-structured, objective, and beautifully formatted markdown answers. Include clear headings, bullet points, and code blocks when applicable.`;

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
    for (const msg of messages) {
      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content || "" }]
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

    const claudeMessages = messages.map(m => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content || ""
    }));

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
  }

  if (!resolvedKey) {
    throw new Error(`No API key available for ${provider}. Please add your key in Settings.`);
  }

  const formattedMessages = [
    { role: "system", content: systemPrompt },
    ...messages.map(m => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content || ""
    }))
  ];

  const headers = {
    Authorization: `Bearer ${resolvedKey.trim()}`,
    "Content-Type": "application/json"
  };

  if (provider === "openrouter") {
    headers["HTTP-Referer"] = "https://perplexity-clone.com";
    headers["X-Title"] = "Perplexity Clone";
  }

  // Resolve legacy or paywalled Mistral models to open-mistral-nemo (supported on free tier)
  let resolvedModelId = modelId;
  if (provider === "mistral") {
    if (!resolvedModelId || resolvedModelId === "mistral-small-latest" || resolvedModelId === "mistral-small") {
      resolvedModelId = "open-mistral-nemo";
    }
  }

  let response;
  try {
    response = await axios({
      method: "post",
      url: `${targetUrl}/chat/completions`,
      headers,
      data: {
        model: resolvedModelId,
        messages: formattedMessages,
        stream: true,
        temperature: 0.7
      },
      responseType: "stream"
    });
  } catch (err) {
    // If Mistral rejected with 429 Rate limit exceeded on a commercial model, automatically fallback to open-mistral-nemo
    if (provider === "mistral" && resolvedModelId !== "open-mistral-nemo" && err.response?.status === 429) {
      console.warn("⚠️ Mistral model was rate limited (429), automatically retrying with open-mistral-nemo...");
      response = await axios({
        method: "post",
        url: `${targetUrl}/chat/completions`,
        headers,
        data: {
          model: "open-mistral-nemo",
          messages: formattedMessages,
          stream: true,
          temperature: 0.7
        },
        responseType: "stream"
      });
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
            const delta = parsed.choices?.[0]?.delta?.content || "";
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
