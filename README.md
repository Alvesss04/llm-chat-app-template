# 🤖 LLM Chat App — by Alvesss04

A customised AI chat application built on top of the [Cloudflare Workers AI template](https://developers.cloudflare.com/workers-ai/), featuring a dark UI, persistent chat history, file import, markdown rendering, and AI Gateway integration.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Alvesss04/llm-chat-app-template)

---

## ✨ What I Changed & Added

This project started from Cloudflare's official `llm-chat-app-template`. Below is everything that was customised or built on top of the original.

---

### 🎨 Visual Redesign (`public/index.html`)

The original template had a basic light-themed UI. I redesigned it with a full dark theme using a custom CSS variable system with Cloudflare orange (`#f6821f`) as the accent colour.

---

### 🗂️ Sidebar (`public/index.html`)

Added a sidebar panel to the left of the chat with some features like:
- **Conversation history list** — all saved chats, newest first
- **New Chat button** — start a fresh conversation instantly
- **Language selector** — change the AI response language on the fly
- **Search bar** — filter conversations by title or message content

---

### 💾 Persistent Chat History (`public/chat.js`)

The original `chat.js` stored messages only in a JavaScript variable which reset on every page refresh. Replaced with a full **localStorage-based persistence system** where every conversation is saved automatically and restored on page load.

Key behaviours:
- Auto-saves after every message exchange
- Auto-generates conversation titles from the first user message
- Loads the most recent conversation on startup

---

### ✏️ Rename Conversations (`public/chat.js`)

Double-click any conversation title in the sidebar to rename it inline. Press `Enter` or click away to save, `Escape` to cancel.

---

### 🔍 Search Conversations (`public/chat.js`)

Live search that filters the sidebar as you type. Searches both conversation **titles** and **message content**. Highlights matching text in titles with an orange mark, and shows a small badge when the match is inside message content rather than the title.

---

### 🌐 Multi-Language AI Responses (`public/chat.js`)

A language dropdown in the sidebar lets you pick the language the AI responds in. Takes effect on the very next message — no need to start a new conversation. Supported languages: English, Portuguese, Spanish, French, German, Italian, Japanese, Chinese, Arabic.

---

### 📎 File Import (`public/chat.js` + `public/index.html`)

A paperclip button next to the input lets you attach files to your message. Supported formats:

| Type | Extensions |
|---|---|
| Text / Docs | `.txt` `.md` `.pdf` `.docx` |
| Code | `.js` `.ts` `.jsx` `.tsx` `.py` `.sh` |
| Data / Config | `.csv` `.json` `.yaml` `.yml` `.env` |
| Web | `.html` `.css` |

PDF parsing is handled by **PDF.js** (Mozilla), Word documents by **Mammoth.js** — both run entirely in the browser with no backend changes. File content is prepended to the message as a formatted block before being sent to the AI.

---

### 📝 Markdown Rendering (`public/chat.js` + `public/index.html`)

AI responses are rendered as formatted markdown using **Marked.js**. Supported formatting includes bold, italic, headings, bullet lists, numbered lists, tables, blockquotes, inline code, and fenced code blocks. Code blocks are syntax-highlighted using **Highlight.js** with a dark GitHub theme.

---

### 📋 Copy Message Button (`public/chat.js`)

A Copy button appears below every message on hover. Clicking it copies the raw text content to the clipboard and shows a green "Copied!" confirmation for 2 seconds.

---

### ⚙️ AI Gateway Integration (`src/index.ts`)

Enabled Cloudflare's AI Gateway for the Workers AI call, which adds caching, analytics, and observability on top of model requests.

**Benefits:**
- 📊 Request logs and analytics in the Cloudflare dashboard
- ⚡ Response caching (identical prompts return cached results within TTL)
- 🔁 Rate limiting and fallback options (configurable in the dashboard)

---

## 🏗️ Project Structure

```
/
├── public/
│   ├── index.html      # Chat UI — dark theme, sidebar, all feature styles
│   └── chat.js         # Frontend logic — all features implemented here
├── src/
│   ├── index.ts        # Worker — AI Gateway enabled, custom system prompt
│   └── types.ts        # TypeScript types (unchanged)
├── wrangler.jsonc      # Cloudflare Worker config (unchanged)
└── README.md           # This file
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- A Cloudflare account with Workers AI access

### Run locally
```bash
npm install
npm run dev
# Opens at http://localhost:8787
```

### Deploy
```bash
npm run deploy
```

### View live logs
```bash
npx wrangler tail
```

---

## ✅ Features

| Feature | Status |
|---|---|
| 🎨 Dark UI redesign | ✅ Done |
| 💾 Persistent chat history (localStorage) | ✅ Done |
| ✏️ Rename conversations | ✅ Done |
| 🌐 Multi-language AI responses | ✅ Done |
| 🤖 Multiple chats | ✅ Done |
| 🔍 Search conversations | ✅ Done |
| 📎 File import (txt, pdf, docx, code, csv...) | ✅ Done |
| 📝 Markdown rendering | ✅ Done |
| 📋 Copy message button | ✅ Done |
| ⚙️ AI Gateway integration | ✅ Done |
| ☁️ Server-side storage (Cloudflare KV/D1) | 🔜 Planned |

---

## 📚 Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Cloudflare Workers AI Models](https://developers.cloudflare.com/workers-ai/models/)
- [Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/)
- [MDN: localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [Marked.js](https://marked.js.org/)
- [Highlight.js](https://highlightjs.org/)
- [PDF.js](https://mozilla.github.io/pdf.js/)
- [Mammoth.js](https://github.com/mwilliamson/mammoth.js)

---

*Built on top of the [Cloudflare LLM Chat App Template](https://github.com/cloudflare/templates/tree/main/llm-chat-app-template) • Customised by [Alvesss04](https://github.com/Alvesss04)*