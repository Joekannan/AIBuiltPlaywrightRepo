---
description: "Bootstrap the complete Playwright TypeScript automation framework from scratch. Creates all folders, base files, page objects, fixtures, utilities, config, CI/CD workflow, and README. Run this once when setting up the project."
name: "Scaffold Framework"
agent: "Playwright QA Architect"
tools: [read, edit, search, execute, todo]
---

Scaffold the complete Playwright TypeScript automation framework for this project.

## Your Task

Build the full framework structure by executing each step below. Use a todo list to track progress.

### Step 1: Read current state
- Read `playwright.config.ts`, `package.json`, and existing `tests/` folder
- Identify what already exists so you don't overwrite good code

### Step 2: Create folder structure and base files

Create these files (only if they don't already exist):

**Pages (Page Object Model):**
- `pages/base.page.ts` — Abstract base class with navigate(), waitForNetworkIdle(), getTitle(), getCurrentUrl()
- `pages/login.page.ts` — LoginPage extending BasePage with: usernameInput, passwordInput, loginButton, errorMessage locators and navigate(), fillCredentials(), submit(), login() methods
- `pages/inventory.page.ts` — InventoryPage with heading, inventoryList, cartBadge locators and getProductCount(), addItemToCart() methods

**Fixtures:**
- `fixtures/base.fixture.ts` — Extended test with loginPage and inventoryPage injected

**Utilities:**
- `utils/env.utils.ts` — ENV object reading BASE_URL, API_BASE_URL, STANDARD_USER, STANDARD_PASSWORD from process.env with fallbacks
- `utils/logger.ts` — Structured logger with info(), warn(), error() methods
- `utils/date.utils.ts` — Date helpers: formatDate(), generateTimestamp(), addDays()

**Helpers:**
- `helpers/test.helper.ts` — clearBrowserStorage(), waitForApiResponse() helpers
- `helpers/auth.helper.ts` — loginAsStandardUser() using ENV credentials

**Test Data:**
- `data/test-data/users.json` — standard_user, locked_out_user, problem_user, performance_glitch_user credentials
- `data/test-data/products.json` — Sauce Labs product names, prices, cart IDs

**Environment:**
- `.env.example` — Template with BASE_URL, API_BASE_URL, STANDARD_USER, STANDARD_PASSWORD

### Step 3: Update playwright.config.ts
- Set `baseURL: process.env.BASE_URL ?? 'https://www.saucedemo.com'`
- Set `screenshot: 'only-on-failure'`
- Set `trace: 'on-first-retry'`
- Set `retries: process.env.CI ? 2 : 0`
- Set reporter to HTML + GitHub Actions conditional
- Add `forbidOnly: !!process.env.CI`

### Step 4: Migrate existing test to POM pattern
- Create `tests/e2e/login/login.spec.ts` using the new LoginPage and InventoryPage fixtures
- Import from `fixtures/base.fixture` not `@playwright/test`
- Import users from `data/test-data/users.json`
- Tag tests with @smoke and @regression appropriately

### Step 5: Create API test placeholder
- Create `tests/api/auth.api.spec.ts` with a basic structure ready for API tests

### Step 6: Update CI/CD workflow
- Update `.github/workflows/playwright.yml` with matrix browser strategy, npm cache, artifact upload, and smoke job for PRs

### Step 7: Create README.md
- Full documentation of the framework

### Step 8: Verify
Run `npx playwright test` and confirm all tests pass. Fix any issues before completing.

Follow all rules in `.github/instructions/framework-structure.instructions.md`.
