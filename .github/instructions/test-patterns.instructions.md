---
description: "Use when writing, reviewing, or refactoring Playwright E2E test specs. Covers test structure, assertion patterns, QA guard rails, data management, tagging strategy, and test isolation rules."
applyTo: "tests/e2e/**/*.spec.ts"
---

# Test Patterns & QA Guard Rails

## Canonical Test File Structure

```typescript
// tests/e2e/<feature>/<feature>.spec.ts
import { test, expect } from '../../fixtures/base.fixture';
import users from '../../data/test-data/users.json';

test.describe('Feature: <Page/Feature Name>', () => {

  test.beforeEach(async ({ loginPage }) => {
    await loginPage.navigate();
  });

  test('@smoke should <expected behavior> when <condition>', async ({ loginPage, inventoryPage }) => {
    // Arrange (if needed beyond beforeEach)
    // Act
    await loginPage.fillCredentials(users.standard.username, users.standard.password);
    await loginPage.submit();
    // Assert
    await expect(inventoryPage.heading).toBeVisible();
    await expect(inventoryPage.heading).toHaveText('Products');
  });

  test('@regression should show error when <negative condition>', async ({ loginPage }) => {
    await loginPage.fillCredentials(users.standard.username, 'wrong_password');
    await loginPage.submit();
    await expect(loginPage.errorMessage).toBeVisible();
  });

});
```

---

## QA Guard Rails — ALWAYS ✅

- **One logical scenario per test** — each test covers one behavior
- **Group with `test.describe()`** — named after the feature/page
- **Setup in `test.beforeEach()`** — navigate or common setup steps
- **Cleanup in `test.afterEach()`** — restore state if test mutates it
- **Use `test.step()`** to label complex operations for better failure messages
- **Import test data** from `data/test-data/*.json` — never hardcode in test
- **Use `expect.soft()`** for non-blocking assertions (batch validation)
- **Tag every test**: `@smoke` for critical path, `@regression` for full suite, `@api` for API tests
- **Test names** follow: `'should <expected behavior> when <condition>'`
- **Isolate state** — each test must pass standalone without depending on others

## QA Guard Rails — NEVER ❌

- ❌ `page.waitForTimeout(N)` — replace with `waitForSelector`, `toBeVisible()`, or `waitForLoadState`
- ❌ Hardcoded credentials — always use `data/test-data/users.json` or `ENV`
- ❌ Hardcoded URLs — use `baseURL` from config; only use relative paths in `goto()`
- ❌ `test.only` committed to main/master branch
- ❌ `test.skip()` without a reason comment
- ❌ Long test chains testing multiple unrelated features
- ❌ Assertions in Page Objects — only in test specs
- ❌ TypeScript `any` type — always use explicit types
- ❌ Ignoring flaky tests — quarantine with `.fixme()` and open a bug

---

## Test Tagging Strategy

| Tag | When to Apply |
|-----|---------------|
| `@smoke` | Must-pass, critical path — runs on every commit |
| `@regression` | Full coverage — runs on nightly/PR |
| `@api` | API-level tests |
| `@critical` | Business-critical — blocks release if failing |
| `@flaky` | Temporarily quarantined — under investigation |

Run by tag:
```bash
npx playwright test --grep @smoke
npx playwright test --grep @regression
npx playwright test --grep "@smoke|@critical"
```

---

## Test Isolation Patterns

### Pattern 1: Login via UI (slow, use sparingly)
```typescript
test.beforeEach(async ({ loginPage }) => {
  await loginPage.login(users.standard.username, users.standard.password);
});
```

### Pattern 2: Login via storageState (fast, preferred for authenticated tests)
```typescript
// In playwright.config.ts project setup:
// setup: [{ project: 'setup', testMatch: '**/auth.setup.ts' }]

// tests/e2e/auth.setup.ts
test('authenticate', async ({ page }) => {
  // perform login, then save storage state
  await page.context().storageState({ path: '.auth/user.json' });
});

// In authenticated test:
test.use({ storageState: '.auth/user.json' });
```

### Pattern 3: API seeding (fastest, for complex data setup)
```typescript
test.beforeEach(async ({ request }) => {
  // Use API to create test data instead of navigating through UI
  await request.post('/api/reset', { data: { userId: 'test-user' } });
});
```

---

## Assertion Best Practices

```typescript
// Prefer built-in Playwright matchers (auto-retry)
await expect(locator).toBeVisible();
await expect(locator).toHaveText('Expected');
await expect(locator).toHaveValue('value');
await expect(page).toHaveURL('/inventory.html');
await expect(page).toHaveTitle('Products');

// Soft assertions for batch checks
await expect.soft(locator1).toBeVisible();
await expect.soft(locator2).toHaveText('text');
// ... expect() at end to fail if any soft assertion failed
expect(test.info().errors).toHaveLength(0);

// Custom error messages
await expect(loginPage.errorMessage, 'Error banner should appear after bad login')
  .toBeVisible();
```

---

## Test Data Rules

- All test credentials in `data/test-data/users.json`
- All product data in `data/test-data/products.json`
- Extend JSON files when new data needed — never create one-off inline data
- Never commit real passwords — use known-safe demo app credentials only
- For generated data (unique emails, IDs), use `date.utils.ts` helpers
