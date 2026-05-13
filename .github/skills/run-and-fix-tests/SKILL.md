---
name: run-and-fix-tests
description: "Run Playwright tests and automatically diagnose and fix any failures. Use when: tests are failing, running the test suite, debugging test failures, fixing broken tests, investigating flaky tests, running smoke tests, running regression suite, pre-PR verification, checking if tests pass."
argument-hint: "Optionally specify scope: 'all', 'smoke', 'login tests', 'api tests', or a specific spec file path"
---

# Run and Fix Tests

This skill runs Playwright tests, diagnoses failures, applies fixes, and re-verifies until all targeted tests pass.

## When to Use

- Run the full or partial test suite
- Tests are failing and need diagnosis + fix
- Pre-commit or pre-PR verification
- Investigating flaky/intermittent tests
- Confirming a new feature's tests pass

---

## Step 1: Determine Scope

| User says | Command to run |
|-----------|----------------|
| "run all" / "run everything" | `npx playwright test` |
| "smoke tests" | `npx playwright test --grep @smoke` |
| "regression" | `npx playwright test --grep @regression` |
| "api tests" | `npx playwright test tests/api/` |
| "login tests" | `npx playwright test tests/e2e/login/` |
| "run on chrome only" | `npx playwright test --project=chromium` |
| "[feature] tests" | `npx playwright test tests/e2e/<feature>/` |
| specific file | `npx playwright test tests/e2e/login/login.spec.ts` |

---

## Step 2: Execute Tests

```bash
# Standard run
npx playwright test <scope>

# With verbose output for debugging
npx playwright test <scope> --reporter=list

# With trace for detailed failure analysis
npx playwright test <scope> --trace on
```

Capture from output:
- Total count: passed / failed / skipped
- Error message and stack trace for each failure
- Screenshot/trace file paths if generated

---

## Step 3: Diagnose Each Failure

Use todo list to track each failing test. For each failure:

1. **Read the error message** — what exactly failed?
2. **Open the failing spec file** — understand what the test is trying to do
3. **Open the page object** — check the locator used
4. **Classify root cause** using the table below

### Root Cause Classification

| Symptom | Root Cause | Where to Look |
|---------|------------|---------------|
| `Locator not found` / `TimeoutError` | Wrong selector or element not rendered | Page object constructor |
| `Expected URL to be X got Y` | Wrong navigation or redirect | Page object `navigate()` |
| `Expected text X got Y` | Data mismatch or wrong locator | Test assertion + page object |
| `strict mode violation: resolved to N elements` | Selector too broad | Make selector more specific |
| `Test failed: Cannot read property of undefined` | Fixture not registered | `fixtures/base.fixture.ts` |
| `refused to connect` / `net::ERR_CONNECTION` | baseURL wrong or server down | `playwright.config.ts` + ENV |
| `Test passes locally, fails on CI` | Timing / environment difference | Add wait, check CI env vars |
| `Test passes sometimes` | Flaky — timing or race condition | Add explicit waits or retry |

---

## Step 4: Apply Fix

### Fix Strategy by Root Cause

```
Wrong selector → Update locator in Page Object
  → Use playwright inspector: npx playwright codegen https://www.saucedemo.com
  → Find the correct [data-test] attribute
  → Update the locator property in pages/<name>.page.ts

Timing issue → Replace waitForTimeout with smart wait
  → await expect(locator).toBeVisible()         ✅
  → await page.waitForLoadState('networkidle')  ✅
  → await page.waitForSelector('[data-test="x"]') ✅
  → await page.waitForTimeout(3000)              ❌

Wrong URL / navigation →
  → Check baseURL in playwright.config.ts
  → Check .env / process.env.BASE_URL
  → Fix navigate() method in page object

Stale test data →
  → Update data/test-data/*.json
  → Never hardcode new data in test files

Race condition (async) →
  → Ensure proper await on every async call
  → Add waitForLoadState after navigation
  → Use Playwright's auto-waiting (prefer toBeVisible over manual waits)

Test interdependency →
  → Move shared setup to beforeEach
  → Isolate test state — each test self-contained

Missing fixture →
  → Add page object to fixtures/base.fixture.ts
```

---

## Step 5: Re-run and Verify

After each fix:

```bash
# Re-run just the fixed test first
npx playwright test <specific-test-file> --reporter=list

# If passing, run full suite to check for regressions
npx playwright test --reporter=list
```

---

## Step 6: Report Results

Report in this format:
```
Test Run Results:
✅ X tests passing
🔧 Y tests fixed (list what was fixed)
❌ Z tests still failing (list with root cause if can't fix)

Summary of changes made:
- Fixed selector for [locator] in pages/example.page.ts
- Added waitForLoadState in pages/login.page.ts navigate()
- Updated test data in data/test-data/users.json
```

---

## Flaky Test Protocol

If a test fails only sometimes (intermittent):

```bash
# Confirm flakiness — run multiple times
npx playwright test <test-file> --repeat-each=5 --reporter=list
```

Then:
1. Add retry at describe level temporarily:
   ```typescript
   test.describe.configure({ retries: 2 });
   ```
2. Investigate: add `--trace on` and review the trace viewer
3. Fix root cause — async timing, DOM animation, network delay
4. Remove the `retries` once root cause is fixed
5. If not fixable now, mark with `.fixme()` + comment explaining the issue

---

## Reference Files

- [Test Patterns & Guard Rails](../../.github/instructions/test-patterns.instructions.md)
- [Page Object Standards](../../.github/instructions/page-objects.instructions.md)
- [Framework Structure](../../.github/instructions/framework-structure.instructions.md)
