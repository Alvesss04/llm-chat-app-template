/**
 * Author: Alvesss04
 * Project helped by AI tools.
 */

/**
 * LLM Chat App Frontend
 * With persistent chat history via localStorage
 */

// ============================================================
// LOCALSTORAGE KEYS
// ============================================================
const STORAGE_KEY = "conversations";
const CURRENT_ID_KEY = "currentConversationId";

// ============================================================
// DOM ELEMENTS
// ============================================================
const chatMessages = document.getElementById("chat-messages");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");
const typingIndicator = document.getElementById("typing-indicator");
const historyList     = document.getElementById("history-list");
const languageSelect  = document.getElementById("language-select");
const searchInput     = document.getElementById("search-input");

const attachButton    = document.getElementById("attach-button");
const fileInput       = document.getElementById("file-input");
const fileChip        = document.getElementById("file-chip");
const fileChipName    = document.getElementById("file-chip-name");
const fileChipRemove  = document.getElementById("file-chip-remove");

// ============================================================
// IN-MEMORY STATE
// ============================================================
const GREETING = "Hello! I'm an LLM chat app powered by Cloudflare Workers AI. How can I help you today?";

const BASE_SYSTEM_PROMPT =
  "You are a friendly, patient assistant who happily helps by giving simple, clear, and reliable answers.";

let chatHistory = [];
let currentConversationId = null;
let isProcessing = false;
let attachedFile = null;


function getSystemPrompt() {
  const lang = languageSelect ? languageSelect.value : "English";
  if (lang === "English") return BASE_SYSTEM_PROMPT;
  return `${BASE_SYSTEM_PROMPT} Always respond in ${lang}, regardless of the language the user writes in.`;
}

function buildPayload() {
  const systemMessage = { role: "system", content: getSystemPrompt() };
  const conversation  = chatHistory.filter((m) => m.role !== "system");
  return [systemMessage, ...conversation];
}

// ============================================================
// UTILITY: Generate a unique ID
// ============================================================
function generateId() {
  return `conv_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

// ============================================================
// LOCALSTORAGE HELPERS
// ============================================================
function getConversations() {
  const raw = localStorage.getItem(STORAGE_KEY);
  // If nothing is saved yet, return an empty object
  return raw ? JSON.parse(raw) : {};
}

function saveConversations(conversations) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
}

// ============================================================
// CREATE A NEW CONVERSATION
// ============================================================
function createNewConversation() {
  const id = generateId();
  const newConv = {
    id,
    title: "New conversation",
    createdAt: Date.now(),
    messages: [
      { role: "assistant", content: GREETING }
    ],
  };

  const conversations = getConversations();
  conversations[id] = newConv;
  saveConversations(conversations);

  return id;
}

// ============================================================
// RENAME A CONVERSATION
// ============================================================
function startRename(convId, currentTitle, spanEl, event) {
  event.stopPropagation();

  const liveItem = historyList.querySelector(`[data-conv-id="${convId}"]`);
  if (!liveItem) return;
  const liveSpan = liveItem.querySelector(".history-title");
  if (!liveSpan) return;

  const input = document.createElement("input");
  input.type = "text";
  input.value = liveSpan.textContent;
  input.className = "rename-input";
  liveSpan.replaceWith(input);

  input.focus();
  input.select();
 
  input.addEventListener("click", (e) => e.stopPropagation());
 
  let saved = false;
 
  function saveRename() {
    if (saved) return;
    saved = true;
    const newTitle = input.value.trim() || currentTitle;
    const conversations = getConversations();
    if (conversations[convId]) {
      conversations[convId].title = newTitle;
      saveConversations(conversations);
    }
    renderHistoryList();
  }
 
  function cancelRename() {
    if (saved) return;
    saved = true;
    renderHistoryList();
  }
 
  input.addEventListener("keydown", (e) => {
    e.stopPropagation();
    if (e.key === "Enter") { e.preventDefault(); saveRename(); }
    if (e.key === "Escape") cancelRename();
  });
 
  input.addEventListener("blur", saveRename);
}

// ============================================================
// FILE UPLOAD — supports .txt, .md, .js, .py, .csv,
//                  .pdf (via PDF.js) and .docx (via Mammoth.js)
// ============================================================
function setupFileUpload() {
  if (window.pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  }

  attachButton.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    if (!file) return;

    showFileChip(`Reading ${file.name}...`);
    attachButton.disabled = true;

    try {
      const text = await extractText(file);

      if (text.length > 15000) {
        alert(`"${file.name}" extracted ${text.length} characters. This may exceed the AI's token limit and get cut off. Consider using a shorter section.`);
      }

      attachedFile = { name: file.name, content: text };
      showFileChip(file.name);
    } catch (err) {
      console.error("File read error:", err);
      alert(`Could not read "${file.name}": ${err.message}`);
      clearAttachment();
    } finally {
      attachButton.disabled = false;
      fileInput.value = ""; 
    }
  });

  fileChipRemove.addEventListener("click", clearAttachment);
}

// ============================================================
// TEXT EXTRACTION
// ============================================================
async function extractText(file) {
  const ext = file.name.split(".").pop().toLowerCase();

  if (ext === "pdf") return extractPdf(file);
  if (ext === "docx") return extractDocx(file);

  return readAsText(file);
}

function readAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = (e) => resolve(e.target.result);
    reader.onerror = ()  => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

async function extractPdf(file) {
  if (!window.pdfjsLib) throw new Error("PDF.js not loaded");

  // PDF.js needs an ArrayBuffer (raw binary data), not text
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pageTexts = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    // Each page returns an array of text items — join them with spaces
    const pageText = content.items.map((item) => item.str).join(" ");
    pageTexts.push(`[Page ${i}]\n${pageText}`);
  }

  return pageTexts.join("\n\n");
}

// Extracts text from a .docx file using Mammoth.js
// Mammoth reads the ZIP/XML structure of .docx and returns plain text
async function extractDocx(file) {
  if (!window.mammoth) throw new Error("Mammoth.js not loaded");

  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

function showFileChip(name) {
  fileChipName.textContent = name;
  fileChip.classList.add("visible");
}

function clearAttachment() {
  attachedFile = null;
  fileChipName.textContent = "";
  fileChip.classList.remove("visible");
  fileInput.value = "";
}

function buildMessageWithFile(userText) {
  if (!attachedFile) return userText;

  const ext = attachedFile.name.split(".").pop().toLowerCase();

  // PDF and DOCX are prose — no code block, just plain text
  if (ext === "pdf" || ext === "docx") {
    return `[File: ${attachedFile.name}]\n${attachedFile.content}\n\n${userText}`.trim();
  }

  // Code / data files — wrap in a fenced code block with language hint
  const langMap = {
    js: "javascript", ts: "typescript", jsx: "javascript", tsx: "typescript",
    py: "python", css: "css", html: "html", json: "json", csv: "csv",
    md: "markdown", sh: "bash", yaml: "yaml", yml: "yaml"
  };
  const lang = langMap[ext] || "";

  return `[File: ${attachedFile.name}]\n\`\`\`${lang}\n${attachedFile.content}\n\`\`\`\n\n${userText}`.trim();
}
function getSearchQuery() {
  return searchInput ? searchInput.value.trim().toLowerCase() : "";
}

// ============================================================
// SEARCH — matchConversation(conv, query)
// ============================================================
function matchConversation(conv, query) {
  if (!query) return { matched: true, messageMatches: 0 };
 
  const titleMatches = conv.title.toLowerCase().includes(query);
 
  const messageMatches = conv.messages.filter(
    (m) => m.role !== "system" && m.content.toLowerCase().includes(query)
  ).length;
 
  return {
    matched: titleMatches || messageMatches > 0,
    messageMatches,
    titleMatches,
  };
}

// ============================================================
// RENDER THE SIDEBAR HISTORY LIST
// ============================================================
function renderHistoryList() {
  const conversations = getConversations();
  const query = getSearchQuery(); // 🔍 read current search text

  const sorted = Object.values(conversations).sort(
    (a, b) => b.createdAt - a.createdAt
  );

  historyList.innerHTML = "";

  if (sorted.length === 0) {
    historyList.innerHTML = `<p style="color:var(--text-light);font-size:0.8rem;text-align:center;margin-top:10px;">No conversations yet</p>`;
    return;
  }

  const filtered = sorted.filter((conv) => matchConversation(conv, query).matched);

  if (filtered.length === 0) {
    historyList.innerHTML = `<p style="color:var(--text-light);font-size:0.8rem;text-align:center;margin-top:10px;">No results for "${escapeHtml(query)}"</p>`;
    return;
  }

  filtered.forEach((conv) => {
    const { messageMatches, titleMatches } = matchConversation(conv, query);

    const item = document.createElement("div");
    item.className = "history-item" + (conv.id === currentConversationId ? " active" : "");
    item.dataset.convId = conv.id;

    const titleSpan = document.createElement("span");
    titleSpan.className = "history-title";
    titleSpan.title = conv.title;

    if (query && titleMatches) {
      const regex = new RegExp(`(${escapeRegex(query)})`, "gi");
      titleSpan.innerHTML = escapeHtml(conv.title).replace(
        regex, `<mark class="search-highlight">$1</mark>`
      );
    } else {
      titleSpan.textContent = conv.title;
    }

    titleSpan.addEventListener("dblclick", (e) =>
      startRename(conv.id, conv.title, titleSpan, e)
    );

    const rightSide = document.createElement("div");
    rightSide.className = "item-right";

    if (query && messageMatches > 0 && !titleMatches) {
      const badge = document.createElement("span");
      badge.className = "match-badge";
      badge.textContent = `${messageMatches} msg`;
      rightSide.appendChild(badge);
    }

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.title = "Delete conversation";
    deleteBtn.textContent = "✕";
    deleteBtn.addEventListener("click", (e) => deleteConversation(conv.id, e));
    rightSide.appendChild(deleteBtn);

    item.appendChild(titleSpan);
    item.appendChild(rightSide);
    item.addEventListener("click", () => loadConversation(conv.id));

    historyList.appendChild(item);
  });
}

// ============================================================
// LOAD A CONVERSATION
// ============================================================
function loadConversation(id) {
  const conversations = getConversations();
  const conv = conversations[id];
  if (!conv) return;

  currentConversationId = id;
  chatHistory = [...conv.messages]; 

  chatMessages.innerHTML = "";

  chatHistory.forEach((msg) => {
    if (msg.role !== "system") {
      addMessageToChat(msg.role, msg.content);
    }
  });

  chatMessages.scrollTop = chatMessages.scrollHeight;
  renderHistoryList();
  userInput.focus();
}

// ============================================================
// SAVE THE CURRENT CONVERSATION
// ============================================================
function saveCurrentConversation() {
  if (!currentConversationId) return;

  const conversations = getConversations();
  const conv = conversations[currentConversationId];
  if (!conv) return;
  const firstUserMsg = chatHistory.find((m) => m.role === "user");
  if (firstUserMsg && conv.title === "New conversation") {
    conv.title = firstUserMsg.content.slice(0, 40) + (firstUserMsg.content.length > 40 ? "..." : "");
  }

  conv.messages = [...chatHistory];
  conversations[currentConversationId] = conv;
  saveConversations(conversations);

  renderHistoryList();
}

// ============================================================
// DELETE A CONVERSATION
// ============================================================
function deleteConversation(id, event) {
  event.stopPropagation(); 

  const conversations = getConversations();
  delete conversations[id];
  saveConversations(conversations);

  if (id === currentConversationId) {
    const remaining = Object.keys(conversations);
    if (remaining.length > 0) {
      loadConversation(remaining[remaining.length - 1]);
    } else {
      startNewChat();
      return;
    }
  }

  renderHistoryList();
}

// ============================================================
// START A NEW CHAT
// ============================================================
function startNewChat() {
  const id = createNewConversation();
  currentConversationId = id;

  chatHistory = [{ role: "assistant", content: GREETING }];

  chatMessages.innerHTML = "";
  addMessageToChat("assistant", GREETING);

  renderHistoryList();
  userInput.focus();
}

// ============================================================
// INITIALIZATION
// ============================================================
function init() {
  if (searchInput) {
    searchInput.addEventListener("input", () => renderHistoryList());
  }

  setupFileUpload();

  const conversations = getConversations();
  const ids = Object.keys(conversations);

  if (ids.length > 0) {
    const latest = Object.values(conversations).sort(
      (a, b) => b.createdAt - a.createdAt
    )[0];
    loadConversation(latest.id);
  } else {
    startNewChat();
  }
}

// ============================================================
// INPUT HANDLERS (unchanged from original)
// ============================================================
userInput.addEventListener("input", function () {
  this.style.height = "auto";
  this.style.height = this.scrollHeight + "px";
});

userInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

sendButton.addEventListener("click", sendMessage);

// ============================================================
// SEND MESSAGE
// ============================================================
async function sendMessage() {
  const message = userInput.value.trim();
  if (message === "" || isProcessing) return;

  isProcessing = true;
  userInput.disabled = true;
  sendButton.disabled = true;

  addMessageToChat("user", message);
  userInput.value = "";
  userInput.style.height = "auto";
  typingIndicator.classList.add("visible");

  const fullMessage = buildMessageWithFile(message);
  chatHistory.push({ role: "user", content: fullMessage });

  clearAttachment();

  saveCurrentConversation();

  try {
    const assistantWrapper = document.createElement("div");
    assistantWrapper.className = "message-wrapper assistant-wrapper";

    const assistantMessageEl = document.createElement("div");
    assistantMessageEl.className = "message assistant-message";
    assistantWrapper.appendChild(assistantMessageEl);
    chatMessages.appendChild(assistantWrapper);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: buildPayload() }),
    });

    if (!response.ok) throw new Error("Failed to get response");
    if (!response.body) throw new Error("Response body is null");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let responseText = "";
    let buffer = "";

    const flushAssistantText = () => {
      assistantMessageEl.innerHTML = renderMarkdown(responseText);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    let sawDone = false;
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        const parsed = consumeSseEvents(buffer + "\n\n");
        for (const data of parsed.events) {
          if (data === "[DONE]") break;
          try {
            const jsonData = JSON.parse(data);
            const content = extractContent(jsonData);
            if (content) { responseText += content; flushAssistantText(); }
          } catch (e) { console.error("SSE parse error:", e); }
        }
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const parsed = consumeSseEvents(buffer);
      buffer = parsed.buffer;

      for (const data of parsed.events) {
        if (data === "[DONE]") { sawDone = true; buffer = ""; break; }
        try {
          const jsonData = JSON.parse(data);
          const content = extractContent(jsonData);
          if (content) { responseText += content; flushAssistantText(); }
        } catch (e) { console.error("SSE parse error:", e); }
      }
      if (sawDone) break;
    }

    if (responseText.length > 0) {
      chatHistory.push({ role: "assistant", content: responseText });
      saveCurrentConversation();
      // Add copy button now that the full response is ready
      assistantWrapper.appendChild(makeCopyButton(responseText));
    }
  } catch (error) {
    console.error("Error:", error);
    addMessageToChat("assistant", "Sorry, there was an error processing your request.");
  } finally {
    typingIndicator.classList.remove("visible");
    isProcessing = false;
    userInput.disabled = false;
    sendButton.disabled = false;
    userInput.focus();
  }
}

// ============================================================
// HELPERS
// ============================================================

/** Extracts text content from a Workers AI or OpenAI SSE chunk */
function extractContent(jsonData) {
  if (typeof jsonData.response === "string" && jsonData.response.length > 0) {
    return jsonData.response;
  }
  if (jsonData.choices?.[0]?.delta?.content) {
    return jsonData.choices[0].delta.content;
  }
  return "";
}

// ============================================================
// 📝 MARKDOWN RENDERING
// ============================================================
function renderMarkdown(text) {
  if (!window.marked) return escapeHtml(text);
  marked.setOptions({ breaks: true });
  return marked.parse(text);
}

function addMessageToChat(role, content) {
  const wrapper = document.createElement("div");
  wrapper.className = `message-wrapper ${role === "user" ? "user-wrapper" : "assistant-wrapper"}`;

  const messageEl = document.createElement("div");
  messageEl.className = `message ${role}-message`;

  if (role === "assistant") 
    messageEl.innerHTML = renderMarkdown(content);
   else 
    messageEl.innerHTML = `<p>${escapeHtml(content)}</p>`;

  wrapper.appendChild(messageEl);

  if (role === "assistant") {
    const copyBtn = makeCopyButton(content);
    wrapper.appendChild(copyBtn);
  }

  chatMessages.appendChild(wrapper);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ============================================================
// 📋 COPY BUTTON
// ============================================================
function makeCopyButton(content) {
  const btn = document.createElement("button");
  btn.className = "copy-btn";
  btn.textContent = "Copy";

  btn.addEventListener("click", () => {
    navigator.clipboard.writeText(content).then(() => {
      btn.textContent = "Copied!";
      btn.classList.add("copied");
      setTimeout(() => {
        btn.textContent = "Copy";
        btn.classList.remove("copied");
      }, 2000);
    }).catch(() => {
      btn.textContent = "Failed";
      setTimeout(() => { btn.textContent = "Copy"; }, 2000);
    });
  });

  return btn;
}

/** Prevents XSS by escaping HTML special characters */
function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Escapes special regex characters so user input is treated as plain text */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Parses Server-Sent Events from a raw buffer string */
function consumeSseEvents(buffer) {
  let normalized = buffer.replace(/\r/g, "");
  const events = [];
  let eventEndIndex;
  while ((eventEndIndex = normalized.indexOf("\n\n")) !== -1) {
    const rawEvent = normalized.slice(0, eventEndIndex);
    normalized = normalized.slice(eventEndIndex + 2);
    const lines = rawEvent.split("\n");
    const dataLines = [];
    for (const line of lines) {
      if (line.startsWith("data:")) {
        dataLines.push(line.slice("data:".length).trimStart());
      }
    }
    if (dataLines.length === 0) continue;
    events.push(dataLines.join("\n"));
  }
  return { events, buffer: normalized };
}

// ============================================================
// START THE APP
// ============================================================
init();