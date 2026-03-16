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
const historyList = document.getElementById("history-list");
const languageSelect  = document.getElementById("language-select");

// ============================================================
// IN-MEMORY STATE
// ============================================================
const GREETING = "Hello! I'm an LLM chat app powered by Cloudflare Workers AI. How can I help you today?";

const BASE_SYSTEM_PROMPT =
  "You are a friendly, patient assistant who happily helps by giving simple, clear, and reliable answers.";

let chatHistory = [];
let currentConversationId = null;
let isProcessing = false;


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
// RENDER THE SIDEBAR HISTORY LIST
// ============================================================
function renderHistoryList() {
  const conversations = getConversations();
  const sorted = Object.values(conversations).sort(
    (a, b) => b.createdAt - a.createdAt
  );

  historyList.innerHTML = "";

  if (sorted.length === 0) {
    historyList.innerHTML = `<p style="color: var(--text-light); font-size: 0.8rem; text-align:center; margin-top: 10px;">No conversations yet</p>`;
    return;
  }

  sorted.forEach((conv) => {
    const item = document.createElement("div");
    item.className = "history-item" + (conv.id === currentConversationId ? " active" : "");
    
    item.dataset.convId = conv.id;

  
    const titleSpan = document.createElement("span");
    titleSpan.className = "history-title";
    titleSpan.title = conv.title;
    titleSpan.textContent = conv.title;
    titleSpan.addEventListener("dblclick", (e) =>
      startRename(conv.id, conv.title, titleSpan, e)
    );
 
    // Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.title = "Delete conversation";
    deleteBtn.textContent = "✕";
    deleteBtn.addEventListener("click", (e) => deleteConversation(conv.id, e));
 
    item.appendChild(titleSpan);
    item.appendChild(deleteBtn);

    // Clicking the item (not the delete button) loads that conversation
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
  const conversations = getConversations();
  const ids = Object.keys(conversations);

  if (ids.length > 0) {
    // Load the most recently created conversation
    const latest = Object.values(conversations).sort(
      (a, b) => b.createdAt - a.createdAt
    )[0];
    loadConversation(latest.id);
  } else {
    // First time: create a fresh conversation
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

  chatHistory.push({ role: "user", content: message });

  saveCurrentConversation();

  try {
    const assistantMessageEl = document.createElement("div");
    assistantMessageEl.className = "message assistant-message";
    assistantMessageEl.innerHTML = "<p></p>";
    chatMessages.appendChild(assistantMessageEl);
    const assistantTextEl = assistantMessageEl.querySelector("p");

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
      assistantTextEl.textContent = responseText;
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

/** Adds a message bubble to the chat UI */
function addMessageToChat(role, content) {
  const messageEl = document.createElement("div");
  messageEl.className = `message ${role}-message`;
  messageEl.innerHTML = `<p>${escapeHtml(content)}</p>`;
  chatMessages.appendChild(messageEl);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

/** Prevents XSS by escaping HTML special characters */
function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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