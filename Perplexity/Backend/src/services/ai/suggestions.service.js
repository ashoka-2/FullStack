// ============================================================
// SUGGESTIONS SERVICE — HOME PAGE KE LIYE LIVE NEWS
// ============================================================
// Kaam:
//   → User ke home page pe trending tech news dikhata hai
//   → Tavily Search API se real-time news fetch karta hai
//   → Smart caching: Har 6 ghante mein sirf ek API call
//     (Baaki time cached data → near-zero API cost!)
//   → Agar Tavily fail ho → static default suggestions bhej do
// ============================================================

import { tavily } from "@tavily/core";

// Static fallback — Internet/Tavily fail ho toh yeh dikhao
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

// In-memory cache — Server restart pe reset hoga (Free tier ke liye acceptable)
let cachedNewsSuggestions = null;
let lastNewsFetchTime = 0;
const CACHE_DURATION_MS = 6 * 60 * 60 * 1000; // 6 ghante

// Tavily se live tech news fetch karo, 6 ghante cache mein rakho
async function getLiveDailyNewsSuggestions() {
  const now = Date.now();

  // Cache hit → purana data wapas bhejo, Tavily mat bulao
  if (cachedNewsSuggestions && (now - lastNewsFetchTime < CACHE_DURATION_MS)) {
    return cachedNewsSuggestions;
  }

  try {
    const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });

    // Tavily se aaj ki top 4 trending tech news maango
    const searchResponse = await tvly.search(
      "Top 4 latest trending technology news headlines today",
      { searchDepth: "basic", includeImages: false }
    );

    const results = searchResponse.results.slice(0, 4);
    if (results.length === 0) return DEFAULT_SUGGESTIONS;

    // News headlines ko suggestion card format mein convert karo
    cachedNewsSuggestions = {
      pills: ["Trending Tech", "Startups", "AI Tools", "Gadgets"],
      queries: [
        `Summarize this: ${results[0]?.title || "Latest tech update"}`,
        `Tell me more about ${results[1]?.title?.substring(0, 30) || "tech market"}...`,
        "What are the top 5 programming news today?",
        "Explain the latest tech market shifts",
        "Search for best developer tools 2026"
      ],
      topics: results.map((result, i) => {
        let domainName = "source";
        try { domainName = new URL(result.url).hostname.replace('www.', ''); } catch (e) {}
        return {
          label: result.title.length > 55
            ? result.title.substring(0, 55) + "..."
            : result.title,
          desc: `News · ${domainName}`,
          iconType: ["global", "file", "magic", "compass"][i % 4]
        };
      })
    };

    lastNewsFetchTime = now;
    console.log("📰 Fetched fresh live news successfully!");
    return cachedNewsSuggestions;

  } catch (error) {
    console.error("⚠️ Live news fetch failed, using static fallback:", error.message);
    return DEFAULT_SUGGESTIONS;
  }
}

// Controller yahan se call karta hai — chat context
// ignore karo, hamesha live news hi return karo (Mistral tokens bachao!)
export async function generateSuggestions(messages = []) {
  const logMsg = messages.length === 0
    ? "Empty chat → Returning live news suggestions."
    : "Active chat → Returning cached news (saving AI tokens).";
  console.log(`ℹ️ ${logMsg}`);

  return await getLiveDailyNewsSuggestions();
}
