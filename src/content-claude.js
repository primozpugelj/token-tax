// Claude.ai Usage Scraper

(function () {
  // Only execute logic on settings usage pages
  function checkUrl() {
    return window.location.href.includes("settings/usage") || window.location.hash.includes("settings/usage");
  }

  if (!checkUrl()) {
    return;
  }

  console.log("Token Tax: Claude scraper active");

  // Keep checking for the presence of elements (since Claude is a SPA)
  let checkInterval = setInterval(() => {
    // 1. Check for logged out state (e.g., login buttons or login paths)
    if (window.location.pathname.startsWith("/login") || document.querySelector("a[href*='/login']") || document.querySelector("input[type='email']")) {
      clearInterval(checkInterval);
      chrome.runtime.sendMessage({
        action: "scrapingFailed",
        platform: "claude",
        error: "Not logged in"
      });
      return;
    }

    // 2. Look for usage/limits containers or text blocks
    // Let's perform a text-based search to be resilient to UI changes
    const bodyText = document.body.innerText;
    
    // We expect text like: "Your messages reset at...", "X of Y messages remaining", etc.
    // Example: "You have 15 messages remaining until 8:00 PM"
    if (bodyText.includes("messages remaining") || bodyText.includes("reset") || bodyText.includes("Usage") || bodyText.includes("Limit")) {
      clearInterval(checkInterval);
      
      try {
        const metrics = parseClaudeMetrics(bodyText);
        chrome.runtime.sendMessage({
          action: "saveMetrics",
          platform: "claude",
          data: metrics
        });
      } catch (err) {
        chrome.runtime.sendMessage({
          action: "scrapingFailed",
          platform: "claude",
          error: "Parse failed: " + err.message
        });
      }
    }
  }, 1000);

  // Parse metrics out of the text
  function parseClaudeMetrics(text) {
    let remaining = null;
    let total = null;
    let resetTime = null;

    // Search for patterns like: "X remaining messages", "X messages remaining", "limit of Y", "reset at Z"
    // Let's implement regex matching:
    const remainingMatch = text.match(/(\d+)\s+(?:messages?\s+)?remaining/i) || text.match(/remaining:\s*(\d+)/i);
    if (remainingMatch) {
      remaining = parseInt(remainingMatch[1], 10);
    }

    const totalMatch = text.match(/limit\s+of\s+(\d+)/i) || text.match(/out\s+of\s+(\d+)/i) || text.match(/(?:max|total):\s*(\d+)/i);
    if (totalMatch) {
      total = parseInt(totalMatch[1], 10);
    }

    // Capture "resets at XX:XX" or "until XX:XX"
    const resetMatch = text.match(/(?:resets?|until)\s+(?:at\s+)?(\d{1,2}:\d{2}\s*(?:[AP]M)?)/i);
    if (resetMatch) {
      resetTime = resetMatch[1];
    }

    // Fallback/Default values if we found some text but couldn't parse all details precisely
    return {
      remaining: remaining !== null ? remaining : "N/A",
      limit: total !== null ? total : "N/A",
      resetTime: resetTime || "Unknown",
      rawText: text.substring(0, 1000) // snapshot for debugging if needed
    };
  }
})();
