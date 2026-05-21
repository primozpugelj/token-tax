// Playwright configuration for Chrome Extension E2E testing

const { defineConfig } = require('@playwright/test');
const path = require('path');

module.exports = defineConfig({
  testDir: path.join(__dirname, 'tests/e2e'),
  timeout: 20000,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    // Chrome extensions can only be loaded in Chrome, which Playwright handles.
    // Headless mode is supported in Playwright when passing appropriate flags,
    // but running with headless: false is recommended for visual inspection if needed.
    headless: true,
  }
});
