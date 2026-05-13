---
description: "Use when creating or modifying Page Object Model (POM) files in pages/. Covers BasePage pattern, locator rules, method naming, fixture integration, and anti-patterns for page objects."
applyTo: "pages/**/*.ts"
---

# Page Object Model Standards

## BasePage — The Foundation

All page objects **must** extend `BasePage`:

```typescript
// pages/base.page.ts
import { Page } from '@playwright/test';

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  async navigate(path = ''): Promise<void> {
    await this.page.goto(path);
  }

  async waitForNetworkIdle(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  async getTitle(): Promise<string> {
    return this.page.title();
  }

  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }
}
```

---

## Page Object Template

```typescript
// pages/<name>.page.ts
import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class ExamplePage extends BasePage {
  // All locators: private readonly properties
  private readonly submitButton: Locator;
  private readonly emailInput: Locator;

  // Locators exposed for assertions in tests: readonly (no private)
  readonly errorMessage: Locator;
  readonly successBanner: Locator;

  constructor(page: Page) {
    super(page);
    this.submitButton = page.locator('[data-test="submit"]');
    this.emailInput = page.locator('[data-test="email"]');
    this.errorMessage = page.locator('[data-test="error"]');
    this.successBanner = page.locator('[data-test="success"]');
  }

  async navigate(): Promise<void> {
    await this.page.goto('/example');
  }

  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  // Compound action — combines multiple steps
  async completeForm(email: string): Promise<void> {
    await this.navigate();
    await this.fillEmail(email);
    await this.submit();
  }
}
```

---

## Locator Selector Priority

Use selectors in this order — stop at the first one that works:

| Priority | Selector Type | Example |
|----------|---------------|---------|
| 1st | `data-test` attribute | `page.locator('[data-test="login-button"]')` |
| 2nd | `data-testid` attribute | `page.locator('[data-testid="submit"]')` |
| 3rd | ARIA role | `page.getByRole('button', { name: 'Login' })` |
| 4th | Label | `page.getByLabel('Username')` |
| 5th | Visible text | `page.getByText('Products')` |
| 6th | CSS class (stable) | `page.locator('.product-title')` |
| ❌ Never | nth-child / XPath | Fragile and unreadable |

---

## Fixture Integration

After creating a page object, **always** register it in `fixtures/base.fixture.ts`:

```typescript
import { ExamplePage } from '../pages/example.page';

type TestFixtures = {
  examplePage: ExamplePage;
};

export const test = base.extend<TestFixtures>({
  examplePage: async ({ page }, use) => {
    await use(new ExamplePage(page));
  },
});
```

---

## Property Visibility Rules

| Locator Usage | Visibility |
|--------------|------------|
| Used only inside page object methods | `private readonly` |
| Needed in tests for assertions (`expect(page.errorMessage).toBeVisible()`) | `readonly` (no private) |
| Methods that perform user actions | `async methodName(): Promise<void>` |
| Methods that return data | `async methodName(): Promise<string>` |

---

## Guard Rails — ALWAYS

- ✅ Extend `BasePage` for every page object
- ✅ Declare all locators as properties in the constructor
- ✅ Return explicit types from methods — no implicit `any`
- ✅ Use compound methods for multi-step flows (e.g., `login()` = navigate + fill + submit)
- ✅ Keep method names verb-based: `fillCredentials()`, `clickCheckout()`, `selectProduct()`

## Guard Rails — NEVER

- ❌ Put `expect()` assertions inside page objects
- ❌ Call `page.waitForTimeout()` in page objects — use `waitForSelector` or `waitForLoadState`
- ❌ Expose raw `page` object as public property
- ❌ Use `string` literals for locators inline in test files — all go in page objects
- ❌ Return `Promise<any>` — always type return values explicitly
- ❌ Create static locators outside the constructor
