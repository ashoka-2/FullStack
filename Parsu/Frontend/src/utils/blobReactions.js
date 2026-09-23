// ============================================================
// RANDOMIZED MASCOT PROMPTS & INTERACTION ENGINE
// Snappy display duration: 2200ms
// ============================================================

export const DEFAULT_MASCOT_DURATION = 2200;

// 1. Chat Area Main Input Interactions
export const INPUT_INTERACTION_PROMPTS = [
  { speech: "What's on your mind? 🤔", mood: "curious" },
  { speech: "Ooh! What are we exploring today? 🔍", mood: "surprised" },
  { speech: "Tell me what you're thinking! 🧠💭", mood: "curious" },
  { speech: "Got a question? I'm all ears! 👂✨", mood: "happy" },
  { speech: "Ask me anything! Let's find answers! 🚀", mood: "wave" },
  { speech: "Curious mind detected! What's next? 💡", mood: "curious" },
  { speech: "Hit me with your best question! 🎯", mood: "happy" },
  { speech: "I'm ready! What should we search? 🌐", mood: "curious" },
  { speech: "Ready when you are! Ask away! ✨", mood: "wave" },
  { speech: "Need help solving something? Let's go! 🔥", mood: "happy" },
  { speech: "What puzzle shall we solve today? 🧩", mood: "hmm" },
  { speech: "Spill your thoughts! I'm listening! 💬", mood: "curious" },
  { speech: "I wonder what curious idea you have! 👀", mood: "sideEye" },
  { speech: "Ask away! The universe is waiting! 🌌", mood: "happy" },
  { speech: "What shall we discover today? 📚✨", mood: "curious" }
];

export const INPUT_TYPING_PROMPTS = [
  { speech: "Ooh, good thought in progress... ✍️", mood: "hmm" },
  { speech: "Keep going, I'm tuned in! 🧐", mood: "curious" },
  { speech: "Intriguing! Let's find out! 💡", mood: "surprised" },
  { speech: "Cooking up something brilliant! 🍳✨", mood: "happy" },
  { speech: "Ooh, I love where this is heading! 🚀", mood: "curious" },
  { speech: "Type away, curious thinker! 💬", mood: "wave" },
  { speech: "Fascinating question! Let's dive deep! 🌊", mood: "hmm" },
  { speech: "Can't wait to answer this! 🤩", mood: "happy" },
  { speech: "My brain is buzzing with excitement! ⚡", mood: "surprised" },
  { speech: "Ooh, this is gonna be fun! ✨", mood: "happy" }
];

// 2. Sidebar Navigation Items
export const SIDEBAR_SETTINGS_PROMPTS = [
  { speech: "Tuning the gears! ⚙️", mood: "curious" },
  { speech: "Personalize your vibe! 🎨", mood: "happy" },
  { speech: "Custom models & themes! Let's upgrade! 🛠️", mood: "surprised" },
  { speech: "Tweaking your preferences? Love it! ✨", mood: "wave" }
];

export const SIDEBAR_SOCIAL_PROMPTS = [
  { speech: "Social Hub! Time to connect the world! 🌐", mood: "happy" },
  { speech: "Expand your digital horizon! 📲", mood: "wave" },
  { speech: "Hook up your social superpowers! ⚡", mood: "surprised" },
  { speech: "AI publishing awaits! Let's connect! 🤖🚀", mood: "curious" }
];

export const SIDEBAR_CHATS_PROMPTS = [
  { speech: "All your past journeys right here! 📚", mood: "curious" },
  { speech: "Reviewing the knowledge archive! 📜", mood: "hmm" },
  { speech: "Every great conversation saved! 🗂️", mood: "happy" },
  { speech: "Let's see what you've learned so far! 💡", mood: "wave" }
];

export const SIDEBAR_NEW_CHAT_PROMPTS = [
  { speech: "Fresh canvas, fresh ideas! 🎨", mood: "happy" },
  { speech: "Clean slate! What are we discovering? 🚀", mood: "curious" },
  { speech: "New chat, endless possibilities! ✨", mood: "surprised" }
];

// 3. Chat History & Chat Delete Interactions
export const CHAT_SELECT_PROMPTS = [
  { speech: "Ooh, revisiting this memory! 📜", mood: "curious" },
  { speech: "Back to this adventure! 🔍", mood: "happy" },
  { speech: "Ah, classic conversation! Resuming! 💡", mood: "hmm" },
  { speech: "Picking up right where we left off! 🚀", mood: "wave" }
];

export const CHAT_DELETE_HOVER_PROMPTS = [
  { speech: "Saying goodbye to this chat? 🥺", mood: "sad" },
  { speech: "Wait, sure you wanna trash this? 🗑️", mood: "surprised" },
  { speech: "Poof, gone forever if you click! 💨", mood: "shy" }
];

export const CHAT_DELETED_PROMPTS = [
  { speech: "Poof! Cleaned up and clutter-free! 🧹✨", mood: "happy" },
  { speech: "Deleted! Making room for fresh ideas! 🚀", mood: "wave" },
  { speech: "All swept away! Ready for new chats! 🧼", mood: "happy" }
];

// 4. Library / Chats Search Bar Interactions
export const LIBRARY_SEARCH_PROMPTS = [
  { speech: "Hunting for a past chat? 🔎", mood: "curious" },
  { speech: "Looking for treasure in history! 🕵️‍♂️", mood: "hmm" },
  { speech: "Type keywords, I'll track it down! 📑", mood: "happy" },
  { speech: "Searching through your memories... 💭", mood: "curious" }
];

export const LIBRARY_SEARCH_TYPING_PROMPTS = [
  { speech: "Scanning the archives! ⚡", mood: "surprised" },
  { speech: "Filtering your chats in real time! 🔍", mood: "hmm" }
];

// 5. Social Hub Connect Button Hover Prompts
export const SOCIAL_CONNECT_HOVER_PROMPTS = {
  instagram: [
    { speech: "Ready to link Instagram? 📸", mood: "happy" },
    { speech: "Share visual stories with the world! ✨", mood: "wave" },
    { speech: "Auto-post photos and reels with AI! 🤖📲", mood: "surprised" }
  ],
  facebook: [
    { speech: "Connect Facebook to publish posts instantly! 🌐", mood: "happy" },
    { speech: "Reach your Facebook audience effortlessly! 👥", mood: "wave" }
  ],
  pinterest: [
    { speech: "Pin inspirations with AI! 📌✨", mood: "happy" },
    { speech: "Turn ideas into beautiful pins! 🎨", mood: "curious" }
  ],
  twitter: [
    { speech: "Tweet with AI speed and wit! 🐦⚡", mood: "surprised" },
    { speech: "Ready to broadcast your thoughts on X? 🚀", mood: "happy" }
  ],
  tiktok: [
    { speech: "Short-form video magic ready to launch! 🎵", mood: "happy" },
    { speech: "Ready to go viral on TikTok? 📱✨", mood: "surprised" }
  ],
  linkedin: [
    { speech: "Supercharge your professional network! 💼", mood: "curious" },
    { speech: "Share insightful industry posts on LinkedIn! 📊", mood: "happy" }
  ],
  youtube: [
    { speech: "Ready to upload videos to YouTube? 🎬", mood: "happy" },
    { speech: "Broadcast your video creations to the world! 🎥✨", mood: "surprised" }
  ],
  default: [
    { speech: "Connect your account for seamless publishing! ⚡", mood: "curious" },
    { speech: "Link this app to automate your content! 🚀", mood: "happy" }
  ]
};

// 6. Social App Successfully Connected Prompts
export const SOCIAL_CONNECTED_PROMPTS = [
  { speech: "Yeh! Now you can upload pics, reels, and stories! 📸🎉", mood: "happy", celebrate: true },
  { speech: "Woohoo! Connected successfully! Time to show off! 🚀✨", mood: "happy", celebrate: true },
  { speech: "Boom! Social superpower unlocked! Let's post! 💥🥳", mood: "happy", celebrate: true },
  { speech: "Awesome! Your AI can now publish directly for you! 🤖📲", mood: "happy", celebrate: true }
];

// Tracker cache to prevent immediate repeats
const lastIndices = {};

function pickRandomUnique(pool, key) {
  let idx = Math.floor(Math.random() * pool.length);
  if (pool.length > 1 && idx === lastIndices[key]) {
    idx = (idx + 1) % pool.length;
  }
  lastIndices[key] = idx;
  return pool[idx];
}

function dispatchMascotEvent(item, duration = DEFAULT_MASCOT_DURATION) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('blob_trigger_mood', {
      detail: {
        mood: item.mood || 'curious',
        speech: item.speech || '',
        duration,
        celebrate: !!item.celebrate,
        revert: true
      }
    })
  );
}

// -------------------------------------------------------------------
// PUBLIC EXPORTED ACTION TRIGGERS
// -------------------------------------------------------------------

let typingThrottleTimer = null;
let librarySearchThrottleTimer = null;

export function triggerBlobInteraction(action = 'hover') {
  const chosen = pickRandomUnique(INPUT_INTERACTION_PROMPTS, 'chat_input_interaction');
  dispatchMascotEvent(chosen, DEFAULT_MASCOT_DURATION);
}

export function triggerBlobTyping() {
  if (typeof window === 'undefined' || typingThrottleTimer) return;
  const chosen = pickRandomUnique(INPUT_TYPING_PROMPTS, 'chat_typing');
  dispatchMascotEvent(chosen, DEFAULT_MASCOT_DURATION);

  typingThrottleTimer = setTimeout(() => {
    typingThrottleTimer = null;
  }, 2400);
}

export function triggerBlobSidebarNav(label) {
  const normalized = (label || '').toLowerCase();
  let pool = SIDEBAR_CHATS_PROMPTS;
  if (normalized.includes('setting')) {
    pool = SIDEBAR_SETTINGS_PROMPTS;
  } else if (normalized.includes('social')) {
    pool = SIDEBAR_SOCIAL_PROMPTS;
  } else if (normalized.includes('new') || normalized.includes('search')) {
    pool = SIDEBAR_NEW_CHAT_PROMPTS;
  }
  const chosen = pickRandomUnique(pool, `sidebar_${normalized}`);
  dispatchMascotEvent(chosen, DEFAULT_MASCOT_DURATION);
}

export function triggerBlobChatSelect() {
  const chosen = pickRandomUnique(CHAT_SELECT_PROMPTS, 'chat_select');
  dispatchMascotEvent(chosen, DEFAULT_MASCOT_DURATION);
}

export function triggerBlobChatDeleteHover() {
  const chosen = pickRandomUnique(CHAT_DELETE_HOVER_PROMPTS, 'chat_delete_hover');
  dispatchMascotEvent(chosen, DEFAULT_MASCOT_DURATION);
}

export function triggerBlobChatDeleted() {
  const chosen = pickRandomUnique(CHAT_DELETED_PROMPTS, 'chat_deleted');
  dispatchMascotEvent(chosen, DEFAULT_MASCOT_DURATION);
}

export function triggerBlobLibrarySearch(action = 'hover') {
  if (action === 'typing') {
    if (librarySearchThrottleTimer) return;
    const chosen = pickRandomUnique(LIBRARY_SEARCH_TYPING_PROMPTS, 'lib_search_typing');
    dispatchMascotEvent(chosen, DEFAULT_MASCOT_DURATION);
    librarySearchThrottleTimer = setTimeout(() => {
      librarySearchThrottleTimer = null;
    }, 2400);
    return;
  }
  const chosen = pickRandomUnique(LIBRARY_SEARCH_PROMPTS, 'lib_search_hover');
  dispatchMascotEvent(chosen, DEFAULT_MASCOT_DURATION);
}

export function triggerBlobSocialHover(platformId) {
  const pool = SOCIAL_CONNECT_HOVER_PROMPTS[platformId] || SOCIAL_CONNECT_HOVER_PROMPTS.default;
  const chosen = pickRandomUnique(pool, `social_hover_${platformId}`);
  dispatchMascotEvent(chosen, DEFAULT_MASCOT_DURATION);
}

export function triggerBlobSocialConnected(platformName) {
  const chosen = pickRandomUnique(SOCIAL_CONNECTED_PROMPTS, 'social_connected');
  // Include platform name dynamically if desired
  dispatchMascotEvent(chosen, 2800);
}
