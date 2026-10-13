/**
 * Parsu AI — ai.service.js (v2, faster + smarter)
 *
 * What changed vs v1
 *  1. REAL streaming. v1 waited for the whole answer, then fake-chunked it. Now the first token
 *     reaches the UI as soon as the model emits it, and tool calls are assembled from the stream.
 *  2. Intent router (regex, 0 ms, no extra LLM call). Detects: social post, map, trip, gallery/cards,
 *     app how-to, web search. Only the prompt modules that matter are sent, so the prompt is ~70% smaller.
 *  3. Social publishing is decisive:
 *       - connected account  -> post_to_social_media is FORCED on the first step (no deliberation),
 *       - not connected      -> instant templated reply ("couldn't upload", where to connect, manual steps),
 *       - mixed              -> posts to the connected ones and reports the rest.
 *     Duplicate tool calls are blocked, so a retry/fallback can never double-post.
 *  4. Map block appears ONLY when asked (or when the user says "yes" to a map offer). Enforced in the
 *     prompt AND by a streaming filter that strips any stray ```map block.
 *  5. Image handling: only the last 2 media messages are sent as pixels, downloads run in parallel with
 *     an LRU cache. Older images become a text placeholder (v1 re-downloaded every image every turn).
 *  6. Timeouts + fallback chain with first-token / idle watchdogs. Fallback never restarts a turn that
 *     already produced output, and never repeats a tool that already ran.
 *  7. Fixed v1 bug: getModelOverloadNotice was declared inside `if (hasImage) { }` so the text path
 *     crashed with a ReferenceError whenever all models failed.
 *
 * Optional new userContext fields (all safe to omit):
 *   connectedPlatforms : ['youtube','instagram', ...]  or [{platform:'youtube'}, ...]
 *   onEvent            : (e) => void   // {type:'tool_start'|'tool_end', name, ok}  for live UI status
 *
 * v2.2 (after reading socialPublisher.service.js, socialMedia.tool.js, chat.controller.js)
 *   - Looks up the user's connected accounts itself (SocialConnection), incl. the Google->YouTube alias the publisher uses.
 *   - Social tool output is streamed to the user directly (it already contains ✅/❌ + live link): one LLM round trip less.
 *   - Media isolation: the tool's DB fallback reads the newest message with a file from ANY user/chat. This file now passes
 *     the media from the CURRENT chat explicitly and refuses to call the tool when the chat has none (set
 *     PARSU_TOOL_MEDIA_SCOPED=1 after you scope that query by chat, see parsu-fixes.md).
 *   - Never throws after an upload ran (the controller would retry the next model and post twice) + 90 s duplicate guard.
 *   - TikTok (not implemented in the publisher) is declined up front; X/LinkedIn are caption-only and the user is told.
 *   - Prefetched Tavily results (userContext.webSearchContext) are attached to the last user message again; when they
 *     exist the searchInternet tool is not bound (no second search).
 *
 * Merged from the other agent's edit (v2.1)
 *   apiKey       : user's own Gemini key (BYOK). Used first, model from GEMINI_BYOK_MODEL (default gemini-3.6-flash),
 *                  apiVersion v1beta, maxRetries 2, temperature 0 for text. Instances are cached per key.
 *   throwOnError : when true the function throws instead of returning a friendly error string.
 *                  With a BYOK key it also skips the shared fallback models, so a bad/expired key surfaces to the caller.
 */

import { HumanMessage, SystemMessage, AIMessage, ToolMessage } from "@langchain/core/messages";
import axios from "axios";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { geminiChatPrimary, geminiVision1, geminiVision2, geminiChatFallback, mistralModel } from "./models.js";
import { searchInternetTool } from "../Tools/search.tool.js";
import { createEmailTool } from "../Tools/email.tool.js";
import { postToSocialMediaTool } from "../Tools/socialMedia.tool.js";

/* ───────────────────────────── config ───────────────────────────── */
const CFG = {
  historyLimit: 16,        // messages kept
  oldMsgChars: 1200,       // truncate older text messages
  visionWindow: 2,         // only the latest N media messages are sent as real images
  imageTimeoutMs: 8000,
  imageMaxBytes: 8 * 1024 * 1024,
  imageCacheMax: 40,
  firstTokenMs: 20000,     // abort a model that never starts
  idleMs: 25000,           // abort a stream that stalls
  toolTimeoutMs: { post_to_social_media: 180000, post_to_instagram: 180000, searchInternet: 20000, emailTool: 30000, default: 45000 },
  toolResultChars: 6000,
  maxIter: { low: 3, medium: 4, high: 5 },
  docChars: 12000,
  memoryFacts: 25,
  byokModel: process.env.GEMINI_BYOK_MODEL || "gemini-3.6-flash",
  dupWindowMs: 90000,
  searchCtxChars: 9000,
  toolMediaScoped: process.env.PARSU_TOOL_MEDIA_SCOPED === "1",
};
const SOCIAL_NAMES = new Set(["post_to_social_media", "post_to_instagram"]);
const MEDIA_USERS = new Set(["instagram", "facebook", "pinterest", "youtube", "tiktok", "all_connected", "all"]);
const PUBLISHABLE = new Set(["instagram", "facebook", "twitter", "linkedin", "pinterest", "youtube"]);
const recentPosts = new Map(); // idempotency: key -> { t, content }

const byokCache = new Map();
function getByokModel(apiKey, vision, modelId) {
  const name = modelId && /gemini/i.test(modelId) ? modelId : CFG.byokModel;
  const k = `${vision ? "v" : "t"}:${name}:${apiKey}`;
  if (!byokCache.has(k)) {
    byokCache.set(k, new ChatGoogleGenerativeAI({
      model: name, apiKey, apiVersion: "v1beta", maxRetries: 2, ...(vision ? {} : { temperature: 0 }),
    }));
    if (byokCache.size > 50) byokCache.delete(byokCache.keys().next().value);
  }
  return byokCache.get(k);
}

/* ───────────────────────────── helpers ───────────────────────────── */
const PLATFORM_LABEL = { youtube: "YouTube", instagram: "Instagram", facebook: "Facebook", twitter: "Twitter / X", linkedin: "LinkedIn", pinterest: "Pinterest", tiktok: "TikTok" };
const ALL_PLATFORMS = Object.keys(PLATFORM_LABEL);

const getCurrentTimeContext = () =>
  new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });

const getIstIso = () => new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 19) + "+05:30";

const textOf = (c) =>
  typeof c === "string" ? c : Array.isArray(c) ? c.map((p) => (typeof p === "string" ? p : p?.text || "")).join("") : c ? JSON.stringify(c) : "";

const sleepless = (ms, label, p) => {
  let t;
  return Promise.race([p, new Promise((_, rej) => { t = setTimeout(() => rej(new Error(`${label} timed out after ${Math.round(ms / 1000)}s`)), ms); })]).finally(() => clearTimeout(t));
};

function getModelOverloadNotice(error, modelName = "Gemini") {
  const msg = error?.message || String(error);
  if (/overload|429|503|quota|resource.*exhaust|high traffic|rate limit|failed to parse stream|capacity|temporarily unavailable|timed out|abort/i.test(msg)) {
    return `${modelName} is experiencing high traffic right now and may take a moment to respond. Please try again in a few moments, or select another model from the dropdown.`;
  }
  return "I'm having trouble connecting to the AI services right now. Please try your request again in a few moments.";
}

const mediaOf = (msg) => {
  if (Array.isArray(msg?.files) && msg.files.length) return msg.files.filter((f) => f?.url);
  return msg?.file?.url ? [msg.file] : [];
};
const isVideo = (m) => m.fileType === "video" || m.mimetype?.startsWith("video/") || /\.(mp4|mov|webm|mkv)(\?|$)/i.test(m.url || "");

/** newest media in the last few messages of THIS conversation */
function recentMedia(messages) {
  for (let i = messages.length - 1; i >= Math.max(0, messages.length - 6); i--) {
    if (messages[i].role === "ai") continue;
    const list = mediaOf(messages[i]);
    if (list.length) return list;
  }
  return [];
}

let socialModelPromise;
const loadSocialModel = () =>
  (socialModelPromise ||= import("../../models/social.model.js").then((m) => m.default || m).catch(() => null));

/** Connected platforms: given by the controller, else read from Mongo (same alias rule as the publisher). null = unknown. */
async function resolveConnected(userContext) {
  const given = normPlatforms(userContext?.connectedPlatforms ?? userContext?.socialConnections);
  if (given) return given;
  const userId = userContext?._id?.toString?.() || userContext?.id;
  if (!userId) return null;
  try {
    const Social = await loadSocialModel();
    if (!Social) return null;
    const rows = await sleepless(2500, "connections", Social.find({ user: userId, isConnected: true }).select("platform scopes").lean());
    const set = new Set(rows.map((r) => String(r.platform).toLowerCase()));
    if (!set.has("youtube") && rows.some((r) => String(r.platform).toLowerCase() === "google" || (r.scopes || []).some((x) => /youtube/i.test(x)))) set.add("youtube");
    return [...set].filter((p) => PLATFORM_LABEL[p]);
  } catch { return null; }
}

/* ───────────────────────────── intent router ───────────────────────────── */
const PLATFORM_RX = {
  youtube: /\b(youtube|youtub|yt|shorts?)\b/i,
  instagram: /\b(instagram|insta|ig|reels?)\b/i,
  facebook: /\b(facebook|fb)\b/i,
  twitter: /\b(twitter|tweets?|x\.com)\b/i,
  linkedin: /\blinked ?in\b/i,
  pinterest: /\bpinterest|pins?\b/i,
  tiktok: /\btik ?tok\b/i,
};
const ALL_RX = /\b(all|every|each)\b.{0,25}\b(accounts?|platforms?|socials?|networks?|apps?)\b|\beverywhere\b|\ball connected\b|\bsocial media\b/i;
const POST_VERB = /\b(upload|post|publish|share|schedule|put|release|send)\b/i;
const HOWTO = /\b(how (do|to|can|should|would)|steps|guide|tutorial|teach)\b/i;
const MAP_RX = /\b(maps?|directions?|route|navigate|navigation|where is|show (me )?(the )?(way|path)|google maps)\b/i;
const YES_RX = /^\s*(yes|yeah|yep|yup|ok(ay)?|sure|please|do it|go ahead|show( it| me| map)?|y)\b/i;
const MAP_OFFER_RX = /(show|see|view|open|display).{0,40}\bmap\b|\bmap\b.{0,40}(directions?|route|mark)/i;
const TRIP_RX = /\b(trip|itinerary|road ?trip|tour|travel plan|plan.{0,20}(visit|travel|journey)|places to (visit|see)|weekend (getaway|plan)|vacation|holiday)\b/i;
const VISUAL_RX = /\b(show|see|display|give|send)\b.{0,40}\b(images?|photos?|pictures?|pics?)\b|\b(images?|photos?|pictures?|pics?) of\b|\bwith (its |their |the )?(details|uses|photos?|images?)\b/i;
const APP_RX = /\b(parsu|settings?|connect|api key|byok|memory|mascot|voice|model|library|social hub|account)\b/i;
const FRESH_RX = /\b(latest|today|tonight|yesterday|news|current|right now|price|stock|score|weather|live|who is|who won|release date|202\d)\b/i;

function normPlatforms(list) {
  if (!Array.isArray(list)) return null;
  const out = new Set();
  for (const p of list) {
    let n = String(typeof p === "string" ? p : p?.platform || p?.name || "").toLowerCase();
    if (n === "x") n = "twitter";
    if (PLATFORM_LABEL[n]) out.add(n);
  }
  return [...out];
}

function detectIntent(messages, userContext) {
  const lastIdx = messages.map((m) => m.role).lastIndexOf("user");
  const last = messages[lastIdx] || messages[messages.length - 1] || {};
  const text = String(last.content || "");
  const prevAi = [...messages].slice(0, lastIdx).reverse().find((m) => m.role === "ai");

  const platforms = ALL_PLATFORMS.filter((p) => PLATFORM_RX[p].test(text));
  const wantsAll = ALL_RX.test(text);
  const recent = messages.slice(-6);
  const hasMedia = recent.some((m) => m.role !== "ai" && mediaOf(m).length > 0);
  const post = POST_VERB.test(text) && (platforms.length > 0 || wantsAll);
  const asksHowTo = HOWTO.test(text);

  const mapAsked = MAP_RX.test(text);
  const mapFollowUp = !!prevAi && MAP_OFFER_RX.test(String(prevAi.content || "")) && YES_RX.test(text);
  const wantsMap = (mapAsked || mapFollowUp) && !post;
  const trip = TRIP_RX.test(text) || (mapFollowUp && !TRIP_RX.test(text) && /trip|itinerary|route/i.test(String(prevAi?.content || "")));

  return {
    text, post, platforms, wantsAll, hasMedia, asksHowTo,
    wantsMap, trip: trip && !post,
    visual: VISUAL_RX.test(text) && !post,
    appHelp: asksHowTo && APP_RX.test(text) && !post ? true : (/where (can|do) i (find|change)|how do i (connect|add|change|set)/i.test(text) && APP_RX.test(text)),
    fresh: FRESH_RX.test(text),
  };
}

/* ───────────────────────────── manual steps (used only if NOT connected) ───────────────────────────── */
const MANUAL_STEPS = {
  youtube: [
    "Sign in at youtube.com with a Google account (no account yet? create one at accounts.google.com).",
    "Click your profile picture → **Create a channel**, then choose a channel name and handle.",
    "Click the **Create** (camera +) button → **Upload video** and pick your file. For Shorts, use a vertical video up to 3 minutes.",
    "Add a title, description and thumbnail, choose the audience (made for kids or not), then pick **Public / Unlisted / Private** or **Schedule**.",
    "Click **Publish** and copy the share link.",
  ],
  instagram: ["Open Instagram → tap **+** → choose **Reel** or **Post**.", "Select your media, add caption and hashtags.", "Tap **Share**."],
  facebook: ["Open your Facebook page or profile → **Create post** / **Reel**.", "Add your media and caption.", "Click **Post**."],
  twitter: ["Open X → **Post**.", "Attach media (up to 4 images or 1 video) and write your text.", "Click **Post**."],
  linkedin: ["Open LinkedIn → **Start a post**.", "Attach media and write your text.", "Click **Post**."],
  pinterest: ["Open Pinterest → **Create → Pin**.", "Upload media, add title, description and a board.", "Click **Publish**."],
  tiktok: ["Open TikTok → **+** → upload your video.", "Add caption and hashtags.", "Tap **Post**."],
};

function notConnectedReply(names, { wantsSteps }) {
  const labels = names.map((n) => PLATFORM_LABEL[n]);
  const list = labels.join(", ");
  let out = `❌ **Couldn't upload to ${list}.** ${names.length > 1 ? "Those accounts aren't" : "That account isn't"} connected yet.\n\n` +
    `👉 Connect ${names.length > 1 ? "them" : "it"} in **Social Hub** (/social-connections) and send the same request again. I'll upload it for you straight away.\n`;
  if (wantsSteps || names.length === 1) {
    for (const n of names.slice(0, 2)) {
      out += `\n**Upload manually to ${PLATFORM_LABEL[n]}:**\n` + MANUAL_STEPS[n].map((s, i) => `${i + 1}. ${s}`).join("\n") + "\n";
    }
  }
  return out;
}

/* ───────────────────────────── tools ───────────────────────────── */
function getTools(userContext, intent) {
  const social = postToSocialMediaTool(userContext);
  const map = { post_to_social_media: social, post_to_instagram: social };

  // Posting with media: expose ONLY the social tool so the model decides instantly.
  if (intent.post) return { tools: [social], map };

  const email = createEmailTool(userContext);
  map.emailTool = email;
  const tools = [email, social];
  if (userContext?.webSearch !== false && !userContext?.webSearchContext) {   // results already prefetched -> no 2nd search
    tools.unshift(searchInternetTool);
    map.searchInternet = searchInternetTool;
  }
  return { tools, map };
}

function bind(model, tools, forceName) {
  if (!tools.length) return model;
  if (forceName) {
    try { return model.bindTools(tools, { tool_choice: forceName }); } catch { /* provider cannot force, fall through */ }
  }
  return model.bindTools(tools);
}

/* ───────────────────────────── history + vision ───────────────────────────── */
const imageCache = new Map();
async function fetchImagePart(url) {
  if (imageCache.has(url)) { const v = imageCache.get(url); imageCache.delete(url); imageCache.set(url, v); return v; }
  const res = await axios.get(url, { responseType: "arraybuffer", timeout: CFG.imageTimeoutMs, maxContentLength: CFG.imageMaxBytes });
  const mime = (res.headers["content-type"] || "image/jpeg").split(";")[0];
  const part = { type: "image_url", image_url: { url: `data:${mime};base64,${Buffer.from(res.data).toString("base64")}` } };
  imageCache.set(url, part);
  if (imageCache.size > CFG.imageCacheMax) imageCache.delete(imageCache.keys().next().value);
  return part;
}

async function buildHistory(messages) {
  const slice = messages.slice(-CFG.historyLimit);
  // indexes of the most recent media-bearing user messages that get real pixels
  const withMedia = slice.map((m, i) => (m.role !== "ai" && mediaOf(m).length ? i : -1)).filter((i) => i >= 0);
  const visionIdx = new Set(withMedia.slice(-CFG.visionWindow));
  let hasImage = false;

  const history = await Promise.all(slice.map(async (msg, i) => {
    let content = String(msg.content || "");
    const isOld = i < slice.length - 6;
    if (isOld && content.length > CFG.oldMsgChars) content = content.slice(0, CFG.oldMsgChars) + " …";
    const media = mediaOf(msg);

    if (msg.role !== "ai" && media.length) {
      const parts = [{ type: "text", text: `[User attached ${media.length} file(s)]\n${content || "Analyze these files."}` }];
      const extra = await Promise.all(media.map(async (m) => {
        if (isVideo(m)) return { type: "text", text: `[Attached video: "${m.name || "video.mp4"}" | URL: ${m.url}]` };
        if (!visionIdx.has(i)) return { type: "text", text: `[Earlier image: ${m.name || "attachment"}]` };
        try { const p = await fetchImagePart(m.url); hasImage = true; return p; }
        catch { return { type: "text", text: `[Image could not be loaded: ${m.name || "attachment"}]` }; }
      }));
      content = [...parts, ...extra];
    }
    return msg.role === "ai" ? new AIMessage({ content }) : new HumanMessage({ content });
  }));

  return { history, hasImage };
}

/* ───────────────────────────── system prompt (modular, compact) ───────────────────────────── */
function buildSystemPrompt(userContext, intent, connected) {
  const level = String(userContext?.thinkingLevel || "low").toLowerCase();
  const depth = level === "medium"
    ? "Depth: balanced. Clear structure, short examples."
    : level === "high" || level === "hard"
      ? "Depth: deep. Check edge cases and give a thorough, well-organised answer."
      : "Depth: FAST. Answer first, no preamble, no filler, no restating the question.";

  const parts = [];
  parts.push(
`You are Parsu AI, a fast, decisive assistant connected to the user's accounts and tools.
Now (IST): ${getCurrentTimeContext()} | ISO: ${getIstIso()}
${depth}
Core rules: act immediately when intent is clear; never ask permission for something already requested; ask at most ONE short question, and only if a required detail is missing. Use clean Markdown with light emoji.`);

  const name = userContext?.userNickname, role = userContext?.userOccupation;
  if (name || role) parts.push(`User: ${[name && `name ${name}`, role && `role ${role}`].filter(Boolean).join(", ")}.`);
  if (userContext?.customInstructions?.trim()) parts.push(`USER'S MANDATORY CUSTOM INSTRUCTIONS (always follow):\n"${userContext.customInstructions.trim()}"`);
  if (userContext?.feedbackInstruction) parts.push(userContext.feedbackInstruction);
  if (userContext?.memoryContext) parts.push(userContext.memoryContext);

  const facts = (userContext?.memoryFacts || []).slice(0, CFG.memoryFacts);
  if (userContext?.memorySummary || facts.length) {
    parts.push(`USER MEMORY (recall naturally when relevant):\n${userContext.memorySummary ? `Summary: ${userContext.memorySummary}\n` : ""}${facts.map((f) => `• ${f}`).join("\n")}`);
  }
  if (userContext?.documentRagContext) parts.push(`ATTACHED DOCUMENT CONTEXT:\n${String(userContext.documentRagContext).slice(0, CFG.docChars)}`);

  parts.push(userContext?.webSearchContext
    ? "Live web search results are attached to the user's last message. Answer from them, do not search again, and end with a '### Sources & Citations' list of [Title](URL) links."
    : userContext?.webSearch !== false
      ? "Web search is ON: for news, prices, scores, weather or anything time-sensitive call 'searchInternet' once, then answer from the results and cite sources."
      : "Web search is OFF: answer from your own knowledge.");

  /* ── social publishing ── */
  if (intent.post) {
    const connLine = connected
      ? `Connected accounts: ${connected.length ? connected.map((p) => PLATFORM_LABEL[p]).join(", ") : "none"}.`
      : "Connected accounts: unknown (the tool verifies).";
    parts.push(
`SOCIAL PUBLISHING
Works now: YouTube (video/Shorts), Instagram (photo, Reel, carousel), Facebook (Page post), Pinterest (image pin). X/Twitter and LinkedIn publish the caption text only (no media upload yet). TikTok is NOT supported yet: leave it out.
${connLine}
1. The user wants the upload DONE. Call 'post_to_social_media' right now with the attached media. Never reply with manual steps or tutorials while the platform is connected.
2. platforms: the ones named by the user, using only connected ones. "all / everywhere / all my accounts" -> ['all_connected'].
3. postMode: 'together' for carousel/album/multiple images unless told otherwise; 'separately' for "one by one / individually".
4. Caption: user's own caption -> use exactly. "Improve my caption" -> polish it and add 3-5 trending hashtags. No caption or "write it yourself" -> look at the media and write an engaging platform-fit caption with 3-5 hashtags and emojis.
   YouTube: make the FIRST caption line a short title (under 90 chars, no hashtags), then the description. X: keep the caption under 250 characters. Always include hashtags.
5. Scheduling: a future date/time -> pass scheduledTime as ISO 8601 with +05:30 unless another zone is stated. YouTube uses native scheduled release.
6. The tool's reply (✅ link / ❌ reason / ⚠️ not connected) is shown to the user automatically. Do not restate it. Never claim an upload that the tool did not confirm.
7. If no media is attached and none is in the recent chat, ask the user to attach it, in one sentence.
8. Do NOT output a map block here.`);
  }

  /* ── maps (only when asked) ── */
  if (intent.wantsMap) {
    parts.push(
`MAP MODE (the user asked for a map/directions)
Reply briefly (distance, time, highways, food/fuel halts, 2-3 tips), then output ONE map block with every stop, in order, never dropping any:
\`\`\`map
from: Start
stops: Stop 1, Stop 2, Stop 3
to: Destination
mode: driving
\`\`\`
mode is driving, transit or walking. Omit 'stops:' for a 2-point route. A single place is just: \`\`\`map\\nPlace, City, Country\\n\`\`\`
If images of the place are requested also add: \`\`\`gallery\\nquery: Place Name\\n\`\`\``);
  } else if (intent.trip) {
    parts.push(
`TRIP PLANNING (map NOT requested)
Give the itinerary: day-wise plan, distances, travel time, halts, food, costs and tips. If the start or destination is missing, ask where they want to go in one line.
NEVER output a \`\`\`map block now. End with exactly this line: "🗺️ Want me to show this on a map with directions?"`);
  } else {
    parts.push("Never output a ```map block unless the user explicitly asks for a map or directions.");
  }

  /* ── visual cards ── */
  if (intent.visual) {
    parts.push(
`IMAGES & PRODUCT CARDS
Photos/pictures of something -> a short warm description plus:
\`\`\`gallery
query: subject
\`\`\`
Product recommendations "with details/uses" -> 3 to 5 items as a JSON array:
\`\`\`cards
[{"name":"…","imageQuery":"precise search words","description":"one sentence","uses":["…","…"]}]
\`\`\`
The frontend loads the real photos.`);
  }

  /* ── in-app guide ── */
  if (intent.appHelp) {
    parts.push(
`APP HELP
Answer in 2-4 friendly lines, then end with a guide trigger so the UI can walk the user there:
\`\`\`guide
<id>
\`\`\`
ids: add_gemini_key, connect_instagram, connect_facebook, view_memory, change_model, mascot_settings, voice_settings, plan_trip, view_library, post_social.`);
  }

  return parts.join("\n\n");
}

/* ───────────────────────────── output filter (strips stray map blocks) ───────────────────────────── */
function makeEmitter(onChunk, stripMap) {
  let buf = "", inMap = false, full = "";
  const out = (s) => { if (!s) return; full += s; onChunk?.(s); };
  return {
    push(piece) {
      if (!stripMap) return out(piece);
      buf += piece;
      for (;;) {
        if (inMap) {
          const i = buf.indexOf("```");
          if (i === -1) { buf = buf.slice(-2); return; }
          buf = buf.slice(i + 3); inMap = false; continue;
        }
        const i = buf.indexOf("```map");
        if (i !== -1) { out(buf.slice(0, i)); buf = buf.slice(i + 6); inMap = true; continue; }
        let hold = 0;
        for (let k = Math.min(5, buf.length); k > 0; k--) if ("```map".startsWith(buf.slice(-k))) { hold = k; break; }
        out(buf.slice(0, buf.length - hold)); buf = buf.slice(buf.length - hold);
        return;
      }
    },
    flush() { if (!inMap) out(buf); buf = ""; },
    get text() { return full; },
  };
}

/* ───────────────────────────── streaming + tool loop ───────────────────────────── */
async function streamOnce(model, messages, out) {
  const ac = new AbortController();
  let timer;
  const arm = (ms) => { clearTimeout(timer); timer = setTimeout(() => ac.abort(), ms); };
  let agg, produced = 0;
  arm(CFG.firstTokenMs);
  try {
    const stream = await model.stream(messages, { signal: ac.signal });
    for await (const chunk of stream) {
      arm(CFG.idleMs);
      agg = agg ? agg.concat(chunk) : chunk;
      const piece = textOf(chunk.content);
      if (piece) { produced += piece.length; out.push(piece); }
    }
  } catch (e) {
    e.partialLen = produced;
    throw e;
  } finally {
    clearTimeout(timer);
  }
  return agg || new AIMessage({ content: "" });
}

const userIdOf = (u) => u?._id?.toString?.() || u?.id || "anon";

function decorateSocial(content, ctx) {
  let extra = "";
  const nc = [...content.matchAll(/The (\w+) account is not connected/gi)].map((m) => m[1].toLowerCase()).filter((p) => MANUAL_STEPS[p]);
  if (nc.length) {
    extra += "\n\n" + [...new Set(nc)].slice(0, 2).map((p) => `**Upload manually to ${PLATFORM_LABEL[p]}:**\n` + MANUAL_STEPS[p].map((x, i) => `${i + 1}. ${x}`).join("\n")).join("\n\n");
  }
  if (/signup|no (youtube )?channel|youtubeSignupRequired/i.test(content)) extra += "\n\n💡 Your Google account may not have a YouTube channel yet. Open youtube.com, click your profile picture, choose **Create a channel**, then send the request again.";
  if (/unauthori[sz]ed|expired|invalid.*(token|credential)|status code 401/i.test(content)) extra += "\n\n💡 The connection looks expired. Reconnect it in **Social Hub** (/social-connections) and try again.";
  if (/✅ \*\*(TWITTER|LINKEDIN)\*\*/.test(content) && ctx.mediaUrls.length) extra += "\n\nℹ️ X and LinkedIn received the caption only. Media upload for them isn't supported yet.";
  return content + extra;
}

async function runTool(call, toolsMap, ctx) {
  const tool = toolsMap[call.name];
  if (!tool) return new ToolMessage({ content: `Tool error: unknown tool ${call.name}`, tool_call_id: call.id });

  const isSocial = SOCIAL_NAMES.has(call.name);
  let args = call.args || {};
  let dupeKey = null;

  if (isSocial) {
    args = { ...args };
    const plats = (Array.isArray(args.platforms) ? args.platforms : [args.platforms]).filter(Boolean).map((x) => String(x).toLowerCase());
    const reqUploads = (ctx.userContext?.uploadedFiles?.length || 0) + (ctx.userContext?.files?.length || 0) > 0;
    if (!args.mediaUrls?.length && !reqUploads && ctx.mediaUrls.length) args.mediaUrls = ctx.mediaUrls;   // media of THIS chat, never another user's
    const hasMedia = (args.mediaUrls?.length || 0) > 0 || reqUploads;
    const usesMedia = !plats.length || plats.some((x) => MEDIA_USERS.has(x));
    if (!hasMedia && usesMedia && !CFG.toolMediaScoped) {
      ctx.socialCalled = true;
      return new ToolMessage({ content: "📎 There is no photo or video attached in this chat. Attach the file you want to post and I'll publish it right away.", tool_call_id: call.id });
    }
    dupeKey = `${userIdOf(ctx.userContext)}|${[...plats].sort().join(",")}|${(args.mediaUrls || []).join(",")}|${args.scheduledTime || ""}`;
    const prev = recentPosts.get(dupeKey);
    if (prev && Date.now() - prev.t < CFG.dupWindowMs) {
      ctx.socialCalled = true; ctx.socialSuccess = true;
      return new ToolMessage({ content: `ℹ️ This exact post was already published a moment ago, so I skipped it to avoid a duplicate.\n\n${prev.content}`, tool_call_id: call.id });
    }
  }

  const key = `${call.name}:${JSON.stringify(args)}`;
  if (ctx.executed.has(key)) return new ToolMessage({ content: ctx.executed.get(key), tool_call_id: call.id });

  ctx.userContext?.onEvent?.({ type: "tool_start", name: call.name, args });
  let content, ok = true;
  try {
    const ms = CFG.toolTimeoutMs[call.name] || CFG.toolTimeoutMs.default;
    const res = await sleepless(ms, call.name, Promise.resolve(tool.invoke(args)));
    content = typeof res === "string" ? res : JSON.stringify(res);
  } catch (err) {
    ok = false;
    content = isSocial ? `❌ FAILED: ${err.message}. The upload may still have gone through, so check your account before retrying.` : `Tool error: ${err.message}`;
  }
  content = content.slice(0, CFG.toolResultChars);
  if (isSocial) {
    ctx.socialCalled = true;
    // Known publisher bug: the post goes live, then `isFreeTier is not defined` makes the tool report FAILED.
    const ghost = /isFreeTier is not defined/i.test(content);
    if (ghost) content = "⚠️ The post was most likely **published**, but the server failed while confirming it, so I have no link.\n\nCheck your account (for YouTube: YouTube Studio → Content) **before** trying again, to avoid a duplicate.";
    const success = ghost || (ok && /✅|SUCCESS/i.test(content));
    if (success) { ctx.socialSuccess = true; if (dupeKey) recentPosts.set(dupeKey, { t: Date.now(), content }); }
    content = decorateSocial(content, ctx);
    ctx.socialLog.push(content);
  }
  ctx.executed.set(key, content);
  ctx.userContext?.onEvent?.({ type: "tool_end", name: call.name, ok });
  return new ToolMessage({ content, tool_call_id: call.id });
}

async function agentLoop(baseModel, label, messages, ctx) {
  const maxIter = ctx.maxIter;
  for (let i = 0; i < maxIter; i++) {
    console.log(`🤖 [${label}] step ${i + 1}`);
    const force = i === 0 ? ctx.forceTool : null;
    const model = bind(baseModel, ctx.tools, force);
    const msg = await streamOnce(model, messages, ctx.out);

    if (!msg.tool_calls || msg.tool_calls.length === 0) return;

    console.log(`🛠️ [${label}] tools: ${msg.tool_calls.map((t) => t.name).join(", ")}`);
    messages.push(msg);
    const socialOnly = msg.tool_calls.every((c) => SOCIAL_NAMES.has(c.name));
    if (socialOnly && ctx.mediaOk) {
      const names = [...new Set(msg.tool_calls.flatMap((c) => (Array.isArray(c.args?.platforms) ? c.args.platforms : [c.args?.platforms]).filter(Boolean)))]
        .map((x) => PLATFORM_LABEL[String(x).toLowerCase()] || (/all/i.test(x) ? "all connected accounts" : x));
      ctx.out.push(`> ⏳ Publishing to ${names.join(", ") || "your accounts"}…\n\n`);
    }
    const results = await Promise.all(msg.tool_calls.map((c) => runTool(c, ctx.toolsMap, ctx)));
    messages.push(...results);
    if (socialOnly) {          // the tool reply already holds ✅ link / ❌ reason: show it as is, skip another LLM round trip
      ctx.out.push(results.map((r) => textOf(r.content)).join("\n\n"));
      return;
    }
  }
  // tool budget used: force a plain final answer
  console.log(`📡 [${label}] final answer without tools`);
  await streamOnce(baseModel, messages, ctx.out);
}

async function runWithFallback(chain, messages, ctx) {
  let lastErr;
  for (const { model, label } of chain) {
    try {
      await agentLoop(model, label, messages, ctx);
      return;
    } catch (err) {
      lastErr = err;
      console.warn(`⚠️ [${label}] failed: ${err.message}`);
      if (err.partialLen > 0) break;      // text already reached the user, do not restart the turn
    }
  }
  throw lastErr;
}

/* ───────────────────────────── public API ───────────────────────────── */
function preflight(intent, connected, media) {
  const asked = intent.platforms;
  if (asked.length && asked.every((p) => p === "tiktok")) {
    return "❌ **Couldn't upload to TikTok.** Direct TikTok publishing isn't available in Parsu AI yet.\n\nI can publish to YouTube, Instagram, Facebook, X, LinkedIn or Pinterest right now. Just tell me which one.";
  }
  const targets = asked.filter((p) => p !== "tiktok");
  const needsMedia = targets.some((p) => ["instagram", "youtube", "pinterest"].includes(p)) || (intent.wantsAll && !targets.length);
  if (needsMedia && !intent.hasMedia && !CFG.toolMediaScoped) {
    return "📎 Attach the photo or video you want to post first, then tell me where to publish it and I'll do it right away.";
  }
  if (targets.length === 1 && targets[0] === "youtube" && media.length && !media.some(isVideo)) {
    return "❌ **Couldn't upload to YouTube.** YouTube needs a video file (MP4, MOV or WebM), but only images are attached.\n\nAttach a video and I'll upload it right away.";
  }
  if (connected) {
    const want = targets.length ? targets : intent.wantsAll ? connected : [];
    if (!want.some((p) => connected.includes(p))) {
      if (intent.wantsAll && !targets.length && !connected.length) {
        return "❌ **Couldn't upload.** You don't have any social accounts connected yet.\n\n👉 Connect them in **Social Hub** (/social-connections), then send the same request again and I'll post to all of them.";
      }
      return notConnectedReply(targets.length ? targets : ["youtube"], { wantsSteps: intent.asksHowTo });
    }
  }
  return null;
}

export async function generateResponse(messages, onChunk, userContext = {}) {
  const t0 = Date.now();
  const intent = detectIntent(messages, userContext);
  const mediaNow = recentMedia(messages);
  const connected = intent.post ? await resolveConnected(userContext) : null;

  if (intent.post) {
    const early = preflight(intent, connected, mediaNow);
    if (early) {                       // instant answer, no LLM call
      for (let i = 0; i < early.length; i += 40) onChunk?.(early.slice(i, i + 40));
      return early;
    }
  }

  const { history, hasImage } = await buildHistory(messages);

  // Prefetched Tavily results go to the last user message (v1 behaviour, was missing in v2.0/2.1)
  if (userContext?.webSearchContext && history.length) {
    const last = history[history.length - 1];
    if (last instanceof HumanMessage) {
      const extra = String(userContext.webSearchContext).slice(0, CFG.searchCtxChars);
      history[history.length - 1] = new HumanMessage({
        content: Array.isArray(last.content) ? [...last.content, { type: "text", text: extra }] : `${last.content}\n\n${extra}`,
      });
    }
  }
  const system = new SystemMessage(buildSystemPrompt(userContext, intent, intent.post ? connected : null));
  const convo = [system, ...history];

  const { tools, map: toolsMap } = getTools(userContext, intent);
  const level = ["low", "medium", "high"].includes(String(userContext?.thinkingLevel).toLowerCase()) ? String(userContext.thinkingLevel).toLowerCase() : "low";
  const out = makeEmitter(onChunk, !intent.wantsMap);

  // Connected + media attached + a real "do it" request -> force the tool on step 1 (fastest decision).
  const forceTool = intent.post && intent.hasMedia && !intent.asksHowTo && (!connected || connected.length > 0) ? "post_to_social_media" : null;

  const mediaUrls = mediaNow.map((m) => m.url).filter(Boolean);
  const reqUploads = (userContext?.uploadedFiles?.length || 0) + (userContext?.files?.length || 0) > 0;
  const ctx = {
    tools, toolsMap, out, forceTool, executed: new Map(), socialCalled: false, socialSuccess: false, socialLog: [],
    maxIter: CFG.maxIter[level], userContext, mediaUrls, mediaOk: mediaUrls.length > 0 || reqUploads,
  };

  const customKey = userContext?.apiKey;
  const shared = hasImage
    ? [{ model: geminiVision1, label: "Gemini Vision" }, { model: geminiVision2, label: "Gemini Vision Fallback" }]
    : [{ model: geminiChatPrimary, label: "Primary" }, { model: geminiChatFallback, label: "Gemini Flash Fallback" }, { model: mistralModel, label: "Mistral Fallback" }];
  const byok = customKey ? [{ model: getByokModel(customKey, hasImage, userContext?.modelId), label: "Your Gemini key" }] : [];
  // With throwOnError + own key, never silently switch to the shared models.
  const chain = userContext?.throwOnError && customKey ? byok : [...byok, ...shared];

  try {
    await runWithFallback(chain, convo, ctx);
  } catch (err) {
    console.error("❌ All AI models failed:", err.message);
    out.flush();
    if (ctx.socialCalled) {            // an upload already ran: never let the controller retry another model (double post)
      const log = ctx.socialLog.join("\n\n");
      if (log && !out.text.includes(ctx.socialLog[0])) out.push((out.text ? "\n\n" : "") + log);
      out.flush();
      return out.text || "The publish step ran, but I couldn't finish the summary. Please check your account before retrying.";
    }
    if (userContext?.throwOnError) throw err;
    const notice = out.text
      ? "\n\n_Connection interrupted. Please retry if this looks incomplete._"
      : getModelOverloadNotice(err, hasImage ? "Gemini Vision" : "Gemini");
    onChunk?.(notice);
    return out.text + notice;
  }

  // Anti-hallucination: claimed an upload without a SUCCESS from the tool.
  if (intent.post && !ctx.socialCalled) {
    const claimed = /\b(uploaded|posted|published|scheduled)\b/i.test(out.text) && !/couldn'?t|could not|failed|not connected|unable|❌/i.test(out.text);
    if (claimed) out.push("\n\n⚠️ Correction: the platform did not confirm this upload, so please treat it as **not posted**. Check Social Hub (/social-connections) and try again.");
  }
  out.flush();
  console.log(`⏱️ Response finished in ${Date.now() - t0} ms`);
  return out.text;
}

export { detectIntent, notConnectedReply };