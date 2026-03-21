import { tool } from "@langchain/core/tools";
import { tavily } from "@tavily/core";
import * as z from "zod";

// Tavily search engine ka client initialize kar rahe hain
const tvly = new tavily(process.env.TAVILY_API_KEY);

// LangChain tool jo internet pe search karne ke kaam aata hai
export const searchInternetTool = tool(
    async ({ query }) => {
      try {
        // Tavily se search karwa rahe hain, top 3 results utha rahe hain
        const data = await tvly.search(query, { searchDepth: "basic", maxResults: 3 });
        return data.results.map(r => `Title: ${r.title}\nDetails: ${r.content}`).join("\n\n");
      } catch (error) {
        // Agar internet search down hai toh fallback message bhej rahe hain
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
