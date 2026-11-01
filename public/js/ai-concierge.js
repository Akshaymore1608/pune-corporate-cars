/**
 * Pune Corporate Cars - Executive AI Concierge Client
 * Powered by Vercel AI SDK Agent Backend (/api/agent/chat)
 */

(function () {
  'use strict';

  // Inject Concierge Styles
  const style = document.createElement('style');
  style.textContent = `
    .pcc-ai-trigger {
      position: fixed;
      bottom: 90px;
      right: 25px;
      z-index: 998;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 18px;
      background: linear-gradient(135deg, #181818 0%, #0a0a0a 100%);
      border: 1.5px solid #C9A24A;
      border-radius: 50px;
      color: #FFFFFF;
      font-family: 'Inter', sans-serif;
      font-size: 0.85rem;
      font-weight: 600;
      letter-spacing: 0.5px;
      cursor: pointer;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.7), 0 0 15px rgba(201, 162, 74, 0.25);
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .pcc-ai-trigger:hover {
      transform: translateY(-3px) scale(1.02);
      box-shadow: 0 14px 30px rgba(0, 0, 0, 0.8), 0 0 25px rgba(201, 162, 74, 0.45);
      border-color: #E5C77B;
    }
    .pcc-ai-trigger .ai-pulse {
      width: 10px;
      height: 10px;
      background: #C9A24A;
      border-radius: 50%;
      box-shadow: 0 0 8px #C9A24A;
      animation: pccPulse 2s infinite;
    }
    @keyframes pccPulse {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(201, 162, 74, 0.7); }
      70% { transform: scale(1.2); box-shadow: 0 0 0 8px rgba(201, 162, 74, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(201, 162, 74, 0); }
    }

    /* Modal / Floating Window */
    .pcc-ai-window {
      position: fixed;
      bottom: 95px;
      right: 25px;
      width: 380px;
      max-width: calc(100vw - 40px);
      height: 540px;
      max-height: calc(100vh - 120px);
      background: #0D0D0D;
      border: 1px solid rgba(201, 162, 74, 0.4);
      border-radius: 16px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.85), 0 0 30px rgba(201, 162, 74, 0.15);
      display: none;
      flex-direction: column;
      z-index: 999;
      overflow: hidden;
      font-family: 'Inter', sans-serif;
      backdrop-filter: blur(12px);
    }
    .pcc-ai-window.open {
      display: flex;
      animation: pccSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes pccSlideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Header */
    .pcc-ai-header {
      padding: 14px 18px;
      background: #141414;
      border-bottom: 1px solid rgba(201, 162, 74, 0.25);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .pcc-ai-header-title {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .pcc-ai-header-title h4 {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 700;
      color: #FFFFFF;
      letter-spacing: 0.3px;
    }
    .pcc-ai-header-title span {
      display: block;
      font-size: 0.7rem;
      color: #C9A24A;
      font-weight: 500;
    }
    .pcc-ai-close-btn {
      background: none;
      border: none;
      color: #888;
      font-size: 1.2rem;
      cursor: pointer;
      line-height: 1;
      padding: 4px;
      transition: color 0.2s;
    }
    .pcc-ai-close-btn:hover {
      color: #FFFFFF;
    }

    /* Messages container */
    .pcc-ai-messages {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: #080808;
    }
    .pcc-ai-msg {
      max-width: 85%;
      padding: 10px 14px;
      border-radius: 12px;
      font-size: 0.85rem;
      line-height: 1.45;
      word-wrap: break-word;
    }
    .pcc-ai-msg.bot {
      align-self: flex-start;
      background: #181818;
      border: 1px solid rgba(201, 162, 74, 0.2);
      color: #E6E6E6;
    }
    .pcc-ai-msg.bot strong {
      color: #E5C77B;
    }
    .pcc-ai-msg.user {
      align-self: flex-end;
      background: #C9A24A;
      color: #080808;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(201, 162, 74, 0.25);
    }
    .pcc-ai-badge-tool {
      display: inline-block;
      font-size: 0.65rem;
      padding: 2px 6px;
      border-radius: 4px;
      background: rgba(201, 162, 74, 0.15);
      border: 1px solid rgba(201, 162, 74, 0.3);
      color: #C9A24A;
      margin-top: 6px;
      font-weight: 600;
    }

    /* Quick Chips */
    .pcc-ai-chips {
      padding: 8px 12px;
      display: flex;
      gap: 6px;
      overflow-x: auto;
      background: #101010;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      scrollbar-width: none;
    }
    .pcc-ai-chips::-webkit-scrollbar { display: none; }
    .pcc-ai-chip {
      white-space: nowrap;
      padding: 5px 10px;
      border-radius: 20px;
      background: #1A1A1A;
      border: 1px solid rgba(201, 162, 74, 0.3);
      color: #C9A24A;
      font-size: 0.72rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .pcc-ai-chip:hover {
      background: #C9A24A;
      color: #080808;
    }

    /* Input area */
    .pcc-ai-footer {
      padding: 12px 14px;
      background: #141414;
      border-top: 1px solid rgba(201, 162, 74, 0.2);
      display: flex;
      gap: 8px;
    }
    .pcc-ai-input {
      flex: 1;
      background: #080808;
      border: 1px solid #333;
      border-radius: 8px;
      padding: 9px 12px;
      color: #FFF;
      font-size: 0.82rem;
      outline: none;
      transition: border 0.2s;
    }
    .pcc-ai-input:focus {
      border-color: #C9A24A;
    }
    .pcc-ai-send-btn {
      background: #C9A24A;
      border: none;
      border-radius: 8px;
      color: #080808;
      font-weight: 700;
      padding: 0 14px;
      cursor: pointer;
      font-size: 0.85rem;
      transition: background 0.2s;
    }
    .pcc-ai-send-btn:hover {
      background: #E5C77B;
    }
    .pcc-ai-send-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `;
  document.head.appendChild(style);

  // Build DOM Structure
  const triggerBtn = document.createElement('button');
  triggerBtn.className = 'pcc-ai-trigger';
  triggerBtn.innerHTML = `
    <span class="ai-pulse"></span>
    <span>AI Concierge</span>
  `;
  document.body.appendChild(triggerBtn);

  const windowModal = document.createElement('div');
  windowModal.className = 'pcc-ai-window';
  windowModal.innerHTML = `
    <div class="pcc-ai-header">
      <div class="pcc-ai-header-title">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C9A24A" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 16v-4"></path>
          <path d="M12 8h.01"></path>
        </svg>
        <div>
          <h4>PCC AI Concierge</h4>
          <span>Powered by Vercel AI SDK</span>
        </div>
      </div>
      <button class="pcc-ai-close-btn" aria-label="Close Concierge">✕</button>
    </div>
    <div class="pcc-ai-messages" id="pccAiMsgBox">
      <div class="pcc-ai-msg bot">
        Welcome to <strong>Pune Corporate Cars India Pvt. Ltd.</strong><br><br>
        I am your AI Executive Concierge. Ask me about our 15 luxury and corporate fleet models, 100+ cities Pan-India coverage, or request an instant tariff quote.
      </div>
    </div>
    <div class="pcc-ai-chips">
      <button class="pcc-ai-chip" data-prompt="Which luxury sedans do you offer?">🚘 Luxury Sedans</button>
      <button class="pcc-ai-chip" data-prompt="Estimate fare for Toyota Innova Crysta for Mumbai to Pune">💰 Innova Fare</button>
      <button class="pcc-ai-chip" data-prompt="Do you have corporate transit in Bengaluru and Hyderabad?">📍 South Hubs</button>
      <button class="pcc-ai-chip" data-prompt="What are your airport transfer rates for Mercedes-Benz?">✈ Airport Mercedes</button>
    </div>
    <form class="pcc-ai-footer" id="pccAiForm">
      <input type="text" class="pcc-ai-input" id="pccAiInput" placeholder="Ask about fleet, tariffs, or cities..." autocomplete="off">
      <button type="submit" class="pcc-ai-send-btn" id="pccAiSend">Send</button>
    </form>
  `;
  document.body.appendChild(windowModal);

  // Elements
  const msgBox = windowModal.querySelector('#pccAiMsgBox');
  const form = windowModal.querySelector('#pccAiForm');
  const input = windowModal.querySelector('#pccAiInput');
  const sendBtn = windowModal.querySelector('#pccAiSend');
  const closeBtn = windowModal.querySelector('.pcc-ai-close-btn');

  // Toggle Visibility
  triggerBtn.addEventListener('click', () => {
    windowModal.classList.toggle('open');
    if (windowModal.classList.contains('open')) {
      input.focus();
    }
  });

  closeBtn.addEventListener('click', () => {
    windowModal.classList.remove('open');
  });

  // Format response text with basic bolding and line breaks
  function formatBotText(text) {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }

  // Append Message
  function appendMessage(text, role, toolBadge = null) {
    const msg = document.createElement('div');
    msg.className = `pcc-ai-msg ${role}`;
    if (role === 'bot') {
      msg.innerHTML = formatBotText(text);
      if (toolBadge) {
        msg.innerHTML += `<br><span class="pcc-ai-badge-tool">⚡ Tool Executed: ${toolBadge}</span>`;
      }
    } else {
      msg.textContent = text;
    }
    msgBox.appendChild(msg);
    msgBox.scrollTop = msgBox.scrollHeight;
  }

  // Handle Send
  async function sendMessage(userText) {
    if (!userText || !userText.trim()) return;
    const prompt = userText.trim();
    appendMessage(prompt, 'user');
    input.value = '';
    sendBtn.disabled = true;

    // Loading indicator
    const loadingMsg = document.createElement('div');
    loadingMsg.className = 'pcc-ai-msg bot';
    loadingMsg.id = 'pccAiLoading';
    loadingMsg.innerHTML = '<em>Searching fleet and tariffs...</em>';
    msgBox.appendChild(loadingMsg);
    msgBox.scrollTop = msgBox.scrollHeight;

    try {
      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      const data = await response.json();
      loadingMsg.remove();

      if (data.success && data.text) {
        const toolName = data.toolCalls && data.toolCalls.length > 0 ? data.toolCalls[0].toolName : null;
        appendMessage(data.text, 'bot', toolName);
      } else {
        appendMessage(data.error || 'Failed to retrieve recommendation. Please call our 24/7 desk at +91 9822943334.', 'bot');
      }
    } catch (err) {
      loadingMsg.remove();
      appendMessage('Communication error. Please ensure server is running or contact reservations directly.', 'bot');
    } finally {
      sendBtn.disabled = false;
      input.focus();
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    sendMessage(input.value);
  });

  // Handle Quick Chips
  windowModal.querySelectorAll('.pcc-ai-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const prompt = chip.getAttribute('data-prompt');
      sendMessage(prompt);
    });
  });

})();
