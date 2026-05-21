// Gemini Usage Scraper

(function () {
  // Only execute logic on usage page
  function checkUrl() {
    return window.location.href.includes("gemini.google.com/usage");
  }

  if (!checkUrl()) {
    return;
  }

  console.log("Token Tax: Gemini scraper active");

  // Keep checking for elements
  let checkInterval = setInterval(() => {
    // 1. Check for logged out state (Google login patterns)
    if (document.querySelector("a[href*='accounts.google.com/ServiceLogin']") || document.querySelector("input[type='email']")) {
      clearInterval(checkInterval);
      chrome.runtime.sendMessage({
        action: "scrapingFailed",
        platform: "gemini",
        error: "Not logged in"
      });
      return;
    }

    // 2. Look for usage/limits elements
    const bodyText = document.body.innerText;
    
    // We expect some text or lists showing limits, queries used, or billing cycles
    if (bodyText.includes("usage") || bodyText.includes("limit") || bodyText.includes("queries") || bodyText.includes("reset") || bodyText.includes("messages")) {
      clearInterval(checkInterval);
      
      try {
        const metrics = parseGeminiMetrics(bodyText);
        chrome.runtime.sendMessage({
          action: "saveMetrics",
          platform: "gemini",
          data: metrics
        });
      } catch (err) {
        chrome.runtime.sendMessage({
          action: "scrapingFailed",
          platform: "gemini",
          error: "Parse failed: " + err.message
        });
      }
    }
  }, 1000);

  // Parse metrics out of the text
  function parseGeminiMetrics(text) {
    let remaining = null;
    let total = null;
    let resetTime = null;

    // Search for patterns like: "X queries remaining", "X of Y queries used", "limits reset in X days", etc.
    const remainingMatch = text.match(/(\d+)\s+queries?\s+remaining/i) || text.match(/remaining:\s*(\d+)/i);
    if (remainingMatch) {
      remaining = parseInt(remainingMatch[1], 10);
    }

    // E.g. "out of 500 queries" or "/ 500"
    const totalMatch = text.match(/limit\s+of\s+(\d+)/i) || text.match(/(?:max|total):\s*(\d+)/i) || text.match(/\/\s*(\d+)\s+queries/i);
    if (totalMatch) {
      total = parseInt(totalMatch[1], 10);
    }

    const resetMatch = text.match(/(?:resets?|billing cycle)\s+(?:on|in|at)\s+(\w+\s+\d{1,2},?\s*\d{4}|\d+\s+days?)/i);
    if (resetMatch) {
      resetTime = resetMatch[1];
    }

    return {
      remaining: remaining !== null ? remaining : "N/A",
      limit: total !== null ? total : "N/A",
      resetTime: resetTime || "Unknown",
      rawText: text.substring(0, 1000)
    };
  }
})();
