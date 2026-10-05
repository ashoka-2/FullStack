// ============================================================
// GUIDE REGISTRY — Single source of truth for all guided help
// walkthroughs. Each guide has an id, the route to navigate to,
// human-friendly pageTitle, and an ordered list of steps.
//
// Each step has:
//   target      – the value of `data-guide="..."` on the DOM element
//   title       – short tooltip heading
//   body        – tooltip description
//   speech      – what the mascot says
//   mood        – mascot mood during this step (happy|curious|wave|love|hmm|fire)
//   position    – preferred tooltip position (top|bottom|left|right)
//   action      – optional Auto-Pilot action object:
//                 { type: "click"|"focus"|"open_url", label: "...", url?: "..." }
// ============================================================

const GUIDES = {
  // ─── Add a Gemini / AI API Key ─────────────────────────────
  add_gemini_key: {
    id: "add_gemini_key",
    title: "Add a Custom API Key",
    pageTitle: "API Keys Settings",
    route: "/settings/api-keys",
    shortAnswer: "Let me walk you through adding your own API key! Head over to Settings → API Keys.",
    steps: [
      {
        target: "api-keys-add-btn",
        title: "Open Key Form",
        body: "Click 'Add Custom Key' to open the provider connection form.",
        speech: "Click here to add your custom AI key! 🔑",
        mood: "happy",
        position: "bottom",
        action: { type: "click", label: "Open Form For Me" },
      },
      {
        target: "api-keys-provider-gemini",
        title: "Select Google Gemini",
        body: "Choose Google Gemini (or any provider like OpenAI, Claude, DeepSeek, Groq, NVIDIA).",
        speech: "Pick Gemini or your favorite provider! ⚡",
        mood: "curious",
        position: "bottom",
        action: { type: "click", label: "Select Gemini" },
      },
      {
        target: "api-keys-get-key-link",
        title: "Get Free Gemini Key",
        body: "Need an API key? You can get a free one in 10 seconds from Google AI Studio.",
        speech: "Google AI Studio gives free Gemini API keys! 🎁",
        mood: "wave",
        position: "bottom",
        action: {
          type: "open_url",
          label: "Open Google AI Studio ↗",
          url: "https://aistudio.google.com/app/apikey",
        },
      },
      {
        target: "api-keys-key-input",
        title: "Paste Your API Key",
        body: "Paste your key here. It is encrypted secretly using AES-256 before saving to the database.",
        speech: "Paste your API key right here! 🔐",
        mood: "curious",
        position: "bottom",
        action: { type: "focus", label: "Focus Input Field" },
      },
      {
        target: "api-keys-test-btn",
        title: "Test & Fetch Models",
        body: "Click 'Test & Fetch Models' to verify your key and instantly unlock Gemini 2.5 Flash, Pro, and custom models.",
        speech: "Let's verify your key and unlock new models! 🚀",
        mood: "happy",
        position: "top",
        action: { type: "click", label: "Test Key" },
      },
      {
        target: "api-keys-save-btn",
        title: "Save & Activate",
        body: "Click 'Save & Unlock Models' to store your key. You're completely ready to chat!",
        speech: "Hit Save and you are all set! 🎉",
        mood: "love",
        position: "top",
      },
    ],
  },

  // ─── Connect Instagram ───────────────────────────────────────
  connect_instagram: {
    id: "connect_instagram",
    title: "Connect Instagram Account",
    pageTitle: "Social Command Center",
    route: "/social-connections",
    shortAnswer: "I'll show you how to connect your Instagram account!",
    steps: [
      {
        target: "social-card-instagram",
        title: "Instagram Channel",
        body: "This is your Instagram card. You can connect via Facebook Login or manual developer token.",
        speech: "Here's your Instagram channel tile! 📸",
        mood: "happy",
        position: "bottom",
      },
      {
        target: "social-connect-btn-instagram",
        title: "Connect Account",
        body: "Click 'Connect Instagram' to authorize Parsu AI to publish reels, carousels, and stories for you.",
        speech: "Tap Connect to link your Instagram account! 🔗",
        mood: "wave",
        position: "top",
        action: { type: "click", label: "Click Connect" },
      },
    ],
  },

  // ─── Connect Facebook ────────────────────────────────────────
  connect_facebook: {
    id: "connect_facebook",
    title: "Connect Facebook Page",
    pageTitle: "Social Command Center",
    route: "/social-connections",
    shortAnswer: "Let me guide you through connecting your Facebook account!",
    steps: [
      {
        target: "social-card-facebook",
        title: "Facebook Channel",
        body: "This is your Facebook page integration card.",
        speech: "Facebook card right here! 🌐",
        mood: "happy",
        position: "bottom",
      },
      {
        target: "social-connect-btn-facebook",
        title: "Authorize Page",
        body: "Click 'Connect Facebook' to grant publishing permission for your pages and groups.",
        speech: "Click Connect to link Facebook! 🔗",
        mood: "wave",
        position: "top",
        action: { type: "click", label: "Click Connect" },
      },
    ],
  },

  // ─── View or Edit Memory & Persona ───────────────────────────
  view_memory: {
    id: "view_memory",
    title: "View & Edit AI Memory",
    pageTitle: "Memory & Persona",
    route: "/settings/memory",
    shortAnswer: "I'll take you to the Memory settings where you can view what I remember about you!",
    steps: [
      {
        target: "memory-enable-toggle",
        title: "Cross-Chat Memory Toggle",
        body: "Toggle cross-chat memory ON or OFF anytime. When ON, Parsu remembers your preferences.",
        speech: "This toggle controls my long-term memory! 🧠",
        mood: "curious",
        position: "bottom",
      },
      {
        target: "memory-custom-instructions",
        title: "Custom Persona Instructions",
        body: "Tell Parsu AI exactly how you want it to respond — concise, friendly, sarcastic, code-only, or expert.",
        speech: "Tell me how you'd like me to behave! ✍️",
        mood: "hmm",
        position: "top",
        action: { type: "focus", label: "Focus Instructions Box" },
      },
      {
        target: "memory-facts-list",
        title: "Learned Memory Facts",
        body: "Browse all facts Parsu has gathered from your conversations. You can delete or edit individual facts.",
        speech: "Here are all the facts I've learned about you! 💡",
        mood: "happy",
        position: "top",
      },
    ],
  },

  // ─── Change the AI Model ─────────────────────────────────────
  change_model: {
    id: "change_model",
    title: "Switch AI Models",
    pageTitle: "AI Chat & Models",
    route: "/ai",
    shortAnswer: "You can switch AI models anytime from the '+' Add to chat menu! Let me open it for you.",
    steps: [
      {
        target: "chat-attach-btn",
        title: "Open 'Add to Chat'",
        body: "Click the '+' button to open the Add to Chat menu where your AI model selector is located.",
        speech: "Click '+' to open the tools sheet! ➕",
        mood: "curious",
        position: "top",
        action: { type: "click", label: "Open Add to Chat" },
      },
      {
        target: "model-selector-btn",
        title: "Choose AI Model",
        body: "Click here to choose from Gemini 2.5 Flash, Pro, Claude 3.7, GPT-4o, DeepSeek, or Groq.",
        speech: "Pick your favorite model right here! 🚀",
        mood: "happy",
        position: "bottom",
        action: { type: "click", label: "Open Model Menu" },
      },
      {
        target: "thinking-level-selector",
        title: "Thinking Power",
        body: "Adjust the AI reasoning depth: High (deep multi-step chain-of-thought) or Low (instant fast responses).",
        speech: "Adjust my thinking power here! ⚡",
        mood: "wave",
        position: "top",
      },
    ],
  },

  // ─── Customize Mascot Companion ──────────────────────────────
  mascot_settings: {
    id: "mascot_settings",
    title: "Customize Floating Mascot",
    pageTitle: "Mascot Companion Settings",
    route: "/settings/mascot",
    shortAnswer: "Let me show you the mascot customization settings!",
    steps: [
      {
        target: "mascot-color-picker",
        title: "Blob Color Swatches",
        body: "Choose from 10 distinct color palettes! Try Fire, Emerald Green, Royal Violet, or Aqua Cyan.",
        speech: "Pick a fresh color for me! 🎨",
        mood: "happy",
        position: "bottom",
      },
      {
        target: "mascot-eye-tracking-card",
        title: "Cursor Eye Tracking",
        body: "Enable this so my eyes smoothly follow your mouse pointer anywhere on screen!",
        speech: "I can watch your cursor across the screen! 👀",
        mood: "curious",
        position: "bottom",
      },
      {
        target: "mascot-flame-card",
        title: "Fiery Head Effect",
        body: "Turn on animated dancing flames with floating ember sparks right on top of my head!",
        speech: "Give me the fire flame head! 🔥",
        mood: "fire",
        position: "bottom",
      },
      {
        target: "mascot-size-slider",
        title: "Adjust Mascot Size",
        body: "Drag this slider from 60px (mini companion) to 300px (giant friendly blob).",
        speech: "Scale me up or down to fit your screen! 📏",
        mood: "wave",
        position: "top",
        action: { type: "focus", label: "Focus Size Slider" },
      },
    ],
  },

  // ─── Voice & Text-to-Speech Settings ─────────────────────────
  voice_settings: {
    id: "voice_settings",
    title: "Voice & Speech Settings",
    pageTitle: "Voice & Speech Settings",
    route: "/settings/voice",
    shortAnswer: "Let me show you the voice settings where you can configure speech recognition and text-to-speech!",
    steps: [
      {
        target: "voice-tts-toggle",
        title: "Select AI Voice",
        body: "Pick from your device's natural voices. You can also adjust speaking pitch and speed.",
        speech: "Choose how my voice sounds! 🔊",
        mood: "happy",
        position: "bottom",
        action: { type: "focus", label: "Focus Voice Dropdown" },
      },
    ],
  },

  // ─── Plan an Interactive Road Trip ───────────────────────────
  plan_trip: {
    id: "plan_trip",
    title: "Plan a Road Trip with Live Map",
    pageTitle: "AI Chat",
    route: "/ai",
    shortAnswer: "Just tell me where you want to travel! I'll generate an interactive map with turn-by-turn navigation and waypoints.",
    steps: [
      {
        target: "chat-main-input",
        title: "Ask For a Trip",
        body: "Type: 'Plan a road trip from Delhi to Goa visiting Mumbai, Pune, and Ratnagiri' to see the live GPS map!",
        speech: "Tell me your dream road trip! 🗺️",
        mood: "curious",
        position: "top",
        action: { type: "focus", label: "Focus Chat Box" },
      },
    ],
  },

  // ─── View Chat Library & Search ──────────────────────────────
  view_library: {
    id: "view_library",
    title: "Search Chat Library",
    pageTitle: "Chat Library",
    route: "/library",
    shortAnswer: "Your entire chat history is indexed in the Library. Let me take you there!",
    steps: [
      {
        target: "library-search-bar",
        title: "Search Conversations",
        body: "Type any keyword or topic to instantly filter through all your past conversations.",
        speech: "Find any past message instantly! 🔍",
        mood: "curious",
        position: "bottom",
        action: { type: "focus", label: "Focus Search Bar" },
      },
    ],
  },

  // ─── Post to Social Media From Chat ──────────────────────────
  post_social: {
    id: "post_social",
    title: "Publish to Social Media",
    pageTitle: "AI Chat",
    route: "/ai",
    shortAnswer: "You can post to Instagram, Facebook, and Twitter directly from chat!",
    steps: [
      {
        target: "chat-attach-btn",
        title: "Attach Photos / Media",
        body: "Click '+' to attach the image or video you want to publish.",
        speech: "Attach your media file here! 📎",
        mood: "curious",
        position: "top",
        action: { type: "click", label: "Open Attach Menu" },
      },
      {
        target: "chat-main-input",
        title: "Tell Parsu Where to Post",
        body: "Type: 'Post this photo to Instagram with an engaging travel caption and hashtags'.",
        speech: "Tell me your caption ideas! 🚀",
        mood: "happy",
        position: "top",
        action: { type: "focus", label: "Focus Chat Box" },
      },
    ],
  },
};

// ─── Intent Matching ───────────────────────────────────────────
export const GUIDE_INTENT_MAP = {
  add_gemini_key: ["gemini key", "api key", "add key", "gemini api", "custom key", "add gemini", "byok", "openai key", "claude key"],
  connect_instagram: ["connect instagram", "link instagram", "instagram account", "instagram login", "instagram page"],
  connect_facebook: ["connect facebook", "link facebook", "facebook account", "facebook page"],
  view_memory: ["memory", "edit memory", "view memory", "what do you remember", "custom instructions", "ai persona"],
  change_model: ["change model", "switch model", "select model", "model selector", "pick model", "deepseek model", "thinking level"],
  mascot_settings: ["mascot", "blob settings", "mascot color", "change mascot", "blob fire", "eye tracking"],
  voice_settings: ["voice settings", "speech settings", "text to speech", "tts", "voice mode"],
  plan_trip: ["plan trip", "road trip", "travel plan", "route planner", "trip planner", "map directions"],
  view_library: ["chat history", "old chats", "library", "past chats", "previous chats", "search chats"],
  post_social: ["post to instagram", "upload to social", "post social media", "publish to facebook", "post to twitter"],
};

export default GUIDES;
