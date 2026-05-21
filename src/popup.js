// Popup controller for Token Tax Dashboard

document.addEventListener("DOMContentLoaded", () => {
  loadMetrics();

  // Listen for storage updates while popup is open
  chrome.storage.onChanged.addListener((changes) => {
    for (const key of ["claude", "gemini"]) {
      if (changes[key]) {
        updatePlatformUI(key, changes[key].newValue);
      }
    }
  });

  // Sync button listener
  const syncBtn = document.getElementById("syncBtn");
  syncBtn.addEventListener("click", () => {
    // Show syncing UI instantly
    setSyncingState("claude");
    setSyncingState("gemini");

    // Send command to background script
    chrome.runtime.sendMessage({ action: "forceSync" });
  });
});

function loadMetrics() {
  chrome.storage.local.get(["claude", "gemini"], (result) => {
    if (chrome.runtime.lastError) {
      console.error("Failed to load metrics from storage:", chrome.runtime.lastError);
      return;
    }

    updatePlatformUI("claude", result.claude);
    updatePlatformUI("gemini", result.gemini);
  });
}

function setSyncingState(platform) {
  const badge = document.getElementById(`${platform}-badge`);
  badge.className = "status-badge status-syncing";
  badge.textContent = "syncing";
  
  const errorEl = document.getElementById(`${platform}-error`);
  errorEl.style.display = "none";
}

function updatePlatformUI(platform, data) {
  const badge = document.getElementById(`${platform}-badge`);
  const remainingEl = document.getElementById(`${platform}-remaining`);
  const limitEl = document.getElementById(`${platform}-limit`);
  const resetEl = document.getElementById(`${platform}-reset`);
  const updatedEl = document.getElementById(`${platform}-updated`);
  const progressEl = document.getElementById(`${platform}-progress`);
  const errorEl = document.getElementById(`${platform}-error`);

  if (!data) {
    badge.className = "status-badge status-error";
    badge.textContent = "no data";
    remainingEl.textContent = "-";
    limitEl.textContent = "-";
    resetEl.textContent = "-";
    updatedEl.textContent = "Never";
    progressEl.style.width = "0%";
    errorEl.style.display = "none";
    return;
  }

  if (data.status === "success" && data.metrics) {
    const metrics = data.metrics;
    
    badge.className = "status-badge status-success";
    badge.textContent = "synced";
    
    remainingEl.textContent = metrics.remaining;
    limitEl.textContent = metrics.limit;
    resetEl.textContent = metrics.resetTime || "-";
    updatedEl.textContent = formatTime(data.updatedAt);
    
    // Calculate progress bar
    if (typeof metrics.remaining === "number" && typeof metrics.limit === "number" && metrics.limit > 0) {
      const pct = Math.min(100, Math.max(0, (metrics.remaining / metrics.limit) * 100));
      progressEl.style.width = `${pct}%`;
    } else {
      progressEl.style.width = "100%"; // Fallback
    }
    
    errorEl.style.display = "none";
  } else if (data.status === "error") {
    badge.className = "status-badge status-error";
    badge.textContent = "failed";
    
    remainingEl.textContent = "-";
    limitEl.textContent = "-";
    resetEl.textContent = "-";
    updatedEl.textContent = formatTime(data.updatedAt);
    progressEl.style.width = "0%";
    
    errorEl.textContent = data.error || "Extraction failed";
    errorEl.style.display = "block";
  }
}

function formatTime(timestamp) {
  if (!timestamp) return "Never";
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
