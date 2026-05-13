---
description: "Add a new E2E Playwright test for a specific feature or page. Creates page object if needed, updates fixtures, writes spec with positive and negative test cases, then runs to verify."
name: "Add E2E Test"
agent: "Playwright QA Architect"
argument-hint: "Feature to test (e.g. 'checkout flow', 'product filtering', 'cart management', 'logout')"
tools: [read, edit, search, execute, todo]
---

Add a new end-to-end Playwright test for: **$input**

## Your Process

Use a todo list to track each step.

### Step 1: Read project context
- Read `playwright.config.ts` for baseURL
- List `pages/` to see existing page objects
- Read `fixtures/base.fixture.ts` to see current fixtures
- Read `data/test-data/users.json` for available test credentials
- Check `tests/e2e/` for existing test patterns to follow

### Step 2: Assess what's needed
- Does a Page Object already exist for this feature?
  - YES → review it, add any missing locators/methods
  - NO → create `pages/<feature>.page.ts` following the Page Object standards

### Step 3: Create/update Page Object (if needed)
- Extend `BasePage`
- Declare all locators as `private readonly` in constructor
- Use `[data-test="..."]` selectors first
- Expose assertion-needed locators as `readonly` (no private)
- Write action methods: navigate, fill, click, submit
- Add a compound method for the full happy-path flow

### Step 4: Update fixtures/base.fixture.ts
- Import the new Page Object
- Add it to the `TestFixtures` type
- Implement the fixture function

### Step 5: Create test spec
Create `tests/e2e/<feature>/<feature>.spec.ts` with:
- `test.describe('Feature: <Name>')` wrapper
- `test.beforeEach()` with common setup (navigation)
- **Happy path test** tagged `@smoke`:
  - `'should <succeed> when <valid condition>'`
- **Negative test(s)** tagged `@regression`:
  - `'should <show error/fail> when <invalid condition>'`
- **Edge case(s)** tagged `@regression` (at least one):
  - Boundary value, empty input, special characters, etc.
- All credentials from `data/test-data/users.json`
- All imports from `fixtures/base.fixture`
- No hardcoded URLs — use relative paths with baseURL

### Step 6: Run and verify
```bash
npx playwright test tests/e2e/<feature>/ --reporter=list
```

- If all pass → done
- If any fail → diagnose, fix, re-run (repeat until all pass)

### Step 7: Report
Summarize:
- Files created/modified
- Tests added (count, names)
- Test results (X passed)

Follow rules in `.github/instructions/test-patterns.instructions.md` and `.github/instructions/page-objects.instructions.md`.
