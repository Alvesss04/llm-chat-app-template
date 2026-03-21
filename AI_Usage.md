# 🤖 AI Usage & Transparency

This file documents how AI tools were used throughout the development of this project.

---

## Tools Used

| Tool | Purpose |
|---|---|
| **Claude (Anthropic)** | Primary coding assistant — architecture, feature implementation, debugging |
| **Cloudflare Workers AI** | The AI model powering the chat (Llama 3.3 70B) — used as a product, not a dev tool |

---

## How AI Was Used

This project started from a Cloudflare template with basic chat functionality. Everything below was designed, requested, and integrated by me — using Claude as a coding assistant to implement it.

**What I directed Claude to build:**
- Full dark UI redesign with a custom CSS variable system
- localStorage-based chat history with auto-save and auto-title
- Migration from localStorage to Cloudflare KV for cross-device sync
- Sidebar with search, language selector, rename (pencil button) and delete
- File import supporting PDF, DOCX, code files and more
- Markdown rendering with syntax-highlighted code blocks
- Copy button on AI responses
- All backend API routes for the KV storage layer

**What I did myself:**
- Decided the overall feature roadmap and priorities
- Designed the sidebar layout and visual structure
- Reviewed, tested and integrated every piece of code into the project
- Debugged issues locally using `wrangler dev` and browser DevTools
- Managed Git — commits, pushes and resolving merge conflicts
- Set up Cloudflare AI Gateway with my own account and gateway ID
- Created and configured the KV namespace via the Wrangler CLI
- Made all visual and UX decisions (colours, button placement, interactions)

---

## What I Learned

- **Cloudflare Workers architecture** — how Workers, KV, AI bindings and static assets connect together
- **Server-Sent Events (SSE)** — how streaming AI responses work under the hood
- **Async JavaScript** — converting a synchronous localStorage system to an async API-based one taught me how `async/await`, event timing, and browser focus/blur events interact in non-obvious ways
- **Stale DOM references** — debugged a bug where double-click events rebuilt the DOM before the rename handler could use it — a classic JavaScript timing problem
- **KV storage design** — structuring data to work now (single user) and scale later (per-user keys when login is added)
- **Browser DevTools** — used the Network tab, Console and `getConversations().then(console.log)` to trace async bugs that weren't throwing visible errors

---

## Where AI Got It Wrong

- **Rename feature** — Claude's initial solution used an `isRenaming` flag to prevent sidebar rebuilds during editing, but had subtle async timing bugs that took many iterations to debug. Eventually switched to a simpler pencil button approach that avoided the timing problem entirely.
- **File merging** — several patches were applied to the wrong version of the file, causing functions to get duplicated or lost. Every change required careful manual review.
- **KV migration** — Claude forgot to make `renderHistoryList` async when migrating from localStorage, causing the sidebar to silently show "No conversations" even though the data was there. Required significant DevTools debugging to trace.
- **Over-engineering** — some early solutions were more complex than needed. Simplifying was usually the right call.

---

*The goal of this project was to learn by building something real — AI was a tool to move faster, not a replacement for understanding what was being built.*
