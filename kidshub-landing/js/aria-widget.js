// ============================================================
// KidsHub — Aria AI Widget
// Connects to /api/chat (Vercel serverless → Anthropic Claude)
// Mirror of Nuvaro's aria-widget.js pattern, adapted for KidsHub
// ============================================================

(function () {
  "use strict";

  // ── CONFIG ─────────────────────────────────────────────────
  // Note: the LLM model is pinned server-side in api/chat.js. Changing
  // the model here has no effect — edit DEFAULT_MODEL in api/chat.js
  // instead.
  const ARIA_CONFIG = {
    apiEndpoint: "/api/chat", // Vercel serverless function
    greetingDelay: 800,
    typingDelay: { min: 800, max: 1800 },

    systemPrompt: `You are Aria — the friendly, expert AI assistant for KidsHub, a leading Canadian daycare management software.

Your mission:
- Welcome and educate daycare owners, directors, and educators
- Clearly explain what KidsHub does, why it matters, and how it solves real childcare admin problems
- Answer questions about features (attendance, billing & payments, parent app, daily reports, compliance, offline mode)
- Qualify prospects naturally and encourage them to book a demo or get in touch with sales
- Capture lead details when there's clear buying intent

Tone:
- Warm, helpful, human-like, professional, and concise
- Avoid robotic/salesy language; focus on real value and clarity

Core product strengths to emphasize:
- Canadian-designed with PIPEDA-compliant data residency in Canada
- Flat-rate pricing with no per-child fees that grow as you scale
- Works on Android & iOS with offline mode support
- Long parent login sessions (90 days) for convenience
- Two distinct portals: Admin + Parent app
- Custom pricing tailored to center size and feature needs

When a prospect expresses interest in pricing:
- Explain that KidsHub offers custom pricing based on centre size and needs
- Invite them to book a 20-minute discovery call

When you collect lead info (name, email, phone, centre), output exactly this pattern (hidden from the user at the end of your reply):
LEAD_CAPTURE::{"name":"<name>","email":"<email>","phone":"<phone>","centre":"<centre>","message":"<summary>"}

Rules for responses:
- Keep replies short and helpful (2–3 sentences, more only for detailed feature explanations)
- Always end with a friendly step forward (suggest booking a demo, asking a follow-up question, or giving a resource)`,
  };

  // ── QUICK PROMPTS (shown in widget before conversation starts) ──
  const QUICK_PROMPTS = [
    { icon: "📋", text: "What features does KidsHub have?" },
    { icon: "💰", text: "How does pricing work?" },
    { icon: "🍁", text: "Is it PIPEDA compliant?" },
    { icon: "📱", text: "Book a demo call" },
  ];

  // ── STATE ──────────────────────────────────────────────────
  let isOpen = false;
  let isLoading = false;
  let conversationHistory = [];
  let promptsShown = true;

  // ── DOM REFS ───────────────────────────────────────────────
  let toggleBtn, widget, messagesArea, inputEl, sendBtn, typingEl, promptsEl;

  // ── INIT ───────────────────────────────────────────────────
  function init() {
    injectHTML();
    cacheDom();
    bindEvents();
    setTimeout(showGreeting, ARIA_CONFIG.greetingDelay);
  }

  // ── HTML INJECTION ─────────────────────────────────────────
  function injectHTML() {
    const toggleHTML = `
      <button id="aria-toggle" aria-label="Open Aria AI assistant" title="Chat with Aria">
        <svg class="aria-icon-chat" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="1.8">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
        </svg>
        <svg class="aria-icon-close" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>`;

    const widgetHTML = `
      <div id="aria-widget" role="dialog" aria-label="Aria AI Assistant" aria-modal="true">
        <div class="aria-header">
          <div class="aria-header-left">
            <div class="aria-avatar">
              🌸
              <span class="aria-status-dot"></span>
            </div>
            <div>
              <div class="aria-name">Aria</div>
              <div class="aria-subtitle">KidsHub AI Assistant · Online</div>
            </div>
          </div>
          <div class="aria-header-actions">
            <button class="aria-action-btn" id="aria-clear" title="Close chat" aria-label="Close chat">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="aria-messages" id="aria-messages">
          <!-- Messages injected here -->
          <div class="aria-typing" id="aria-typing">
            <div class="aria-msg-avatar">🌸</div>
            <div class="typing-dots">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>

        <div class="aria-prompts" id="aria-prompts">
          ${QUICK_PROMPTS.map(
            (p) => `
            <button class="aria-prompt-btn" data-prompt="${escapeAttr(p.text)}">
              <span class="aria-prompt-icon">${p.icon}</span>
              ${escapeHtml(p.text)}
            </button>`,
          ).join("")}
        </div>

        <div class="aria-input-area">
          <textarea id="aria-input" rows="1" placeholder="Ask me anything about KidsHub…" aria-label="Message Aria"></textarea>
          <button id="aria-send" aria-label="Send message">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/>
            </svg>
          </button>
        </div>
        <div class="aria-footer-note">Powered by Claude AI · KidsHub by Nuvaro</div>
      </div>`;

    document.body.insertAdjacentHTML("beforeend", toggleHTML + widgetHTML);
  }

  // ── CACHE DOM ──────────────────────────────────────────────
  function cacheDom() {
    toggleBtn = document.getElementById("aria-toggle");
    widget = document.getElementById("aria-widget");
    messagesArea = document.getElementById("aria-messages");
    inputEl = document.getElementById("aria-input");
    sendBtn = document.getElementById("aria-send");
    typingEl = document.getElementById("aria-typing");
    promptsEl = document.getElementById("aria-prompts");
  }

  // ── BIND EVENTS ────────────────────────────────────────────
  function bindEvents() {
    toggleBtn.addEventListener("click", toggleWidget);

    sendBtn.addEventListener("click", handleSend);

    inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });

    inputEl.addEventListener("input", autoResize);

    document.getElementById("aria-clear").addEventListener("click", closeWidget);

    // Quick prompts
    promptsEl.addEventListener("click", (e) => {
      const btn = e.target.closest(".aria-prompt-btn");
      if (btn) {
        const prompt = btn.dataset.prompt;
        inputEl.value = prompt;
        promptsEl.style.display = "none";
        promptsShown = false;
        handleSend();
      }
    });

    // Close on outside click
    document.addEventListener("click", (e) => {
      if (
        isOpen &&
        !widget.contains(e.target) &&
        !toggleBtn.contains(e.target)
      ) {
        closeWidget();
      }
    });

    // Accessibility: close on Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isOpen) closeWidget();
    });
  }

  // ── TOGGLE ─────────────────────────────────────────────────
  function toggleWidget() {
    isOpen ? closeWidget() : openWidget();
  }
  function openWidget() {
    isOpen = true;
    widget.classList.add("open");
    toggleBtn.classList.add("open");
    toggleBtn.setAttribute("aria-expanded", "true");
    setTimeout(() => inputEl.focus(), 300);
  }
  function closeWidget() {
    isOpen = false;
    widget.classList.remove("open");
    toggleBtn.classList.remove("open");
    toggleBtn.setAttribute("aria-expanded", "false");
  }

  // ── GREETING ───────────────────────────────────────────────
  function showGreeting() {
    appendMessage(
      "bot",
      "Hi! I'm Aria 👋 I'm here to help you learn about KidsHub — the daycare management platform built for Canadian childcare providers. What would you like to know?",
    );
  }

  // ── SEND ───────────────────────────────────────────────────
  async function handleSend() {
    const text = inputEl.value.trim();
    if (!text || isLoading) return;

    // Hide prompts once user starts chatting
    if (promptsShown) {
      promptsEl.style.display = "none";
      promptsShown = false;
    }

    inputEl.value = "";
    autoResize.call(inputEl);

    appendMessage("user", text);
    conversationHistory.push({ role: "user", content: text });

    setLoading(true);
    showTyping();

    try {
      const reply = await callApi(conversationHistory);
      hideTyping();
      setLoading(false);

      // Strip lead capture pattern before displaying
      const cleanReply = reply.replace(/LEAD_CAPTURE::\{.*?\}/gs, "").trim();
      appendMessage("bot", cleanReply);
      conversationHistory.push({ role: "assistant", content: reply });

      // Handle lead capture if present
      const leadMatch = reply.match(/LEAD_CAPTURE::(\{.*?\})/s);
      if (leadMatch) {
        try {
          const leadData = JSON.parse(leadMatch[1]);
          sendLeadNotification(leadData);
        } catch (_) {}
      }
    } catch (err) {
      hideTyping();
      setLoading(false);
      appendMessage(
        "bot",
        "Sorry, I'm having a brief connection issue. Please try again or email us at contact@nuvaro.ca 😊",
      );
      console.error("Aria error:", err);
    }
  }

  // ── API CALL ───────────────────────────────────────────────
  async function callApi(history) {
    const res = await fetch(ARIA_CONFIG.apiEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system: ARIA_CONFIG.systemPrompt,
        messages: history,
        max_tokens: 400,
      }),
    });

    if (!res.ok) throw new Error(`API ${res.status}`);
    const data = await res.json();

    // Support both direct Anthropic format and OpenRouter passthrough
    if (data.content && data.content[0]) return data.content[0].text;
    if (data.choices && data.choices[0]) return data.choices[0].message.content;
    throw new Error("Unexpected response format");
  }

  // ── LEAD NOTIFICATION ──────────────────────────────────────
  async function sendLeadNotification(data) {
    try {
      await fetch(ARIA_CONFIG.apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ __lead: true, ...data }),
      });
    } catch (_) {}
  }

  // ── APPEND MESSAGE ─────────────────────────────────────────
  function appendMessage(role, text) {
    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const div = document.createElement("div");
    div.className = `aria-msg ${role}`;

    const avatar =
      role === "bot" ? '<div class="aria-msg-avatar">🌸</div>' : "";

    div.innerHTML = `
      ${avatar}
      <div>
        <div class="aria-bubble">${formatMessage(text)}</div>
        <div class="aria-msg-time">${time}</div>
      </div>`;

    messagesArea.insertBefore(div, typingEl);
    scrollToBottom();
  }

  // ── FORMAT ─────────────────────────────────────────────────
  function formatMessage(text) {
    return escapeHtml(text)
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br>");
  }

  // ── TYPING ─────────────────────────────────────────────────
  function showTyping() {
    typingEl.classList.add("show");
    scrollToBottom();
  }
  function hideTyping() {
    typingEl.classList.remove("show");
  }

  // ── LOADING ────────────────────────────────────────────────
  function setLoading(state) {
    isLoading = state;
    sendBtn.disabled = state;
    inputEl.disabled = state;
  }

  // ── CLEAR ──────────────────────────────────────────────────
  function clearChat() {
    conversationHistory = [];
    Array.from(messagesArea.children).forEach((child) => {
      if (child !== typingEl) child.remove();
    });
    promptsEl.style.display = "flex";
    promptsShown = true;
    setTimeout(showGreeting, 400);
  }

  // ── HELPERS ────────────────────────────────────────────────
  function scrollToBottom() {
    requestAnimationFrame(() => {
      messagesArea.scrollTop = messagesArea.scrollHeight;
    });
  }

  function autoResize() {
    this.style.height = "auto";
    this.style.height = Math.min(this.scrollHeight, 100) + "px";
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function escapeAttr(str) {
    return String(str).replace(/"/g, "&quot;");
  }

  // ── BOOT ───────────────────────────────────────────────────
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
