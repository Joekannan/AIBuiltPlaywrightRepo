---
name: add-playwright-test
description: "Add new Playwright E2E or API tests. Use when: user asks to add test, write test, create test spec, add page coverage, add test for a feature, add login test, add cart test, add inventory test, add checkout test, add API test, create page object. Handles creating page objects, updating fixtures, writing specs, and running to verify."
argument-hint: "Describe the test: 'add tests for checkout flow' or 'add API test for products endpoint'"
---

# Add Playwright Test

This skill creates well-structured Playwright tests following the project's Page Object Model pattern.

## When to Use

- User asks to add/create/write any new test for a feature or page
- A feature needs test coverage that doesn't exist yet
- A new page needs a page object + spec

---

## Decision: E2E or API?

| User Signal | Test Type |
|-------------|-----------|
| "page", "UI", "click", "form", "navigate", "button", "screen" | E2E |
| "API", "endpoint", "REST", "request", "response", "HTTP", "status code" | API |

---

## Procedure: E2E Test

### Step 1: Read context (always first)
```bash
# Read existing structure
cat playwright.config.ts
ls pages/
cat fixtures/base.fixture.ts
cat data/test-data/users.json
```

### Step 2: Create or update Page Object

If the page object doesn't exist, create `pages/<name>.page.ts`:
- Extend `BasePage` from `pages/base.page.ts`
- Declare all locators as `private readonly` properties in constructor
- Use `[data-test="..."]` selectors as first choice
- Write one method per user action (fill, click, navigate, submit)
- Expose locators needed for assertions as `readonly` (no private)

```typescript
// pages/example.page.ts
import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class ExamplePage extends BasePage {
  private readonly someInput: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.someInput = page.locator('[data-test="some-input"]');
    this.errorMessage = page.locator('[data-test="error"]');
  }

  async navigate(): Promise<void> {
    await this.page.goto('/example');
  }

  async fillInput(value: string): Promise<void> {
    await this.someInput.fill(value);
  }
}
```

### Step 3: Update fixtures/base.fixture.ts

Add the new page object to the fixture:
```typescript
import { ExamplePage } from '../pages/example.page';

type TestFixtures = {
  examplePage: ExamplePage;
  // ... existing fixtures
};

export const test = base.extend<TestFixtures>({
  examplePage: async ({ page }, use) => {
    await use(new ExamplePage(page));
  },
  // ... existing fixture implementations
});
```

### Step 4: Create test spec

Create `tests/e2e/<feature>/<feature>.spec.ts`:
- Import from `fixtures/base.fixture` (NOT `@playwright/test`)
- Import test data from `data/test-data/users.json`
- Wrap in `test.describe('Feature: <Name>')`
- Cover: happy path (@smoke), negative cases (@regression), edge cases

### Step 5: Run and verify
```bash
npx playwright test tests/e2e/<feature>/ --headed
```

Fix any failures before completing. All tests must pass.

---

## Procedure: API Test

### Step 1: Read context
```bash
cat utils/env.utils.ts
ls tests/api/
```

### Step 2: Create API test file

Create `tests/api/<resource>.api.spec.ts`:
- Import from `@playwright/test` directly (API tests use built-in `request`)
- Import `ENV` from `utils/env.utils`
- Group by resource in `test.describe('API: <Resource>')`
- Cover: 200 success with schema, 401 no auth, 400 bad data

### Step 3: Run and verify
```bash
npx playwright test tests/api/ --project=chromium
```

---

## Test Quality Checklist

Before completing, verify:
- [ ] Imports from `fixtures/base.fixture` (E2E) or `@playwright/test` (API)
- [ ] No hardcoded credentials — uses `data/test-data/users.json` or `ENV`
- [ ] No `page.waitForTimeout()` — uses smart waits
- [ ] Positive AND negative test cases included
- [ ] Selectors use `[data-test="..."]` where available
- [ ] Test names: `'should <behavior> when <condition>'`
- [ ] Tagged with `@smoke` or `@regression`
- [ ] All tests pass on run

## Reference Files

- [Framework Structure](../../.github/instructions/framework-structure.instructions.md)
- [Page Object Standards](../../.github/instructions/page-objects.instructions.md)
- [Test Patterns & Guard Rails](../../.github/instructions/test-patterns.instructions.md)
- [API Testing Standards](../../.github/instructions/api-testing.instructions.md)
