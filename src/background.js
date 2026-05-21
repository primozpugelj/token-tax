// Background Lifecycle Manager for AI Usage Scraper

const ALARM_NAME = "sync-limit-alarm";
const SYNC_INTERVAL_MINUTES = 1;
const SAFETY_TIMEOUT_MS = 8000;

const PLATFORM_URLS = {
  claude: "https://claude.ai/new#settings/usage",
  gemini: "https://gemini.google.com/usage"
};

// Track active extraction tabs and their timeout IDs
const activeTabs = new Map();

// Initialize alarm on install/startup
chrome.runtime.onInstalled.addListener(() => {
  setupAlarm();
  triggerSync();
});

chrome.runtime.onStartup.addListener(() => {
  setupAlarm();
  triggerSync();
});

// Listen for alarms
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    triggerSync();
  }
});

// Setup periodic alarm
function setupAlarm() {
  chrome.alarms.create(ALARM_NAME, {
    periodInMinutes: SYNC_INTERVAL_MINUTES
  });
}

// Orchestrate the tab creation for sync
function triggerSync() {
  for (const [platform, url] of Object.entries(PLATFORM_URLS)) {
    startScrapingTab(platform, url);
  }
}

function startScrapingTab(platform, url) {
  // If there's already an active tab for this platform, close it first
  if (activeTabs.has(platform)) {
    const existing = activeTabs.get(platform);
    clearTimeout(existing.timeoutId);
    try {
      chrome.tabs.remove(existing.tabId, () => {
        // Suppress errors from already closed tabs
        chrome.runtime.lastError;
      });
    } catch (e) {
      console.warn(`Failed to remove existing tab for ${platform}:`, e);
    }
  }

  // Create the tab in the background (active: false)
  chrome.tabs.create({ url, active: false }, (tab) => {
    if (chrome.runtime.lastError || !tab) {
      console.error(`Failed to create tab for ${platform}:`, chrome.runtime.lastError);
      return;
    }

    const tabId = tab.id;

    // Set safety timeout to close tab if scraping hangs or takes too long
    const timeoutId = setTimeout(() => {
      console.warn(`Scraping timed out for ${platform} (tab ID ${tabId})`);
      closeTabAndCleanup(platform, tabId);
      // Mark as error status in storage
      savePlatformStatus(platform, {
        status: "error",
        error: "Timeout reached during extraction",
        updatedAt: Date.now()
      });
    }, SAFETY_TIMEOUT_MS);

    // Save info
    activeTabs.set(platform, { tabId, timeoutId });
  });
}

// Helper to close tab and clear tracking
function closeTabAndCleanup(platform, tabId) {
  const active = activeTabs.get(platform);
  if (active && active.tabId === tabId) {
    clearTimeout(active.timeoutId);
    activeTabs.delete(platform);
  }

  try {
    chrome.tabs.remove(tabId, () => {
      // Suppress errors
      chrome.runtime.lastError;
    });
  } catch (e) {
    console.warn(`Failed to close tab ${tabId}:`, e);
  }
}

// Save platform metrics/status to chrome.storage
function savePlatformStatus(platform, data) {
  chrome.storage.local.set({ [platform]: data }, () => {
    if (chrome.runtime.lastError) {
      console.error(`Failed to save storage for ${platform}:`, chrome.runtime.lastError);
    }
  });
}

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { action, platform, data, error } = message;

  if (action === "forceSync") {
    console.log("Forced sync triggered from popup");
    triggerSync();
    return;
  }

  const tabId = sender.tab ? sender.tab.id : null;
  if (!tabId) return;

  if (action === "saveMetrics" && platform) {
    const active = activeTabs.get(platform);
    if (active && active.tabId === tabId) {
      console.log(`Received metrics for ${platform}:`, data);
      savePlatformStatus(platform, {
        status: "success",
        metrics: data,
        updatedAt: Date.now()
      });
      closeTabAndCleanup(platform, tabId);
    }
  } else if (action === "scrapingFailed" && platform) {
    const active = activeTabs.get(platform);
    if (active && active.tabId === tabId) {
      console.error(`Scraping failed for ${platform}:`, error);
      savePlatformStatus(platform, {
        status: "error",
        error: error || "Unknown scraping failure",
        updatedAt: Date.now()
      });
      closeTabAndCleanup(platform, tabId);
    }
  }
});
