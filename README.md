# 🤖 LLM Chat App — by Alvesss04

A customised AI chat application built on top of the [Cloudflare Workers AI template](https://developers.cloudflare.com/workers-ai/), featuring a dark UI, persistent chat history, and AI Gateway integration.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Alvesss04/llm-chat-app-template)

---

## ✨ What I Changed & Added

This project started from Cloudflare's official `llm-chat-app-template`. Below is everything that was customised or built on top of the original.

---

### 🎨 Visual Redesign (`public/index.html`)

The original template had a basic light-themed UI. I redesigned it with a full dark theme using a custom CSS variable system.

---

### 🗂️ Auxiliar Sidebar (`public/index.html`)

Added a sidebar panel to the left of the chat that shows all saved conversations, also some feaures including language, search bar, and few more features.


---

### 💾 Persistent Chat History (`public/chat.js`)


This was the biggest addition. The original `chat.js` stored messages only in a JavaScript variable (`chatHistory`), which reset every time the page was refreshed.

I replaced that with a full **localStorage-based persistence system**.

---

### ⚙️ AI Gateway Integration (`src/index.ts`)

Enabled Cloudflare's AI Gateway for the Workers AI call, which adds caching, analytics, and observability on top of the model requests. Used a private one created by me.


**What AI Gateway gives to my benefit:**
- 📊 Request logs and analytics in the Cloudflare dashboard
- 🔁 Rate limiting and fallback options (configurable in the dashboard)
---

### 📊 File input option (`public/index.html` && `public/chat.js`)

Implement a new feature which gives the possibility to import files into the chat. Possible files: (.pdf .docs .txt .md .js .ts .jsx .tsx .py .css .html .json .csv .yaml .yml .sh .env)

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

- 📊 **Local chat history** — to save the history locally - DONE ✅
- ✏️ **Rename conversations** — double-click a title in the sidebar to edit it - DONE ✅
- 🌐 **Multi-language UI** — change the AI language before texting - DONE ✅
- 🤖 **New and multiple chats** — have multiple chats and create new ones when needed - DONE ✅
- 🔍 **Search** — filter conversations by keyword - DONE ✅
- 📤 **Import** — import files to improve the conversation - DONE ✅
- 📝 **Markdown rendering** — render AI responses as formatted text - DONE ✅
- 📋 **Copy message button** — click to copy any AI response - DONE ✅
- ☁️ **Server-side storage** — move chat history to Cloudflare KV or D1 so it syncs across devices



---

## 📚 Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Cloudflare Workers AI Models](https://developers.cloudflare.com/workers-ai/models/)
- [Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/)
- [MDN: localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

---

*Built on top of the [Cloudflare LLM Chat App Template](https://github.com/cloudflare/templates/tree/main/llm-chat-app-template) • Customised by [Alvesss04](https://github.com/Alvesss04)*