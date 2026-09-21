# AI DEVELOPMENT CONTEXT — Perplexity Social Media Command Center

> This file is for external AI agents (Perplexity, Claude, ChatGPT, etc.) that are asked to modify this codebase.
> **Read CODEBASE_ARCHITECTURE.md first** for the full structure.

---

## GOLDEN RULES FOR AI AGENTS

1. **Do NOT rebuild** — inspect and extend the existing system cleanly.
2. **Do NOT expose social media API credentials** to external AI agents. Use a tool-based capability approach.
3. **Follow existing patterns** — this codebase uses Express 5 ESM modules, Redux Toolkit, and JWT httpOnly cookies.
4. **Check SocialConnection model** for any social media token operations — tokens are NOT on the user model.
5. **Use ImageKit** for all image hosting — never store files locally.
6. **Respect the AI tool loop** — LangChain tools are defined in `Backend/src/services/Tools/`. Follow the existing pattern for new tools.

---

## FILE EDITING PATTERNS

### Adding a new social media publishing tool:
1. Create `Backend/src/services/Tools/<platform>.tool.js` (copy `instagram.tool.js` as template)
2. Create `Backend/src/services/<platform>.service.js` (low-level API wrapper)
3. Import and add tool to the tools array in `Backend/src/services/ai/chat.generator.js`
4. Update the system prompt in `chat.generator.js` to include instructions for the new platform
5. The tool should query `SocialConnection.findOne({ user: userId, platform: '<platform>', isConnected: true }).select("+accessToken")`

### Adding a new OAuth platform:
1. Add platform config to `PLATFORMS` object in `Backend/src/controllers/social.controller.js`
2. Add env vars to `.env` and `.env.example`
3. Add redirect URI for the platform
4. Add platform card to `PLATFORMS` array in `Frontend/src/features/auth/pages/SocialConnections.jsx`

### Adding a new AI model/capability:
1. User model has `geminiApiKey` and `preferredModel` fields
2. If user provides their own API key, instantiate a model with their key
3. Models are configured in `Backend/src/services/ai/models.js`

---

## WHAT NOT TO TOUCH

- `Backend/src/middlewares/auth.middleware.js` — works correctly
- `Backend/src/config/database.js` — works correctly
- `Backend/src/sockets/server.socket.js` — works correctly
- `Frontend/src/features/Components/Loading.jsx` — premium GSAP animation, don't simplify
- Cookie settings in auth controller — production-ready config

---

## DESIGN SYSTEM

| Token | Value |
|---|---|
| Primary Accent | `#20b8cd` (teal) |
| Secondary Accent | `#60A6AF` |
| Background (dark) | `#0a0a0a` / `#020202` |
| Card Background | `#191a1a` |
| Border Color | `#2d2e2e` |
| Font Stack | System defaults |
| Border Radius | `rounded-xl` / `rounded-2xl` / `rounded-3xl` |
| Shadows | `shadow-xl` + colored glows |
| Animations | GSAP `power3.out` / `power4.out` |

---

## API ROUTES SUMMARY

### Auth (`/api/auth`)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /register | No | Register with email/password |
| POST | /login | No | Login with credentials |
| POST | /logout | No | Clear JWT cookie |
| GET | /me | Yes | Get current user |
| GET | /verify-email | No | Email verification link handler |
| POST | /resend-verification-email | No | Resend verification |
| GET | /google | No | Redirect to Google OAuth |
| GET | /google/callback | No | Google OAuth callback |

### Chat (`/api/chats`)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /send | Yes | Send message (AI response via Socket.io) |
| GET | / | Yes | List user's chats |
| GET | /:id | Yes | Get single chat |
| DELETE | /:id | Yes | Delete chat |
| GET | /search | Yes | Search chats |
| POST | /suggestions | Yes | Get AI suggestions |

### Social (`/api/social`)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /accounts | Yes | List connected accounts |
| DELETE | /accounts/:platform | Yes | Disconnect platform |
| GET | /connect/:platform | Yes | Get OAuth redirect URL |
| GET | /callback/:platform | No | OAuth callback (redirect) |
| POST | /connect-manual | Yes | Manual token connection |
