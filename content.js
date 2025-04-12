chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "extractPageContent") {
      try {
        const selection = window.getSelection();
        const selectedText = selection && selection.toString().trim();
        const fullText = document.body.innerText || document.documentElement.innerText || "";
        const text = selectedText || fullText;
        sendResponse({ success: true, text });
      } catch (error) {
        console.error("Content script extraction error:", error);
        sendResponse({ success: false, error: error.message });
      }
    }
  });  