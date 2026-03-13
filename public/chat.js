/**
 * LLM Chat App Frontend
 * With persistent chat history via localStorage
 */

// ============================================================
// 🗂️ LOCALSTORAGE KEYS
// We use two keys in localStorage:
//   - "conversations": an object containing ALL saved chats
//   - "currentConversationId": the ID of the active chat
// ============================================================
const STORAGE_KEY = "conversations";
const CURRENT_ID_KEY = "currentConversationId";

// ============================================================
// 🎯 DOM ELEMENTS
// We grab all the elements from the HTML that we'll interact with.
// ============================================================
const chatMessages = document.getElementById("chat-messages");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");
const typingIndicator = document.getElementById("typing-indicator");
const historyList = document.getElementById("history-list");

// ============================================================
// 🧠 IN-MEMORY STATE
// chatHistory  → the messages of the CURRENT active conversation
// currentId    → the ID of the active conversation
// isProcessing → prevents sending while AI is responding
// ============================================================
const GREETING = "Hello! I'm an LLM chat app powered by Cloudflare Workers AI. How can I help you today?";

let chatHistory = [];
let currentConversationId = null;
let isProcessing = false;

// ============================================================
// 🔧 UTILITY: Generate a unique ID
// We use the current timestamp + a random number.
// Example output: "conv_1718123456789_4823"
// ============================================================
function generateId() {
  return `conv_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

// ============================================================
// 💾 LOCALSTORAGE HELPERS
//
// Think of localStorage like a small database in the browser.
// It stores key → value pairs, but only strings — so we use
// JSON.stringify() to save objects and JSON.parse() to read them.
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
// 💬 CREATE A NEW CONVERSATION
// This is called when the user clicks "+ Nova Conversa" OR
// when the page first loads and there are no saved chats.
//
// Each conversation is an object like:
// {
//   id: "conv_1234",
//   title: "Ask about Cloudflare...",  ← derived from 1st user message
//   createdAt: 1718123456789,          ← timestamp
//   messages: [ { role, content }, ... ]
// }
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
// 🖥️ RENDER THE SIDEBAR HISTORY LIST
// This rebuilds the entire sidebar list from scratch every time
// something changes (new chat, new message, delete, etc.)
// ============================================================
function renderHistoryList() {
  const conversations = getConversations();

  // Sort conversations newest first
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

    // 📝 The title is shown on the left, delete button on the right
    item.innerHTML = `
      <span class="history-title" title="${escapeHtml(conv.title)}">${escapeHtml(conv.title)}</span>
      <button class="delete-btn" title="Delete conversation" onclick="deleteConversation('${conv.id}', event)">✕</button>
    `;

    // Clicking the item (not the delete button) loads that conversation
    item.addEventListener("click", () => loadConversation(conv.id));

    historyList.appendChild(item);
  });
}

// ============================================================
// 📂 LOAD A CONVERSATION
// When the user clicks a history item, we:
// 1. Update the current ID
// 2. Load that conversation's messages into chatHistory
// 3. Re-render the chat messages area
// 4. Re-render the sidebar to highlight the active item
// ============================================================
function loadConversation(id) {
  const conversations = getConversations();
  const conv = conversations[id];
  if (!conv) return;

  currentConversationId = id;
  chatHistory = [...conv.messages];  // copy the saved messages into memory

  // Clear the chat UI
  chatMessages.innerHTML = "";

  // Re-render each message
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
// 💾 SAVE THE CURRENT CONVERSATION
// After each message exchange, we write the updated chatHistory
// back to localStorage under the current conversation's ID.
// If it's the first user message, we use it to set the title.
// ============================================================
function saveCurrentConversation() {
  if (!currentConversationId) return;

  const conversations = getConversations();
  const conv = conversations[currentConversationId];
  if (!conv) return;

  // Auto-generate title from first user message
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
// 🗑️ DELETE A CONVERSATION
// We stop the click from bubbling up to the item (which would
// try to load the deleted conversation).
// If we delete the current conversation, we load the next one.
// ============================================================
function deleteConversation(id, event) {
  event.stopPropagation(); // prevent the click from loading the conversation

  const conversations = getConversations();
  delete conversations[id];
  saveConversations(conversations);

  // If we deleted the active conversation, switch to another
  if (id === currentConversationId) {
    const remaining = Object.keys(conversations);
    if (remaining.length > 0) {
      loadConversation(remaining[remaining.length - 1]);
    } else {
      // No conversations left → create a fresh one
      startNewChat();
      return;
    }
  }

  renderHistoryList();
}

// ============================================================
// ➕ START A NEW CHAT
// Called by the "+ Nova Conversa" button in the HTML.
// Creates a fresh conversation, sets it as active, clears the UI.
// ============================================================
function startNewChat() {
  const id = createNewConversation();
  currentConversationId = id;

  // Reset in-memory chatHistory to just the greeting
  chatHistory = [{ role: "assistant", content: GREETING }];

  // Clear the chat UI and show only the greeting
  chatMessages.innerHTML = "";
  addMessageToChat("assistant", GREETING);

  renderHistoryList();
  userInput.focus();
}

// ============================================================
// 🚀 INITIALIZATION
// When the page loads, we either:
//   A) Find existing conversations and load the most recent one
//   B) Create a brand new conversation (first-time user)
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
// ⌨️ INPUT HANDLERS (unchanged from original)
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
// 📤 SEND MESSAGE
// Core function — sends the message to the API, streams the
// response, and saves everything to localStorage at the end.
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

  // 💾 Save immediately after user sends (so title can update)
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
      body: JSON.stringify({ messages: chatHistory }),
    });

    if (!response.ok) throw new Error("Failed to get response");
    if (!response.body) throw new Error("Response body is null");

    // Stream the response
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

    // ✅ AI finished responding — save to localStorage
    if (responseText.length > 0) {
      chatHistory.push({ role: "assistant", content: responseText });
      saveCurrentConversation(); // 💾 persist the full exchange
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
// 🧩 HELPERS
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
// 🏁 START THE APP
// ============================================================
init();