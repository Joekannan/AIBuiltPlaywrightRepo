---
description: "Use when setting up, modifying, or troubleshooting GitHub Actions CI/CD workflows for Playwright tests. Covers matrix browser strategy, artifact upload, environment variables, secrets management, scheduled runs, and pipeline guard rails."
applyTo: ".github/workflows/**"
---

# GitHub Actions CI/CD for Playwright

## Enhanced Workflow Pattern

```yaml
name: Playwright Tests

on:
  push:
    branches: [main, master, develop]
  pull_request:
    branches: [main, master]
  schedule:
    - cron: '0 6 * * 1-5'   # Mon–Fri 6am UTC nightly regression
  workflow_dispatch:         # Manual trigger from GitHub UI

env:
  BASE_URL: ${{ vars.BASE_URL || 'https://www.saucedemo.com' }}

jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false       # Collect results from ALL browsers, not just first failure
      matrix:
        browser: [chromium, firefox, webkit]

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: lts/*
          cache: npm           # Cache node_modules for faster runs

      - name: Install dependencies
        run: npm ci            # Use ci not install for reproducible builds

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps ${{ matrix.browser }}

      - name: Run Playwright tests
        run: npx playwright test --project=${{ matrix.browser }}
        env:
          CI: true
          BASE_URL: ${{ env.BASE_URL }}
          # Secrets never hardcoded — pulled from GitHub secrets
          STANDARD_USER: ${{ secrets.STANDARD_USER }}
          STANDARD_PASSWORD: ${{ secrets.STANDARD_PASSWORD }}

      - name: Upload HTML Report
        uses: actions/upload-artifact@v4
        if: always()           # Upload even on failure
        with:
          name: playwright-report-${{ matrix.browser }}
          path: playwright-report/
          retention-days: 30

      - name: Upload Traces on Failure
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: traces-${{ matrix.browser }}
          path: test-results/
          retention-days: 7
```

---

## Smoke-Only PR Checks (Fast Feedback)

Add a second job for PRs to run only `@smoke` tagged tests:

```yaml
  smoke:
    name: Smoke Tests (PR)
    if: github.event_name == 'pull_request'
    timeout-minutes: 15
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: lts/*
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test --grep @smoke --project=chromium
        env:
          CI: true
          BASE_URL: ${{ vars.BASE_URL || 'https://www.saucedemo.com' }}
```

---

## Environment Management

| Variable | Where to Set | Example |
|----------|-------------|---------|
| `BASE_URL` | GitHub Variables (not secret) | `https://staging.example.com` |
| `STANDARD_USER` | GitHub Secrets | `standard_user` |
| `STANDARD_PASSWORD` | GitHub Secrets | `secret_sauce` |
| `API_BASE_URL` | GitHub Variables | `https://api.example.com` |

### Setting via GitHub CLI
```bash
gh variable set BASE_URL --body "https://www.saucedemo.com"
gh secret set STANDARD_PASSWORD --body "secret_sauce"
```

---

## CI Guard Rails

- ✅ ALWAYS use `fail-fast: false` in matrix strategy
- ✅ ALWAYS upload reports with `if: always()` — needed for debugging failures
- ✅ Use `npm ci` not `npm install` for reproducible installs
- ✅ Use `cache: npm` in setup-node to speed up runs
- ✅ Set `CI: true` — enables retries and strict mode in Playwright config
- ✅ Use `--with-deps` when installing browsers (includes OS dependencies)
- ❌ NEVER commit `.env` files — use GitHub Secrets/Variables
- ❌ NEVER hardcode secrets in workflow YAML
- ❌ NEVER use `test.only` — `forbidOnly: !!process.env.CI` catches this
- ❌ NEVER install ALL browsers when testing a single browser in matrix

---

## Branch Strategy

| Branch | Trigger | Tests |
|--------|---------|-------|
| `main` / `master` | Push | Full regression, all browsers |
| `develop` | Push | Full regression, all browsers |
| PR to `main` | PR open/update | Smoke only, chromium |
| Nightly | Schedule | Full regression, all browsers |
| Manual | `workflow_dispatch` | Configurable |

---

## playwright.config.ts CI Integration

```typescript
export default defineConfig({
  forbidOnly: !!process.env.CI,     // Fail if test.only in code
  retries: process.env.CI ? 2 : 0,  // Retry on CI, not locally
  workers: process.env.CI ? 1 : undefined,  // Serial on CI for stability
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['html', { open: 'on-failure' }]],
});
```
