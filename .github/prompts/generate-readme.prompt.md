---
description: "Generate or update the project README.md for the Playwright TypeScript automation framework. Reads all project files to produce accurate, up-to-date documentation."
name: "Generate README"
agent: "Playwright QA Architect"
tools: [read, edit, search]
---

Generate a comprehensive and accurate `README.md` for this Playwright TypeScript automation framework.

## Your Process

### Step 1: Read all relevant files first

Read these files to ensure the README is accurate (not invented):
- `package.json` — scripts, dependencies, project name
- `playwright.config.ts` — configuration, browsers, settings
- `.env.example` — required environment variables
- `pages/` — list all page objects
- `tests/e2e/` and `tests/api/` — test count and feature coverage
- `fixtures/base.fixture.ts` — available fixtures
- `.github/workflows/playwright.yml` — CI configuration

### Step 2: Write README.md

Include these sections in order:

---

# Playwright TypeScript Automation Framework

## Overview
- What application is being tested (SauceDemo — https://www.saucedemo.com)
- Tech stack: Playwright, TypeScript, Node.js
- Test types: E2E UI tests, API tests
- Pattern: Page Object Model

## Prerequisites
- Node.js version (from .nvmrc or package.json engines if present, else "LTS")
- npm version
- Supported browsers: Chromium, Firefox, WebKit

## Setup
```bash
git clone <repo>
cd playwright-swaglabs
npm ci
cp .env.example .env
# Edit .env with your values
npx playwright install
```

## Environment Configuration
Table of all env vars from .env.example with descriptions and defaults.

## Running Tests
All npm scripts with examples:
```bash
# Run all tests
npx playwright test

# Smoke tests only
npx playwright test --grep @smoke

# Specific feature
npx playwright test tests/e2e/login/

# API tests
npx playwright test tests/api/

# Single browser
npx playwright test --project=chromium

# Headed (watch mode)
npx playwright test --headed

# Debug mode
npx playwright test --debug

# With trace
npx playwright test --trace on
```

## Framework Structure
Annotated folder tree showing what each file/folder does.

## Writing Tests
Step-by-step guide:
1. Create page object in `pages/`
2. Register in `fixtures/base.fixture.ts`
3. Create spec in `tests/e2e/<feature>/`
4. Import from `fixtures/base.fixture`
5. Use test data from `data/test-data/`

With a minimal code example.

## Test Tagging
| Tag | Description | When to run |
|-----|-------------|-------------|
| @smoke | Critical path | Every commit |
| @regression | Full coverage | PR + nightly |
| @api | API tests | PR + nightly |

## Page Objects (list all current POMs with brief description)

## CI/CD
- GitHub Actions workflow overview
- Triggers: push, PR, schedule
- Matrix: all three browsers
- Artifacts: HTML reports (30 days), traces on failure (7 days)
- How to view reports

## Troubleshooting
Common issues:
- Tests failing locally but passing on CI (or vice versa)
- Browser not found error
- baseURL not set
- Selector not found

---

Write the actual README.md content based on what you read from the project files. Make it accurate and practical — a new team member should be able to run their first test in under 5 minutes by following it.
