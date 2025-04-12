/**
 * @fileoverview Background script for Firefox extension handling content extraction and tab management
 */

/**
 * @typedef {Object} ExtractResponse
 * @property {boolean} success - Whether the extraction was successful
 * @property {string} text - Extracted text content
 * @property {boolean} isPDF - Whether the content is from a PDF
 * @property {string} [error] - Error message if extraction failed
 */

/**
 * Helper function to safely execute scripts in a tab
 * @param {number} tabId - ID of the target tab
 * @param {Function} func - Function to execute in the tab
 * @returns {Promise<any>} Result of the executed function or null if failed
 * @throws {Error} When script execution fails
 */
async function executeScriptInTab(tabId, func) {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func,
    });
    return results?.[0]?.result;
  } catch (error) {
    console.error("Script execution error:", error);
    return null;
  }
}

/**
 * Get the active tab in the current window
 * @param {number} [retries=3] - Number of retry attempts
 * @param {number} [delay=200] - Delay between retries in ms
 * @returns {Promise<chrome.tabs.Tab|null>} Active tab or null if not found
 */
async function getActiveTab(retries = 3, delay = 200) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const tab = tabs.find(t => t.id && t.url && /^https?:/.test(t.url));
      if (tab) return tab;
    } catch (err) {
      console.warn(`🔄 Retrying getActiveTab (attempt ${attempt + 1})...`);
    }
    await new Promise(r => setTimeout(r, delay));
  }
  console.error("❌ No active tab available after retries");
  return null;
}

/**
 * Send a message to a tab and wait for response
 * @param {number} tabId - ID of the target tab
 * @param {Object} message - Message to send
 * @returns {Promise<ExtractResponse>} Response from the tab
 * @throws {Error} When message sending fails or times out
 */
function sendTabMessage(tabId, message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, response => {
      if (chrome.runtime.lastError) {
        // If content script isn't ready, inject it
        if (chrome.runtime.lastError.message.includes("Could not establish connection")) {
          chrome.scripting.executeScript({
            target: { tabId },
            files: ["content.js"]
          }, () => {
            // Retry message after injection
            setTimeout(() => {
              chrome.tabs.sendMessage(tabId, message, secondResponse => {
                if (chrome.runtime.lastError) {
                  reject(chrome.runtime.lastError);
                } else {
                  resolve(secondResponse);
                }
              });
            }, 100);
          });
        } else {
          reject(chrome.runtime.lastError);
        }
      } else {
        resolve(response);
      }
    });
  });
}

/**
 * Message handler for content extraction requests
 * @listens {chrome.runtime.onMessage}
 * @param {Object} message - The message object
 * @param {chrome.runtime.MessageSender} sender - Message sender information
 * @param {Function} sendResponse - Callback to send response
 * @returns {boolean} True if response will be sent asynchronously
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "extractPageContent") {
    (async () => {
      try {
        const tab = await getActiveTab();
        if (!tab) {
          console.warn("No active tab available");
          sendResponse({ success: false, error: "No active tab found" });
          return;
        }

        // Check if it's a PDF before trying content extraction
        const isPDF = tab.url?.toLowerCase().endsWith('.pdf');
        if (isPDF) {
          sendResponse({ success: true, text: "", isPDF: true });
          return;
        }

        // Try to get content from the tab
        const response = await sendTabMessage(tab.id, { action: "extractPageContent" });
        if (!response?.success) {
          throw new Error(response?.error || "Failed to extract content");
        }

        sendResponse({ success: true, text: response.text });
      } catch (error) {
        console.error("Content extraction failed:", error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true; // Keep the message channel open
  }
});
