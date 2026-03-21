# 📝 PROMPTS.md

A log of the key prompts used throughout the development of this project with Claude (Anthropic).

---

## 🏗️ Project Setup & UI

```
I'm doing a template from Cloudflare for an AI machine. I already done some new 
things especially visual to make it better. Now I want to implement a chat history 
where it can save our conversations like Claude does.
```

```
Make the UI dark themed with Cloudflare orange as the accent colour. Add a sidebar 
to the left of the chat that shows saved conversations, a new chat button, and a 
language selector.
```

---

## 💾 Chat History (localStorage)

```
Implement a full chat history system using localStorage that:
- Saves every conversation automatically after each message
- Auto-generates titles from the first user message
- Loads the most recent conversation on page load
- Shows all conversations in the sidebar.
```

---

## ✏️ Rename Conversations

```
Add the ability to rename conversations. Double-click a title in the sidebar 
to edit it inline. Press Enter or click away to save, Escape to cancel.
```

```
The renaming is not working. When I double-click it flashes for less than a second 
and disappears. Fix it please!
```

```
Lets change how the rename works — instead of double-click, add a pencil icon 
button that appears on hover next to the delete button, like how delete works.
```

---

## 🔍 Search Conversations

```
Add a live search bar to the sidebar that filters conversations as I type. 
It should search both conversation titles and message content. Highlight 
matching text in titles and show a badge when the match is inside a message.
```

---

## 🌐 Multi-Language AI Responses

```
Add a language dropdown to the sidebar that changes the language the AI 
responds in. It should take effect on the very next message without needing 
to start a new conversation. Supported: English, Portuguese, Spanish, French, 
German, Italian, Japanese, Chinese, Arabic.
```

---

## 📎 File Import

```
Add a paperclip button next to the input that lets users attach files to 
their message. Support: .txt, .md, .js, .ts, .py, .csv, .json, .html, .css, 
.yaml, .env. Show a chip above the input with the filename and an X to remove it. 
When sent, prepend the file content to the message as a formatted code block.
```

```
Can we also support PDF and Word (.docx) files? Use PDF.js for PDFs and 
Mammoth.js for Word documents, both loaded from CDN.
```

---

## 📝 Markdown Rendering

```
Render AI responses as formatted markdown using Marked.js. Support bold, 
italic, headings, bullet lists, tables, blockquotes, inline code and fenced 
code blocks. Add syntax highlighting to code blocks using Highlight.js with 
the github-dark theme.
```

---

## 📋 Copy Message Button

```
Add a Copy button that appears below every AI message on hover. Clicking it 
copies the raw text to clipboard and shows "Copied!" in green for 2 seconds.
```

---

## ☁️ Server-Side Storage (Cloudflare KV)

```
Move chat history from localStorage to Cloudflare KV so it syncs across 
devices and browsers. Add these API routes to the Worker:
- GET /api/conversations — load all conversations
- POST /api/conversations — save all conversations  
- DELETE /api/conversations/:id — delete one conversation
Update the frontend to call these routes instead of localStorage.
```

```
The conversations are not showing in the sidebar. The API returns data correctly 
but renderHistoryList shows "No conversations yet". Fix it.
```

```
The rename is broken after the KV migration — the input disappears immediately. 
Debug and fix the async timing issue.
```

---

## 📄 Documentation

```
Write a README.md optimised for an interviewer to review. Include a tech stack 
table, features list, architecture diagram, and short getting started commands. 
Keep it clear and easy to read.
```

```
Write a PROMPTS.md file documenting the actual prompts I used, and an AI_USAGE.md 
file covering what AI tools were used, how I used them vs what I did myself, 
what I learned, and where AI got things wrong.
```

---

*All prompts were written by Alvesss04. Claude (Anthropic) was used as the coding assistant throughout.*
*Also some prompts I didn´t post here since they are not usefull or just minimal prompts."
