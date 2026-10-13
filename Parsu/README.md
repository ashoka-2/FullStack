<div align="center">

# ⚡ PARSU AI
### Multi-Model Autonomous AI Workspace, Voice Agent & Universal Social Command Center

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
  An autonomous, enterprise-grade AI operating workspace uniting leading foundation models, real-time web search grounding, hands-free Jarvis voice automation, Google Workspace productivity, and direct 1-click social broadcasting across seven platforms.
</p>

[Live Production App](https://parsuai.vercel.app/) • [Backend API Service](https://parsuai.onrender.com) • [Complete Features](#-complete-feature-matrix) • [API Reference](#-backend-api-reference) • [Getting Started](#-getting-started)

---

</div>

## 📑 Table of Contents
- [✨ Core Capabilities](#-core-capabilities)
- [🧠 Foundation Model Suite](#-foundation-model-suite)
- [🌐 System Architecture](#-system-architecture)
- [🧩 Complete Feature Matrix](#-complete-feature-matrix)
  - [1. Minimal Workspace & Chat Canvas (`ChatArea.jsx`)](#1-minimal-workspace--chat-canvas-chatareajsx)
  - [2. Multi-Provider Hot Model Switching](#2-multi-provider-hot-model-switching)
  - [3. Jarvis Hands-Free Voice Agent (`VoiceMode.jsx`)](#3-jarvis-hands-free-voice-agent-voicemodejsx)
  - [4. Real-Time Web Search Grounding (Tavily)](#4-real-time-web-search-grounding-tavily)
  - [5. Thinking Mode & Deep Reasoning Inspector](#5-thinking-mode--deep-reasoning-inspector)
  - [6. Multi-Attachment Ingestion & Vision OCR](#6-multi-attachment-ingestion--vision-ocr)
  - [7. Code Studio & Interactive Artifact Playground](#7-code-studio--interactive-artifact-playground)
  - [8. Google Workspace Integration Hub (`GoogleWorkspaceHub.jsx`)](#8-google-workspace-integration-hub-googleworkspacehubjsx)
  - [9. Universal 7-Platform Social Command Center (`SocialMediaPublisher.jsx`)](#9-universal-7-platform-social-command-center-socialmediapublisherjsx)
  - [10. Interactive Route Plotting & Google Maps Engine](#10-interactive-route-plotting--google-maps-engine)
  - [11. Long-Term Adaptive Memory & Custom Persona Engine](#11-long-term-adaptive-memory--custom-persona-engine)
  - [12. JellyBlob Reactive Physics Companion Mascot](#12-jellyblob-reactive-physics-companion-mascot)
  - [13. Universal Semantic Library Search & Command Palette (`Cmd+K`)](#13-universal-semantic-library-search--command-palette-cmdk)
  - [14. Bring Your Own Key (BYOK) AES-256 Vault](#14-bring-your-own-key-byok-aes-256-vault)
  - [15. Interactive AI Guided Tours & Walkthroughs (`useGuideEngine`)](#15-interactive-ai-guided-tours--walkthroughs-useguideengine)
  - [16. Admin Control Center & Connector Lock Manager](#16-admin-control-center--connector-lock-manager)
  - [17. Multi-Device Session Heartbeat Manager](#17-multi-device-session-heartbeat-manager)
  - [18. Offline-Ready PWA & Web Push Notification Center](#18-offline-ready-pwa--web-push-notification-center)
  - [19. Export & Secure Public Sharing (Markdown, PDF, JSON)](#19-export--secure-public-sharing-markdown-pdf-json)
- [📡 Backend API Reference](#-backend-api-reference)
- [💻 Getting Started & Local Setup](#-getting-started--local-setup)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [🔒 Security & Google User Data Policy Compliance](#-security--google-user-data-policy-compliance)
- [🎨 Design Tokens & UI Architecture](#-design-tokens--ui-architecture)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## ✨ Core Capabilities

- **⚡ Zero-Latency AI Workflow**: Real-time token streaming with ultra-responsive UX built on React 19 and Vite 7.
- **🔄 Multi-Model Switching**: Seamlessly toggle between Google Gemini 3.6 Flash, Anthropic Claude 3.5 Sonnet, OpenAI GPT-4o, and DeepSeek R1/V3 within any active conversation.
- **🎙️ Voice Operating System**: Hands-free conversation engine capable of triggering real desktop actions like opening Spotify, YouTube, or Google Chrome.
- **🔎 Verified Web Grounding**: Live citations and verified timestamped sources via Tavily eliminate hallucination for news, stock data, and research.
- **📬 Personal Google Hub**: OAuth 2.0 integration allowing Parsu to read, draft, and organize Gmail, schedule Google Calendar events, and inspect Google Drive assets.
- **🚀 7-Channel Social Broadcaster**: Compose once with AI-enhanced copy and broadcast directly to Instagram, YouTube, X (Twitter), LinkedIn, Facebook, Pinterest, and TikTok.
- **🔐 Client-Side AES-256 BYOK**: Complete data sovereignty—encrypt and store your private API keys locally without server telemetry exposure.
- **🗺️ Visual Navigation**: Interactive Google Maps cards with dynamic route plotting, waypoints, and travel duration estimates directly in chat bubbles.
- **👾 Reactive Physics Mascot**: JellyBlob companion renders emotions, eye gaze tracking, and physical wobbles aligned with model generation state.

---

## 🧠 Foundation Model Suite

Parsu AI unifies multiple AI providers through an intelligent router and fallback orchestrator:

| Model | Provider | Context Window | Specialization |
|---|---|---|---|
| **Gemini 3.6 Flash** *(Default)* | Google DeepMind | 1,000,000 tokens | Real-time multimodal reasoning, document ingestion, near-zero latency |
| **Claude 3.5 Sonnet** | Anthropic | 200,000 tokens | Complex code architecture, nuanced creative writing, system analysis |
| **GPT-4o** | OpenAI | 128,000 tokens | General reasoning, structured JSON data extraction, conversational fluency |
| **DeepSeek R1 / V3** | DeepSeek | 64,000 tokens | Deep algorithmic reasoning, mathematical proofs, step-by-step logic |
| **Mistral NeMo 12B** | Mistral AI | 128,000 tokens | Open-weight high performance, multilingual tasks, rate-limit fallback |
| **Groq Llama 3.3 70B** | Groq | 128,000 tokens | Ultra-fast token streaming (up to 500+ tokens/sec) |

---

## 🌐 System Architecture

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           PARSU CLIENT (REACT 19 + VITE 7)                      │
│  ┌───────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐  │
│  │ Minimal ChatArea / UI │  │ VoiceMode (Jarvis)   │  │ Guided Tour Engine   │  │
│  └───────────┬───────────┘  └──────────┬───────────┘  └──────────┬───────────┘  │
│              │                         │                         │              │
│              ▼                         ▼                         ▼              │
│       Redux Toolkit Store  ◄──►  Socket.io Stream ◄──► Axios REST Client       │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │ HTTPS / WebSockets (WSS)
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         NODE.JS / EXPRESS 5 BACKEND (ESM)                       │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │ Controllers: Auth, Chat, Models, Social, Admin, Devices, Workspace        │  │
│  └─────────────────────────────────────┬─────────────────────────────────────┘  │
│                                        │                                        │
│                                        ▼                                        │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │ AI Execution Engine (LangChain Tool Loop & Multi-Provider Model Router)   │  │
│  ├───────────────────┬───────────────────┬───────────────────┬───────────────┤  │
│  │ Tavily Web Search │ Google Workspace  │ Social Publisher  │ Maps Engine   │  │
│  └───────────────────┴───────────────────┴───────────────────┴───────────────┘  │
│                                        │                                        │
│                                        ▼                                        │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │ MongoDB 9 Database (Users, Conversations, Encrypted Secrets, Telemetry)   │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │
         ┌───────────────────────────────┼───────────────────────────────┐
         ▼                               ▼                               ▼
  ┌──────────────┐                ┌──────────────┐                ┌──────────────┐
  │ AI Providers │                │ Google APIs  │                │ Social APIs  │
  │ Gemini, Groq │                │ Gmail, Drive │                │ Instagram, X │
  │ Claude, OpenAI                │ Calendar, YT │                │ LinkedIn, FB │
  └──────────────┘                └──────────────┘                └──────────────┘
```

---

## 🧩 Complete Feature Matrix

### 1. Minimal Workspace & Chat Canvas (`ChatArea.jsx`)
- **Zero-Distraction Header**: Glowing brand insignia and clean minimalist styling without clunky promotional banners.
- **Instant Starter Chips**: One-tap query shortcuts covering coding, research, email summaries, travel planning, and desktop app execution.
- **Dynamic Trending Topics**: Live suggestions retrieved from the backend recommendation engine reflecting real-world trends.
- **Smart Skeleton Streaming**: Real-time optimistic UI renders smooth placeholder skeletons while asynchronous title generation and streaming run in the background.

### 2. Multi-Provider Hot Model Switching
- Toggle active models on the fly mid-conversation without interrupting message history or resetting context.
- Automatic graceful fallback routes queries to alternative providers if an upstream rate limit is encountered.

### 3. Jarvis Hands-Free Voice Agent (`VoiceMode.jsx`)
- **Full-Duplex Speech**: Real-time bi-directional conversation powered by browser Web Speech APIs and custom voice synthesizers.
- **Intent Dispatcher (`useVoiceAgent.js`)**: Executes desktop and web actions directly from vocal commands (e.g., *"Play lofi on Spotify"*, *"Open YouTube and search tech reviews"*, *"Search the web for stock prices"*).
- **Audio Visualizer**: Responsive real-time frequency bars reacting fluidly to incoming vocal audio levels.

### 4. Real-Time Web Search Grounding (Tavily)
- Autonomous tool execution triggers internet searches when up-to-the-minute information is requested.
- Outputs structured citation badges with direct URLs, site favicons, and verified publish dates to guarantee data authenticity.

### 5. Thinking Mode & Deep Reasoning Inspector
- Collapsible deep reasoning accordion displays the model's step-by-step logic, intermediate verification, and tool dispatch logs.
- Displays exact thinking time duration (e.g., *Thought for 3.4 seconds*) so users can audit AI cognition.

### 6. Multi-Attachment Ingestion & Vision OCR
- **Image & Video Analysis**: Upload PNG, JPG, WebP, and MP4 files with instant thumbnail previews in `AttachmentPreviewStrip.jsx`.
- **Document Reading**: Ingest PDFs, Word documents, text files, and CSV datasets for deep contextual synthesis.
- **Direct Camera Capture**: Instant photo capture modal directly within the input sheet.

### 7. Code Studio & Interactive Artifact Playground
- **Full-Screen Prompt Portal**: Expand long-form prompts and code into a distraction-free IDE-like editor (`z-[9980]`) with live character and line metrics.
- **Tab Key Indentation**: Native 2-space tab insertion support without losing cursor position.
- **Multi-Language Highlighting**: Syntax highlighting for 50+ programming languages with 1-click clipboard copying and file downloads.

### 8. Google Workspace Integration Hub (`GoogleWorkspaceHub.jsx`)
- Secure Google OAuth 2.0 connection granting tailored access:
  - **Gmail**: Read unread emails, generate categorized summaries, and draft contextual replies.
  - **Google Calendar**: Query schedules, highlight double-bookings, and schedule new calendar events.
  - **Google Drive**: Ingest and query drive files, retrieve PDFs, and export chat outputs.
  - **YouTube**: Upload AI-generated videos and review analytics.

### 9. Universal 7-Platform Social Command Center (`SocialMediaPublisher.jsx`)
- Unified multi-network post composer:
  - **Instagram**: Feed posts, reels, carousel images, and auto-generated hashtags.
  - **X (Twitter)**: Single posts and multi-tweet sequential threads.
  - **LinkedIn**: Professional articles, company updates, and polls.
  - **YouTube**: Community updates and short video uploads.
  - **Facebook**: Page updates and rich media carousels.
  - **Pinterest**: Pins with rich metadata and destination URLs.
  - **TikTok**: Short video uploads and trending caption tags.
- Powered by **ImageKit CDN** for rapid image transcoding, cropping, and high-performance delivery.

### 10. Interactive Route Plotting & Google Maps Engine
- Chat responses containing travel queries or geographic directions render interactive Google Maps cards.
- Visualizes start, waypoint, and destination markers with route polylines and estimated travel durations.

### 11. Long-Term Adaptive Memory & Custom Persona Engine
- **Cross-Session Memory**: Remembers user preferences, project details, coding stack choices, and background info across threads.
- **Custom System Instructions**: Set persona tone, response length limits, output formatting, and domain expertise.
- **Granular Memory Management**: Search, inspect, and delete specific memory records at any time.

### 12. JellyBlob Reactive Physics Companion Mascot
- Interactive SVG physics mascot that expresses emotion:
  - **Idle**: Gentle breathing and ambient eye blinking.
  - **Typing**: Follows the user's cursor across the screen.
  - **Thinking**: Orbiting thought bubbles with elastic wobbles.
  - **Success & Error**: Distinct audio-visual animations celebrating answers or alerting to issues.

### 13. Universal Semantic Library Search & Command Palette (`Cmd+K`)
- Rapid search across all conversation threads, prompts, pinned messages, and shared artifacts.
- Keyboard navigation with instant previews for quick thread resumption.

### 14. Bring Your Own Key (BYOK) AES-256 Vault
- Bring personal API keys for Gemini, OpenAI, Anthropic, or Groq.
- Encrypted on the client using AES-256-GCM prior to storage and protected on MongoDB with `select: false` attributes.

### 15. Interactive AI Guided Tours & Walkthroughs (`useGuideEngine`)
- **Interactive Tour Cards**: When the AI explains how to use an app feature, an embedded tour card with a 1-tap *"Take Live Tour"* action appears in the response.
- **Smooth View Transitions**: Glides the user to the target settings page using the native View Transitions API with audio cues and mascot escorting without resetting chat history.

### 16. Admin Control Center & Connector Lock Manager
- **Central Connector Toggles**: Lock or unlock social networks (`Live`, `Locked by Admin`, `Maintenance`).
- **Telemetry Dashboard**: Live metrics tracking active users, total messages, token consumption, and Google API quotas.
- **User Management**: Searchable directory for user role assignment and moderation.

### 17. Multi-Device Session Heartbeat Manager
- Track active web and mobile sessions with browser user-agent, IP address, and location.
- Terminate stale or unauthorized sessions with 1 click.

### 18. Offline-Ready PWA & Web Push Notification Center
- Fully installable Progressive Web App on macOS, Windows, iOS, and Android.
- Background Service Worker (`sw.js`) caches critical assets for offline reliability.
- VAPID Web Push notifications alert users to scheduled social posts and background research completion.

### 19. Export & Secure Public Sharing (Markdown, PDF, JSON)
- Export conversations as Markdown documents, printable PDFs, or JSON data.
- Generate shareable public links with private credential masking for seamless collaboration.

---

## 📡 Backend API Reference

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/auth/register` | `POST` | Public | Register new user account |
| `/api/auth/login` | `POST` | Public | Authenticate user & issue HTTP-only JWT |
| `/api/auth/google` | `GET` | Public | Initiate Google OAuth 2.0 flow |
| `/api/auth/google/callback` | `GET` | Public | Google OAuth callback handler |
| `/api/auth/me` | `GET` | User | Retrieve current user profile |
| `/api/auth/logout` | `POST` | User | Clear session cookies & revoke tokens |
| `/api/chat` | `POST` | User | Send message & stream AI token output |
| `/api/chat/history` | `GET` | User | Fetch paginated chat history |
| `/api/chat/:id` | `GET` | User | Retrieve single conversation thread |
| `/api/chat/:id` | `DELETE` | User | Delete conversation thread |
| `/api/models` | `GET` | User | List available models & status |
| `/api/social/publish` | `POST` | User | Broadcast post across connected platforms |
| `/api/social/connectors` | `GET` | User | Get status of social media connectors |
| `/api/google/workspace/status` | `GET` | User | Check connected Google Workspace services |
| `/api/admin/metrics` | `GET` | Admin | Retrieve server telemetry & usage metrics |
| `/api/admin/connectors` | `PUT` | Admin | Toggle connector locks & maintenance status |
| `/api/devices` | `GET` | User | List active user device sessions |
| `/api/devices/:id` | `DELETE` | User | Terminate specific device session |

---

## 💻 Getting Started & Local Setup

### Prerequisites
- **Node.js**: `v20.x` or higher
- **npm** or **pnpm**
- **MongoDB**: Local MongoDB instance or MongoDB Atlas URI
- **Google Cloud Console Project**: OAuth 2.0 Client ID & Secret
- **Tavily API Key**: Real-time web search grounding

---

### Backend Setup

1. **Clone the repository and enter the directory**:
   ```bash
   git clone https://github.com/AshokKumar/parsu-ai.git
   cd parsu-ai/Backend
   npm install
   ```

2. **Configure environment variables in `Backend/.env`**:
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

   # AI Provider Keys
   GEMINI_API_KEY=your_gemini_api_key
   GROQ_API_KEY=your_groq_api_key
   MISTRAL_API_KEY=your_mistral_api_key
   OPENAI_API_KEY=your_openai_api_key
   ANTHROPIC_API_KEY=your_anthropic_api_key

   # Web Search Grounding
   TAVILY_API_KEY=your_tavily_search_api_key

   # Google Maps Platform
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key

   # ImageKit CDN
   IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
   IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
   IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id
   ```

3. **Start the backend server**:
   ```bash
   npm run dev
   ```

---

### Frontend Setup

1. **Navigate to the `Frontend` directory**:
   ```bash
   cd ../Frontend
   npm install
   ```

2. **Configure environment variables in `Frontend/.env`**:
   ```env
   # Backend API Endpoint
   VITE_BACKEND_URL=http://localhost:5000

   # Google Maps Platform (Frontend Map Previews)
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

   # Maintenance Mode Toggle
   VITE_MAINTENANCE_MODE=false
   ```

3. **Start the Vite dev server**:
   ```bash
   npm run dev
   ```

4. **Open in browser**:
   ```
   http://localhost:5173
   ```

---

## 🔒 Security & Google User Data Policy Compliance

Parsu AI adheres strictly to industry security benchmarks and the **Google API Services User Data Policy**:

1. **Limited Use Compliance**: Data accessed via Google APIs (Gmail, Google Calendar, Google Drive, YouTube) is strictly utilized to provide and improve user-facing features. It is **never** sold, transferred to data brokers, or utilized to train general AI/ML models.
2. **Per-User On-Demand Connections**: Google Workspace integrations require explicit per-scope user approval and can be disconnected with one click in Settings or revoked at [myaccount.google.com/permissions](https://myaccount.google.com/permissions).
3. **Encrypted Tokens & Secrets**: Sensitive OAuth refresh tokens and custom user API keys are encrypted with AES-256-GCM and marked with `select: false` in Mongoose to prevent accidental serialization into API responses.
4. **Secure Cookie Authentication**: JWT access tokens are transported exclusively via `httpOnly`, `Secure`, and `SameSite=Lax` cookies, protecting sessions against Cross-Site Scripting (XSS) attacks.

---

## 🎨 Design Tokens & UI Architecture

Parsu AI employs a tailored design token system built on Vanilla CSS variables and Tailwind CSS:

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

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to your branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for more information.

<div align="center">
  <sub>Crafted with passion by Ashok Kumar & the Parsu AI Team.</sub>
</div>
