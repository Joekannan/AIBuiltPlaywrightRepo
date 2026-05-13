# Playwright TypeScript Automation Framework

A production-grade E2E and API automation framework built with [Playwright](https://playwright.dev/) and TypeScript, targeting the [SauceDemo](https://www.saucedemo.com) web application.

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| [Playwright](https://playwright.dev/) | Browser automation and API testing |
| TypeScript | Type-safe test authoring |
| Node.js (LTS) | Runtime |
| GitHub Actions | CI/CD pipeline |

**Test Pattern**: Page Object Model (POM)  
**Browsers**: Chromium, Firefox, WebKit  
**Test Types**: E2E UI tests, API tests

---

## Prerequisites

- Node.js LTS (v20+) — [download](https://nodejs.org)
- npm (bundled with Node.js)

---

## Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd playwright-swaglabs

# 2. Install dependencies
npm ci

# 3. Install Playwright browsers
npx playwright install

# 4. Configure environment
cp .env.example .env
# .env is pre-configured for SauceDemo — no changes needed for local runs
```

---

## Environment Configuration

Copy `.env.example` to `.env`. All values have safe defaults for SauceDemo:

| Variable | Description | Default |
|----------|-------------|---------|
| `BASE_URL` | Application base URL | `https://www.saucedemo.com` |
| `API_BASE_URL` | API base URL | `https://www.saucedemo.com` |
| `STANDARD_USER` | Standard test user username | `standard_user` |
| `STANDARD_PASSWORD` | Standard test user password | `secret_sauce` |
| `DEBUG` | Enable debug logging (`true`/empty) | _(empty)_ |

> **Never commit `.env`** — it is git-ignored. Use `.env.example` as the template.

---

## Running Tests

```bash
# Run all tests (all browsers)
npx playwright test

# Run smoke tests only (fastest — critical path)
npx playwright test --grep @smoke

# Run full regression suite
npx playwright test --grep @regression

# Run a specific feature
npx playwright test tests/e2e/login/

# Run API tests
npx playwright test tests/api/

# Run on a specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Watch mode (headed)
npx playwright test --headed

# Debug a test (step-through)
npx playwright test --debug

# Collect traces (for failure analysis)
npx playwright test --trace on

# Run with verbose output
npx playwright test --reporter=list

# Open last HTML report
npx playwright show-report
```

---

## Framework Structure

```
playwright-swaglabs/
├── .github/
│   ├── agents/
│   │   └── playwright-qa.agent.md        # AI orchestrator agent
│   ├── instructions/                     # Always-on coding rules
│   │   ├── framework-structure.instructions.md
│   │   ├── page-objects.instructions.md
│   │   ├── test-patterns.instructions.md
│   │   ├── api-testing.instructions.md
│   │   └── ci-cd.instructions.md
│   ├── prompts/                          # Slash-command task prompts
│   │   ├── scaffold-framework.prompt.md
│   │   ├── add-e2e-test.prompt.md
│   │   ├── add-api-test.prompt.md
│   │   ├── run-fix-tests.prompt.md
│   │   └── generate-readme.prompt.md
│   ├── skills/                           # On-demand workflow skills
│   │   ├── add-playwright-test/SKILL.md
│   │   └── run-and-fix-tests/SKILL.md
│   └── workflows/
│       └── playwright.yml                # CI/CD pipeline
├── pages/                                # Page Object Model classes
│   ├── base.page.ts                      # Abstract base — shared methods
│   ├── login.page.ts                     # Login page
│   └── inventory.page.ts                 # Products/inventory page
├── tests/
│   ├── e2e/                              # UI end-to-end tests
│   │   └── login/
│   │       └── login.spec.ts
│   └── api/                              # REST API tests
│       └── auth.api.spec.ts
├── fixtures/
│   └── base.fixture.ts                   # Extended test — all POMs injected
├── helpers/
│   ├── test.helper.ts                    # Generic test utilities
│   └── auth.helper.ts                    # Auth helpers
├── utils/
│   ├── env.utils.ts                      # Environment variable access
│   ├── logger.ts                         # Structured logger
│   └── date.utils.ts                     # Date/time utilities
├── data/
│   └── test-data/
│       ├── users.json                    # Test user accounts
│       └── products.json                 # Product catalog data
├── playwright.config.ts                  # Playwright configuration
├── .env.example                          # Environment template
└── README.md
```

---

## Writing Tests

### Step 1: Create a Page Object (if needed)

```typescript
// pages/checkout.page.ts
import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class CheckoutPage extends BasePage {
  private readonly firstNameInput: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.firstNameInput = page.locator('[data-test="firstName"]');
    this.errorMessage = page.locator('[data-test="error"]');
  }

  async fillFirstName(name: string): Promise<void> {
    await this.firstNameInput.fill(name);
  }
}
```

### Step 2: Register in fixtures

```typescript
// fixtures/base.fixture.ts — add to existing file
import { CheckoutPage } from '../pages/checkout.page';

type TestFixtures = {
  checkoutPage: CheckoutPage;
  // ... existing fixtures
};

export const test = base.extend<TestFixtures>({
  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },
});
```

### Step 3: Write the test spec

```typescript
// tests/e2e/checkout/checkout.spec.ts
import { test, expect } from '../../../fixtures/base.fixture';
import users from '../../../data/test-data/users.json';

test.describe('Feature: Checkout', () => {

  test('@smoke should complete checkout with valid information', async ({ checkoutPage }) => {
    await checkoutPage.fillFirstName('Jane');
    // ... rest of test
    await expect(checkoutPage.errorMessage).not.toBeVisible();
  });

});
```

---

## Page Objects

| Page Object | File | Covers |
|------------|------|--------|
| `BasePage` | `pages/base.page.ts` | navigate, waitForNetworkIdle, getTitle, getCurrentUrl |
| `LoginPage` | `pages/login.page.ts` | Login form, credentials, error message |
| `InventoryPage` | `pages/inventory.page.ts` | Products list, cart badge, add/remove items |

---

## Test Tags

Tag every test to control which tests run in which contexts:

| Tag | Description | When it runs |
|-----|-------------|--------------|
| `@smoke` | Critical path — must always pass | Every commit, every PR |
| `@regression` | Full coverage suite | PRs to main, nightly schedule |
| `@api` | API-level tests | PRs to main, nightly schedule |
| `@critical` | Business-blocking scenarios | Blocks release if failing |

```bash
# Run by tag
npx playwright test --grep @smoke
npx playwright test --grep "@smoke|@critical"
npx playwright test --grep @regression
```

---

## CI/CD

The GitHub Actions pipeline (`.github/workflows/playwright.yml`) runs:

| Trigger | Job | Browsers |
|---------|-----|---------|
| Push to `main`/`develop` | Full regression | Chromium, Firefox, WebKit |
| Pull Request to `main` | Smoke tests | Chromium only |
| Nightly (Mon–Fri 6am UTC) | Full regression | Chromium, Firefox, WebKit |
| Manual (`workflow_dispatch`) | Full regression | Chromium, Firefox, WebKit |

**Artifacts uploaded:**
- HTML reports → retained 30 days (always uploaded)
- Traces → retained 7 days (uploaded on failure only)

**To view reports:** Go to GitHub Actions → select a run → download `playwright-report-<browser>` artifact → open `index.html`.

### Setting CI Environment Variables

```bash
# GitHub Variables (non-sensitive)
gh variable set BASE_URL --body "https://www.saucedemo.com"

# GitHub Secrets (sensitive)
gh secret set STANDARD_USER --body "standard_user"
gh secret set STANDARD_PASSWORD --body "secret_sauce"
```

---

## Configuration Reference

Key settings in `playwright.config.ts`:

| Setting | Local | CI |
|---------|-------|----|
| `baseURL` | `process.env.BASE_URL` or `https://www.saucedemo.com` | From GitHub Variables |
| `retries` | `0` | `2` |
| `workers` | Parallel (CPU-based) | `1` (serial) |
| `screenshot` | On failure only | On failure only |
| `trace` | On first retry | On first retry |
| `forbidOnly` | `false` | `true` (blocks `test.only`) |

---

## Troubleshooting

| Problem | Solution |
|---------|---------|
| `Browser not found` | Run `npx playwright install` |
| `Error: baseURL is not set` | Copy `.env.example` to `.env` |
| `TimeoutError: Locator not found` | Inspect selector with `npx playwright codegen https://www.saucedemo.com` |
| Tests pass locally, fail on CI | Check env vars in GitHub secrets; CI may have different network/timing |
| `test.only` found on CI | Remove all `test.only` — `forbidOnly` blocks them on CI |
| Flaky tests | Run with `--trace on`, open trace viewer: `npx playwright show-trace trace.zip` |

---

## AI Agent

This project includes a **Playwright QA Architect** agent (`.github/agents/playwright-qa.agent.md`) that can:

- Scaffold the full framework from scratch
- Add new E2E or API tests when you describe what to test
- Run tests and automatically fix failures
- Update CI/CD configuration

**Usage in VS Code Copilot Chat:** Select the `Playwright QA Architect` agent, then describe your task:
- _"Add tests for the checkout flow"_
- _"Run all tests and fix any failures"_
- _"Add an API test for the login endpoint"_
