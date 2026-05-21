// Playwright E2E Integration Test for Token Tax extension

const { test, expect } = require('@playwright/test');
const chromium = require('playwright').chromium;
const path = require('path');
const fs = require('fs');

test.describe('Token Tax Extension E2E', () => {
  let context;
  let extensionId;

  test.beforeAll(async () => {
    const pathToExtension = path.join(__dirname, '../../src');
    
    // Create a fresh temporary user data directory within the workspace to isolate runs
    const userDataDir = path.join(__dirname, '../../.tmp_playwright_user_data');
    if (fs.existsSync(userDataDir)) {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    }
    fs.mkdirSync(userDataDir, { recursive: true });

    // Set TMPDIR to a local directory within the workspace to prevent sandbox socket binding errors
    const customTmpDir = path.join(__dirname, '../../.tmp_playwright_tmpdir');
    if (!fs.existsSync(customTmpDir)) {
      fs.mkdirSync(customTmpDir, { recursive: true });
    }
    process.env.TMPDIR = customTmpDir;

    // Launch persistent chromium context with extension loaded
    context = await chromium.launchPersistentContext(userDataDir, {
      headless: false, // Chrome extensions are only supported in headful Chromium (headless: false)
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`
      ],
      env: {
        ...process.env,
        TMPDIR: customTmpDir,
        TEMP: customTmpDir,
        TMP: customTmpDir
      }
    });

    // Retrieve background worker
    let [background] = context.serviceWorkers();
    if (!background) {
      background = await context.waitForEvent('serviceworker');
    }

    // Extract the Extension ID from the background service worker URL
    // Format: chrome-extension://<extension-id>/background.js
    const urlParts = background.url().split('/');
    extensionId = urlParts[2];
  });

  test.afterAll(async () => {
    if (context) {
      await context.close();
    }
  });

  test('extension service worker is active and reachable', async () => {
    expect(extensionId).not.toBeNull();
    expect(extensionId.length).toBeGreaterThan(10);
  });

  test('popup UI loads correctly and shows platform cards', async () => {
    // Must create page from the extension's persistent context, not the default
    // Playwright context — otherwise chrome-extension:// URLs are blocked
    const page = await context.newPage();
    try {
      await page.goto(`chrome-extension://${extensionId}/popup.html`);

      // Verify title and headers
      await expect(page.locator('h1')).toHaveText('Token Tax');
      
      // Verify platform card visibility
      await expect(page.locator('#card-claude')).toBeVisible();
      await expect(page.locator('#card-gemini')).toBeVisible();

      // Verify presence of limits labels
      await expect(page.locator('#claude-remaining')).toBeVisible();
      await expect(page.locator('#gemini-remaining')).toBeVisible();
    } finally {
      await page.close();
    }
  });

  test('trigger sync click updates badge state to syncing', async () => {
    const page = await context.newPage();
    try {
      await page.goto(`chrome-extension://${extensionId}/popup.html`);

      // Initially badges should load status
      const claudeBadge = page.locator('#claude-badge');
      
      // Click "Sync Now" button
      const syncBtn = page.locator('#syncBtn');
      await syncBtn.click();

      // Assert it immediately changes status to syncing
      await expect(claudeBadge).toHaveText('syncing');
      await expect(claudeBadge).toHaveClass(/status-syncing/);
    } finally {
      await page.close();
    }
  });
});
