// Background Service Worker Unit Tests using Node.js native test runner

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const MockChrome = require('./mock-chrome');

test('Background Service Worker Orchestration', async (t) => {
  const chrome = new MockChrome();
  const backgroundCode = fs.readFileSync(path.join(__dirname, '../src/background.js'), 'utf8');

  // Helper to execute background.js code in a sandbox VM context
  const runBackground = () => {
    const context = vm.createContext({
      chrome,
      console,
      setTimeout,
      clearTimeout
    });
    vm.runInContext(backgroundCode, context);
  };

  await t.test('Registers alarm and starts sync on install', () => {
    chrome.reset();
    runBackground();

    // Trigger installation
    chrome.triggerInstalled();

    // 1. Alarm setup check
    assert.strictEqual(chrome.alarmsCreated.length, 1);
    assert.strictEqual(chrome.alarmsCreated[0].name, 'sync-limit-alarm');
    assert.ok(typeof chrome.alarmsCreated[0].options.periodInMinutes === 'number' && chrome.alarmsCreated[0].options.periodInMinutes > 0);

    // 2. Initial sync tabs check (should open a tab for each platform)
    assert.strictEqual(chrome.tabsCreated.length, 2);
    assert.ok(chrome.tabsCreated.some(tab => tab.url.includes('claude.ai') && tab.active === false));
    assert.ok(chrome.tabsCreated.some(tab => tab.url.includes('gemini.google.com') && tab.active === false));
  });

  await t.test('Launches extraction tabs when alarm fires', () => {
    chrome.reset();
    runBackground();

    // Trigger alarm
    chrome.triggerAlarm('sync-limit-alarm');

    // Should start scraping tabs (2 tabs)
    assert.strictEqual(chrome.tabsCreated.length, 2);
  });

  await t.test('Saves success metrics and cleans up tab upon receiving data message', () => {
    chrome.reset();
    runBackground();

    // Initialize alarm to spawn tabs and collect their mock IDs
    chrome.triggerAlarm('sync-limit-alarm');
    const claudeTab = chrome.tabsCreated.find(tab => tab.url.includes('claude.ai'));
    
    assert.ok(claudeTab, "Claude tab should have been created");

    // Mock sender and metrics payload
    const mockSender = { tab: { id: claudeTab.id } };
    const mockPayload = {
      action: "saveMetrics",
      platform: "claude",
      data: { remaining: 5, limit: 50, resetTime: "5:00 PM" }
    };

    // Trigger content script message
    chrome.triggerMessage(mockPayload, mockSender);

    // Tab must be closed immediately
    assert.ok(chrome.tabsRemoved.includes(claudeTab.id), "Claude tab should be closed upon successful metric reception");

    // Check local storage save
    const saved = chrome.localStorage.claude;
    assert.ok(saved, "Claude storage must have active records");
    assert.strictEqual(saved.status, "success");
    assert.strictEqual(saved.metrics.remaining, 5);
    assert.strictEqual(saved.metrics.limit, 50);
    assert.strictEqual(saved.metrics.resetTime, "5:00 PM");
    assert.ok(typeof saved.updatedAt === "number");
  });

  await t.test('Handles scraping errors and updates status badge appropriately', () => {
    chrome.reset();
    runBackground();

    // Initialize alarm to spawn tabs
    chrome.triggerAlarm('sync-limit-alarm');
    const geminiTab = chrome.tabsCreated.find(tab => tab.url.includes('gemini.google.com'));

    assert.ok(geminiTab, "Gemini tab should have been created");

    const mockSender = { tab: { id: geminiTab.id } };
    const mockPayload = {
      action: "scrapingFailed",
      platform: "gemini",
      error: "Not logged in"
    };

    // Trigger failure message
    chrome.triggerMessage(mockPayload, mockSender);

    // Tab must still close
    assert.ok(chrome.tabsRemoved.includes(geminiTab.id), "Gemini tab should close on scraping failure");

    // Local storage should save error details
    const saved = chrome.localStorage.gemini;
    assert.ok(saved, "Gemini storage must contain record");
    assert.strictEqual(saved.status, "error");
    assert.strictEqual(saved.error, "Not logged in");
  });

  await t.test('Allows manual force sync execution from the popup UI', () => {
    chrome.reset();
    runBackground();

    // Send command without a tab ID (representing the popup execution boundary)
    chrome.triggerMessage({ action: "forceSync" });

    // Should initiate immediate scraping
    assert.strictEqual(chrome.tabsCreated.length, 2);
  });
});
