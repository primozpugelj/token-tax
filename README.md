# AI Usage Scraper Chrome Extension

A lightweight, automated Chrome Extension designed to track your token and message consumption across **Claude.ai** and **Gemini** in real-time. 

Since these consumer platforms do not expose public usage metrics via standard APIs, this extension automates background checks using your existing browser authentication states—completely avoiding login walls, Cloudflare blocks, or iframe restrictions.

## How It Works
1. **Automated Alarm:** A background service worker triggers a sync cycle at a customizable interval (e.g., every 15 minutes).
2. **Hidden Execution:** The extension opens a standalone background tab (`active: false`) for each platform. This bypasses the strict `X-Frame-Options: DENY` headers that break iframe-based approaches like the Offscreen API.
3. **DOM & Network Scraping:** Specialized content scripts extract usage numbers either directly from UI elements or by intercepting active API calls.
4. **Local Aggregation:** The data is pushed to a central target (local Chrome storage, a console log, or a local dashboard webhook).
5. **Auto-Teardown:** The background tab is killed instantly after extraction to prevent system clutter.

## Proposed Source Structure
```text
token-tax/src
├── manifest.json            # Extension configuration & permissions
├── background.js           # Alarm manager and lifecycle controller
├── content-claude.js       # Scraping engine for Claude.ai
├── content-gemini.js       # Scraping engine for gemini.google.com
