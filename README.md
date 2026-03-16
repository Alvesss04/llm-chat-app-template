# 🤖 LLM Chat App — by Alvesss04

A customised AI chat application built on top of the [Cloudflare Workers AI template](https://developers.cloudflare.com/workers-ai/), featuring a dark UI, persistent chat history, and AI Gateway integration.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Alvesss04/llm-chat-app-template)

---

## ✨ What I Changed & Added

This project started from Cloudflare's official `llm-chat-app-template`. Below is everything that was customised or built on top of the original.

---

### 🎨 Visual Redesign (`public/index.html`)

The original template had a basic light-themed UI. I redesigned it with a full dark theme using a custom CSS variable system:

| Variable | Value | Purpose |
|---|---|---|
| `--bg-main` | `#121212` | Page background |
| `--bg-chat` | `#1c1c1c` | Chat area background |
| `--bg-input` | `#2a2a2a` | Input field background |
| `--primary-color` | `#f6821f` | Cloudflare orange accent |
| `--user-msg-bg` | `#f6821f` | User message bubbles |
| `--assistant-msg-bg` | `#545454` | AI message bubbles |

Other visual changes:
- Rounded chat container with a visible border
- Distinct user vs assistant message bubble styles
- Responsive layout that works on mobile and desktop
- Custom styled send button with hover and disabled states
- Typing indicator styled in the brand orange

---

### 🗂️ Chat History Sidebar (`public/index.html`)

Added a sidebar panel to the left of the chat that shows all saved conversations. Built entirely with HTML and CSS — no extra libraries.

**New HTML structure:**
```html
<div class="app-layout">
  <aside class="sidebar">
    <button class="new-chat-btn">New Chat/button>
    <div id="history-list" class="history-list"></div>
  </aside>
  <div class="chat-container">...</div>
</div>
```

**New CSS classes added:**
- `.app-layout` — flexbox wrapper that holds sidebar + chat side by side
- `.sidebar` — fixed-width panel (240px) with its own scroll
- `.history-list` — scrollable list of conversation items
- `.history-item` — individual conversation row with title + delete button
- `.history-item.active` — highlights the currently open conversation
- `.history-title` — truncates long titles with ellipsis
- `.delete-btn` — hidden by default, appears on hover
- `.new-chat-btn` — styled button to start a fresh conversation

---

### 💾 Persistent Chat History (`public/chat.js`)

This was the biggest addition. The original `chat.js` stored messages only in a JavaScript variable (`chatHistory`), which reset every time the page was refreshed.

I replaced that with a full **localStorage-based persistence system**.

#### How it works

All conversations are saved in the browser's `localStorage` under a single key called `"conversations"`. Each conversation is an object shaped like this:

```json
{
  "conv_1718123456_4823": {
    "id": "conv_1718123456_4823",
    "title": "How does Cloudflare work...",
    "createdAt": 1718123456789,
    "messages": [
      { "role": "assistant", "content": "Hello!..." },
      { "role": "user", "content": "How does Cloudflare work?" },
      { "role": "assistant", "content": "Great question!..." }
    ]
  }
}
```

#### New functions added

| Function | What it does |
|---|---|
| `generateId()` | Creates a unique ID using timestamp + random number |
| `getConversations()` | Reads all conversations from localStorage |
| `saveConversations()` | Writes all conversations back to localStorage |
| `createNewConversation()` | Creates a fresh conversation and saves it |
| `loadConversation(id)` | Loads a saved conversation into the chat UI |
| `saveCurrentConversation()` | Persists the current chat after every message |
| `renderHistoryList()` | Rebuilds the sidebar list from localStorage |
| `deleteConversation(id, event)` | Removes a conversation and handles edge cases |
| `startNewChat()` | Resets the UI and creates a new conversation |
| `init()` | Runs on page load — restores the last conversation or starts fresh |
| `escapeHtml(text)` | Sanitises user input to prevent XSS attacks |

#### Key behaviours
- **Auto-title** — the conversation title is automatically generated from the first user message (truncated to 40 characters)
- **Auto-save** — saves to localStorage immediately after the user sends a message, and again after the AI finishes responding
- **On load** — automatically opens the most recent conversation
- **Delete active** — if you delete the conversation you're currently in, it gracefully switches to the next available one (or starts a new chat if none remain)
- **Security** — all user content is passed through `escapeHtml()` before being rendered in the DOM

#### What localStorage means for privacy
- ✅ History is stored **only in your browser** — no server ever stores it
- ✅ Not accessible to other users, or anyone else
- ❌ History does **not** sync across devices or browsers
- ❌ Clearing browser data will delete the history
- ℹ️ Undeploying the Worker does **not** affect the saved history

---

### ⚙️ AI Gateway Integration (`src/index.ts`)

Enabled Cloudflare's AI Gateway for the Workers AI call, which adds caching, analytics, and observability on top of the model requests.

```ts
const stream = await env.AI.run(
  MODEL_ID,
  {
    messages,
    max_tokens: 1024,
    stream: true,
  },
  {
    gateway: {
      id: "alvesss-gateway",
      skipCache: false,
      cacheTtl: 3600,       // Cache responses for 1 hour
    },
  }
);
```

**What AI Gateway gives you:**
- 📊 Request logs and analytics in the Cloudflare dashboard
- ⚡ Response caching (identical prompts return cached results within the TTL)
- 🔁 Rate limiting and fallback options (configurable in the dashboard)

> To use this, create a gateway at [dash.cloudflare.com → AI → AI Gateway](https://dash.cloudflare.com/?to=/:account/ai/ai-gateway) and replace `alvesss-gateway` with your own gateway ID.

---

### 🧠 Custom System Prompt (`src/index.ts`)

Changed the default system prompt to make the assistant friendlier and clearer:

```ts
const SYSTEM_PROMPT =
  "You are a friendly, patient assistant who happily helps by giving simple, clear, and reliable answers.";
```

---

## 🏗️ Project Structure

```
/
├── public/
│   ├── index.html      # Chat UI — redesigned dark theme + sidebar
│   └── chat.js         # Frontend logic — full chat history system
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

## 🔮 Features and Ideas to implement.

- ☁️ **Server-side storage** — move chat history to Cloudflare KV or D1 so it syncs across devices
- ✏️ **Rename conversations** — double-click a title in the sidebar to edit it
- 🔍 **Search** — filter conversations by keyword
- 📝 **Markdown rendering** — render AI responses as formatted markdown
- 📤 **Export** — download a conversation as `.txt` or `.md`
- 🌐 **Multi-language UI** — change the AI language before texting

---

## 📚 Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Cloudflare Workers AI Models](https://developers.cloudflare.com/workers-ai/models/)
- [Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/)
- [MDN: localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

---

*Built on top of the [Cloudflare LLM Chat App Template](https://github.com/cloudflare/templates/tree/main/llm-chat-app-template) • Customised by [Alvesss04](https://github.com/Alvesss04)*
