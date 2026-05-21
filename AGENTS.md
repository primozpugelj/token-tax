# AGENTS.md

## Project Overview

A lightweight, automated Chrome Extension designed to track your token and message consumption across **Claude.ai** and **Gemini** in real-time. 

Since these consumer platforms do not expose public usage metrics via standard APIs, this extension automates background checks using your existing browser authentication states—completely avoiding login walls, Cloudflare blocks, or iframe restrictions.

## Repository Structure

```
token-tax/
├── src/          # Source code
├── specs/        # Specs
└── README.md     # Basic documentation and projec description
```

## Build & Test Commands

- **Unit tests (Zero-Dependency):** `npm run test:unit` (or `node tests/run-tests.js`)
- **E2E tests (Playwright):** `npm run test:e2e` (requires `npm install` and `npx playwright install chromium`)

## Code Style

- Follow existing patterns in the codebase
- Use [language] style guide (e.g. PEP 8 for Python, StandardJS for JS)
- Keep functions small and focused
- Write tests for new features

## Agent Guidelines

### What agents should do
- Read existing code before making changes
- Run tests after modifications
- Keep changes minimal and focused on the task
- Prefer editing existing files over creating new ones

### What agents should avoid
- Deleting files without explicit instruction
- Changing unrelated code
- Committing secrets or credentials
- Modifying lock files directly

## Key Files

| File | Purpose |
|------|---------|
| `specs/implementation-plan.md` | Implementation plan - follow the steps and update this file after each step |
| `tests/run-tests.js` | Native unit tests runner script (runs VM-mocked extension tests) |
| `tests/e2e/extension.spec.js` | Playwright E2E browser tests |

## Notes

Any additional context, gotchas, or domain-specific knowledge agents should know.