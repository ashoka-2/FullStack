// ============================================================
// SUGGESTIONS SERVICE — REDIS-CACHED DAILY MARKET & NEWS SUGGESTIONS
// ============================================================
// Features:
//   → Daily market, tech, startup, and AI updates
//   → Cached in Redis once per day (Key: parsu:suggestions:daily:YYYY-MM-DD)
//   → 24-hour TTL: First user of the day triggers generation,
//     all subsequent users read directly from Redis (0 AI tokens / 0 extra API cost!)
//   → Robust fallback to in-memory cache and market defaults if Redis/Tavily is offline
// ============================================================

import { tavily } from "@tavily/core";
import redisClient, { isRedisReady } from "../../config/redis.js";

// High-quality static fallback for market & tech suggestions
const DEFAULT_SUGGESTIONS = {
  pills: ["Market Movers", "AI Breakthroughs", "Startups", "FinTech", "Dev Ecosystem"],
  queries: [
    "Summarize top technology and market news today",
    "What are the major AI agent breakthroughs this week?",
    "How are current market interest rates impacting tech startups?",
    "Explain the latest trends in full-stack web and cloud architectures",
    "Find the top emerging open-source developer tools in 2026"
  ],
  topics: [
    { label: "Global Tech & Market Movements", desc: "Market · Today", iconType: "global" },
    { label: "Autonomous AI Agents & Workflows", desc: "AI · Trending", iconType: "robot" },
    { label: "Startup Venture Capital & Seed Rounds", desc: "Business · Live", iconType: "file" },
    { label: "Cloud Native & Microservice Innovations", desc: "Dev · 2h ago", iconType: "magic" }
  ]
};

// In-memory fallback if Redis is temporarily offline
let inMemoryDailyCache = {
  date: null,
  data: null
};

/**
 * Returns today's UTC date key: YYYY-MM-DD
 */
function getTodayDateKey() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Generates fresh daily market and tech suggestions via Tavily
 */
async function fetchDailyNewsFromWeb() {
  try {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
      console.warn("⚠️ [Suggestions] TAVILY_API_KEY not configured. Using market defaults.");
      return DEFAULT_SUGGESTIONS;
    }

    const tvly = tavily({ apiKey });
    const searchResponse = await tvly.search(
      "Top tech market movements AI breakthroughs startup funding and technology headlines today",
      { searchDepth: "basic", includeImages: false, maxResults: 5 }
    );

    const results = (searchResponse?.results || []).slice(0, 5);
    if (results.length === 0) return DEFAULT_SUGGESTIONS;

    const queries = [
      `Summarize today's major market shifts: ${results[0]?.title || "Latest tech update"}`,
      `Explain the impact of ${results[1]?.title?.substring(0, 45) || "recent tech developments"}`,
      "What are the key startup and AI funding rounds happening today?",
      "Analyze the current market sentiment and tech earnings shifts",
      "Search for the most discussed developer tools and software updates today"
    ];

    const topics = results.slice(0, 4).map((result, i) => {
      let domainName = "market";
      try {
        domainName = new URL(result.url).hostname.replace(/^www\./, "");
      } catch (e) {
        domainName = "news";
      }

      const cleanTitle = (result.title || "Market Update").trim();
      return {
        label: cleanTitle.length > 58 ? cleanTitle.substring(0, 58) + "..." : cleanTitle,
        desc: `Market · ${domainName}`,
        iconType: ["global", "magic", "file", "robot"][i % 4],
        url: result.url || ""
      };
    });

    return {
      pills: ["Market Movers", "AI Breakthroughs", "Startups", "FinTech", "Dev Ecosystem"],
      queries,
      topics,
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.warn("⚠️ [Suggestions] Failed to fetch live news from Tavily, using fallback:", error.message);
    return DEFAULT_SUGGESTIONS;
  }
}

/**
 * Fetches daily suggestions with Redis caching (24h TTL)
 */
async function getDailyCachedSuggestions() {
  const today = getTodayDateKey();
  const redisKey = `parsu:suggestions:daily:${today}`;

  // 1. Check Redis Cache
  if (redisClient && isRedisReady()) {
    try {
      const cached = await redisClient.get(redisKey);
      if (cached) {
        console.log(`⚡ [Redis Cache HIT] Serving daily market suggestions for ${today} (Key: ${redisKey}, 0 AI tokens spent)`);
        const parsed = JSON.parse(cached);
        inMemoryDailyCache = { date: today, data: parsed };
        return parsed;
      }
    } catch (err) {
      console.warn("⚠️ [Redis] Error reading suggestions cache:", err.message);
    }
  }

  // 2. Check In-Memory Cache (fallback if Redis is offline)
  if (inMemoryDailyCache.date === today && inMemoryDailyCache.data) {
    console.log(`⚡ [Memory Cache HIT] Serving daily market suggestions for ${today} from local memory.`);
    return inMemoryDailyCache.data;
  }

  // 3. Cache Miss: First user of the day triggers generation
  console.log(`🔄 [Redis Cache MISS] Generating fresh daily market & news suggestions for ${today}...`);
  const freshSuggestions = await fetchDailyNewsFromWeb();
  freshSuggestions.date = today;

  // 4. Store in Redis with 24 hours TTL (86400 seconds)
  if (redisClient && isRedisReady()) {
    try {
      await redisClient.set(redisKey, JSON.stringify(freshSuggestions), "EX", 86400);
      console.log(`✅ [Redis Cache SET] Stored daily market suggestions in Redis (Key: ${redisKey}, TTL: 86400s)`);
    } catch (err) {
      console.warn("⚠️ [Redis] Error writing suggestions to cache:", err.message);
    }
  }

  // 5. Store in In-Memory Cache as secondary backup
  inMemoryDailyCache = {
    date: today,
    data: freshSuggestions
  };

  return freshSuggestions;
}

/**
 * Public entrypoint called by chat controller
 */
export async function generateSuggestions(messages = []) {
  return await getDailyCachedSuggestions();
}
