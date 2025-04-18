async function handlePDFWithModelFallback(file, userInput, model) {
  if (model !== 'local') {
    const { extractTextFromPDF } = await import(chrome.runtime.getURL('pdf-handler.js'));
    const text = await extractTextFromPDF(file);
    const prompt = `${userInput}\n\n--- Uploaded PDF Start ---\n${text.slice(0, 20000)}\n--- Uploaded PDF End ---`;
    await sendPrompt(prompt, userInput);
    return;
  }

  const usePdfBot = await Promise.race([
    checkPdfBotHealth(),
    new Promise(resolve => setTimeout(() => resolve(false), 3000))
  ]);

  if (usePdfBot) {
    try {
      const result = await fetchPdfSummaryFromBot(file);
      const prompt = `${userInput}\n\n--- PDF Summary via Local Bot ---\n${result}\n--- End ---`;
      await sendPrompt(prompt, userInput);
    } catch (err) {
      console.warn("PDF bot failed, falling back to local PDF.js", err);
      const { extractTextFromPDF } = await import(chrome.runtime.getURL('pdf-handler.js'));
      const text = await extractTextFromPDF(file);
      const prompt = `${userInput}\n\n--- Uploaded PDF Start ---\n${text.slice(0, 20000)}\n--- Uploaded PDF End ---`;
      await sendPrompt(prompt, userInput);
    }
  } else {
    const { extractTextFromPDF } = await import(chrome.runtime.getURL('pdf-handler.js'));
    const text = await extractTextFromPDF(file);
    const prompt = `${userInput}\n\n--- Uploaded PDF Start ---\n${text.slice(0, 20000)}\n--- Uploaded PDF End ---`;
    await sendPrompt(prompt, userInput);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const gearButton = document.getElementById("set-api-key");
  const chat = document.getElementById("chat");
  const modelToggle = document.getElementById("model-toggle");
  const promptInput = document.getElementById("prompt");

  const serverButton = document.getElementById("toggle-server");
  let serverRunning = false;

  chrome.storage.local.get("serverToken", (result) => {
    const SERVER_TOKEN = result.serverToken;
    if (!SERVER_TOKEN) {
      console.warn("⚠️ No server token set in storage. Cannot toggle servers.");
      return;
    }

    serverButton.onclick = async () => {
      const { serverToken } = await new Promise((res) =>
        chrome.storage.local.get("serverToken", res)
      );
    
      if (!serverToken) {
        alert("❌ No server token found. Please set it via the gear icon.");
        return;
      }
    
      const url = `http://localhost:4200/${serverRunning ? 'stop' : 'start'}-services`;
    
      // 🟡 Indicate stopping/starting
      serverButton.textContent = serverRunning ? "Stopping..." : "Starting...";
      serverButton.style.backgroundColor = "#b8860b"; // goldenrod
    
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": serverToken
          }
        });
    
        if (!res.ok) throw new Error(`Server responded with status ${res.status}`);
    
        const msg = await res.text();
        console.log(`✅ ${serverRunning ? 'Stopped' : 'Started'} services:\n${msg}`);
        serverRunning = !serverRunning;
      } catch (err) {
        console.error("❌ Failed to toggle services:", err);
        serverButton.textContent = "⚠️ Error";
        serverButton.style.backgroundColor = "#8B0000";
        return;
      }
    
      // ✅ Set final state
      serverButton.textContent = serverRunning ? "Stop Servers" : "Start Servers";
      serverButton.style.backgroundColor = serverRunning ? "#228B22" : "#8B0000";
    };    
  });

  if (gearButton) {
    /**
     * Handles API key management modal UI
     * @returns {void}
     */
    gearButton.onclick = async () => {
      if (document.getElementById("apiModal")) return;

      const modalWrapper = document.createElement("div");
      modalWrapper.id = "apiModal";
      modalWrapper.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
      `;

      const modalContent = document.createElement("div");
      modalContent.innerHTML = `
        <button id='closeModal' style="position:absolute;top:5px;right:10px;font-size:20px;background:none;border:none;color:white;cursor:pointer">✖️</button>
        <h3>🔐 API Keys</h3>
        <label for='serverToken'>Server Control Token:</label>
        <input type='password' id='serverToken' placeholder='...' style="width:100%;padding:8px;background:#1e1e1e;color:white;border:1px solid #555;margin-bottom:10px"/>
        <label for='apiKey'>OpenAI API Key:</label>
        <input type='password' id='apiKey' placeholder='...' style="width:100%;padding:8px;background:#1e1e1e;color:white;border:1px solid #555;margin-bottom:10px"/>
        <label for='perplexityKey'>Perplexity API Key:</label>
        <input type='password' id='perplexityKey' placeholder='...' style="width:100%;padding:8px;background:#1e1e1e;color:white;border:1px solid #555;margin-bottom:10px"/>
        <div style="display:flex;gap:10px;margin-top:10px">
          <button id='save' style="flex:1">Save</button>
          <button id='clear' style="flex:1">Clear</button>
        </div>
        <div id='status' style="margin-top:10px;font-size:0.85em;color:#9acd32"></div>
      `;
      modalContent.style.cssText = `
        background: #121212;
        padding: 20px;
        border-radius: 8px;
        max-width: 400px;
        width: 100%;
        font-family: 'IBM Plex Mono', monospace;
        color: white;
        position: relative;
      `;

      modalWrapper.appendChild(modalContent);
      document.body.appendChild(modalWrapper);

      modalContent.querySelector("#closeModal").onclick = () => modalWrapper.remove();

      const apiKeyInput = modalContent.querySelector("#apiKey");
      const perplexityInput = modalContent.querySelector("#perplexityKey");
      const serverTokenInput = modalContent.querySelector("#serverToken");
      const status = modalContent.querySelector("#status");

      chrome.storage.local.get(["apiKey", "perplexityKey","serverToken"], (result) => {
        if (result.apiKey) apiKeyInput.value = result.apiKey;
        if (result.perplexityKey) perplexityInput.value = result.perplexityKey;
        if (result.serverToken) serverTokenInput.value = result.serverToken;
      });

      modalContent.querySelector("#save").onclick = () => {
        const apiKey = apiKeyInput.value;
        const perplexityKey = perplexityInput.value;
        const serverToken = serverTokenInput.value;
        chrome.storage.local.set({ apiKey, perplexityKey, serverToken }, () => {
          status.textContent = "✅ Keys saved!";
          setTimeout(() => (status.textContent = ""), 2000);
        });
      };

      modalContent.querySelector("#clear").onclick = () => {
        chrome.storage.local.remove(["apiKey", "perplexityKey","serverToken"], () => {
          apiKeyInput.value = "";
          perplexityInput.value = "";
          serverTokenInput.value = "";
          status.textContent = "🧹 Keys cleared.";
          setTimeout(() => (status.textContent = ""), 2000);
        });
      };
    };
  }

  /**
   * Handles model toggle between Mistral and Deep Research
   * @listens {Event} change
   */
  modelToggle.addEventListener("change", () => {
    const isGPT = modelToggle.checked;
    console.log("🔁 Model switched to:", isGPT ? "Deep Research (GPT+Perplexity)" : "Mistral (Local)");
  });

  document.getElementById("send").addEventListener("click", () => {
    const userInput = promptInput.value;
    promptInput.value = "";
    sendPageAwarePrompt(userInput);
  });

  promptInput.addEventListener("keydown", (e) => {
    if (e.metaKey && e.key === "Enter") {
      e.preventDefault();
      document.getElementById("send").click();
    }
  });

  /**
   * Queries the active tab with retries
   * @param {number} [retries=3] - Number of retry attempts
   * @param {number} [delay=200] - Delay between retries in ms
   * @returns {Promise<chrome.tabs.Tab>} The active tab
   * @throws {Error} If no active tab is found after retries
   */
  async function queryActiveTab(retries = 3, delay = 200) {
    return new Promise((resolve, reject) => {
      function tryQuery(attempt) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (chrome.runtime.lastError || !tabs || !tabs.length) {
            if (attempt < retries) {
              console.warn(`🔄 Retrying tab query (attempt ${attempt + 1})...`);
              setTimeout(() => tryQuery(attempt + 1), delay);
            } else {
              reject(new Error("❌ Could not access active tab"));
            }
          } else {
            resolve(tabs[0]);
          }
        });
      }
      tryQuery(0);
    });
  }

  /**
   * Processes user input considering page context and selected model
   * @param {string} userInput - The user's prompt
   * @returns {Promise<void>}
   */
  async function sendPageAwarePrompt(userInput) {
    const isGPT = modelToggle?.checked;
    let needsContext = false;

    if (!isGPT) {
      try {
        const response = await fetch("http://localhost:4000/mistral", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "mistral",
            prompt: `Answer only \"yes\" or \"no\": Does this request require content from the current webpage?\n\nRequest: ${userInput}`
          })
        });
        const result = await response.json();
        const intentResponse = result.response?.toLowerCase().trim();
        console.log("🔍 Mistral intent check response:", intentResponse);
        needsContext = /^(yes|yeah|yup|affirmative)/.test(intentResponse);
      } catch (err) {
        console.warn("🟠 Intent detection failed:", err);
      }
    } else {
      needsContext = /(summarize|analyze|explain|review|read|scan|evaluate|contextualize|understand|reflect|synthesize|discuss|highlight|focus on|extract|study)/i.test(userInput);
    }

    if (!needsContext) return sendPrompt(userInput);

    try {
      const tab = await queryActiveTab();
      chrome.tabs.sendMessage(tab.id, { action: "extractPageContent" }, async (response) => {
        if (response?.isPDF) {
          try {
            console.log("📎 Attempting to autofetch PDF from tab URL...");
            const { url } = tab;
            const response = await fetch(url);
            const blob = await response.blob();
            const file = new File([blob], "autofetched.pdf", { type: "application/pdf" });
        
            const model = modelToggle?.checked ? 'gpt' : 'local';
            await handlePDFWithModelFallback(file, userInput, model);
        
          } catch (err) {
            console.warn("❌ Autofetch failed, falling back to upload prompt:", err);
            const uploadInput = document.createElement("input");
            uploadInput.type = "file";
            uploadInput.accept = ".pdf";
            uploadInput.style.display = "none";
            uploadInput.onchange = async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const { default: PDFHandler } = await import(chrome.runtime.getURL('pdf-handler.js'));
              console.log("📥 Calling PDFHandler.extractTextFromPDF...");
              const result = await PDFHandler.extractTextFromPDF(file);
              const text = typeof result === 'string' ? result : result?.text || '';
              console.log("📤 Extracted PDF text length:", text.length);
              console.log("📄 PDF content preview:", text.slice(0, 300));
              const finalPrompt = `${userInput}\n\n--- Uploaded PDF Start ---\n${text.slice(0, 20000)}\n--- Uploaded PDF End ---`;
              await sendPrompt(finalPrompt, userInput);
            };
            document.body.appendChild(uploadInput);
            uploadInput.click();
          }
        } else {
          const extracted = response?.text || "";
          console.log(`📄 Full extracted length: ${extracted.length} characters`);
          const trimmed = extracted.slice(0, 20000);
          console.log(`📄 Injected page content used: ${trimmed.length} characters`);
          const finalPrompt = `${userInput}\n\n--- Page Content Start ---\n${trimmed}\n--- Page Content End ---`;
          await sendPrompt(finalPrompt, userInput);
        }
      });
    } catch (err) {
      console.warn("⚠️ Could not access page content:", err);
      await sendPrompt(userInput);
    }
  }

  /**
   * Sends prompt to appropriate model endpoint
   * @param {string} prompt - The processed prompt to send
   * @param {string} [originalPrompt=prompt] - The original user input
   * @returns {Promise<void>}
   */
  async function sendPrompt(prompt, originalPrompt = prompt) {
    const isGPT = modelToggle?.checked;
    addMessage("user", originalPrompt, "user");
    addMessage("assistant", "⏳ Thinking...");

    try {
      if (isGPT) {
        const stored = await new Promise((res) => chrome.storage.local.get(["apiKey", "perplexityKey"], res));
        const { apiKey, perplexityKey } = stored;
        if (!apiKey || !perplexityKey) throw new Error("Missing API keys");

        const searchResponse = await fetch("http://localhost:3000/perplexity", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${perplexityKey}`,
          },
          body: JSON.stringify({ query: prompt }),
        });
        const searchData = await searchResponse.json();
        const sources = (searchData.sources || []).map((src, i) => `[${i + 1}] ${src.title}: ${src.url}`).join("\n");

        const enhancedPrompt = `Using these Perplexity results, synthesize a deep research summary with citations:\n\n${searchData.answer}\n\nSources:\n${sources}`;

        const chatResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4",
            messages: [{ role: "user", content: enhancedPrompt }],
          }),
        });
        const data = await chatResponse.json();
        chat.lastChild.remove();
        addMessage("assistant", data.choices?.[0]?.message?.content || "(No response)", "deep-research");
      } else {
        const llmResponse = await fetch("http://localhost:4000/mistral", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model: "mistral", prompt })
        });
        const data = await llmResponse.json();
        chat.lastChild.remove();
        addMessage("assistant", data.response || "(No response)");
      }
    } catch (err) {
      chat.lastChild.remove();
      addMessage("assistant", `❌ Error: ${err.message}`);
    }
  }

  /**
   * Adds a message to the chat UI
   * @param {'user'|'assistant'} role - The role of the message sender
   * @param {string} text - The message content
   * @param {string} [className='assistant'] - CSS class for styling
   */
  function addMessage(role, text, className = "assistant") {
    const div = document.createElement("div");
    div.className = `message ${className}`;

    const pre = document.createElement("pre");
    const label = role === "user" ? "You" : className === "deep-research" ? "Deep Research" : "Mistral";
    pre.innerHTML = `<strong>${label}:</strong><br><div class='message-content' style='user-select: text;'>${text}</div>`;
    pre.style.whiteSpace = "pre-wrap";
    pre.style.wordBreak = "break-word";

    if (role !== "user") {
      const copyBtn = document.createElement("button");
      copyBtn.textContent = "📋";
      copyBtn.className = "copy-btn";
      copyBtn.onclick = () => {
        const stripped = pre.innerText.replace(/^(Deep Research|Mistral|You):\s*/, "");
        navigator.clipboard.writeText(stripped);
      };
      div.appendChild(copyBtn);
    }

    div.appendChild(pre);
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
  }
});