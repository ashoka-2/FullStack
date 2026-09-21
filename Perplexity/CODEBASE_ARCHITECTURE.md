# CODEBASE ARCHITECTURE — Perplexity AI Social Media Command Center

> **Last Updated:** September 20, 2026
> **Maintainer:** Ashok Kumar
> **Purpose:** Prevent future AI agents/developers from scanning the entire repository every time.

---

## PROJECT OVERVIEW

Perplexity is an AI-powered chat platform (inspired by Perplexity.ai) with integrated social media publishing capabilities. Users can chat with AI, upload images, and publish content to connected social media accounts (Instagram, Facebook, Pinterest, Twitter/X, TikTok, LinkedIn, YouTube) directly from the chat interface using natural language commands.

---

## TECH STACK

| Layer | Technology |
|---|---|
| Frontend Framework | React 19 + Vite 7 |
| Frontend Styling | Tailwind CSS v4 |
| Frontend State | Redux Toolkit |
| Frontend Routing | React Router v7 |
| Frontend Animations | GSAP |
| Frontend Icons | Remix Icons |
| Backend Framework | Express 5 (ESM modules) |
| Database | MongoDB via Mongoose 9 |
| Authentication | JWT (httpOnly cookies) + Google OAuth 2.0 |
| AI Models | LangChain (Google Gemini + Mistral) |
| AI Tools | searchInternet, emailTool, post_to_instagram |
| Image Storage | ImageKit CDN |
| Real-time | Socket.io |
| Email | Nodemailer via Google OAuth2 |

---

## FOLDER STRUCTURE

```
/Perplexity
├── Backend/
│   ├── server.js                    # Entry point — HTTP server + Socket.io
│   ├── .env                         # Environment variables (secrets)
│   ├── .env.example                 # Template for env vars
│   ├── package.json
│   └── src/
│       ├── app.js                   # Express app setup (CORS, routes, middleware)
│       ├── config/
│       │   ├── database.js          # MongoDB connection
│       │   └── redis.js             # Redis config (unused currently)
│       ├── controllers/
│       │   ├── auth.controller.js   # Register, Login, Google OAuth, Verify Email
│       │   ├── chat.controller.js   # Send message, Get chats, Search, Suggestions
│       │   └── social.controller.js # Social OAuth flows, connect/disconnect accounts
│       ├── middlewares/
│       │   └── auth.middleware.js   # JWT cookie verification
│       ├── models/
│       │   ├── user.model.js        # User schema (with googleId, authProvider)
│       │   ├── chat.model.js        # Chat thread schema
│       │   ├── message.model.js     # Individual message schema
│       │   └── social.model.js      # Social media connections (per-platform tokens)
│       ├── routes/
│       │   ├── auth.routes.js       # /api/auth/* routes
│       │   ├── chat.routes.js       # /api/chats/* routes
│       │   └── social.routes.js     # /api/social/* routes
│       ├── services/
│       │   ├── ai.service.js        # Barrel export for AI services
│       │   ├── imagekit.service.js  # ImageKit upload utility
│       │   ├── instagram.service.js # Instagram Graph API posting
│       │   ├── mail.service.js      # Email sending via Nodemailer
│       │   ├── ai/
│       │   │   ├── models.js            # Gemini + Mistral model instances
│       │   │   ├── chat.generator.js    # Main AI response generator with tool loop
│       │   │   ├── title.service.js     # Chat title generation
│       │   │   └── suggestions.service.js # Suggestion generation
│       │   └── Tools/
│       │       ├── search.tool.js       # Tavily web search tool
│       │       ├── email.tool.js        # Email sending tool
│       │       └── instagram.tool.js    # Instagram posting tool (uses SocialConnection model)
│       ├── sockets/
│       │   └── server.socket.js     # Socket.io initialization
│       └── validators/
│           └── auth.validator.js    # Express-validator rules
│
├── Frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── .env                         # VITE_HOST_URL, VITE_BACKEND_URL
│   ├── package.json
│   └── src/
│       ├── main.jsx                 # React entry point
│       ├── app/
│       │   ├── App.jsx              # Router provider
│       │   ├── app.routes.jsx       # All frontend routes
│       │   ├── app.store.js         # Redux store
│       │   ├── Layout.jsx           # Root layout with loading overlay
│       │   ├── ErrorBoundary.jsx    # Global error handler
│       │   └── index.css            # Global styles + Tailwind config
│       ├── features/
│       │   ├── Components/          # Shared UI components
│       │   │   ├── Sidebar.jsx          # Main sidebar navigation
│       │   │   ├── Loading.jsx          # GSAP loading animation
│       │   │   ├── Toast.jsx            # Toast notifications
│       │   │   ├── ConfirmationModal.jsx
│       │   │   ├── PerplexityIcon.jsx
│       │   │   └── ScrollToTop.jsx
│       │   ├── auth/
│       │   │   ├── auth.slice.js        # Redux slice (user, loading, error)
│       │   │   ├── components/
│       │   │   │   ├── FormField.jsx    # Reusable form input
│       │   │   │   └── Protected.jsx   # Auth guard
│       │   │   ├── hook/
│       │   │   │   └── useAuth.js       # Auth actions hook
│       │   │   ├── pages/
│       │   │   │   ├── Login.jsx        # Login + Google OAuth button
│       │   │   │   ├── Register.jsx     # Register + Google OAuth button
│       │   │   │   └── SocialConnections.jsx  # Social media connection hub
│       │   │   └── service/
│       │   │       ├── auth.api.js      # Auth API calls
│       │   │       └── social.api.js    # Social connection API calls
│       │   └── chat/
│       │       ├── chat.slice.js        # Chat Redux slice
│       │       ├── components/          # Chat UI components
│       │       ├── hook/                # Chat hooks
│       │       ├── pages/               # Chat pages
│       │       └── service/             # Chat API calls
│       └── assets/
```

---

## AUTHENTICATION ARCHITECTURE

1. **Local Auth**: Email/password → bcrypt hash → JWT in httpOnly cookie (7 day expiry)
2. **Google OAuth**: `/api/auth/google` → Google consent → `/api/auth/google/callback` → find-or-create user → JWT cookie → redirect to frontend
3. **Social OAuth**: `/api/social/connect/:platform` → returns OAuth URL → platform consent → `/api/social/callback/:platform` → token exchange → save to SocialConnection model → redirect to frontend
4. **Auth Middleware**: `auth.middleware.js` verifies JWT from `req.cookies.token`

---

## SOCIAL MEDIA INTEGRATION ARCHITECTURE

- **SocialConnection Model**: Separate MongoDB document per user per platform
- **Fields**: platform, platformUserId, platformUsername, profilePicUrl, accessToken (select:false), refreshToken, tokenExpiresAt, scopes, isConnected, meta
- **Compound unique index**: (user + platform) — one connection per platform per user
- **OAuth flows**: Full OAuth 2.0 for all 7 platforms with state validation and token exchange
- **Manual fallback**: Token paste form for platforms without configured OAuth app
- **AI Integration**: Instagram tool queries SocialConnection model directly (not user model)

---

## AI ARCHITECTURE

- **Primary**: Gemini 3.1 Flash Lite (text) / Gemini 2.5 Flash Lite (vision)
- **Fallback cascade**: Gemini 2.5 → Gemini 1.5 → Mistral
- **Tool loop**: Max 5 iterations with LangChain tool calling
- **Streaming**: Chunks emitted via Socket.io to frontend
- **Tools**: searchInternet, emailTool, post_to_instagram
- **Caption AI**: Auto-generates platform-optimized captions for uploaded images

---

## ENVIRONMENT VARIABLES

See `.env.example` for the complete list. Key groups:
- Server config (PORT, MONGODB_URI, JWT_SECRET)
- AI keys (GEMINI_API_KEY, MISTRAL_API_KEY, TAVILY_API_KEY)
- Google OAuth (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
- ImageKit (IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, IMAGEKIT_URL_ENDPOINT)
- Social OAuth (META_APP_ID/SECRET, PINTEREST_*, TWITTER_*, TIKTOK_*, LINKEDIN_*, YOUTUBE_*)
- Deployment URLs (FRONTEND_URL, BACKEND_URL)

---

## SECURITY RULES

1. All tokens stored with `select: false` in Mongoose — never returned in API responses
2. OAuth state validated with timestamp (10 min expiry)
3. Social media API credentials NEVER exposed to AI agents or frontend
4. CORS restricted to allowed origins
5. JWT in httpOnly + secure + sameSite=none cookies
6. Passwords hashed with bcrypt (10 rounds)
7. Google OAuth users have no password stored
