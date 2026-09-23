# AI DEVELOPMENT CONTEXT — Parsu AI Social Media Command Center

> This file is for external AI agents (Antigravity, Claude, ChatGPT, Cursor, etc.) modifying or extending this codebase.
> **Frontend URL:** https://parsuai.vercel.app/
> **Read CODEBASE_ARCHITECTURE.md first** for the complete structural reference.

---

## GOLDEN RULES FOR AI AGENTS

1. **Do NOT rebuild** — inspect and extend existing modules cleanly.
2. **Do NOT expose social media or AI API credentials** — tokens and secrets are strictly managed backend-side and stored with `select: false` in Mongoose.
3. **Follow existing patterns** — this codebase uses Express 5 ESM modules, Redux Toolkit, and JWT httpOnly cookies.
4. **Social Tokens** — always query `SocialConnection` model for platform OAuth tokens; they are never stored directly on the `User` model.
5. **Image & File Hosting** — always upload media to ImageKit via `imagekit.service.js` — never save files locally.
6. **AI Tool Loop** — LangChain tools are defined in `Backend/src/services/Tools/`. Always follow the existing structured tool calling pattern.
7. **Active AI Models & Free Tier Support**:
   - Primary: `gemini-3.6-flash` (do not revert to deprecated `1.5-flash` or `2.5-flash`).
   - Fallback Gemini: `gemini-flash-latest` and `gemini-pro-latest`.
   - Mistral: Use `open-mistral-nemo` (12B SOTA, 128k context) or `codestral-latest`. **Never** hardcode `mistral-small-latest` or `mistral-large-latest` without fallback, as free-tier accounts hit HTTP 429 rate limit lockouts.
8. **Scroll Containers & Lenis Compatibility**:
   - The application uses `ReactLenis` smooth scrolling.
   - Any scrollable modal, portal, or container (`overflow-y-auto`) **must** include `data-lenis-prevent="true"` and `onWheel={(e) => e.stopPropagation()}` to prevent Lenis from hijacking wheel events.
9. **Maintenance Mode Integrity**:
   - When `VITE_MAINTENANCE_MODE=true`, no data from the backend or database may be fetched.
   - Guarded at the root in `App.jsx` and in `axios.js` request interceptor.

---

## RECENT MAJOR ARCHITECTURAL UPDATES

### 1. Resizable Input Area & Code Format Preservation
- **Resizable Inputs**: Textareas in `ChatArea.jsx` and `FollowUpInput.jsx` support native vertical resizing (`resize-y`) from `44px` up to `75vh`.
- **Expand / Collapse Button**: Dedicated `RiExpandUpDownLine` / `RiContractUpDownLine` toggle in the action bar switches instantly between compact and multi-line editor modes (`240px`–`300px`+).
- **Code Preservation**: Configured with `whiteSpace: 'pre-wrap'`, `tabSize: 2`, and dynamic `font-mono` when code syntax is detected.
- **Tab Key Indentation**: Pressing `Tab` inside the textarea inserts `  ` (2 spaces) without losing keyboard focus.
- **User Message Bubbles (`ChatMessage.jsx`)**: Preserves all formatting and newlines with `whitespace-pre-wrap break-words`, and renders syntax-highlighted `CodeBlock` instances for raw or markdown code.

### 2. Top-Layer Portal Model Selector (`ModelSelectorDropdown.jsx`)
- Rendered into `document.body` via React Portal (`z-[9990]`) to escape parent overflow limitations.
- Positioned dynamically using viewport coordinates (`getBoundingClientRect()`).
- Added `data-lenis-prevent="true"`, `onWheel={(e) => e.stopPropagation()}`, and `min-h-0` on scroll containers so mouse wheel scrolling functions smoothly without page stutter.

### 3. Active AI Model Upgrades & Mistral 429 Resolution
- Migrated from deprecated `gemini-1.5-flash` to `gemini-3.6-flash` and `gemini-flash-latest`.
- Resolved Mistral `429 Rate limit exceeded` errors by updating default and fallback model to `open-mistral-nemo` (12B parameters, 128k context, 100% free-tier supported) and `codestral-latest`. Added automatic 429 auto-retry fallback in `model.service.js`.

### 4. Application Maintenance Mode
- Controlled via `VITE_MAINTENANCE_MODE=true` in `Frontend/.env` or Vercel Environment Variables.
- Complete data isolation: bypasses all routers, blocks `auth.handleGetMe()`, disconnects WebSockets, and blocks outgoing Axios requests.
- Dedicated interactive `MaintenanceMode.jsx` page featuring the JellyBlob mascot, status cards, and live refresh checker.

### 6. Chat Loading Lag & Heavy Code Rendering Optimization
- **Prism Syntax Lexer Optimization**: Long code generation or pasted code (up to 2000 lines) previously caused synchronous AST parsing freezes. In `ChatMessage.jsx`, `CodeBlock` renders an initial 70 lines with an expanding gradient button (`Show all {totalLines} lines (+hidden lines)`).
- **Full Code Preservation**: Copying copies 100% of the entire code snippet regardless of whether it is collapsed or expanded.
- **Component Memoization (`React.memo`)**: Wrapped `CodeBlock` and `ChatMessage` in `React.memo`. Normalized `isUser` logic internally so `ChatPage2.jsx` passes stable references `msg={msg}` rather than reconstructing objects `{ ...msg }` on every keystroke.

### 7. Animated Framer Motion Sheet & Mobile Responsive Input
- **Animated AddToChatSheet**: Built with Framer Motion (`motion/react`) spring physics (`y: '100%'` to `y: 0`). Supports drag-to-dismiss gesture by sliding downwards.
- **Mobile Full-Screen Mode**: In `AddToChatSheet.jsx`, mobile displays a full-screen toggle (`RiFullscreenLine`) expanding to 100dvh, while desktop retains the clean centered modal.
- **Connectors Integration**: Removed the "Add to project" button; clicking "Connectors" navigates to `/social-connections`. Added `/socials` redirect alias in `app.routes.jsx`.
- **Streamlined Toolbar**: Removed standalone camera icon button from input bars (camera is cleanly housed inside the sheet).
- **Mobile Model Names**: In `ModelSelectorDropdown.jsx`, shows compact brand names on mobile (`Gemini`, `Mistral`, `Groq`, `DeepSeek`, `Claude`, `OpenAI`) via `getShortBrandName()` and full model names on desktop.
- **Full-Screen Prompt & Code Editor**: Textareas auto-expand with content; users can trigger a dedicated Full-Screen Prompt & Code Studio modal to comfortably write, indent, and format large prompts and code.

---

## DESIGN SYSTEM TOKENS

| Token | Value | Description |
|---|---|---|
| Primary Cyan | `#20b8cd` | Main interactive brand accent |
| Secondary Teal | `#60A6AF` | Borders, subtle highlights, active states |
| Light Mode Background | `#f4f5f7` | Balanced off-white (prevents harsh glare) |
| Dark Mode Background | `#050505` / `#070809` | Deep obsidian dark theme |
| Surface / Cards (Dark) | `#121212` / `#171819` | Elevated card surfaces |
| Surface / Cards (Light)| `#ffffff` | Elevated clean white surfaces |
| Border Colors | `border-zinc-200/90` (light) / `border-[#2d2e2e]` (dark) | Crisp boundary definitions |
| Layering Hierarchy | Mascot (`z-[10000]`), Dropdown Portal (`z-[9990]`), Fixed Headers (`z-50`), Modals (`z-50`) | Precise stacking context |

---

## API ROUTES SUMMARY

### Auth (`/api/auth`)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | No | Register with email/password |
| POST | `/login` | No | Login with credentials |
| POST | `/logout` | No | Clear JWT cookie |
| GET | `/me` | Yes | Get current user profile |
| GET | `/verify-email` | No | Email verification link handler |
| POST | `/resend-verification-email` | No | Resend email verification |
| GET | `/google` | No | Redirect to Google OAuth |
| GET | `/google/callback` | No | Google OAuth callback handler |

### Chat & AI Models (`/api/chats` & `/api/models`)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/chats/send` | Yes | Send message (streamed response via Socket.io) |
| GET | `/api/chats/` | Yes | List user's conversation threads |
| GET | `/api/chats/:id` | Yes | Get single chat with paginated messages |
| DELETE | `/api/chats/:id` | Yes | Delete conversation thread |
| GET | `/api/chats/search` | Yes | Search conversation history |
| POST | `/api/chats/suggestions` | Yes | Generate contextual follow-up suggestions |
| GET | `/api/models/` | Yes | Get default & custom AI models list |
| POST | `/api/models/test` | Yes | Validate custom API key connection |
| POST | `/api/models/keys` | Yes | Save encrypted custom provider API key |
| DELETE | `/api/models/keys/:id` | Yes | Delete custom API key |

### Social Media (`/api/social`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/accounts` | Yes | List connected social accounts |
| DELETE | `/accounts/:platform` | Yes | Disconnect platform |
| GET | `/connect/:platform` | Yes | Generate OAuth redirect URL |
| GET | `/callback/:platform` | No | OAuth callback handler |
| POST | `/connect-manual` | Yes | Manual access token connection |
| POST | `/publish` | Yes | Publish media to connected social accounts |

---

## 8. Mobile Responsiveness Standards & Proxy Resilience

### Mobile Layout Patterns
- **Sidebar Auto-Close**: On mobile devices (`lg:hidden`), clicking any navigation link, recent chat thread, or "New Chat" automatically closes the sidebar drawer.
- **Backdrop Overlays**: Every page (`Dashboard`, `ChatPage2`, `Library`, `SocialConnections`, `Settings`, `InfoPageLayout`) mounts an interactive `<div onClick={() => setIsSidebarOpen(false)} className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]" />` to dismiss the navigation drawer on tap.
- **Hero & Heading Scaling**: Use `text-3xl sm:text-5xl md:text-[5.5rem]` with responsive icons (`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12`) so titles never cause horizontal scroll on 320px–375px mobile screens.
- **Horizontal Scrolling Suggestions**: Suggestion pills on mobile use `overflow-x-auto no-scrollbar` instead of stacking 4 vertical rows.
- **Code Block & Table Overflow Guard**: In `ChatMessage.jsx`, wrap code highlighters and markdown `<table>` elements with `overflow-x-auto custom-scrollbar` so wide tables or long code lines never stretch the mobile viewport.
- **Floating Mascot Placement**: On mobile (< 640px), the floating mascot scales to `max(56px, min(size, 72px))` and sits at `bottom-24 right-4 sm:bottom-6 sm:right-6` to avoid blocking mobile textareas or send buttons.
- **Auth Page Sizing**: Mascot canvas scales to `w-40 h-40 xs:w-48 xs:h-48 sm:w-72 sm:h-72` on mobile so credentials forms remain visible above the fold.

### Vite Dev Proxy Resilience (`AggregateError [ECONNREFUSED]`)
- Vite dev server proxy (`vite.config.js`) includes `configure: (proxy) => { proxy.on('error', ...)}` handlers for `/api` and `/socket.io`.
- When the backend server on `http://localhost:3000` is offline or restarting, ECONNREFUSED is caught and handled gracefully with HTTP 503 instead of crashing Vite or spamming unhandled aggregate error stack traces.
- `chat.socket.js` specifies `reconnectionAttempts: 8`, backoff delays, and prefers `['websocket', 'polling']` to minimize polling traffic when offline.

---

## 9. Generation State Lifecycle, Apple-Style Toolbar & Tavily Search

### Generation State vs Fetch State (`isGenerating` in `chat.slice.js`)
- **Root Cause**: Previously, `handleGetMessages(id)` set `loading = true` during message fetch on navigation, which triggered `MessageQueueTray` ("AI is generating response... [🔴 Stop Responding]") and turned Send into "Queue" even though no message was being generated.
- **Resolution**: Separated `loading` (data retrieval) from `isGenerating` (active token streaming).
- `ChatPage2.jsx` passes `isResponding={isGenerating}` to `FollowUpInput`, and message queuing triggers only when `isGenerating` is true.

### Apple Squircle Toolbar Components (`ChatArea.jsx` & `FollowUpInput.jsx`)
- **Attach Button**: Uses continuous rounded circle styling (`w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full border border-zinc-300 dark:border-white/15 bg-zinc-100/90 dark:bg-white/[0.06]`) displaying ONLY `<RiAddLine size={18} />`, with no text.
- **Native Camera Button**: Positioned adjacent to Attach. Clicking triggers `<input type="file" accept="image/*" capture="environment" />` via `<RiCameraLine size={17} />`, allowing instant mobile photo capture.
- **Tavily Web Search Toggle**:
  - Pill button `<button onClick={handleToggleWebSearch}>` with `<RiGlobalLine size={14} />`, active cyan glow when ON.
  - State persisted in `localStorage.getItem("parsu_web_search")` (with backwards compatibility fallback to `perplexity_web_search`).
  - Passed to `sendMessage` API as `webSearch=true|false`.
  - Backend controller imports `@tavily/core` to fetch live internet results when ON, injecting citations into third-party LLMs and enabling `searchInternetTool` in Gemini. When OFF, models respond purely using their internal training knowledge.

---

## 10. AI Message Feedback, Speech-To-Text, Text-To-Speech & Mascot Speech Sync

### AI Message Like & Dislike Feedback (`rateMessageFeedback`)
- **Schema & Route**:
  - `Message` schema includes `feedback: { type: String, enum: ['like', 'dislike', null], default: null }`.
  - POST `/api/chats/message/:messageId/feedback` allows toggling like/dislike.
- **Adaptive Prompt Steering**:
  - In `chat.controller.js`, before generating subsequent AI responses, recent conversation history is inspected for liked and disliked messages.
  - Generates dynamic steering instructions:
    - *Liked messages*: "The user appreciated the depth/style of this response: [liked excerpt]. Continue providing high-value, structured answers in this tone."
    - *Disliked messages*: "The user disliked this response: [disliked excerpt]. Avoid repeating these shortcomings."
  - Injected directly into Gemini's system instructions and OpenAI/Mistral/Groq chat history.
- **UI State & Reactions**:
  - In `ChatMessage.jsx`, thumbs-up and thumbs-down buttons trigger optimistic UI updates and dispatch mascot emotion triggers (`love` or `hmm`).

### Microphone Voice Input (Speech-to-Text)
- Integrated into `ChatArea.jsx` and `FollowUpInput.jsx` via `window.SpeechRecognition || window.webkitSpeechRecognition`.
- Clicking the microphone toggles real-time listening mode.
- Pulsing red active ring indicator (`animate-pulse ring-2 ring-rose-500/30 text-rose-500`).
- Transcribed speech is appended smoothly into the prompt input textarea with active typing triggers.

### AI Response Audio Speaker (Text-to-Speech)
- Each AI message in `ChatMessage.jsx` displays a speaker icon (`RiVolumeUpLine` / `RiVolumeUpFill`).
- Pre-processes Markdown prior to synthesis: strips raw fenced code blocks (replacing them with "Code block omitted"), removes markdown formatting, links, and syntax characters for natural listening.
- Respects custom voice, speed rate, and pitch from `localStorage` (`parsu_tts_voice`, `parsu_tts_rate`, `parsu_tts_pitch` with backwards compatibility fallback).
- Dispatches `blob_speech_state` events (`{ speaking: true, text }` / `{ speaking: false }`).

### Voice Customization in Settings (`VoiceSettingsForm.jsx`)
- Built and mounted under Section 5 in `Settings.jsx`.
- Dynamically enumerates all browser voices via `window.speechSynthesis.getVoices()`.
- Interactive sliders for speech rate (0.75x–1.5x) and pitch (0.8–1.3).
- Includes "Test Voice" preview button to test selected voice settings instantly.

### Mascot Speech Synchronization (`FloatingBlobMascot.jsx`)
- Global `FloatingBlobMascot` listens for `blob_speech_state` custom events.
- When AI response TTS begins (`speaking: true`), the mascot enters animated speaking mode:
  - Displays speech bubble: "Speaking AI response... 🔊"
  - Dances and oscillates between `happy` and `wave` moods with randomized eye gaze movements.
  - When speech concludes (`speaking: false`), restores ambient idle state.

---

## 11. Premium 'Add to chat' Sheet, Live Voice Captioning & Cross-Chat Vector Memory

### 1. Premium 'Add to chat' Sheet (`AddToChatSheet.jsx`)
- **Native Mobile Bottom Sheet & Apple-Grade Modal**:
  - Replicates the exact mobile UI with rounded drag handle, `✕` close button, and centered `Add to chat` header.
  - **4 Media Action Cards**:
    - 📷 **Camera**: Triggers direct device camera capture.
    - 🖼️ **Photos**: Photo gallery upload (`image/*`).
    - 🎥 **Videos**: Dedicated video upload (`video/*`).
    - 📁 **Files**: Document & code file upload (`.pdf, .txt, .md, .doc, .docx`).
  - **Option Rows**:
    - 📦 **Add to project**: Displays project status / selector.
    - 🌐 **Web search**: iOS-style toggle switch controlling real-time Tavily search.
    - 〰️ **Connectors**: Direct link to `/socials` integration hub.
    - 🧠 **Memory**: iOS-style toggle switch controlling cross-chat memory retrieval.

### 2. Live Voice Captioning Stream
- **Real-Time Word-by-Word Captioning**:
  - In `ChatArea.jsx` and `FollowUpInput.jsx`, speech recognition captures `interimTranscript` alongside `finalTranscript`.
  - Displays a dedicated glassmorphism **Live Speech Caption Bar** directly above the input box during microphone recording.
  - Features an animated 4-bar audio equalizer waveform, pulsing recording beacon, live streaming transcript text, and a "Done" button.

### 3. Cross-Chat Vector Memory Engine
- **Mechanism**:
  - Toggle persisted in `localStorage` (`parsu_memory_enabled` with backwards compatibility fallback to `perplexity_memory_enabled`).
  - When enabled, `sendMessage` in `chat.controller.js` retrieves past messages from all other conversation threads belonging to the same user.
  - Uses `generateEmbedding` with `text-embedding-004` and `cosineSimilarity` (`embedding.service.js`) to semantically match the user's prompt against prior conversations.
  - Extracts the top 3-4 concise memory snippets (~1-2 sentences each) and injects them into Gemini's `systemContent` and model context.
  - Asynchronously saves 768-dimension vectors for every user and AI message into MongoDB (`message.embedding`), saving tokens and providing instant context across all chats.


