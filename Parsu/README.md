<div align="center">

# ⚡ PARSU AI
### Multi-Model Autonomous AI Workspace & Social Command Center

[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite_7-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js_20+-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express_5-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB_9-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
[![Google Cloud](https://img.shields.io/badge/Google_Cloud-4285F4?style=for-the-badge&logo=google-cloud&logoColor=white)](https://cloud.google.com/)

<p align="center">
  <b>Research deeper. Think faster. Publish everywhere.</b><br />
  A next-generation AI workspace uniting leading foundation models, live Tavily web grounding, hands-free voice automation, Google Workspace, and direct 1-click publishing across seven social networks.
</p>

[Live Demo](https://parsuai.vercel.app/) • [API Endpoint](https://parsuai.onrender.com) • [Documentation](#table-of-contents) • [Getting Started](#-getting-started)

---

</div>

## 📑 Table of Contents
- [✨ Key Highlights](#-key-highlights)
- [🧠 Multi-Model AI Engine](#-multi-model-ai-engine)
- [🌐 System Architecture](#-system-architecture)
- [🧩 Component Breakdown & Feature Deep Dive](#-component-breakdown--feature-deep-dive)
  - [1. Landing Page Showcase (`LandingPage.jsx`)](#1-landing-page-showcase-landingpagejsx)
  - [2. Minimal Dashboard & Chat Workspace (`ChatArea.jsx`)](#2-minimal-dashboard--chat-workspace-chatareajsx)
  - [3. Interactive Live Demo Stage (`DemoStage.jsx`)](#3-interactive-live-demo-stage-demostagejsx)
  - [4. Multi-Layer AddToChat Sheet (`AddToChatSheet.jsx`)](#4-multi-layer-addtochat-sheet-addtochatsheetjsx)
  - [5. Full-Screen Prompt & Code Studio](#5-full-screen-prompt--code-studio)
  - [6. Jarvis Hands-Free Voice Agent (`VoiceMode.jsx`)](#6-jarvis-hands-free-voice-agent-voicemodejsx)
  - [7. Google Workspace Integration Hub (`GoogleWorkspaceHub.jsx`)](#7-google-workspace-integration-hub-googleworkspacehubjsx)
  - [8. Universal Social Media Command Center (`SocialMediaPublisher.jsx`)](#8-universal-social-media-command-center-socialmediapublisherjsx)
  - [9. BYOK Encrypted Custom Key Manager](#9-byok-encrypted-custom-key-manager)
  - [10. Apple-Grade Admin Portal & Live Telemetry](#10-apple-grade-admin-portal--live-telemetry)
- [💻 Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Repository Cloning](#repository-cloning)
  - [Backend Setup & Environment Variables](#backend-setup--environment-variables)
  - [Frontend Setup & Environment Variables](#frontend-setup--environment-variables)
  - [Running Locally](#running-locally)
- [🔒 Security & Google User Data Compliance](#-security--google-user-data-compliance)
- [🎨 Design System & Aesthetic Tokens](#-design-system--aesthetic-tokens)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## ✨ Key Highlights

- **🎯 Zero-Bloat Minimal Dashboard**: Focused chat canvas with glowing PARSU AI brand header, instant capability shortcut chips, backend daily suggestions, and clean floating input bar.
- **⚡ Hot Model Switching**: Switch seamlessly between **Google Gemini 3.6 Flash**, **Anthropic Claude 3.5 Sonnet**, **OpenAI GPT-4o**, and **DeepSeek R1/V3** in active threads without losing conversation context.
- **🎙️ Full-Duplex Live Voice Agent**: Hands-free conversation engine featuring real-time speech synthesis, live captions, intent routing, and local computer app control (Spotify, Chrome, YouTube).
- **🔎 Real-Time Web Grounding**: Live internet search powered by Tavily returning clickable URL citations and timestamped sources to eliminate hallucinations.
- **📬 Personal Google Workspace Sync**: Seamless OAuth integration for Gmail (search & draft replies), Google Calendar (event creation & availability checks), Google Drive (file reading & storage), and YouTube.
- **🚀 1-Click Publishing to 7 Networks**: Direct posting and scheduling with AI captions to **Instagram, YouTube, Facebook, X (Twitter), LinkedIn, TikTok, and Pinterest**.
- **🔑 Bring Your Own Key (BYOK)**: Store your own API keys securely with AES-256 local encrypted storage for high-throughput, rate-limit-free research.
- **👾 Reactive JellyBlob Mascot**: Expressive SVG physics blob that reacts dynamically to typing, thinking, hovering, and errors.
- **💎 Apple-Grade Aesthetics**: Glassmorphic UI, obsidian dark and crisp light themes, Lenis smooth scrolling, and View Transitions API.

---

## 🧠 Multi-Model AI Engine

Parsu AI orchestrates multiple foundation models through a unified LangChain tool-calling loop:

| Model | Provider | Context Window | Best Used For |
|---|---|---|---|
| **Gemini 3.6 Flash** *(Default)* | Google DeepMind | 1,000,000 tokens | Real-time multimodal reasoning, document analysis, low latency |
| **Claude 3.5 Sonnet** | Anthropic | 200,000 tokens | Complex code architecture, nuanced creative writing, system analysis |
| **GPT-4o** | OpenAI | 128,000 tokens | General reasoning, structured data extraction, conversational fluency |
| **DeepSeek R1 / V3** | DeepSeek | 64,000 tokens | Deep algorithmic reasoning, mathematical proofs, budget-friendly high logic |
| **Mistral NeMo 12B** | Mistral AI | 128,000 tokens | Open-weight high performance, multilingual tasks, rate-limit fallback |
| **Groq Llama 3.3 70B** | Groq | 128,000 tokens | Ultra-fast token streaming (500+ tokens/sec) |

---

## 🌐 System Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│                         PARSU AI CLIENT (REACT 19 + VITE 7)            │
│  ┌───────────────────────┐  ┌──────────────────────┐  ┌─────────────┐  │
│  │ Minimal ChatArea / UI │  │ VoiceMode (Jarvis)   │  │ LandingPage │  │
│  └───────────┬───────────┘  └──────────┬───────────┘  └──────┬──────┘  │
│              │                         │                     │         │
│              ▼                         ▼                     ▼         │
│       Redux Toolkit Store  ◄──►  Socket.io Stream ◄──► Axios REST Client│
└──────────────────────────────────────┬─────────────────────────────────┘
                                       │ HTTP / WebSockets
                                       ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        EXPRESS 5 BACKEND (NODE.JS ESM)                 │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Controllers: Auth, Chat, Models, Social, Admin, Devices         │  │
│  └───────────────────┬──────────────────────────────────────────────┘  │
│                      │                                                 │
│                      ▼                                                 │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ AI Execution Engine (LangChain Tool Loop & Multi-Provider Router)│  │
│  ├─────────────────┬───────────────────┬────────────────────────────┤  │
│  │ Tavily Web Tool │ Gmail/OAuth Tool  │ Universal Social Publisher │  │
│  └─────────────────┴───────────────────┴────────────────────────────┘  │
│                      │                                                 │
│                      ▼                                                 │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ MongoDB Database (Users, Chats, Messages, Encrypted Tokens)      │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────┬─────────────────────────────────┘
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        ▼                              ▼                              ▼
 ┌──────────────┐               ┌──────────────┐              ┌──────────────┐
 │ AI Providers │               │ Google APIs  │              │ Social APIs  │
 │ Gemini, Groq │               │ Gmail, Drive │              │ Instagram, X │
 │ Claude, OpenAI               │ Calendar, YT │              │ LinkedIn, FB │
 └──────────────┘               └──────────────┘              └──────────────┘
```

---

## 🧩 Component Breakdown & Feature Deep Dive

### 1. Landing Page Showcase (`LandingPage.jsx`)
- **3D Hero Workspace Tilt**: Mouse-following 3D perspective preview of the Parsu chat interface (`HeroWorkspacePreview.jsx`).
- **Interactive Live Demo Section (`DemoStage`)**: Placed directly after the hero preview, allowing guests to watch Parsu in action with real-time prompt typing and animated route plotting.
- **Five Superpowers Panels (`PANELS`)**:
  - `01`: Multi-Model Intelligence (with authentic Gemini, Claude, GPT-4o, and DeepSeek SVG logos).
  - `02`: Live Search Grounding (with direct citations, timestamps, and zero hallucination).
  - `03`: Works with Google (with official Gmail, Google Calendar, Drive, and YouTube badges).
  - `04`: Publish to Seven Networks (with Instagram, X, LinkedIn, YouTube, Facebook, Pinterest, and TikTok badges).
  - `05`: Talk to it & Adaptive Memory (hands-free Jarvis agent + cross-session preference memory).
- **High-Contrast Stats Strip (`STATS`)**: Solid high-contrast figures (`text-zinc-950 dark:text-white`) with unified cyan icon badges (`4+ Models`, `7 Social Networks`, `4 Google Integrations`, `256-bit AES Encryption`).
- **Google OAuth Transparency**: Explicit disclosure cards explaining every requested permission scope in full compliance with the Google API Services User Data Policy.

### 2. Minimal Dashboard & Chat Workspace (`ChatArea.jsx`)
- **Brand Header**: Minimal glowing cyan icon badge and bold "PARSU AI" title without distracting marketing banners or "start chatting" buttons.
- **Capability Shortcuts**: Instant 1-click test chips:
  - *Explain quantum computing simply*
  - *Open Spotify & search lofi*
  - *Draft an Instagram caption*
  - *Summarize unread Gmail*
  - *Plan a 3-day trip to Munnar*
  - *Write Python automation script*
  - *Live hands-free voice talk*
- **Daily Suggestions & Trending Topics**: Real-time queries and news cards retrieved dynamically from the backend recommendation engine.
- **Instant Skeleton Loading in Sidebar**: Sidebar instantly displays skeleton loading for new chats while title generation runs asynchronously, preventing interface lag or double-thread creation.

### 3. Interactive Live Demo Stage (`DemoStage.jsx`)
- Built with GSAP timeline sequencing:
  - Automated typewriter simulation of sample prompts.
  - Interactive feature tabs with pause-on-hover mechanics.
  - Dynamic route drawer (`MapVisual`) and voice audio bars (`VoiceVisual`).

### 4. Multi-Layer AddToChat Sheet (`AddToChatSheet.jsx`)
- Accessible via the `+` button in the chat input bar.
- Supported attachments:
  - **Camera**: Instant photo capture.
  - **Photos & Videos**: Upload images and video files with direct preview in `AttachmentPreviewStrip.jsx`.
  - **Documents**: Upload PDF, text, and code files for contextual ingestion.
  - **Web Search Toggle**: Enable/disable live Tavily internet search.
  - **Adaptive Memory Toggle**: Enable/disable personalized memory across conversations.
  - **Model Switcher**: Switch the active LLM on the fly.

### 5. Full-Screen Prompt & Code Studio
- Clicking "Full Screen" on multi-line prompts opens a distraction-free, code-ready editor portal (`z-[9980]`).
- Features `Tab` key indentation support (inserts 2 spaces), monospace font auto-detection, live line/character count telemetry, and code formatting preservation.

### 6. Jarvis Hands-Free Voice Agent (`VoiceMode.jsx`)
- **Full-Duplex Speech**: Bi-directional audio interaction using browser SpeechRecognition and SpeechSynthesis.
- **Intent Dispatcher (`useVoiceAgent.js`)**: Interprets intents such as opening local desktop applications (Spotify, Chrome, VS Code), searching the web, or planning schedules.
- **Live Sound Waveform**: Frequency-reacting visualizer pulsing with voice cadence.

### 7. Google Workspace Integration Hub (`GoogleWorkspaceHub.jsx`)
- Connect personal Google accounts securely via Google OAuth 2.0.
- **Gmail**: Summarize unread emails, generate professional drafts, and send directly with user confirmation.
- **Google Calendar**: Query daily schedules, detect scheduling conflicts, and create events.
- **Google Drive**: Search documents, read attachments, and save generated notes.
- **YouTube**: Upload generated video assets directly to personal channels.

### 8. Universal Social Media Command Center (`SocialMediaPublisher.jsx`)
- Publish text, image carousels, and videos across 7 platforms:
  - **Instagram**: Feed posts, reels, and captions with automated hashtag generation.
  - **X (Twitter)**: Single tweets and long-form threads.
  - **LinkedIn**: Professional articles and corporate updates.
  - **YouTube**: Video uploads and community posts.
  - **Facebook**: Page posts and media updates.
  - **Pinterest**: Pin creation with destination links.
  - **TikTok**: Short video uploads and hashtags.
- Backed by **ImageKit CDN** for automated media transcoding and high-speed delivery.

### 9. BYOK Encrypted Custom Key Manager
- Users can input their own Gemini, OpenAI, Claude, or Groq API keys.
- Keys are encrypted locally using **AES-256-GCM** before transmission and stored with `select: false` on Mongoose models for maximum privacy.

### 10. Apple-Grade Admin Portal & Live Telemetry
- Routes under `/admin/*`:
  - **Dashboard**: Real-time traffic, active users, session durations, and server health.
  - **Users**: Searchable directory of registered users with role management.
  - **Contacts & Newsletter**: Unified inbox for inbound contact inquiries and exportable subscriber lists.
  - **API Usage**: Google Maps monthly quota monitor and LLM token usage counters.

---

## 💻 Getting Started

### Prerequisites
- **Node.js**: `v20.x` or higher
- **npm** or **pnpm**
- **MongoDB**: Local instance or MongoDB Atlas cluster URI
- **Google Cloud Console Project**: Configured OAuth 2.0 Client ID & Secret
- **ImageKit Account**: For media uploads and image CDN hosting
- **Tavily API Key**: For real-time web search grounding

---

### Repository Cloning

```bash
# Clone the repository
git clone https://github.com/AshokKumar/parsu-ai.git

# Navigate into the project directory
cd parsu-ai
```

---

### Backend Setup & Environment Variables

1. Navigate to the `Backend` directory:
   ```bash
   cd Backend
   npm install
   ```

2. Create a `.env` file in `Backend/.env`:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173

   # Database
   MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/parsu_ai?retryWrites=true&w=majority

   # Authentication & Security
   JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters
   ENCRYPTION_KEY=your_aes_256_encryption_key_32_bytes

   # Google OAuth 2.0 (Google Workspace & Sign-In)
   GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

   # AI Provider API Keys
   GEMINI_API_KEY=your_gemini_api_key
   GROQ_API_KEY=your_groq_api_key
   MISTRAL_API_KEY=your_mistral_api_key
   OPENAI_API_KEY=your_openai_api_key
   ANTHROPIC_API_KEY=your_anthropic_api_key

   # Search Grounding
   TAVILY_API_KEY=your_tavily_search_api_key

   # Google Maps Platform
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key

   # ImageKit CDN
   IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
   IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
   IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id
   ```

3. Start the backend development server:
   ```bash
   npm run dev
   ```

---

### Frontend Setup & Environment Variables

1. In a separate terminal, navigate to the `Frontend` directory:
   ```bash
   cd Frontend
   npm install
   ```

2. Create a `.env` file in `Frontend/.env`:
   ```env
   # Backend API Endpoint
   VITE_BACKEND_URL=http://localhost:5000

   # Google Maps API Key (for frontend interactive maps)
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

   # Maintenance Mode Toggle (Set true to test maintenance screen)
   VITE_MAINTENANCE_MODE=false
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

---

## 🔒 Security & Google User Data Compliance

Parsu AI adheres strictly to industry security benchmarks and the **Google API Services User Data Policy**:

1. **Limited Use Compliance**: Data accessed via Google APIs (Gmail, Google Calendar, Google Drive, YouTube) is strictly utilized to provide and improve user-facing features. It is **never** sold, transferred to data brokers, or utilized to train general AI/ML models.
2. **Per-User On-Demand Connections**: Google Workspace integrations require explicit per-scope user approval and can be disconnected with one click in Settings or revoked at [myaccount.google.com/permissions](https://myaccount.google.com/permissions).
3. **Encrypted Tokens & Secrets**: Sensitive OAuth refresh tokens and custom user API keys are encrypted with AES-256-GCM and marked with `select: false` in Mongoose to prevent accidental serialization into API responses.
4. **Secure Cookie Authentication**: JWT access tokens are transported exclusively via `httpOnly`, `Secure`, and `SameSite=Lax` cookies, protecting sessions against Cross-Site Scripting (XSS) attacks.

---

## 🎨 Design System & Aesthetic Tokens

Parsu AI employs a tailored design system built on Vanilla CSS variables and Tailwind CSS:

```css
:root {
  --accent-cyan: #20b8cd;           /* Primary brand action color */
  --accent-cyan-hover: #1898a9;     /* Interactive button hover */
  --color-clear-hanada: #20b8cd;    /* Accent highlight borders */
  --bg-primary: #070809;            /* Obsidian dark canvas */
  --bg-secondary: #0e1012;          /* Secondary container background */
  --bg-surface: #131518;            /* Card and modal surfaces */
  --border-secondary: #1f2328;      /* Subtle border boundaries */
}

/* Light Mode Overrides */
.light {
  --bg-primary: #f8fafc;            /* Balanced glare-free canvas */
  --bg-secondary: #ffffff;          /* Crisp card surfaces */
  --bg-surface: #ffffff;            /* Modal and card surfaces */
  --border-secondary: #e2e8f0;      /* Gentle border boundaries */
}
```

---

## 🤝 Contributing

We welcome community contributions, bug fixes, and feature enhancements!

1. **Fork the repository**
2. **Create a feature branch**:
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**:
   ```bash
   git commit -m 'feat: add amazing feature'
   ```
4. **Push to your branch**:
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for more information.

<div align="center">
  <sub>Crafted with passion by Ashok Kumar & the Parsu AI Team.</sub>
</div>
