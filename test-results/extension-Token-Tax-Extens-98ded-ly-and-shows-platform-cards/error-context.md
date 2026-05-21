# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: extension.spec.js >> Token Tax Extension E2E >> popup UI loads correctly and shows platform cards
- Location: tests/e2e/extension.spec.js:67:3

# Error details

```
Error: page.goto: net::ERR_ABORTED at chrome-extension://iogpljlogilonklailmebpdnaeojaica/popup.html
Call log:
  - navigating to "chrome-extension://iogpljlogilonklailmebpdnaeojaica/popup.html", waiting until "load"

```

# Test source

```ts
  1  | // Playwright E2E Integration Test for Token Tax extension
  2  | 
  3  | const { test, expect } = require('@playwright/test');
  4  | const chromium = require('playwright').chromium;
  5  | const path = require('path');
  6  | const fs = require('fs');
  7  | 
  8  | test.describe('Token Tax Extension E2E', () => {
  9  |   let context;
  10 |   let extensionId;
  11 | 
  12 |   test.beforeAll(async () => {
  13 |     const pathToExtension = path.join(__dirname, '../../src');
  14 |     
  15 |     // Create a temporary user data directory within the workspace to isolate runs
  16 |     const userDataDir = path.join(__dirname, '../../.tmp_playwright_user_data');
  17 |     if (!fs.existsSync(userDataDir)) {
  18 |       fs.mkdirSync(userDataDir, { recursive: true });
  19 |     }
  20 | 
  21 |     // Set TMPDIR to a local directory within the workspace to prevent sandbox socket binding errors
  22 |     const customTmpDir = path.join(__dirname, '../../.tmp_playwright_tmpdir');
  23 |     if (!fs.existsSync(customTmpDir)) {
  24 |       fs.mkdirSync(customTmpDir, { recursive: true });
  25 |     }
  26 |     process.env.TMPDIR = customTmpDir;
  27 | 
  28 |     // Launch persistent chromium context with extension loaded
  29 |     context = await chromium.launchPersistentContext(userDataDir, {
  30 |       headless: false, // Chrome extensions are only supported in headful Chromium (headless: false)
  31 |       args: [
  32 |         `--disable-extensions-except=${pathToExtension}`,
  33 |         `--load-extension=${pathToExtension}`,
  34 |         `--headless=new` // Modern headless mode allows extensions to work headlessly!
  35 |       ],
  36 |       env: {
  37 |         ...process.env,
  38 |         TMPDIR: customTmpDir,
  39 |         TEMP: customTmpDir,
  40 |         TMP: customTmpDir
  41 |       }
  42 |     });
  43 | 
  44 |     // Retrieve background worker
  45 |     let [background] = context.serviceWorkers();
  46 |     if (!background) {
  47 |       background = await context.waitForEvent('serviceworker');
  48 |     }
  49 | 
  50 |     // Extract the Extension ID from the background service worker URL
  51 |     // Format: chrome-extension://<extension-id>/background.js
  52 |     const urlParts = background.url().split('/');
  53 |     extensionId = urlParts[2];
  54 |   });
  55 | 
  56 |   test.afterAll(async () => {
  57 |     if (context) {
  58 |       await context.close();
  59 |     }
  60 |   });
  61 | 
  62 |   test('extension service worker is active and reachable', async () => {
  63 |     expect(extensionId).not.toBeNull();
  64 |     expect(extensionId.length).toBeGreaterThan(10);
  65 |   });
  66 | 
  67 |   test('popup UI loads correctly and shows platform cards', async ({ page }) => {
  68 |     // Navigate page directly to the popup HTML within the extension context
> 69 |     await page.goto(`chrome-extension://${extensionId}/popup.html`);
     |                ^ Error: page.goto: net::ERR_ABORTED at chrome-extension://iogpljlogilonklailmebpdnaeojaica/popup.html
  70 | 
  71 |     // Verify title and headers
  72 |     await expect(page.locator('h1')).toHaveText('Token Tax');
  73 |     
  74 |     // Verify platform card visibility
  75 |     await expect(page.locator('#card-claude')).toBeVisible();
  76 |     await expect(page.locator('#card-gemini')).toBeVisible();
  77 | 
  78 |     // Verify presence of limits labels
  79 |     await expect(page.locator('#claude-remaining')).toBeVisible();
  80 |     await expect(page.locator('#gemini-remaining')).toBeVisible();
  81 |   });
  82 | 
  83 |   test('trigger sync click updates badge state to syncing', async ({ page }) => {
  84 |     await page.goto(`chrome-extension://${extensionId}/popup.html`);
  85 | 
  86 |     // Initially badges should load status
  87 |     const claudeBadge = page.locator('#claude-badge');
  88 |     
  89 |     // Click "Sync Now" button
  90 |     const syncBtn = page.locator('#syncBtn');
  91 |     await syncBtn.click();
  92 | 
  93 |     // Assert it immediately changes status to syncing
  94 |     await expect(claudeBadge).toHaveText('syncing');
  95 |     await expect(claudeBadge).toHaveClass(/status-syncing/);
  96 |   });
  97 | });
  98 | 
```