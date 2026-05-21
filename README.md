# AI Usage Scraper Chrome Extension

A lightweight, automated Chrome Extension designed to track your token and message consumption across **Claude.ai** and **Gemini** in real-time. 

Since these consumer platforms do not expose public usage metrics via standard APIs, this extension automates background checks using your existing browser authentication states—completely avoiding login walls, Cloudflare blocks, or iframe restrictions.

---

## How It Works
1. **Automated Alarm:** A background service worker triggers a sync cycle at a customizable interval (default: every 15 minutes).
2. **Hidden Execution:** The extension opens a standalone background tab (`active: false`) for each platform. This bypasses the strict `X-Frame-Options: DENY` headers that break iframe-based approaches like the Offscreen API.
3. **DOM Scraping:** Specialized content scripts injected into the background tabs scrape usage statistics (remaining messages, billing caps, resets) once the pages have rendered.
4. **Local Persistence:** Data is stored in the browser's `chrome.storage.local` namespace.
5. **Dashboard UI:** The extension popup renders a premium dark-themed dashboard showing your remaining capacity and reset times, with manual "Sync Now" controls.
6. **Auto-Teardown:** The background tab is programmatically closed instantly after extraction, or after a safety timeout (8 seconds) to prevent system clutter.

---

## Repository Structure
```text
token-tax/
├── src/
│   ├── manifest.json        # Extension config & permissions
│   ├── background.js        # Service worker (lifecycle & alarms)
│   ├── content-claude.js    # Claude.ai scraper
│   ├── content-gemini.js    # Gemini scraper
│   ├── popup.html           # Dashboard popup interface
│   └── popup.js             # Dashboard controller
├── tests/
│   ├── e2e/
│   │   └── extension.spec.js # Playwright E2E browser tests
│   ├── background.test.js    # Node.js native unit tests
│   ├── mock-chrome.js        # Chrome API mocks
│   └── run-tests.js          # Native unit tests runner script
├── specs/
│   └── implementation-plan.md
├── package.json
└── README.md
```

---

## Installation Guide (Unpacked Extension)
1. Open Google Chrome.
2. Navigate to `chrome://extensions/`.
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked** in the top-left corner.
5. Choose the `src/` directory of this repository.

---

## Testing Options

This project implements two testing routes to ensure reliability across browser states.

### 1. Unit Testing (Zero-Dependency)
Unit tests evaluate the background worker orchestration, alarm triggers, tab cleanup sequence, and message handling without needing external npm modules or browser installs. It uses Node.js's native test runner and VM sandbox to mock the Chrome API environment.

* **Run Command:**
  ```bash
  npm run test:unit
  ```
  *(Alternatively, run `node tests/run-tests.js`)*

### 2. End-to-End (E2E) Testing (Playwright)
E2E tests load the unpacked extension in Chrome via Playwright, launch mock user interfaces, and verify service worker activation, messaging, and popup dashboard states.

* **Prerequisites (Requires npm packages and browser download):**
  ```bash
  npm install
  npx playwright install chromium
  ```
* **Run Command:**
  ```bash
  npm run test:e2e
  ```
