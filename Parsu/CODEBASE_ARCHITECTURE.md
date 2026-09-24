# CODEBASE ARCHITECTURE — Parsu AI Social Media Command Center

> **Last Updated:** September 23, 2026
> **Maintainer:** Ashok Kumar
> **Live Frontend URL:** https://parsuai.vercel.app/
> **Live Backend URL:** https://parsuai.onrender.com
> **Purpose:** Structural blueprint and technical documentation for developers and AI agents.

---

## PROJECT OVERVIEW

Parsu AI is an AI-powered conversational search platform and social media command center. Users can chat with multiple state-of-the-art AI models, upload rich media (photos, videos, documents), manage custom API keys, and publish generated content directly to 7 social media platforms (Instagram, Facebook, Pinterest, Twitter/X, TikTok, LinkedIn, YouTube) with AI-generated captions and album carousels.

---

## TECH STACK

| Layer | Technology |
|---|---|
| Frontend Framework | React 19 + Vite 7 |
| Styling & Theme | Tailwind CSS v4 + Vanilla CSS Design System |
| State Management | Redux Toolkit (auth, chat, toasts) |
| Routing | React Router v7 |
| Smooth Scrolling | Lenis React (`@studio-freight/lenis`) |
| Interactive Mascot | Custom SVG JellyBlob with Physics & Motion |
| Markdown & Code | ReactMarkdown + remark-gfm + react-syntax-highlighter (Prism vscDarkPlus) |
| Icons | Remix Icons (`@remixicon/react`) |
| Backend Framework | Express 5 (ESM modules) |
| Database | MongoDB via Mongoose 9 |
| Authentication | JWT (httpOnly cookies) + Google OAuth 2.0 |
| AI Architecture | LangChain + Google Gen AI SDK + Mistral AI SDK |
| Supported Models | Gemini 3.6 Flash, Gemini Pro, Mistral NeMo 12B, Codestral, Groq Llama, DeepSeek R1/V3, Claude, OpenAI |
| Media Storage | ImageKit CDN |
| Real-time Streaming | Socket.io + Server-Sent Events (SSE) |
| Email Service | Nodemailer via Google OAuth2 |

---

## FOLDER STRUCTURE

```
/Perplexity
├── Backend/
│   ├── server.js                        # HTTP server + Socket.io entry point
│   ├── .env                             # Environment variables & secrets
│   ├── .env.example                     # Env template
│   ├── package.json
│   └── src/
│       ├── app.js                       # Express app configuration & middlewares
│       ├── config/
│       │   ├── database.js              # MongoDB Mongoose connection
│       │   └── redis.js                 # Optional Redis client
│       ├── controllers/
│       │   ├── auth.controller.js       # Register, Login, Google OAuth, Email verification
│       │   ├── chat.controller.js       # Send message, get threads, search, suggestions
│       │   ├── model.controller.js      # List models, test keys, save encrypted custom keys
│       │   └── social.controller.js     # OAuth flows & publishing across 7 social platforms
│       ├── middlewares/
│       │   ├── auth.middleware.js       # JWT cookie validation
│       │   └── rateLimiter.middleware.js# Endpoint rate limiting
│       ├── models/
│       │   ├── user.model.js            # User accounts & encrypted customApiKeys
│       │   ├── chat.model.js            # Chat thread schema
│       │   ├── message.model.js         # Message schema (roles, files, social posts)
│       │   └── social.model.js          # Platform OAuth tokens (select: false)
│       ├── routes/
│       │   ├── auth.routes.js           # /api/auth/* routes
│       │   ├── chat.routes.js           # /api/chats/* routes
│       │   ├── model.routes.js          # /api/models/* routes
│       │   └── social.routes.js         # /api/social/* routes
│       ├── services/
│       │   ├── imagekit.service.js      # ImageKit media upload & CDN hosting
│       │   ├── mail.service.js          # Nodemailer email verification
│       │   ├── model.service.js         # Multi-provider chat engine & model registry
│       │   ├── social.service.js        # Universal social media publish handler
│       │   ├── ai/
│       │   │   ├── models.js            # Gemini (3.6 Flash) & Mistral (NeMo 12B) instances
│       │   │   ├── chat.generator.js    # LangChain multi-step agent loop & fallbacks
│       │   │   ├── title.service.js     # Automatic thread title generator
│       │   │   └── suggestions.service.js# Contextual query suggestions
│       │   └── Tools/
│       │       ├── search.tool.js       # Tavily web search tool
│       │       ├── email.tool.js        # Automated email tool
│       │       └── instagram.tool.js    # Instagram posting tool
│       └── sockets/
│           └── server.socket.js         # Real-time message streaming
│
├── Frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── .env                             # VITE_BACKEND_URL, VITE_MAINTENANCE_MODE
│   ├── package.json
│   └── src/
│       ├── main.jsx                     # Application bootstrap
│       ├── app/
│       │   ├── App.jsx                  # Root guard (Maintenance Mode, Auth & Socket init)
│       │   ├── app.routes.jsx           # React Router v7 routes configuration
│       │   ├── app.store.js             # Redux store configuration
│       │   ├── Layout.jsx               # Root layout, Lenis scroller, Theme sync, Loading overlay
│       │   ├── ErrorBoundary.jsx        # Global React error boundary
│       │   └── index.css                # Tailwind CSS v4 & custom design tokens
│       ├── utils/
│       │   ├── axios.js                 # Custom Axios with maintenance & auth interceptors
│       │   ├── maintenance.js           # VITE_MAINTENANCE_MODE evaluation helper
│       │   └── blobReactions.js         # Mascot interaction triggers
│       └── features/
│           ├── Components/              # Shared UI design system
│           │   ├── JellyBlobMascot.jsx  # Interactive SVG physics mascot
│           │   ├── FloatingBlobMascot.jsx# Persistent floating mascot container (z-[10000])
│           │   ├── Loading.jsx          # GSAP page transition preloader
│           │   ├── Toast.jsx            # Redux-backed notification toasts
│           │   ├── Footer.jsx           # Global brand & legal footer
│           │   ├── ConnectionMonitor.jsx# Offline & network interruption detector
│           │   ├── ParsuLogo.jsx        # Vector brand mark
│           │   └── ScrollToTop.jsx      # Route transition scroll reset
│           ├── pages/                   # Public & Information pages
│           │   ├── MaintenanceMode.jsx  # Complete offline maintenance page
│           │   ├── PrivacyPolicy.jsx    # Privacy policy documentation
│           │   ├── TermsOfService.jsx   # Terms of service documentation
│           │   ├── About.jsx            # Platform story & architecture
│           │   ├── Contact.jsx          # Support & feedback channels
│           │   └── FAQ.jsx              # Frequently asked questions
│           ├── auth/
│           │   ├── auth.slice.js        # Auth state management
│           │   ├── pages/               # Auth, Social Hub, & Settings pages
│           │   └── components/          # CustomKeyManager, FormField, Protected
│           └── chat/
│               ├── chat.slice.js        # Chat state management
│               ├── hook/                # useChat hook
│               ├── pages/               # Dashboard (home) & ChatPage2 (active thread)
│               └── components/
│                   ├── ChatArea.jsx     # Main prompt input with auto-grow & full-screen studio
│                   ├── FollowUpInput.jsx# Thread follow-up bar with queue & full-screen studio
│                   ├── ChatMessage.jsx  # Memoized Markdown/CodeBlock renderer with 70-line folding
│                   ├── ModelSelectorDropdown.jsx # Portaled dropdown (z-[9990]) with mobile short brand names
│                   ├── AddToChatSheet.jsx# Framer Motion animated bottom sheet with drag-to-dismiss & mobile fullscreen
│                   ├── MessageQueueTray.jsx # Queued prompts tray
│                   └── AttachmentPreviewStrip.jsx # Multi-media attachment bar
```

---

## CORE ARCHITECTURAL SUBSYSTEMS

### 1. Multi-Model AI Engine (`Backend/src/services/model.service.js`)
- **Default Models**:
  - `gemini-3.6-flash`: Ultra-fast reasoning & vision (Google)
  - `gemini-pro-latest`: Deep analysis & complex coding (Google)
  - `open-mistral-nemo`: Mistral 12B reasoning with 128k context (Free tier active)
  - `codestral-latest`: Specialized code generation & software logic (Mistral)
  - `llama-3.3-70b-versatile`: Open weights running on Groq LPU
  - `deepseek-chat` / `deepseek-reasoner`: DeepSeek V3 & R1 Chain-of-Thought
- **Custom Keys Encryption**: Users can securely attach their own API keys in Settings. Stored AES-256 encrypted in MongoDB under `User.customApiKeys`.
- **429 Rate Limit Auto-Retry**: Automatically aliases deprecated or commercial rate-limited IDs to supported free models without user interruption.

### 2. Resizable Prompt Editor & Code Format Preservation
- **Vertical Resize (`resize-y`)**: Textareas in `ChatArea.jsx` and `FollowUpInput.jsx` allow free vertical manual expansion from `44px` up to `75vh`.
- **Expand / Collapse Toggle**: Clickable button (`RiExpandUpDownLine` / `RiContractUpDownLine`) toggles an expanded multi-line code editor mode (`240px`–`300px`+).
- **Code Preservation**: `whiteSpace: 'pre-wrap'`, `tabSize: 2`, `MozTabSize: 2`, and dynamic monospace styling (`font-mono`) on code detection.
- **Tab Key Indentation**: Pressing `Tab` inserts 2 spaces without shifting keyboard focus.
- **Message Rendering**: `ChatMessage.jsx` renders syntax-highlighted code blocks with copy buttons and preserves all whitespace for user prompts.

### 3. Application Maintenance Mode System
- **Configuration**: Driven by `VITE_MAINTENANCE_MODE=true` in `.env` or Vercel Environment Variables.
- **Zero Data Fetching**:
  - `App.jsx` root guard halts `auth.handleGetMe()` and prevents WebSocket connections.
  - `axios.js` pre-request interceptor blocks any outgoing HTTP requests before leaving the client.
- **Visual Presentation**: Loads `MaintenanceMode.jsx` featuring an interactive JellyBlob mascot, status indicators, safeguard cards, and a live refresh checker.

### 4. Smooth Scrolling & Lenis Isolation
- The application uses `ReactLenis` for smooth momentum scrolling.
- All floating popovers, scroll lists, and portals (e.g., `ModelSelectorDropdown.jsx`) feature `data-lenis-prevent="true"`, `onWheel={(e) => e.stopPropagation()}`, `overscroll-contain`, and `min-h-0` to ensure internal mouse wheel scrolling functions smoothly without page stutter.

### 5. Stacking & Layering Hierarchy
| Layer | Z-Index | Component |
|---|---|---|
| JellyBlob Mascot | `z-[10000]` | `FloatingBlobMascot.jsx` |
| Portaled Dropdowns | `z-[9990]` | `ModelSelectorDropdown.jsx` |
| Floating Controls & Queue | `z-50` | `FollowUpInput.jsx`, `MessageQueueTray.jsx` |
| Sticky Navigation Headers | `z-40` | `Dashboard.jsx` header, `ChatPage2.jsx` top bar |
| Page Backdrop | `z-0` | Main application content |

### 6. Mobile Responsiveness Architecture & Proxy Resilience
- **Mobile Drawer Auto-Close & Backdrops**: All pages provide mobile backdrop dismissals (`lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]`), and `Sidebar.jsx` automatically closes upon clicking any nav item, thread, or action on mobile screens (`window.innerWidth < 1024`).
- **Responsive Typography & Mascot Scaling**: Hero titles scale smoothly (`text-3xl sm:text-5xl md:text-[5.5rem]`), mascot canvas scales down on mobile viewports (`w-40 h-40`), and the floating mascot relocates to `bottom-24 right-4 sm:bottom-6 sm:right-6` so typing inputs remain clear.
- **Table & Code Block Horizontal Isolation**: Markdown tables and syntax highlighters are wrapped in `overflow-x-auto custom-scrollbar` to prevent container stretching on narrow mobile viewports.
- **Vite Proxy ECONNREFUSED Resilience**: Vite's `server.proxy` incorporates custom error handlers in `vite.config.js` for `/api` and `/socket.io` that trap offline connection failures (`ECONNREFUSED`) and return HTTP 503 rather than logging unhandled AggregateErrors to the terminal.

### 7. AI Generation Lifecycle, Apple-Style Toolbar & Tavily Web Search System
- **Generation vs. Fetch State Isolation (`isGenerating`)**:
  - `chat.slice.js` explicitly differentiates `loading` (data fetching, thread deletion, message pagination) from `isGenerating` (active AI token streaming).
  - Prevents the false "AI is generating response... [🔴 Stop Responding]" tray and premature "Queue" button when navigating into historical chats (`/chat/:id`).
- **Apple Continuous Corner Shape Toolbar**:
  - **Attach Button**: Redesigned as an Apple-style continuous rounded circle (`rounded-full border border-zinc-300 dark:border-white/15 bg-zinc-100/90 dark:bg-white/[0.06]`) displaying only the `+` icon (`RiAddLine`), with no text.
  - **Instant Camera Button**: Directly captures photos on mobile devices using `<input type="file" accept="image/*" capture="environment" />` via `<RiCameraLine />`.
  - **Tavily Web Search Toggle**: Pill button (`<RiGlobalLine />`) toggling real-time internet searches. When ON, queries Tavily search API (`@tavily/core`) for fresh internet facts and injects citations into the LLM context. When OFF, models (Gemini, Mistral, Llama, DeepSeek) operate in pure training-knowledge mode.
- **Mobile Header Optimization (360px Viewports)**:
  - Header padding reduced from fixed `px-6` to responsive `px-2.5 sm:px-6`.
  - Knowledge tab hidden on narrow viewports (`hidden sm:flex`) to avoid horizontal clipping with ModelSelectorDropdown and Share button.

### 8. Voice & Audio Ecosystem, Adaptive Feedback Steering & Mascot Talking Animation
- **Interactive Message Feedback & Dynamic LLM Steering**:
  - `Message` schema includes `feedback: { type: String, enum: ['like', 'dislike', null], default: null }`.
  - POST `/api/chats/message/:messageId/feedback` records user thumbs-up and thumbs-down.
  - `chat.controller.js` analyzes liked and disliked responses from recent thread history and injects adaptive steering instructions into subsequent generation prompts, encouraging the AI to emulate liked response structures and avoid disliked flaws.
- **Microphone Speech-to-Text (STT)**:
  - Built into `ChatArea.jsx` and `FollowUpInput.jsx` using `SpeechRecognition` / `webkitSpeechRecognition`.
  - Continuous listening with pulsing red indicator ring and automatic transcription injection into the active prompt textarea.
- **Text-to-Speech (TTS) & Voice Settings**:
  - `ChatMessage.jsx` provides a dedicated speaker icon on all AI responses.
  - Cleans Markdown before speech synthesis (removing code blocks, raw URLs, and markdown tokens) for natural pronunciation.
  - `VoiceSettingsForm.jsx` in `Settings.jsx` allows users to select custom speech synthesis voices, pitch (0.8–1.3), and speaking rate (0.75x–1.5x) with instant preview testing.
- **Mascot Speech Synchronization (`FloatingBlobMascot.jsx`)**:
  - Global mascot listens to `blob_speech_state` events.
  - When AI speech playback starts, the mascot displays a speech bubble ("Speaking AI response... 🔊") and animates expressions (happy/wave) with dynamic gaze movements in synchronization with audio playback.

### 9. 'Add to chat' Mobile Bottom Sheet, Live Speech Captions & Vector Memory
- **'Add to chat' Bottom Sheet (`AddToChatSheet.jsx`)**:
  - Exact recreation of the mobile sheet screenshot with drag handle, close button, and 4 media cards: Camera, Photos, Videos, and Files.
  - Option rows for project linking, web search toggle, connector integration, and cross-chat memory toggle.
  - Seamlessly functions as a mobile slide-up drawer and a desktop Apple-style sheet.
- **Live Voice Captioning**:
  - Captures real-time streaming speech recognition tokens.
  - Renders a floating live captioning equalizer bubble above the input box while user is speaking.
- **Cross-Chat Memory & Vector Database (RAG)**:
  - Generates 768-dimension embeddings using `text-embedding-004`.
  - Performs semantic cosine similarity search across user's other conversation threads in MongoDB.
  - Injects top 3-4 concise recalled context snippets into Gemini and open models to maintain continuous memory across all chats with minimal token footprint.

### 10. Desktop Sidebar Collapse Rail, GSAP Preloader, Route Reload & Library Fixes
- **Desktop Sidebar Collapse into 64px Icon Rail**:
  - Toggling sidebar collapse on desktop (`lg:`) contracts the sidebar from `w-56` to `w-16` while keeping navigation icons visible and centered with tooltips.
  - Main layouts reflow smoothly from `lg:pl-56` to `lg:pl-16` using `cubic-bezier(0.4, 0, 0.2, 1)`.
  - Mobile behavior remains a responsive sliding drawer (`w-[280px]`) unaffected by desktop rail collapse.
- **Pointer Cursor System**:
  - Restored standard system hand pointer cursor (`cursor: pointer !important;`) across all buttons, links, inputs, and interactive components.
- **Route Reload & Refresh Preservation**:
  - Guarded auth checks in `Protected.jsx` and `AdminProtected.jsx` to wait until authentication is confirmed before evaluating redirect logic, preventing unintended redirection to `/ai` on page reload.
- **Library Action Fixes**:
  - Fixed chat object ID resolution (`thread._id || thread.id`) in `ThreadCard.jsx` for rename, pin toggle, and delete actions.
  - Added immediate re-fetch hooks in `Library.jsx` to reflect thread title and pin updates without reloading.
- **Ultra-Luxury OLED GSAP Preloader**:
  - Replaced SVG wave animations with an OLED dark HUD (`#050505`), floating glowing Parsu logo mark, precision numeric counter (0% to 100%), hairline neon progress bar, and buttery smooth GSAP timeline exit.



