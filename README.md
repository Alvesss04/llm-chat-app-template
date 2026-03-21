# 🤖 Alvesss AI Chat

### A high-performance, edge-native AI chatbot built on Cloudflare’s global network.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Alvesss04/llm-chat-app-template)

---
🌟 Overview
--
Most chatbots suffer from high latency and loss of state on refresh. This project solves those issues by leveraging Cloudflare Workers AI for low-latency inference and Cloudflare KV for global state persistence.

The result is a chat experience that feels instantaneous and remembers your conversation across sessions, powered entirely by edge computing.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Cloudflare Workers (TypeScript) |
| AI Model | Llama 3.1 8B via Workers AI |
| Storage | Cloudflare KV (server-side) |
| Streaming | Server-Sent Events (SSE) |
| Frontend | Vanilla JS, HTML, CSS |
| Libraries | Marked.js, Highlight.js, PDF.js, Mammoth.js |

---

## ✨ Features

- 💬 **Real-time streaming** — AI responses stream token by token via SSE
- ☁️ **Server-side storage** — conversations stored in Cloudflare KV, synced across all devices and browsers
- 📝 **Markdown rendering** — AI responses rendered with syntax-highlighted code blocks
- 📎 **File import** — attach `.pdf`, `.docx`, `.txt`, code files and more to any message
- 🔍 **Live search** — filters conversations by title and message content in real time
- 🌐 **Multi-language** — switch the AI response language on the fly
- ✏️ **Rename & delete** conversations inline
- 📋 **Copy button** on every AI response
- ⚙️ **AI Gateway** — caching, rate limiting and analytics via Cloudflare AI Gateway

---

## 🏗️ Architecture

```
Browser (chat.js)
    │
    ├── GET/POST /api/conversations  ──▶  Cloudflare KV  (chat history)
    │
    └── POST /api/chat               ──▶  Workers AI  (Llama 3.1 streaming)
                                              │
                                         AI Gateway  (cache + analytics)
```

---

## 🚀 Running Locally

```bash
npm install
npx wrangler kv namespace create CHAT_HISTORY  # first time only
npm run dev                                     # http://localhost:8787
```

## 🚢 Deploy

```bash
npm run deploy
```

---

## 📁 Project Structure

```
├── public/
│   ├── index.html   # UI — dark theme, sidebar, all styles
│   └── chat.js      # All frontend logic
└── src/
    ├── index.ts     # Worker — API routes, AI streaming, KV storage
    └── types.ts     # TypeScript interfaces
```

---

*Built on top of the [Cloudflare LLM Chat App Template](https://github.com/cloudflare/templates/tree/main/llm-chat-app-template) • Extended by [Alvesss04](https://github.com/Alvesss04)*
