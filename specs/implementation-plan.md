---

### `implementation-plan.md`
```markdown
# Implementation Plan: AI Usage Scraper

This blueprint outlines a step-by-step roadmap to implement the background tab scraper for tracking Claude and Gemini consumption metrics[cite: 1].

---

## Phase 1: Foundation (`manifest.json`)
Define the Manifest V3 structure[cite: 1]. We require background execution, tab lifecycle control, and targeted permission execution[cite: 1].

### Key Actions
* Create `manifest.json`[cite: 1].
* Request `alarms` permission for periodic background scheduling[cite: 1].
* Request `tabs` and `scripting` permissions to orchestrate hidden pages[cite: 1].
* Explicitly white-list host patterns (`https://claude.ai/*` and `https://gemini.google.com/*`) to allow data extraction[cite: 1].

---

## Phase 2: Lifecycle Management (`background.js`)
Build the core engine responsible for handling background tasks and clean cleanup sequences[cite: 1].

### Key Actions
1. **Register Alarms:** Initialize a `chrome.alarms` listener on extension startup[cite: 1].
2. **Tab Orchestration:** Upon alarm trigger, programmatically call `chrome.tabs.create({ url: ..., active: false })`[cite: 1].
3. **Watch and Destroy:** Track the generated `tabId`[cite: 1]. Implement a timeout safety anchor (e.g., force-close the tab after 8 seconds if extraction stalls) alongside a completion listener that closes the tab instantly upon receipt of payload data[cite: 1].

---

## Phase 3: Extraction Strategy (Content Scripts)
Write unique content scripts tailored to each platform's architectural layout[cite: 1].

### Claude.ai (`content-claude.js`)
* **Target Target:** `https://claude.ai/settings/billing` or the account popup window[cite: 1].
* **Strategy A (DOM Parsing):** Use a MutationObserver to watch for the limits element (e.g., text blocks showing "*Remaining messages*", "*Resets at...*")[cite: 1].
* **Strategy B (Fetch Interception):** Inject a script to override `window.fetch` and listen to responses from internal `/api/auth/current_user` or billing endpoints[cite: 1].

### Gemini (`content-gemini.js`)
* **Target Target:** `https://gemini.google.com/` Advanced panel or settings page[cite: 1].
* **Strategy:** Query the side-panel text content for tier limits or billing cycle caps[cite: 1]. 

---

## Phase 4: Data Processing & Persistence
Decide where your data travels once extracted from the DOM[cite: 1].

### Alternative Outputs
* **Option A (Lightweight):** Store metrics locally using `chrome.storage.local`[cite: 1]. Build a simple popup UI inside the extension to render a unified charts dashboard[cite: 1].
* **Option B (Connected):** Issue a native `fetch()` command to relay the JSON payload to a local Node.js / Python server running on your computer (`http://localhost:3000/api/usage`)[cite: 1]. This enables seamless integration with desktop tracking suites[cite: 1].

---

## Phase 5: Resiliency & Edge Case Handling
Mitigate issues where the automation loop fails due to external variations[cite: 1].

* **Logged Out State:** If the content script encounters a login screen, it must abort immediately, signal `background.js` to close the tab, and flag a "Re-authentication required" error status badge on the extension icon[cite: 1].
* **UI Redesigns:** Wrap selectors inside robust `try/catch` statements[cite: 1]. If a metric fails to parse, dump the raw DOM snapshot to your log endpoint for easy debugging updates[cite: 1].