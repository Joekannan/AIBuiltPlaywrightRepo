---
description: "Run Playwright tests and automatically fix any failures. Specify scope: all tests, smoke, regression, a feature name, or a specific file. Diagnoses root causes and applies fixes iteratively."
name: "Run and Fix Tests"
agent: "Playwright QA Architect"
argument-hint: "Test scope: 'all', '@smoke', 'login', 'api', 'tests/e2e/inventory/', or leave blank for full suite"
tools: [read, edit, search, execute, todo]
---

Run Playwright tests for scope: **$input**

## Your Process

Use a todo list to track each failing test that needs fixing.

### Step 1: Determine run command

Map the user's scope to the right command:
- blank / "all" → `npx playwright test`
- "@smoke" → `npx playwright test --grep @smoke`
- "@regression" → `npx playwright test --grep @regression`
- "api" → `npx playwright test tests/api/`
- "<feature>" → `npx playwright test tests/e2e/<feature>/`
- specific file → `npx playwright test <path-to-file>`
- "chromium only" → add `--project=chromium`

### Step 2: Run tests
```bash
npx playwright test <scope> --reporter=list
```

Capture: passed count, failed count, each error message.

### Step 3: If all pass
Report the passing summary and stop. No fixes needed.

### Step 4: If tests fail — diagnose each one

For each failure, add it to the todo list and work through:

1. Read the error: what exactly failed? (TimeoutError, AssertionError, TypeError)
2. Open the failing spec file
3. Open the related page object
4. Apply the fix strategy:

| Error Type | Fix Location | Fix Action |
|------------|-------------|------------|
| `TimeoutError: Locator not found` | Page object locator | Update selector to correct `[data-test]` attribute |
| `Expected URL X got Y` | Page object navigate() | Fix URL path or baseURL config |
| `Expected text X got Y` | Test assertion or page object | Fix locator or update expected text |
| `strict mode violation` | Page object locator | Make selector more specific |
| `Cannot read property` | Fixture or page object | Check fixture registration in base.fixture.ts |
| `net::ERR_CONNECTION` | Config / ENV | Check baseURL in playwright.config.ts |
| Flaky / intermittent | Page object / test | Replace waitForTimeout with smart wait |

### Step 5: Re-run after each fix
```bash
# Verify the specific fixed test
npx playwright test <fixed-test-file> --reporter=list

# Then run full scope to catch regressions
npx playwright test <scope> --reporter=list
```

Repeat Steps 4-5 until all targeted tests pass.

### Step 6: Final report

```
Test Run Complete
==================
✅ X tests passing
🔧 Y tests fixed:
  - [test name]: [what was fixed]
❌ Z tests still failing:
  - [test name]: [root cause] — [reason can't fix now]

Changes made:
  - [file]: [change description]
```

Follow rules in `.github/instructions/test-patterns.instructions.md`.
Use the `run-and-fix-tests` skill for detailed diagnosis procedures.
