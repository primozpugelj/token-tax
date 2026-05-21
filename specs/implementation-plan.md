# Implementation Plan: AI Usage Scraper

This blueprint outlines a step-by-step roadmap to implement the background tab scraper for tracking Claude and Gemini consumption metrics.

---

## Finalized Decisions
- **Claude Scrape Targets:** Target limits page at `https://claude.ai/new#settings/usage` / `https://claude.ai/settings/usage`.
- **Gemini Scrape Targets:** Target limits page at `https://gemini.google.com/usage`.
- **Testing Approach:** Implement both Node.js native unit tests (`node:test` + VM runner) and Playwright E2E tests.
- **Data Persistence:** Store counts locally in browser using `chrome.storage.local`.

---

## Phase 1: Foundation (`manifest.json`)
Define the Manifest V3 structure. We require background execution, tab lifecycle control, storage persistence, and targeted permission execution.

### Key Actions
* Create `manifest.json`.
* Request `alarms` permission for periodic background scheduling.
* Request `tabs` and `scripting` permissions to orchestrate hidden pages.
* Request `storage` permission to save metrics locally.
* Explicitly whitelist host patterns (`https://claude.ai/*` and `https://gemini.google.com/*`) to allow data extraction.

---

## Phase 2: Lifecycle Management (`background.js`)
Build the core engine responsible for handling background tasks and clean cleanup sequences.

### Key Actions
1. **Register Alarms:** Initialize a `chrome.alarms` listener on extension startup.
2. **Tab Orchestration:** Upon alarm trigger, programmatically call `chrome.tabs.create({ url: ..., active: false })`.
3. **Watch and Destroy:** Track the generated `tabId`. Implement a timeout safety anchor (e.g., force-close the tab after 8 seconds if extraction stalls) alongside a completion listener that closes the tab instantly upon receipt of payload data.

---

## Phase 3: Extraction Strategy (Content Scripts)
Write unique content scripts tailored to each platform's architectural layout.

### Claude.ai (`content-claude.js`)
- **Target URL:** `https://claude.ai/new#settings/usage` / `https://claude.ai/settings/usage`.
- **Strategy:** Read settings details containing usage limits (e.g. remaining messages) and send to background page using `chrome.runtime.sendMessage`.

### Gemini (`content-gemini.js`)
- **Target URL:** `https://gemini.google.com/usage`.
- **Strategy:** Read elements displaying remaining message capacity or next billing cycle limits and send to background page.

---

## Phase 4: Data Processing & Persistence
Decide where your data travels once extracted from the DOM.

- **Storage:** Local browser storage (`chrome.storage.local`).
- **Dashboard:** Unified dashboard inside popup UI (`popup.html` / `popup.js`).

---

## Phase 5: Resiliency & Edge Case Handling
Mitigate issues where the automation loop fails due to external variations.

* **Logged Out State:** If the content script encounters a login screen, it must abort immediately, signal `background.js` to close the tab, and flag a "Re-authentication required" error status badge on the extension icon.
* **UI Redesigns:** Wrap selectors inside robust `try/catch` statements.

---

## Phase 6: Testing Framework Setup
Provide routes for validating extension behaviour and logic.

### Option A: Zero-Dependency Unit Tests (Default/Recommended)
- Test script: `tests/run-tests.js`.
- Utilizes Node.js `vm` module to run extension JS scripts under a mocked `chrome` browser context.
- Assertions via native Node.js `node:assert` and `node:test` modules.
- **Benefits:** Fast, lightweight, zero dependencies, no installation needed.

### Option B: Playwright E2E Testing (Optional Integration)
- Uses `@playwright/test` to spawn an instance of Chrome with the unpacked extension loaded.
- Simulates page navigation and asserts service-worker alarms, storage saves, and popup UI responses.
- **Benefits:** Validates actual browser integration and UI. Requires `npm install` and playwright browser installation.