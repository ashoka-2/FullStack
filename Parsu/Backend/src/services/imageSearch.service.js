import axios from "axios";
import { tavily } from "@tavily/core";

let googleCseCooldownUntil = 0;
let tavilyCooldownUntil = 0;

/**
 * Image Search Service
 * Searches web images using:
 * 1. Google Custom Search Engine (if GOOGLE_CSE_API_KEY & GOOGLE_CSE_ID configured in .env)
 * 2. Tavily Image Search (if TAVILY_API_KEY configured)
 * 3. Wikimedia Commons / Openverse Public APIs (zero-key fallback)
 */
async function searchWebImagesUncached(query, limit = 6) {
    const q = String(query || "").trim().slice(0, 180);
    if (!q) return [];
    const safeLimit = Math.max(1, Math.min(Number(limit) || 6, 10));

    // 1. Google Custom Search API (Images)
    const googleApiKey = process.env.GOOGLE_CSE_API_KEY || process.env.GOOGLE_SEARCH_API_KEY;
    const googleCx = process.env.GOOGLE_CSE_ID || process.env.GOOGLE_SEARCH_CX;

    if (googleApiKey && googleCx && Date.now() >= googleCseCooldownUntil) {
        try {
            const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(q)}&searchType=image&key=${googleApiKey}&cx=${googleCx}&num=${safeLimit}&safe=active`;
            const resp = await axios.get(url, { timeout: 7000 });
            if (resp.data?.items && resp.data.items.length > 0) {
                return resp.data.items.map(item => ({
                    title: item.title,
                    url: item.link,
                    thumbnail: item.image?.thumbnailLink || item.link,
                    source: item.displayLink || "Google Search",
                    contextUrl: item.image?.contextLink || item.link
                }));
            }
        } catch (err) {
            console.warn("⚠️ Google CSE Image Search error, falling back:", err.message);
            if (err.response?.status === 429) googleCseCooldownUntil = Date.now() + 60_000;
        }
    }

    // 2. Tavily Image Search
    const tavilyKey = process.env.TAVILY_API_KEY;
    if (tavilyKey && Date.now() >= tavilyCooldownUntil) {
        try {
            const tvly = new tavily(tavilyKey);
            const searchData = await tvly.search(q, {
                searchDepth: "basic",
                maxResults: safeLimit,
                includeImages: true
            });

            if (Array.isArray(searchData.images) && searchData.images.length > 0) {
                return searchData.images.slice(0, safeLimit).map((imgUrl, idx) => ({
                    title: `${q} - Result ${idx + 1}`,
                    url: typeof imgUrl === "string" ? imgUrl : (imgUrl.url || imgUrl),
                    thumbnail: typeof imgUrl === "string" ? imgUrl : (imgUrl.url || imgUrl),
                    source: "Web Search"
                }));
            }
        } catch (err) {
            console.warn("⚠️ Tavily image search error, falling back:", err.message);
            if (err.response?.status === 429 || /excessive requests|rate.?limit/i.test(err.message || "")) {
                tavilyCooldownUntil = Date.now() + 60_000;
            }
        }
    }

    // 3. Wikimedia Commons Public Image API (Zero-API key fallback)
    try {
        const wikiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(q)}&gsrlimit=${safeLimit}&prop=imageinfo&iiprop=url|mime&format=json&origin=*`;
        const wikiResp = await axios.get(wikiUrl, { 
            headers: { "User-Agent": "ParsuAssistant/1.0 (https://github.com/parsu; parsuapp@example.com)" },
            timeout: 6000 
        });
        const pages = wikiResp.data?.query?.pages;
        if (pages && Object.keys(pages).length > 0) {
            const items = Object.values(pages)
                .map(page => {
                    const info = page.imageinfo?.[0];
                    if (!info || !info.url) return null;
                    // Skip SVGs or unsupported files
                    if (info.mime && !info.mime.startsWith("image/")) return null;
                    return {
                        title: page.title?.replace(/^File:/i, "").replace(/\.[^/.]+$/, "") || q,
                        url: info.url,
                        thumbnail: info.thumburl || info.url,
                        source: "Wikimedia Commons"
                    };
                })
                .filter(Boolean);

            if (items.length > 0) return items.slice(0, safeLimit);
        }
    } catch (err) {
        console.warn("⚠️ Wikimedia image search error:", err.message);
    }

    // Return no results instead of showing unrelated stock imagery as if it matched the search.
    return [];
}

const imageCache = new Map();
const pendingImageSearches = new Map();
const imageSearchQueue = [];
let activeImageSearches = 0;
const IMAGE_CACHE_TTL = 15 * 60 * 1000;
const EMPTY_IMAGE_CACHE_TTL = 60 * 1000;

function drainImageSearchQueue() {
    while (activeImageSearches < 2 && imageSearchQueue.length) {
        const task = imageSearchQueue.shift();
        activeImageSearches += 1;
        Promise.resolve()
            .then(task.run)
            .then(task.resolve, task.reject)
            .finally(() => {
                activeImageSearches -= 1;
                drainImageSearchQueue();
            });
    }
}

/** Cache duplicate searches and cap upstream concurrency to avoid CSE/Tavily bursts. */
export async function searchWebImages(query, limit = 6) {
    const q = String(query || "").trim().replace(/\s+/g, " ").slice(0, 180);
    if (!q) return [];
    const safeLimit = Math.max(1, Math.min(Number(limit) || 6, 10));
    const key = `${q.toLocaleLowerCase()}::${safeLimit}`;
    const cached = imageCache.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.images;
    if (cached) imageCache.delete(key);

    let pending = pendingImageSearches.get(key);
    if (!pending) {
        pending = new Promise((resolve, reject) => {
            imageSearchQueue.push({
                run: () => searchWebImagesUncached(q, safeLimit),
                resolve,
                reject
            });
            drainImageSearchQueue();
        }).then(images => {
            const ttl = images.length ? IMAGE_CACHE_TTL : EMPTY_IMAGE_CACHE_TTL;
            imageCache.set(key, { images, expiresAt: Date.now() + ttl });
            if (imageCache.size > 500) imageCache.delete(imageCache.keys().next().value);
            return images;
        }).finally(() => pendingImageSearches.delete(key));
        pendingImageSearches.set(key, pending);
    }
    return pending;
}

export default searchWebImages;

