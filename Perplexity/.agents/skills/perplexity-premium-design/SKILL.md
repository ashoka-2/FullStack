---
name: perplexity-premium-design
description: Design system, UI patterns, interactive physics mascot architecture, resizable prompt editors, and glassmorphic aesthetics from Perplexity AI. Use this skill when building modern, stunning web applications with conversational AI, interactive mascots, resizable inputs, rich dark/light modes, and high-conversion UX.
---

# Perplexity Premium Design System & UI Architecture

This skill provides the comprehensive design system, UI architecture, and implementation patterns extracted from the Perplexity AI platform. Any AI agent using this skill can create state-of-the-art web applications with the same high level of polish, interactivity, and elegance.

---

## 1. Aesthetic Principles & Color Palette

Never use generic, blinding pure white or flat saturated primaries. The design relies on curated, harmonious, high-contrast dark tones and eye-friendly, glare-free light tones.

### Color Tokens

| Token | Dark Mode | Light Mode | Purpose |
|---|---|---|---|
| **Base Canvas** | `#050505` / `#070809` | `#f4f5f7` | Page background (soft, zero-glare) |
| **Card / Surface** | `#121212` / `#171819` | `#ffffff` | Elevated component surface |
| **Hover Surface** | `#1a1a1a` / `#222222` | `#f0f1f3` / `#eaebee` | Interactive hover feedback |
| **Primary Accent** | `#20b8cd` | `#20b8cd` | Main interactive brand cyan |
| **Secondary Accent** | `#60A6AF` | `#3b7d85` | Subtler highlights, active borders |
| **Borders** | `border-white/10` or `#2d2e2e` | `border-zinc-200/90` | Ultra-crisp, elegant borders |
| **Text Primary** | `#ffffff` / `#f4f5f7` | `#09090b` / `#18181b` | High legibility text |
| **Text Secondary** | `#a1a1aa` / `#71717a` | `#71717a` / `#52525b` | Descriptive captions & meta |

### Ambient Lighting & Glassmorphism
- Use subtle top-centered gradient glows with `blur-3xl pointer-events-none`:
  ```jsx
  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[420px] bg-gradient-to-b from-[#20b8cd]/10 via-[#20b8cd]/5 to-transparent blur-3xl pointer-events-none" />
  ```
- Use `backdrop-blur-2xl` with 98% opacity backgrounds for modals and dropdowns:
  `bg-[#fafafa]/98 dark:bg-[#121314]/98 backdrop-blur-2xl`

---

## 2. Interactive Mascot System (`JellyBlob`)

A dynamic, physics-reacting mascot humanizes AI applications and significantly boosts user engagement.

### Architecture
- **Rendering**: SVG path with spring-physics squircle deformation.
- **Emotion States**: `curious`, `happy`, `surprised`, `hmm`, `love`, `sleepy`, `angry`, `neutral`.
- **Gaze Tracking**: Eyes follow mouse cursor or focus targets using `{ x, y }` coordinates.
- **Global Event Triggers**: Dispatches and listens to `blob_trigger_mood` on `window`:
  ```javascript
  window.dispatchEvent(new CustomEvent('blob_trigger_mood', {
    detail: {
      mood: 'happy',
      speech: 'Operation completed successfully! ✨',
      duration: 3500,
      celebrate: true,
      revert: true
    }
  }));
  ```
- **Layering**: Always place floating mascots at `z-[10000]` so they remain visible above headers and dropdowns.

---

## 3. Resizable Prompt Editor & Code Preservation

Standard single-line or fixed-height textareas ruin UX when pasting long prompts or code snippets.

### Rules for the Prompt Input:
1. **Vertical Manual Resizability (`resize-y`)**:
   - Apply `resize-y` on `<textarea>` with a minimum height (`min-h-[44px]`) and generous max height (`max-h-[75vh]`).
2. **Dedicated Expand / Collapse Button**:
   - Provide an icon toggle (`RiExpandUpDownLine` / `RiContractUpDownLine`) in the bottom action bar.
   - When toggled to expanded mode, set height to `min-h-[240px]` to `min-h-[300px]`.
3. **Preserving Indentation & Code Formatting**:
   - Apply inline styles: `whiteSpace: 'pre-wrap'`, `tabSize: 2`, `MozTabSize: 2`.
   - Dynamic typography: Switch to `font-mono text-[14px] md:text-[15px] leading-relaxed` whenever code syntax is detected (`/^(import|export|const|function|def|class)\b/m` or braces/brackets).
4. **Tab Key Indentation**:
   - Intercept `e.key === 'Tab'` in `handleKeyDown`:
     ```javascript
     if (e.key === 'Tab') {
       e.preventDefault();
       const start = e.target.selectionStart;
       const end = e.target.selectionEnd;
       const updated = value.substring(0, start) + '  ' + value.substring(end);
       setValue(updated);
       requestAnimationFrame(() => {
         ref.current.selectionStart = ref.current.selectionEnd = start + 2;
       });
     }
     ```
5. **Code & Line Info Strip**:
   - When multi-line or code content is detected, show a status badge:
     `{lineCount} lines • {charCount} characters` + `Code format preserved` with a quick `Expand size` shortcut.

---

## 4. Portaled Dropdowns & Smooth Scroll Isolation

When building dropdown popovers or modals in apps with smooth scrolling (e.g. Lenis):
1. **React Portal to `document.body`**:
   - Use `createPortal(..., document.body)` so popovers are never clipped by parent `overflow-hidden` or stacking contexts.
   - Assign `z-[9990]` (below mascot at `z-[10000]`, but above headers and overlays).
2. **Dynamic Positioning**:
   - Calculate coordinates via `getBoundingClientRect()` with flip detection (opens upward if space below is limited).
3. **Smooth Scroll Isolation (Lenis Compatibility)**:
   - Always attach `data-lenis-prevent="true"`, `onWheel={(e) => e.stopPropagation()}`, and `overscroll-contain` on both the popover container and the scroll list.
   - Attach `min-h-0` on flex column scroll children so flexbox allows proper vertical scrolling.
   - In window scroll listeners, ignore scroll events originating from inside the popover to prevent coordinate recalculation jitter.

---

## 5. Multi-Attachment Preview Strip & Queued Prompts

### Attachment Strip
- When users upload images, videos, or documents, render a compact badge strip directly above the textarea:
  - Shows file type icon (Emerald for images, Purple for videos, Red for PDFs).
  - Displays file name with truncate, file size, and a remove (`RiCloseLine`) button.
  - Multi-attachment grid/carousel support.

### Message Queueing System
- When the AI is actively generating or responding, do NOT disable the input box or freeze the user.
- Allow users to click **"Queue"** to add follow-up instructions into a persistent `MessageQueueTray`.
- Provide inline controls to edit prompt text, delete queued items, or click **"Stop Responding"** to cancel the active AI stream.
- Automatically dequeue and process the next queued prompt once the current response finishes.

---

## 6. Zero-Data-Leak Maintenance Mode

When taking an application into Maintenance Mode:
1. **Environment-Driven**: Control via `VITE_MAINTENANCE_MODE=true` in `.env` or cloud dashboard (e.g. Vercel).
2. **Root-Level React Guard**:
   - In `App.jsx`, before mounting routers, check if maintenance mode is active.
   - If active, **completely stop** `auth.handleGetMe()` and disconnect WebSocket servers.
   - Render ONLY the `<MaintenanceMode />` page.
3. **Axios Network Blocker**:
   - Add a pre-request interceptor in `axios.js` that rejects all outgoing requests immediately, ensuring **zero** queries reach the backend or database.
4. **Maintenance Page Design**:
   - Interactive mascot with construction/repair mood.
   - Reassurance cards confirming data is safely preserved.
   - Live shimmer progress bar and a "Check If We're Back" button that re-checks connectivity on demand.

---

## 7. Stacking & Z-Index Standard

| Z-Index | Usage |
|---|---|
| `z-[10000]` | Interactive Mascot (`FloatingBlobMascot`) |
| `z-[9990]` | Portaled Popovers & Dropdowns (`ModelSelectorDropdown`) |
| `z-50` | Floating Action Bars, Queues, Modals |
| `z-40` | Sticky Top Navigation Bars |
| `z-10` | Floating Action Buttons |
| `z-0` | Normal Content Flow |

---

## 8. Summary Checklist for Any New Feature

- [ ] Does it support seamless dark/light modes without harsh glare?
- [ ] Are inputs resizable with code format preservation?
- [ ] Are portaled elements protected with `data-lenis-prevent` and `min-h-0`?
- [ ] Does it provide lively visual feedback (mascot mood, micro-animations, toast alerts)?
- [ ] Is error recovery graceful with automatic fallback models (e.g., Mistral NeMo instead of paywalled commercial models)?
