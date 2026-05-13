# Senior QA Engineer Interview Preparation
## TypeScript · Playwright · Framework Design · CI/CD · Behavioral

> **How to use this guide:** Work through every section. For behavioral questions, replace the placeholder answers with your own real situations using the STAR format.

---

## TABLE OF CONTENTS

1. [TypeScript Fundamentals](#1-typescript-fundamentals)
2. [Playwright Core Concepts](#2-playwright-core-concepts)
3. [Page Object Model (POM)](#3-page-object-model-pom)
4. [Test Fixtures & Dependency Injection](#4-test-fixtures--dependency-injection)
5. [API Testing with Playwright](#5-api-testing-with-playwright)
6. [Framework Architecture & Design](#6-framework-architecture--design)
7. [Test Strategy & Design](#7-test-strategy--design)
8. [BDD with playwright-bdd / Cucumber](#8-bdd-with-playwright-bdd--cucumber)
9. [CI/CD with GitHub Actions](#9-cicd-with-github-actions)
10. [Debugging, Flakiness & Troubleshooting](#10-debugging-flakiness--troubleshooting)
11. [Performance, Scalability & Reporting](#11-performance-scalability--reporting)
12. [Workers, Shards & Parallelism](#12-workers-shards--parallelism)
12a. [Fixtures — Deep Dive](#12a-fixtures--deep-dive)
13. [Senior QE Mindset & Leadership](#13-senior-qe-mindset--leadership)
14. [Behavioral Questions (STAR Format)](#14-behavioral-questions-star-format)

---

---

## 1. TYPESCRIPT FUNDAMENTALS

---

### Q1. What is the difference between `interface` and `type` in TypeScript? When would you use each in a test framework?

**Answer:**

Both `interface` and `type` define shapes of objects, but they have important differences:

| Feature | `interface` | `type` |
|---------|-------------|--------|
| Merging | ✅ Declaration merging allowed | ❌ Not allowed |
| Extending | `extends` keyword | `&` intersection |
| Primitive alias | ❌ No | ✅ Yes |
| Union/Intersection | ❌ No | ✅ Yes |
| Computed properties | ❌ No | ✅ Yes |

**In a test framework context:**

Use `interface` for contracts/shapes that represent domain objects, because they are extensible:
```typescript
// pages/base.page.ts — a contract for all page objects
interface IPage {
  navigate(): Promise<void>;
  waitForLoad(): Promise<void>;
}

// A more specific page can extend it
interface ILoginPage extends IPage {
  fillCredentials(user: string, pass: string): Promise<void>;
  submit(): Promise<void>;
}
```

Use `type` for union types, utility types, and aliasing:
```typescript
// Narrowing credential types
type UserRole = 'standard' | 'locked_out' | 'problem' | 'performance_glitch';

// Utility — pick only login-relevant fields
type LoginCredentials = Pick<User, 'username' | 'password'>;

// Combining two shapes
type FixtureContext = PlaywrightFixtures & CustomHelpers;
```

**Rule of thumb:** Prefer `interface` for page objects and public API contracts; prefer `type` for unions, mapped types, and utility combinations.

---

### Q2. Explain `async/await` in TypeScript. How does Playwright use it, and what are common mistakes?

**Answer:**

`async/await` is syntactic sugar over Promises. An `async` function always returns a `Promise`. The `await` keyword pauses execution inside that function until the awaited Promise resolves or rejects.

```typescript
// Under the hood, this:
async function login() {
  await page.fill('#username', 'user');
  await page.click('#submit');
}

// Is equivalent to:
function login() {
  return page.fill('#username', 'user')
    .then(() => page.click('#submit'));
}
```

**How Playwright uses it:**
Every Playwright action (`click`, `fill`, `goto`, `waitFor`) is asynchronous because they communicate with the browser process. You MUST `await` them or your test races ahead before the browser responds.

**Common mistakes:**

1. **Missing `await`** — the most dangerous mistake:
```typescript
// WRONG — test continues immediately, assertion may run before click completes
page.click('#submit');
await expect(page).toHaveURL('/dashboard');

// CORRECT
await page.click('#submit');
await expect(page).toHaveURL('/dashboard');
```

2. **Not awaiting inside loops:**
```typescript
// WRONG — fires all requests concurrently before any resolves
for (const item of items) {
  page.click(item); // no await
}

// CORRECT — sequential
for (const item of items) {
  await page.click(item);
}

// OR if truly parallel, use Promise.all
await Promise.all(items.map(item => page.click(item)));
```

3. **Swallowed rejections** — not wrapping in try/catch when needed:
```typescript
// If fillCredentials throws, nothing catches it
async function fillCredentials(user: string, pass: string) {
  await this.usernameInput.fill(user);
  await this.passwordInput.fill(pass);
}
```

4. **Forgetting `async` on the function itself** — TypeScript will error at compile time but it's a common slip.

---

### Q3. What are generics in TypeScript and how are they used in Playwright fixtures?

**Answer:**

Generics allow writing reusable code that works with multiple types while retaining type safety. Think of them as type-level parameters.

```typescript
// A generic identity function
function getFirst<T>(arr: T[]): T {
  return arr[0];
}
getFirst<string>(['a', 'b']); // returns string
getFirst<number>([1, 2]);     // returns number
```

**In Playwright fixtures:**

Playwright's `test.extend<T>()` is a generic function. When you call it, you pass your custom fixture interface as the type parameter so TypeScript knows exactly what fixtures are available:

```typescript
// fixtures/base.fixture.ts
import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { InventoryPage } from '../pages/inventory.page';

// Define the shape of your custom fixtures
type MyFixtures = {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
};

// Extend with generics — TypeScript now knows loginPage & inventoryPage exist
export const test = base.extend<MyFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  inventoryPage: async ({ page }, use) => {
    await use(new InventoryPage(page));
  },
});

export { expect } from '@playwright/test';
```

Now in any test file:
```typescript
import { test, expect } from '../../fixtures/base.fixture';

test('login', async ({ loginPage, inventoryPage }) => {
  // TypeScript fully autocompletes loginPage.fillCredentials() etc.
});
```

Without the generic, TypeScript would not know `loginPage` exists and would throw a type error.

---

### Q4. What is the difference between `unknown`, `any`, and `never` in TypeScript?

**Answer:**

| Type | Meaning | Use Case |
|------|---------|----------|
| `any` | Opt out of type checking entirely | Avoid — defeats the purpose of TypeScript |
| `unknown` | A value exists but its type is not yet known | Safe alternative to `any` — forces you to narrow before use |
| `never` | A value that can never occur | Exhaustive checks, functions that always throw |

**`any` — the escape hatch (avoid):**
```typescript
let x: any = 5;
x.toUpperCase(); // No error at compile time — but crashes at runtime!
```

**`unknown` — the safe alternative:**
```typescript
function parseApiResponse(raw: unknown) {
  if (typeof raw === 'string') {
    return raw.toUpperCase(); // OK — narrowed to string
  }
  throw new Error('Unexpected response type');
}
```

**`never` — exhaustive type guard:**
```typescript
type Status = 'pass' | 'fail' | 'skip';

function handleStatus(s: Status) {
  if (s === 'pass') return 'green';
  if (s === 'fail') return 'red';
  if (s === 'skip') return 'yellow';
  // If you add a new Status without handling it, TypeScript errors here
  const exhaustive: never = s;
  throw new Error(`Unhandled: ${exhaustive}`);
}
```

**In test framework context:** Never use `any`. Use `unknown` when parsing external data (API responses, JSON files). Use `never` for exhaustive switch statements over union types.

---

### Q5. Explain TypeScript decorators and how they relate to test frameworks.

**Answer:**

Decorators are a stage-3 TC39 proposal (enabled via `experimentalDecorators` in `tsconfig.json`). They are functions that modify classes, methods, or properties at design time.

```typescript
// Method decorator — logs entry/exit of every page method
function LogMethod(target: any, key: string, descriptor: PropertyDescriptor) {
  const original = descriptor.value;
  descriptor.value = async function (...args: any[]) {
    console.log(`[${key}] called with`, args);
    const result = await original.apply(this, args);
    console.log(`[${key}] completed`);
    return result;
  };
  return descriptor;
}

class LoginPage {
  @LogMethod
  async fillCredentials(user: string, pass: string) {
    await this.usernameInput.fill(user);
    await this.passwordInput.fill(pass);
  }
}
```

**In Playwright specifically:** Playwright itself does not use decorators, but frameworks built on top (like Allure for reporting, or custom DI containers) may use them. The more relevant TypeScript features in Playwright are generics, interfaces, and type utilities.

---

### Q6. What are TypeScript utility types and give practical examples in a test framework?

**Answer:**

Utility types are built-in generic types that transform existing types.

```typescript
type User = {
  id: number;
  username: string;
  password: string;
  role: 'admin' | 'user';
  isLocked: boolean;
};

// Partial — all fields optional (useful for partial updates in API tests)
type PartialUser = Partial<User>;
// { id?: number; username?: string; ... }

// Required — all fields required
type RequiredUser = Required<User>;

// Pick — select specific fields
type Credentials = Pick<User, 'username' | 'password'>;
// { username: string; password: string }

// Omit — exclude specific fields
type PublicUser = Omit<User, 'password'>;
// { id: number; username: string; role: ...; isLocked: boolean }

// Record — key-value map
type UserFixtures = Record<string, Credentials>;
// { standard: { username, password }, locked: { ... }, ... }

// ReturnType — extract return type of a function
type LoginResult = ReturnType<typeof loginPage.submit>;
// Resolves to whatever submit() returns

// Parameters — extract parameter types
type FillArgs = Parameters<typeof loginPage.fillCredentials>;
// [username: string, password: string]
```

**Practical use in test data:**
```typescript
// data/test-data/users.json drives this type
type TestUsers = Record<'standard' | 'locked_out' | 'problem', Credentials>;
```

---

---

## 2. PLAYWRIGHT CORE CONCEPTS

---

### Q7. How does Playwright differ from Selenium and Cypress? Why would you choose Playwright?

**Answer:**

**Architecture Differences:**

| Feature | Selenium | Cypress | Playwright |
|---------|---------|---------|------------|
| Protocol | WebDriver (HTTP) | Chrome DevTools Protocol (CDP) — browser runner | CDP + WebSocket — direct browser control |
| Language | Java, Python, JS, C#, Ruby | JS/TS only | JS/TS, Python, Java, C# |
| Browsers | All (via drivers) | Chromium-based (+ Firefox experimental) | Chromium, Firefox, WebKit (Safari engine) |
| Parallelism | Grid (complex setup) | Limited (paid dashboard) | Built-in, config-driven |
| Auto-wait | Manual (`WebDriverWait`) | Auto-retry built-in | Auto-wait on actions AND assertions |
| iframes | Awkward | Very limited | First-class support |
| Multiple tabs | Complex | Not supported | First-class support |
| Network intercept | External proxy | `cy.intercept()` | `page.route()` built-in |
| Mobile emulation | Selenium Grid / Appium | Limited | Built-in device descriptors |

**Why choose Playwright:**

1. **True cross-browser** — Chromium, Firefox AND WebKit (the Safari engine). Cypress cannot test WebKit natively.
2. **Auto-waiting is smarter** — Playwright waits for actionability (visible, stable, enabled, attached) before every action. You rarely write explicit waits.
3. **Isolation by default** — each test gets a fresh browser context (isolated cookies, local storage) without relying on `cy.clearCookies()`.
4. **Network interception is built-in** — mock APIs, abort requests, modify responses — all without plugins.
5. **Parallel by default** — tests run in parallel workers with zero extra setup.
6. **Storage state / auth reuse** — log in once, save the state, reuse across all tests — dramatically faster suites.

```typescript
// Login once, reuse everywhere
await page.context().storageState({ path: 'auth.json' });

// playwright.config.ts
use: {
  storageState: 'auth.json' // All tests start already logged in
}
```

---

### Q8. Explain Playwright's auto-waiting mechanism in detail.

**Answer:**

Playwright's auto-wait is one of its most powerful features. Before performing any action, Playwright checks a set of **actionability conditions** and retries until they are met or a timeout is hit.

**Actionability conditions checked per action:**

| Condition | Click | Fill | Check | Select |
|-----------|-------|------|-------|--------|
| Attached to DOM | ✅ | ✅ | ✅ | ✅ |
| Visible | ✅ | ✅ | ✅ | ✅ |
| Stable (not animating) | ✅ | ✅ | ✅ | ✅ |
| Enabled | ✅ | ✅ | ✅ | ✅ |
| Receives events (not covered by overlay) | ✅ | | ✅ | |
| Editable | | ✅ | | |

**Example — no explicit wait needed:**
```typescript
// Playwright waits for the button to be: visible, attached, stable, enabled
await page.click('#submit');

// For assertions, expect() also auto-retries until the condition is met
await expect(page.locator('.success-message')).toBeVisible();
// This retries for up to 5 seconds (configurable) before failing
```

**Configuring timeouts:**
```typescript
// Global default — playwright.config.ts
use: {
  actionTimeout: 10_000,   // per action (click, fill, etc.)
  navigationTimeout: 30_000 // per navigation
}

// Per assertion
await expect(locator).toBeVisible({ timeout: 15_000 });

// Per action
await page.click('#btn', { timeout: 5_000 });
```

**What auto-wait does NOT cover:**
- Waiting for an animation to finish playing (use `waitForFunction`)
- Waiting for a network request to complete after an action (use `waitForResponse`)
- Waiting for data to be loaded into the DOM after an AJAX call (use `waitForSelector` or expect assertions)

**Anti-pattern to avoid:**
```typescript
// NEVER DO THIS — Playwright already auto-waits
await page.waitForTimeout(2000); // Hard sleep — brittle and slow
await page.click('#submit');

// DO THIS instead — Playwright waits for the element automatically
await page.click('#submit');
await expect(page.locator('.dashboard')).toBeVisible();
```

---

### Q9. What is a Locator in Playwright and how does it differ from `page.$()` and `ElementHandle`?

**Answer:**

**`ElementHandle` (legacy):** A snapshot reference to a DOM element at a specific point in time. If the DOM re-renders, the handle becomes stale.
```typescript
const btn = await page.$('#submit'); // ElementHandle — snapshot
await btn.click(); // Stale if DOM re-rendered
```

**`Locator` (modern, recommended):** A lazy description of how to find an element. It does NOT query the DOM when created. The query is executed (with auto-retry) only when you perform an action or assertion on it.
```typescript
const btn = page.locator('#submit'); // Locator — lazy, always fresh
await btn.click(); // Queries DOM at click time, with auto-wait
```

**Key differences:**

| | ElementHandle | Locator |
|--|--------------|---------|
| DOM query | Immediate (eager) | Deferred (lazy) |
| Staleness | Can go stale | Always re-queries |
| Auto-wait | Manual | Built-in |
| Assertion support | Limited | Full `expect(locator).*` |
| Recommended | ❌ No | ✅ Yes |

**Best practice locator strategies (in priority order):**

```typescript
// 1. Role-based (most resilient — matches what users see)
page.getByRole('button', { name: 'Login' });
page.getByRole('heading', { name: 'Products' });

// 2. Label text
page.getByLabel('Username');

// 3. Placeholder text
page.getByPlaceholder('Enter username');

// 4. Test ID (custom attribute — second most resilient)
page.getByTestId('login-button'); // looks for data-testid="login-button"

// 5. Text content
page.getByText('Sign in');

// 6. CSS selector (avoid when possible — breaks with UI changes)
page.locator('.btn-primary');

// 7. XPath (last resort)
page.locator('//button[@id="submit"]');
```

---

### Q10. Explain `page.route()` for network interception. Provide a real-world example.

**Answer:**

`page.route()` intercepts network requests matching a URL pattern, letting you: abort them, fulfill with mock data, or modify the real response. This is essential for:
- Testing error states (500 errors, timeouts)
- Removing external API dependencies from tests
- Testing loading states
- Speeding up tests by mocking slow API calls

**Syntax:**
```typescript
await page.route(urlPattern, handler);
// urlPattern: string, RegExp, or predicate function
// handler: receives Route and Request objects
```

**Example 1 — Mock a product API to return controlled data:**
```typescript
test('should display products from API', async ({ page }) => {
  // Intercept before navigation
  await page.route('**/api/products', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 1, name: 'Sauce Labs Backpack', price: 29.99 }
      ]),
    });
  });

  await page.goto('/inventory');
  await expect(page.getByText('Sauce Labs Backpack')).toBeVisible();
});
```

**Example 2 — Simulate a 500 server error:**
```typescript
test('should show error message when API fails', async ({ page }) => {
  await page.route('**/api/checkout', async (route) => {
    await route.fulfill({ status: 500, body: 'Internal Server Error' });
  });

  await page.goto('/checkout');
  await page.click('[data-testid="complete-order"]');
  await expect(page.getByText('Something went wrong')).toBeVisible();
});
```

**Example 3 — Modify real response (add a field):**
```typescript
await page.route('**/api/user', async (route) => {
  const response = await route.fetch(); // Get real response
  const body = await response.json();
  body.isAdmin = true; // Modify
  await route.fulfill({ response, body: JSON.stringify(body) });
});
```

**Example 4 — Abort a request (test offline behavior):**
```typescript
await page.route('**/analytics/**', route => route.abort());
```

**In Page Objects:** Do NOT put `page.route()` calls in page objects — they belong in tests or helpers, because mocking is a test concern, not a page concern.

---

### Q11. What is `page.waitForResponse()` and `page.waitForRequest()`? When do you use them?

**Answer:**

These are used to synchronize your test with specific network activity — essential when an action triggers an API call and you need to wait for the response before asserting.

**`waitForResponse()` — most common:**
```typescript
// Wait for a specific API call to complete after clicking
const [response] = await Promise.all([
  page.waitForResponse('**/api/checkout/complete'),
  page.click('[data-testid="finish"]'), // triggers the request
]);

// Assert on the response
expect(response.status()).toBe(200);
const body = await response.json();
expect(body.orderId).toBeDefined();
```

**Why `Promise.all()`?** Because if you `await page.click()` first, the request may already have fired and resolved before `waitForResponse()` starts listening. `Promise.all()` sets up the listener BEFORE the click, so nothing is missed.

**With a predicate function (more precise):**
```typescript
const response = await page.waitForResponse(
  resp => resp.url().includes('/api/products') && resp.status() === 200
);
```

**`waitForRequest()` — validate what was sent:**
```typescript
const [request] = await Promise.all([
  page.waitForRequest(req => req.url().includes('/api/login')),
  loginPage.submit(),
]);

// Assert on what was sent to the server
const body = request.postDataJSON();
expect(body.username).toBe('standard_user');
```

---

### Q12. Explain Playwright's browser contexts and why they matter for test isolation.

**Answer:**

**Browser:** The actual browser process (Chromium, Firefox, WebKit). Heavy to create — one per test run usually.

**BrowserContext:** An isolated browser session inside a browser. Has its own: cookies, local storage, session storage, cache, and permissions. Multiple contexts can run inside one browser simultaneously.

**Page:** A tab inside a BrowserContext.

```
Browser
├── BrowserContext A (fresh state)
│   ├── Page 1
│   └── Page 2
└── BrowserContext B (fresh state)
    └── Page 1
```

**Why this matters for test isolation:**

Each Playwright test gets a FRESH browser context by default. This means:
- Cookies from Test A do not affect Test B — no `cy.clearCookies()` needed
- Local storage is empty at the start of every test
- Tests truly run in isolation — can run in parallel safely

```typescript
// Playwright creates a new context automatically per test
test('test A', async ({ page }) => {
  // Fresh context — no state from any other test
  await page.goto('/login');
});

test('test B', async ({ page }) => {
  // Different context — completely isolated
  await page.goto('/login');
});
```

**Reusing auth state across tests (storage state pattern):**
```typescript
// Global setup — login once and save state
// global-setup.ts
const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();
await page.goto('/login');
await page.fill('#user', 'standard_user');
await page.fill('#pass', 'secret_sauce');
await page.click('#login-btn');
await context.storageState({ path: 'auth/standard-user.json' });
await browser.close();

// playwright.config.ts — reuse for all tests
use: {
  storageState: 'auth/standard-user.json'
}
```

**Multi-user scenarios:**
```typescript
test('admin can see all users', async ({ browser }) => {
  const adminContext = await browser.newContext({
    storageState: 'auth/admin.json'
  });
  const adminPage = await adminContext.newPage();
  // ...admin actions...

  const userContext = await browser.newContext({
    storageState: 'auth/user.json'
  });
  const userPage = await userContext.newPage();
  // ...user actions in parallel...
});
```

---

### Q13. What is the `expect` API in Playwright and what are web-first assertions?

**Answer:**

Playwright's `expect` API is designed specifically for async browser testing. Unlike Jest's synchronous `expect`, Playwright's assertions are **web-first** — they automatically retry until the condition is met or the timeout expires.

**Web-first assertions — auto-retry:**
```typescript
// This retries checking for up to 5 seconds by default
await expect(page.locator('.success')).toBeVisible();
await expect(page.locator('#title')).toHaveText('Products');
await expect(page.locator('input')).toHaveValue('standard_user');
await expect(page.locator('.item')).toHaveCount(6);
await expect(page).toHaveURL('/inventory');
await expect(page).toHaveTitle('Swag Labs');
```

**Non-retrying assertions (use for immediate checks):**
```typescript
expect(response.status()).toBe(200);
expect(someArray).toHaveLength(3);
expect(someString).toContain('error');
```

**Soft assertions — collect multiple failures before failing:**
```typescript
test('product card has all elements', async ({ page, inventoryPage }) => {
  // Soft assertions — all run even if some fail
  await expect.soft(inventoryPage.productName).toBeVisible();
  await expect.soft(inventoryPage.productPrice).toBeVisible();
  await expect.soft(inventoryPage.addToCartButton).toBeEnabled();
  // Hard assertion — stops test if fails
  await expect(inventoryPage.heading).toHaveText('Products');
});
```

**Custom assertion messages:**
```typescript
await expect(page.locator('#error'), 'Error banner should be visible after bad login')
  .toBeVisible();
```

**Negation:**
```typescript
await expect(page.locator('#spinner')).not.toBeVisible();
await expect(page.locator('#error')).not.toHaveText('');
```

---

---

## 3. PAGE OBJECT MODEL (POM)

---

### Q14. Explain the Page Object Model pattern. Why is it important and what are its rules?

**Answer:**

The Page Object Model (POM) is a design pattern where each page/component of the application is represented as a class. The class encapsulates:
1. **Locators** — how to find elements on that page
2. **Actions** — methods that represent what a user can do on that page

**Why POM matters:**
- **Maintainability** — when a locator changes, you update ONE place, not every test that uses it
- **Readability** — tests read like business scenarios, not DOM queries
- **Reusability** — the same page object is used across many tests
- **Separation of concerns** — tests describe WHAT to test; page objects describe HOW to interact

**Full example matching this framework's conventions:**

```typescript
// pages/login.page.ts
import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class LoginPage extends BasePage {
  // ── Locators ─────────────────────────────────────────────────────────────
  // private readonly: cannot be accessed outside, never reassigned
  private readonly usernameInput: Locator;
  private readonly passwordInput: Locator;
  private readonly loginButton: Locator;
  readonly errorMessage: Locator; // public so tests can assert on it

  constructor(page: Page) {
    super(page);
    // Define locators in constructor — they are lazy (no DOM query yet)
    this.usernameInput = page.locator('[data-test="username"]');
    this.passwordInput = page.locator('[data-test="password"]');
    this.loginButton = page.locator('[data-test="login-button"]');
    this.errorMessage = page.locator('[data-test="error"]');
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  async navigate(): Promise<void> {
    await this.page.goto('/');
  }

  async fillCredentials(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
  }

  async submit(): Promise<void> {
    await this.loginButton.click();
  }

  // Compound action — combines steps for convenience
  async loginAs(username: string, password: string): Promise<void> {
    await this.fillCredentials(username, password);
    await this.submit();
  }
}
```

**POM rules (NEVER break these):**
- ❌ No assertions in page objects — assertions belong in test specs only
- ❌ No `test.expect()` inside a page object method
- ❌ No hardcoded test data inside page objects
- ✅ Return values from page objects when needed (e.g., current URL, text)
- ✅ Keep actions at the user-intent level, not DOM-implementation level

---

### Q15. What is the BasePage pattern and what should go in it?

**Answer:**

`BasePage` is an abstract class that all page objects extend. It holds:
- The `page` instance (shared)
- Common navigation/waiting utilities used by all pages
- No page-specific locators or actions

```typescript
// pages/base.page.ts
import { Page } from '@playwright/test';

export abstract class BasePage {
  protected readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ── Common Utilities ──────────────────────────────────────────────────────

  async navigate(path: string = '/'): Promise<void> {
    await this.page.goto(path);
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  async getTitle(): Promise<string> {
    return this.page.title();
  }

  async getCurrentURL(): Promise<string> {
    return this.page.url();
  }

  async scrollToBottom(): Promise<void> {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  }

  // Useful for debugging — take a screenshot from any page
  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `test-results/${name}.png` });
  }
}
```

**What NOT to put in BasePage:**
- Any page-specific locators
- Any page-specific actions
- Business logic
- Assertions

---

### Q16. How do you handle dynamic locators and lists of elements in Playwright Page Objects?

**Answer:**

**Dynamic locators — using parameters:**
```typescript
// Locator that changes based on product name
getProductByName(name: string): Locator {
  return this.page.getByRole('heading', { name }).locator('..');
}

// Dynamic row in a table
getTableRow(rowIndex: number): Locator {
  return this.page.locator(`table tbody tr:nth-child(${rowIndex})`);
}

// Dynamic by data attribute
getCartItemByTitle(title: string): Locator {
  return this.page.locator(`[data-test="inventory-item"]`)
    .filter({ hasText: title });
}
```

**Working with lists:**
```typescript
// pages/inventory.page.ts
readonly productItems: Locator;

constructor(page: Page) {
  super(page);
  this.productItems = page.locator('[data-test="inventory-item"]');
}

async getProductCount(): Promise<number> {
  return this.productItems.count();
}

async getAllProductNames(): Promise<string[]> {
  return this.productItems
    .locator('[data-test="inventory-item-name"]')
    .allTextContents();
}

async addItemToCart(itemName: string): Promise<void> {
  const item = this.productItems.filter({ hasText: itemName });
  await item.getByRole('button', { name: /add to cart/i }).click();
}
```

**In test:**
```typescript
test('should display 6 products', async ({ inventoryPage }) => {
  const count = await inventoryPage.getProductCount();
  expect(count).toBe(6);
});
```

---

---

## 4. TEST FIXTURES & DEPENDENCY INJECTION

---

### Q17. What are Playwright fixtures and how do they implement dependency injection?

**Answer:**

Fixtures in Playwright are the equivalent of dependency injection — they provide test dependencies (page objects, helpers, data) automatically to each test, set them up before the test, and tear them down after.

**How it works:**

```typescript
// fixtures/base.fixture.ts
import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { InventoryPage } from '../pages/inventory.page';

type TestFixtures = {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
};

export const test = base.extend<TestFixtures>({
  // Setup + teardown for loginPage
  loginPage: async ({ page }, use) => {
    // SETUP: runs before the test
    const loginPage = new LoginPage(page);
    
    // INJECT: pass to the test
    await use(loginPage);
    
    // TEARDOWN: runs after the test (even if test fails)
    // Nothing to tear down here — browser context handles cleanup
  },

  inventoryPage: async ({ page }, use) => {
    await use(new InventoryPage(page));
  },
});

export { expect };
```

**Using fixtures in tests — DI in action:**
```typescript
// tests/e2e/login/login.spec.ts
import { test, expect } from '../../fixtures/base.fixture';

test('should login successfully', async ({ loginPage, inventoryPage }) => {
  // loginPage and inventoryPage are INJECTED — no manual instantiation
  await loginPage.navigate();
  await loginPage.loginAs('standard_user', 'secret_sauce');
  await expect(inventoryPage.heading).toBeVisible();
});
```

**Fixture with real setup/teardown:**
```typescript
type TestFixtures = {
  authenticatedPage: Page;
};

export const test = base.extend<TestFixtures>({
  authenticatedPage: async ({ browser }, use) => {
    // Setup: create a fresh context and log in
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/login');
    await page.fill('[data-test="username"]', 'standard_user');
    await page.fill('[data-test="password"]', 'secret_sauce');
    await page.click('[data-test="login-button"]');
    await page.waitForURL('/inventory');
    
    await use(page); // inject to test
    
    // Teardown: close context — always runs
    await context.close();
  },
});
```

**Fixture scopes:**
```typescript
// Worker scope — runs once per worker process (expensive setup)
export const test = base.extend<{}, { dbConnection: Database }>({
  dbConnection: [async ({}, use) => {
    const db = await Database.connect(process.env.DB_URL!);
    await use(db);
    await db.disconnect();
  }, { scope: 'worker' }], // only created once per worker
});
```

---

### Q18. How do you compose fixtures when you need multiple page objects and helpers?

**Answer:**

Fixtures compose naturally — one fixture can depend on another, just like functions calling functions:

```typescript
// fixtures/base.fixture.ts
import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { InventoryPage } from '../pages/inventory.page';
import { CartPage } from '../pages/cart.page';
import { AuthHelper } from '../helpers/auth.helper';

type TestFixtures = {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  cartPage: CartPage;
  authHelper: AuthHelper;
  // A pre-authenticated inventory page (composes loginPage + inventoryPage)
  loggedInInventory: InventoryPage;
};

export const test = base.extend<TestFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  inventoryPage: async ({ page }, use) => {
    await use(new InventoryPage(page));
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  authHelper: async ({ page }, use) => {
    await use(new AuthHelper(page));
  },

  // This fixture composes loginPage to produce a logged-in state
  loggedInInventory: async ({ loginPage, inventoryPage }, use) => {
    await loginPage.navigate();
    await loginPage.loginAs('standard_user', 'secret_sauce');
    await use(inventoryPage); // test receives inventory page, already logged in
  },
});
```

**Test using composed fixture:**
```typescript
test('should add item to cart', async ({ loggedInInventory, cartPage }) => {
  // No need to log in — loggedInInventory handles it
  await loggedInInventory.addItemToCart('Sauce Labs Backpack');
  await cartPage.navigate();
  await expect(cartPage.cartItems).toHaveCount(1);
});
```

---

---

## 5. API TESTING WITH PLAYWRIGHT

---

### Q19. How do you write API tests in Playwright? What is `APIRequestContext`?

**Answer:**

Playwright has a built-in HTTP client (`APIRequestContext`) accessible via the `request` fixture. It handles authentication headers, base URLs, cookies, and can share session state with a browser page.

**Basic API test structure:**
```typescript
// tests/api/auth.api.spec.ts
import { test, expect } from '@playwright/test';

test.describe('@api Authentication API', () => {
  
  test('POST /api/login returns 200 with valid credentials', async ({ request }) => {
    const response = await request.post('https://api.example.com/login', {
      data: {
        username: 'standard_user',
        password: 'secret_sauce',
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('token');
    expect(typeof body.token).toBe('string');
  });

  test('POST /api/login returns 401 with invalid credentials', async ({ request }) => {
    const response = await request.post('https://api.example.com/login', {
      data: { username: 'wrong', password: 'wrong' },
    });

    expect(response.status()).toBe(401);
  });
});
```

**With base URL configured in playwright.config.ts:**
```typescript
// playwright.config.ts
use: {
  baseURL: 'https://api.example.com',
}

// test — now URLs are relative
const response = await request.get('/products');
```

**CRUD API test with auth header:**
```typescript
test('GET /products returns product list', async ({ request }) => {
  const response = await request.get('/products', {
    headers: {
      Authorization: `Bearer ${process.env.API_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  expect(response.status()).toBe(200);
  const products = await response.json();
  expect(Array.isArray(products)).toBe(true);
  expect(products.length).toBeGreaterThan(0);
  
  // Schema validation
  const first = products[0];
  expect(first).toHaveProperty('id');
  expect(first).toHaveProperty('name');
  expect(first).toHaveProperty('price');
});
```

**Sharing auth between API and UI:**
```typescript
test('API login + UI verification', async ({ page, request }) => {
  // Get token via API
  const loginResp = await request.post('/api/login', {
    data: { username: 'standard_user', password: 'secret_sauce' }
  });
  const { token } = await loginResp.json();

  // Inject token into browser storage
  await page.goto('/');
  await page.evaluate((t) => localStorage.setItem('auth_token', t), token);
  await page.goto('/dashboard');
  await expect(page.getByText('Welcome')).toBeVisible();
});
```

---

### Q20. How do you do schema validation in Playwright API tests?

**Answer:**

Playwright does not ship a schema validator, but you can integrate one easily. Two common approaches:

**Approach 1 — Manual property checks (simple, no dependencies):**
```typescript
test('product schema is correct', async ({ request }) => {
  const response = await request.get('/products/1');
  const product = await response.json();

  // Structural checks
  expect(product).toMatchObject({
    id: expect.any(Number),
    name: expect.any(String),
    price: expect.any(Number),
    category: expect.any(String),
  });
  expect(product.price).toBeGreaterThan(0);
});
```

**Approach 2 — Zod schema validation (recommended for complex APIs):**
```typescript
import { z } from 'zod';

const ProductSchema = z.object({
  id: z.number().positive(),
  name: z.string().min(1),
  price: z.number().positive(),
  description: z.string(),
  image: z.string().url(),
  category: z.enum(['electronics', 'clothing', 'bags']),
});

test('product matches schema', async ({ request }) => {
  const response = await request.get('/products/1');
  const body = await response.json();
  
  // Will throw with detailed error if schema doesn't match
  const product = ProductSchema.parse(body);
  expect(product.price).toBeGreaterThan(0);
});
```

**Approach 3 — JSON Schema + ajv:**
```typescript
import Ajv from 'ajv';

const productSchema = {
  type: 'object',
  required: ['id', 'name', 'price'],
  properties: {
    id: { type: 'number' },
    name: { type: 'string' },
    price: { type: 'number', minimum: 0 },
  },
};

test('validates product schema', async ({ request }) => {
  const ajv = new Ajv();
  const validate = ajv.compile(productSchema);
  
  const response = await request.get('/products/1');
  const body = await response.json();
  
  const valid = validate(body);
  expect(valid, ajv.errorsText(validate.errors)).toBe(true);
});
```

---

---

## 6. FRAMEWORK ARCHITECTURE & DESIGN

---

### Q21. Walk me through how you would design a Playwright TypeScript framework from scratch.

**Answer:**

This is a high-value question — interviewers want to see you think holistically, not just write tests.

**Step 1 — Understand the requirements:**
- What is the tech stack? (SPA, SSR, PWA?)
- What browsers must be covered?
- Is there a backend API to test?
- What are the CI/CD constraints?
- What is the team size and TypeScript experience?
- Any BDD requirement from business?

**Step 2 — Initialize the project:**
```bash
npm init playwright@latest
# Choose: TypeScript, tests/ folder, add GitHub Actions
```

**Step 3 — Define the folder structure:**
```
project/
├── pages/           # Page Object Model classes
├── fixtures/        # Playwright test extensions (DI)
├── helpers/         # Reusable cross-cutting utilities
├── utils/           # Pure utility functions (dates, env, logging)
├── data/            # Test data (JSON, factories)
├── tests/
│   ├── e2e/         # Browser tests by feature
│   └── api/         # HTTP API tests
├── features/        # (optional) BDD .feature files
├── .github/workflows/ # CI/CD
└── playwright.config.ts
```

**Step 4 — Configure `playwright.config.ts`:**
```typescript
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['junit', { outputFile: 'results.xml' }]],
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    video: 'on-first-retry',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
  ],
});
```

**Step 5 — Build the BasePage and first Page Objects**

**Step 6 — Create fixtures for DI**

**Step 7 — Set up test data management:**
- Static data: `data/test-data/*.json`
- Dynamic data: factory functions
- Sensitive data: environment variables / secrets

**Step 8 — Add helpers:**
- `auth.helper.ts` — global setup for auth state
- `test.helper.ts` — shared test utilities

**Step 9 — Configure CI/CD (GitHub Actions)**

**Step 10 — Add reporting (Allure / built-in HTML / Slack notifications)**

**Decision points an interviewer will probe:**
- "Why not use a class-based fixture approach?" — because Playwright's functional fixtures integrate with its DI system better
- "How do you handle shared auth?" — global setup + `storageState`
- "How do you prevent flakiness in CI?" — proper auto-waits, no `waitForTimeout`, retry configuration, network idling

---

### Q22. How do you manage test data in a large Playwright framework?

**Answer:**

Test data management is a critical concern. There are several strategies, each suited to different situations:

**Strategy 1 — Static JSON files (simple, deterministic):**
```typescript
// data/test-data/users.json
{
  "standard": { "username": "standard_user", "password": "secret_sauce" },
  "lockedOut": { "username": "locked_out_user", "password": "secret_sauce" },
  "problem": { "username": "problem_user", "password": "secret_sauce" }
}

// In test:
import users from '../../data/test-data/users.json';
await loginPage.fillCredentials(users.standard.username, users.standard.password);
```

**Strategy 2 — Factory functions (dynamic, unique data per test):**
```typescript
// data/factories/user.factory.ts
import { faker } from '@faker-js/faker';

export function createUser(overrides: Partial<User> = {}): User {
  return {
    id: faker.string.uuid(),
    username: faker.internet.username(),
    email: faker.internet.email(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    ...overrides, // allow test-specific overrides
  };
}

// In test:
const user = createUser({ email: 'specific@test.com' });
await registerPage.fill(user);
```

**Strategy 3 — API-seeded data (E2E with real backend):**
```typescript
// fixtures/base.fixture.ts
testUser: async ({ request }, use) => {
  // Create user via API before test
  const response = await request.post('/api/users', {
    data: createUser(),
  });
  const user = await response.json();
  
  await use(user);
  
  // Cleanup — delete after test
  await request.delete(`/api/users/${user.id}`);
},
```

**Strategy 4 — Environment variables for sensitive data:**
```typescript
// utils/env.utils.ts
export function getEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value;
}

// Usage
const apiKey = getEnv('API_KEY');
const baseUrl = getEnv('BASE_URL', 'https://www.saucedemo.com');
```

**Never commit:**
- Real passwords or API keys to source control
- PII (Personally Identifiable Information)
- Production database credentials

---

### Q23. How do you implement logging in a Playwright framework?

**Answer:**

Good logging is essential for diagnosing failures in CI where you cannot observe the browser.

```typescript
// utils/logger.ts
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

class Logger {
  private readonly context: string;

  constructor(context: string) {
    this.context = context;
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    const timestamp = new Date().toISOString();
    const entry = {
      timestamp,
      level,
      context: this.context,
      message,
      ...(data ? { data } : {}),
    };
    console.log(JSON.stringify(entry));
  }

  debug(message: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: unknown): void {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: unknown): void {
    this.log(LogLevel.WARN, message, data);
  }

  error(message: string, data?: unknown): void {
    this.log(LogLevel.ERROR, message, data);
  }
}

export function createLogger(context: string): Logger {
  return new Logger(context);
}
```

**Usage in a page object:**
```typescript
import { createLogger } from '../utils/logger';

export class LoginPage extends BasePage {
  private readonly logger = createLogger('LoginPage');

  async loginAs(username: string, password: string): Promise<void> {
    this.logger.info('Attempting login', { username });
    await this.fillCredentials(username, password);
    await this.submit();
    this.logger.info('Login submitted');
  }
}
```

**Playwright's built-in DEBUG logging:**
```bash
# Show all Playwright internal logs
DEBUG=pw:api npx playwright test

# Show only browser logs
DEBUG=pw:browser npx playwright test
```

---

---

## 7. TEST STRATEGY & DESIGN

---

### Q24. What is the Test Pyramid and how does it guide your automation strategy?

**Answer:**

The Test Pyramid (by Mike Cohn) describes the ideal distribution of tests across three layers, balancing speed, cost, and coverage.

```
         /\
        /  \
       / E2E \        (10-20%) — slow, costly, high confidence
      /────────\
     /Integration\    (20-30%) — API tests, service integration
    /────────────\
   /  Unit Tests  \   (60-70%) — fast, cheap, focused
  /────────────────\
```

**In a Playwright framework context:**

| Layer | Tools | What to test | Volume |
|-------|-------|-------------|--------|
| Unit | Jest / Vitest | Utility functions, helpers, data transformers | Most |
| Integration/API | Playwright `request` fixture | API contracts, response schemas, auth flows | Medium |
| E2E (UI) | Playwright browser tests | Critical user journeys, cross-browser | Least |

**Why this ratio matters:**
- E2E tests are 100x slower than unit tests
- E2E tests are more flaky (network, browser, UI timing)
- Unit tests catch bugs earlier and cheaper

**Anti-pattern — the Ice Cream Cone:**
Many teams invert this — lots of E2E, few unit tests. This results in:
- Slow CI pipelines
- High flakiness
- Tests that are hard to diagnose when they fail

**What to automate at E2E level:**
- Critical user journeys (login → add to cart → checkout)
- Cross-browser behavior that cannot be tested at lower levels
- Integration of frontend + backend

**What NOT to automate at E2E level:**
- Every permutation of form validation (do that at unit level)
- Every API error response (test at API level)
- Purely visual changes (use visual regression tools like Percy)

---

### Q25. Explain your approach to test tagging and selective test execution.

**Answer:**

Tagging allows selective execution of subsets of tests — essential for running only smoke tests on every commit and full regression only on PRs or nightly.

**Tag naming convention used in this framework:**
```typescript
test('@smoke should login with valid credentials', ...);
test('@regression should show error message for locked user', ...);
test('@api GET /products should return 200', ...);
test('@critical checkout happy path completes successfully', ...);
```

**Running by tag:**
```bash
# Run only smoke tests
npx playwright test --grep "@smoke"

# Run smoke AND critical
npx playwright test --grep "@smoke|@critical"

# Exclude flaky tests
npx playwright test --grep-invert "@flaky"

# Run regression on specific browser
npx playwright test --grep "@regression" --project=chromium
```

**In CI/CD — different jobs run different tags:**
```yaml
# .github/workflows/playwright.yml
jobs:
  smoke:
    runs-on: ubuntu-latest
    steps:
      - run: npx playwright test --grep "@smoke"
    # Runs on every push/PR — fast feedback

  regression:
    runs-on: ubuntu-latest
    if: github.event_name == 'schedule' || github.event_name == 'workflow_dispatch'
    steps:
      - run: npx playwright test --grep "@regression"
    # Runs nightly or on-demand only
```

**Test.describe-level tagging:**
```typescript
test.describe('@smoke Login Feature', () => {
  test('valid login redirects to inventory', async ({ loginPage }) => { ... });
  test('invalid login shows error', async ({ loginPage }) => { ... });
});
```

---

### Q26. What is your strategy for handling flaky tests?

**Answer:**

Flakiness is one of the biggest challenges in E2E testing. A structured approach is essential:

**Step 1 — Identify flaky tests:**
```bash
# Run test 10 times to detect flakiness
npx playwright test login.spec.ts --repeat-each=10
```

**Step 2 — Categorize root causes:**

| Cause | Solution |
|-------|---------|
| Timing/race conditions | Replace `waitForTimeout` with proper auto-waits |
| Network dependency | Mock external APIs with `page.route()` |
| State leakage between tests | Ensure proper beforeEach/afterEach cleanup |
| Element ordering issues | Use unique data-testid attributes |
| Animation interference | Wait for `networkidle` or specific elements |
| Environment instability | Increase retries in CI, investigate infrastructure |

**Step 3 — Quarantine while investigating:**
```typescript
test.fixme('@flaky should complete checkout', async ({ page }) => {
  // TODO: Flaky in CI — checkout button sometimes not clickable
  // Ticket: QA-123
});
```

**Step 4 — Fix root causes:**
```typescript
// BEFORE (flaky) — hard wait
await page.waitForTimeout(3000);
await page.click('#checkout');

// AFTER (stable) — wait for the specific condition
await page.waitForLoadState('networkidle');
await expect(page.locator('#checkout')).toBeEnabled();
await page.click('#checkout');
```

**Step 5 — Configure smart retries:**
```typescript
// playwright.config.ts
retries: process.env.CI ? 2 : 0, // retry only in CI
```

**Step 6 — Track flakiness rate:**
Use Playwright's built-in reporter or a dashboard (Playwright Cloud) to monitor test pass rates over time.

---

---

## 8. BDD WITH PLAYWRIGHT-BDD / CUCUMBER

---

### Q27. What is BDD and when should you use it? How does playwright-bdd work?

**Answer:**

**BDD (Behaviour Driven Development)** is a collaborative practice where business analysts, developers, and QAs co-author test scenarios in plain English using the **Gherkin** language. The key benefit is that tests become living documentation accessible to non-technical stakeholders.

**Gherkin syntax:**
```gherkin
# features/login.feature
Feature: User Authentication
  As a registered user
  I want to log in to the application
  So that I can access my account

  Background:
    Given I am on the login page

  @smoke
  Scenario: Successful login with valid credentials
    When I enter username "standard_user" and password "secret_sauce"
    And I click the login button
    Then I should be redirected to the inventory page
    And I should see "Products" as the page heading

  @regression
  Scenario: Login fails with locked account
    When I enter username "locked_out_user" and password "secret_sauce"
    And I click the login button
    Then I should see the error message "Epic sadface: Sorry, this user has been locked out."
```

**playwright-bdd bridges Gherkin with Playwright:**

```typescript
// features/step-definitions/login.steps.ts
import { createBdd } from 'playwright-bdd';
import { test } from '../../fixtures/bdd.fixture';
import { expect } from '@playwright/test';

const { Given, When, Then } = createBdd(test);

Given('I am on the login page', async ({ loginPage }) => {
  await loginPage.navigate();
});

When('I enter username {string} and password {string}', 
  async ({ loginPage }, username: string, password: string) => {
    await loginPage.fillCredentials(username, password);
});

When('I click the login button', async ({ loginPage }) => {
  await loginPage.submit();
});

Then('I should be redirected to the inventory page', async ({ page }) => {
  await expect(page).toHaveURL('/inventory');
});

Then('I should see {string} as the page heading', async ({ inventoryPage }, heading: string) => {
  await expect(inventoryPage.heading).toHaveText(heading);
});
```

**playwright.config.ts for BDD:**
```typescript
const bddTestDir = defineBddConfig({
  features: 'features/**/*.feature',
  steps: [
    'features/step-definitions/**/*.ts',
    'features/hooks.ts',
    'fixtures/bdd.fixture.ts',
  ],
});

projects: [
  {
    name: 'bdd',
    testDir: bddTestDir,
    use: { ...devices['Desktop Chrome'] },
  },
]
```

**When to use BDD:**
- ✅ When business stakeholders want to co-author scenarios
- ✅ When test cases serve as product documentation
- ✅ When you have complex business rules that need traceability

**When NOT to use BDD:**
- ❌ When the team is purely technical and Gherkin adds overhead without value
- ❌ For API-level or unit tests — too verbose
- ❌ When stakeholders don't actually read the feature files

---

---

## 9. CI/CD WITH GITHUB ACTIONS

---

### Q28. Walk me through a complete GitHub Actions workflow for Playwright tests.

**Answer:**

```yaml
# .github/workflows/playwright.yml
name: Playwright Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
  schedule:
    - cron: '0 2 * * *'  # Nightly at 2am UTC
  workflow_dispatch:      # Manual trigger

env:
  BASE_URL: ${{ vars.BASE_URL }}

jobs:
  # ── Smoke tests on every push/PR ────────────────────────────────────────────
  smoke-tests:
    name: Smoke Tests (${{ matrix.browser }})
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false  # Don't cancel other browsers if one fails
      matrix:
        browser: [chromium, firefox, webkit]

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci  # Use ci (not install) for reproducible builds

      - name: Install Playwright browsers
        run: npx playwright install --with-deps ${{ matrix.browser }}

      - name: Run smoke tests
        run: npx playwright test --grep "@smoke" --project=${{ matrix.browser }}
        env:
          BASE_URL: ${{ vars.BASE_URL }}
          API_KEY: ${{ secrets.API_KEY }}

      - name: Upload test results
        if: always()  # Upload even on failure — critical for debugging
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report-smoke-${{ matrix.browser }}
          path: playwright-report/
          retention-days: 30

  # ── Full regression — nightly or on-demand only ──────────────────────────
  regression-tests:
    name: Full Regression
    runs-on: ubuntu-latest
    if: |
      github.event_name == 'schedule' ||
      github.event_name == 'workflow_dispatch'
    needs: smoke-tests  # Only run if smoke passed

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps

      - name: Run full regression
        run: npx playwright test --grep "@regression"
        env:
          BASE_URL: ${{ vars.BASE_URL }}
          API_KEY: ${{ secrets.API_KEY }}

      - name: Upload regression report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report-regression
          path: playwright-report/
          retention-days: 30

  # ── Publish report to GitHub Pages ──────────────────────────────────────
  publish-report:
    name: Publish Test Report
    runs-on: ubuntu-latest
    needs: [smoke-tests]
    if: always()
    permissions:
      pages: write
      id-token: write

    steps:
      - name: Download all artifacts
        uses: actions/download-artifact@v4
        with:
          path: all-reports/

      - name: Deploy to GitHub Pages
        uses: actions/deploy-pages@v4
```

**Key decisions explained:**

| Decision | Why |
|----------|-----|
| `npm ci` not `npm install` | Reproducible: uses exact package-lock.json versions |
| `if: always()` on upload | Must upload artifacts even when tests fail — that's when you need them most |
| `fail-fast: false` | See all browser results, not just the first failure |
| Separate smoke/regression jobs | Smoke gates PRs; regression doesn't block developers |
| `--with-deps` | Installs OS-level browser dependencies (fonts, libs) needed in Ubuntu |
| Secrets for sensitive data | Never hardcode API keys — use GitHub Secrets |

---

### Q29. How do you manage environment-specific configuration in CI/CD?

**Answer:**

**Hierarchy of environment configuration:**

```
1. GitHub Secrets    — sensitive (API keys, passwords)
2. GitHub Variables  — non-sensitive config (base URLs, feature flags)
3. .env files        — local development only (never committed)
4. playwright.config.ts defaults — fallback values
```

**env.utils.ts — centralized env access:**
```typescript
// utils/env.utils.ts
export function getEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(
      `Required environment variable "${key}" is not set. ` +
      `Add it to your .env file or CI environment.`
    );
  }
  return value;
}

export const ENV = {
  BASE_URL: getEnv('BASE_URL', 'https://www.saucedemo.com'),
  API_URL: getEnv('API_URL', 'https://api.example.com'),
  TEST_USER_PASSWORD: getEnv('TEST_USER_PASSWORD', 'secret_sauce'),
} as const;
```

**playwright.config.ts using env:**
```typescript
import { ENV } from './utils/env.utils';

export default defineConfig({
  use: {
    baseURL: ENV.BASE_URL,
  },
});
```

**Multi-environment strategy:**
```yaml
# Run against staging
workflow_dispatch:
  inputs:
    environment:
      type: choice
      options: [staging, production]
      default: staging

# Use in step
env:
  BASE_URL: ${{ inputs.environment == 'production' && vars.PROD_URL || vars.STAGING_URL }}
```

---

---

## 10. DEBUGGING, FLAKINESS & TROUBLESHOOTING

---

### Q30. How do you debug a failing Playwright test?

**Answer:**

Playwright has a powerful debugging toolkit. Here is the escalating approach:

**Level 1 — Read the error output:**
Playwright's error messages include a screenshot, the failed assertion, and the call stack. Always read the full error before jumping to code.

**Level 2 — Run in headed mode:**
```bash
npx playwright test login.spec.ts --headed
# Slows down execution so you can see what's happening
npx playwright test login.spec.ts --headed --slow-mo=1000
```

**Level 3 — Use Playwright Inspector (interactive debugger):**
```bash
PWDEBUG=1 npx playwright test login.spec.ts
# Opens a GUI debugger with step-through, DOM inspector, locator testing
```

**Level 4 — Add `page.pause()` in code:**
```typescript
test('debug me', async ({ page, loginPage }) => {
  await loginPage.navigate();
  await page.pause(); // Pauses here — Inspector opens
  await loginPage.fillCredentials('standard_user', 'secret_sauce');
});
```

**Level 5 — Trace Viewer (post-mortem analysis):**
```typescript
// playwright.config.ts
use: {
  trace: 'on', // or 'on-first-retry' in CI
}
```
```bash
# After a test run, open the trace
npx playwright show-trace test-results/trace.zip
# Shows timeline, screenshots, network, console, DOM snapshot at every step
```

**Level 6 — Enable verbose browser logging:**
```bash
DEBUG=pw:api npx playwright test       # Playwright API calls
DEBUG=pw:browser npx playwright test   # Browser protocol messages
```

**Level 7 — Use `test.step()` for better failure messages:**
```typescript
test('complete checkout', async ({ page }) => {
  await test.step('Navigate to cart', async () => {
    await page.goto('/cart');
  });
  await test.step('Fill shipping details', async () => {
    await page.fill('[name="firstName"]', 'John');
  });
  // If step 2 fails, you know exactly where without reading the full trace
});
```

---

### Q31. How do you handle iframes, shadow DOM, and popups in Playwright?

**Answer:**

**iFrames:**
```typescript
// Access iframe content
const frame = page.frameLocator('#payment-iframe');
await frame.getByLabel('Card Number').fill('4111111111111111');
await frame.getByRole('button', { name: 'Pay' }).click();

// Named frame
const namedFrame = page.frame({ name: 'payment' });
await namedFrame?.fill('#card', '4111111111111111');
```

**Shadow DOM:**
```typescript
// Playwright's locators pierce shadow DOM by default
await page.locator('custom-button >> text=Submit').click();

// Or use shadow DOM explicitly
const host = page.locator('my-web-component');
const button = host.locator('button'); // Pierces shadow root automatically
```

**New tabs and popups:**
```typescript
// Wait for new tab to open
const [newPage] = await Promise.all([
  page.waitForEvent('popup'),
  page.click('a[target="_blank"]'),
]);
await newPage.waitForLoadState();
await expect(newPage).toHaveURL(/expected-url/);

// Handle file download popup
const [download] = await Promise.all([
  page.waitForEvent('download'),
  page.click('#download-btn'),
]);
await download.saveAs('downloads/report.pdf');
```

**Alert/Confirm/Prompt dialogs:**
```typescript
// Handle before the action that triggers it
page.on('dialog', async (dialog) => {
  console.log('Dialog message:', dialog.message());
  await dialog.accept(); // or dialog.dismiss(), dialog.fill('value')
});
await page.click('#delete-btn'); // triggers confirm dialog
```

---

---

## 11. PERFORMANCE, SCALABILITY & REPORTING

---

### Q32. How do you optimize test execution speed in a large test suite?

**Answer:**

**1. Parallel execution (most impactful):**
```typescript
// playwright.config.ts
fullyParallel: true,           // All tests run in parallel (not just files)
workers: process.env.CI ? 4 : undefined,  // 4 workers in CI
```

**2. Reuse authentication state:**
```typescript
// global-setup.ts
async function globalSetup() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('/login');
  await page.fill('[data-test="username"]', 'standard_user');
  await page.fill('[data-test="password"]', 'secret_sauce');
  await page.click('[data-test="login-button"]');
  await page.context().storageState({ path: 'auth/standard-user.json' });
  await browser.close();
}

// playwright.config.ts
globalSetup: './global-setup.ts',
use: { storageState: 'auth/standard-user.json' }
// Result: All tests start already logged in — eliminates login from every test
```

**3. API setup instead of UI setup:**
```typescript
// SLOW: navigate to cart, add items via UI
await page.goto('/inventory');
await page.click('[data-test="add-to-cart-sauce-labs-backpack"]');

// FAST: seed data via API
await request.post('/api/cart', { data: { items: ['backpack'] } });
await page.goto('/cart'); // jump straight to what you want to test
```

**4. Mock external dependencies:**
```typescript
// Don't make real calls to analytics, CDNs, third-party APIs
await page.route('**googlatagmanager.com/**', route => route.abort());
await page.route('**/cdn.example.com/**', route => route.abort());
```

**5. Targeted test runs in CI:**
```bash
# Only run tests for changed files (requires setup)
npx playwright test --grep "@smoke"  # Fast subset for PRs
```

---

### Q33. Explain Playwright's reporters and how you configure them.

**Answer:**

```typescript
// playwright.config.ts
reporter: process.env.CI
  ? [
      ['github'],                          // GitHub Actions annotations on failures
      ['junit', { outputFile: 'results/junit.xml' }],  // For test management tools
      ['html', { open: 'never' }],         // HTML report (don't auto-open in CI)
      ['json', { outputFile: 'results/results.json' }],
    ]
  : [
      ['html', { open: 'on-failure' }],    // Auto-open browser on failure locally
      ['list'],                            // Console output during run
    ],
```

**Built-in reporters:**
| Reporter | Use Case |
|----------|---------|
| `html` | Detailed interactive report with screenshots, traces, videos |
| `junit` | Integration with Jira, Jenkins, Azure DevOps |
| `json` | Custom processing, dashboard integration |
| `github` | Inline failure annotations in GitHub PRs |
| `list` | Real-time console output during run |
| `dot` | Minimal output for large suites |
| `line` | One line per test with failures highlighted |

**Allure reporter (popular in enterprise):**
```bash
npm install allure-playwright
```
```typescript
reporter: [['allure-playwright', { detail: true, outputFolder: 'allure-results' }]]
```
```bash
npx allure generate allure-results --clean -o allure-report
npx allure open allure-report
```

---

---

## 12. WORKERS, SHARDS & PARALLELISM

---

### Q. What is a Worker in Playwright?

**Answer:**

A **worker** is an independent Node.js process that runs tests. Playwright spawns multiple workers to run tests **in parallel** — each worker gets its own browser instance and runs tests independently.

```
npx playwright test
│
├── Worker 1 (Node.js process)
│   ├── Browser Instance 1
│   └── Runs: login.spec.ts, cart.spec.ts
│
├── Worker 2 (Node.js process)
│   ├── Browser Instance 2
│   └── Runs: checkout.spec.ts
│
└── Worker 3 (Node.js process)
    ├── Browser Instance 3
    └── Runs: inventory.spec.ts
```

Each worker is completely **isolated** — separate memory, separate browser, no shared state.

---

### Q. What is the difference between `workers`, `fullyParallel`, and `parallel` in Playwright?

**Answer:**

**`workers`** — how many parallel Node.js processes to run:
```typescript
// playwright.config.ts
workers: 4,           // always 4 workers
workers: '50%',       // use 50% of CPU cores
workers: undefined,   // default: half of CPU cores (local), 1 in CI
```

**`fullyParallel`** — controls HOW tests within a file are distributed:
```typescript
fullyParallel: false  // DEFAULT — all tests in a FILE run in the same worker sequentially
                      // different files run in parallel across workers

fullyParallel: true   // every individual test can run in ANY worker
                      // maximum parallelism
```

**Visual difference:**

```
fullyParallel: false (default)
├── Worker 1: login.spec.ts → test1, test2, test3 (sequential in same worker)
└── Worker 2: checkout.spec.ts → test1, test2, test3 (sequential in same worker)

fullyParallel: true
├── Worker 1: login.spec.ts → test1
├── Worker 2: login.spec.ts → test2   ← same FILE, different workers
├── Worker 3: checkout.spec.ts → test1
└── Worker 4: login.spec.ts → test3
```

**`test.describe.configure({ mode: 'parallel' })`** — parallel at describe block level:
```typescript
test.describe.configure({ mode: 'parallel' }); // only THIS describe runs in parallel

test.describe('Login tests', () => {
  test('test 1', ...); // runs in parallel with test 2
  test('test 2', ...);
});
```

---

### Q. What is worker scope in fixtures and when would you use it?

**Answer:**

By default, fixtures have **test scope** — created fresh for every test, torn down after.

**Worker scope** — created ONCE when the worker starts, shared across ALL tests in that worker, torn down when the worker shuts down.

```typescript
// fixtures/base.fixture.ts
type WorkerFixtures = {
  dbConnection: DatabaseClient;  // expensive to create
};

export const test = base.extend<{}, WorkerFixtures>({
  // Note: worker fixtures go in the SECOND generic parameter
  dbConnection: [async ({}, use) => {
    console.log('DB connection OPEN — happens once per worker');
    const db = await DatabaseClient.connect(process.env.DB_URL!);

    await use(db); // all tests in this worker share this connection

    console.log('DB connection CLOSE — happens once per worker');
    await db.disconnect();
  }, { scope: 'worker' }],  // <-- worker scope declared here
});
```

**Timeline with 3 tests in Worker 1:**
```
Worker 1 starts
  → dbConnection OPEN (once)
    → test 1 runs (uses dbConnection)
    → test 2 runs (uses same dbConnection)
    → test 3 runs (uses same dbConnection)
  → dbConnection CLOSE (once)
Worker 1 ends
```

**When to use worker scope:**
| Use Case | Why |
|----------|-----|
| Database connections | Expensive to open/close per test |
| Auth tokens that don't expire quickly | No need to re-authenticate per test |
| Compiled/cached resources | Build once, use many |
| Browser launched with special flags | Heavy startup cost |

**When NOT to use worker scope:**
- Anything that carries state between tests (defeats test isolation)
- Page objects (each test needs a fresh page/context)
- Test-specific data (must be unique per test)

---

### Q. How does Playwright decide which tests go to which worker?

**Answer:**

Playwright uses a **greedy scheduling** algorithm:
1. It builds a list of all test files
2. Workers pick up the next available file when they finish their current one
3. Files are distributed dynamically — not pre-assigned

```
Test files: [A, B, C, D, E, F]  Workers: 3

Timeline:
Worker 1: [A]........[D].....[F]
Worker 2: [B]...[C].........[E]
Worker 3: stays busy with longer files

Playwright auto-balances — workers don't sit idle
```

**Controlling order with project dependencies:**
```typescript
// playwright.config.ts
projects: [
  { name: 'setup', testMatch: '**/global-setup.spec.ts' },
  {
    name: 'chromium',
    dependencies: ['setup'], // waits for setup to complete first
    use: { ...devices['Desktop Chrome'] },
  },
]
```

---

### Q. What happens when a worker crashes mid-test?

**Answer:**

If a worker process crashes (not a test failure — an actual process crash):
- Playwright detects the crash
- Marks all tests that were running in that worker as **failed**
- Spawns a new worker to continue with remaining tests
- The crashed worker's fixtures are NOT torn down (teardown code never runs)

**Implication:** If your worker-scoped fixture opens a database connection and the worker crashes, the connection leaks. Design cleanup to be handled by the database server's timeout, not just your fixture teardown.

---

### Q. How do you run tests serially (no parallelism) for tests that share state?

**Answer:**

```typescript
// Option 1 — serial mode on a describe block
test.describe.configure({ mode: 'serial' });

test.describe('Checkout flow (order matters)', () => {
  test('step 1 — add to cart', async ({ page }) => { ... });
  test('step 2 — proceed to checkout', async ({ page }) => { ... });
  test('step 3 — complete order', async ({ page }) => { ... });
  // These run in order, in the same worker
});

// Option 2 — limit to 1 worker globally (no parallelism at all)
// playwright.config.ts
workers: 1,

// Option 3 — file-level serial (all tests in this file run sequentially)
// At the top of the spec file:
test.describe.configure({ mode: 'serial' });
```

**When to use serial:**
- Tests that represent a workflow where each step depends on the previous
- Tests that share a single external resource (e.g., one test account)
- Database state that cannot be easily reset

**Warning:** Serial tests are fragile — if step 2 fails, step 3 is skipped. Prefer independent tests whenever possible.

---

### Q. What is Sharding in Playwright?

**Answer:**

Sharding splits your test suite across **multiple CI machines**, running a subset on each. Each machine runs its shard independently, then results are merged.

```
Without sharding (1 machine, 100 tests):
Machine 1: runs all 100 tests → 20 minutes

With sharding (4 machines, 100 tests):
Machine 1: tests 1–25   → 5 minutes ↘
Machine 2: tests 26–50  → 5 minutes  → All finish in ~5 minutes
Machine 3: tests 51–75  → 5 minutes  ↗
Machine 4: tests 76–100 → 5 minutes ↗
```

---

### Q. How does the `--shard` flag work?

**Answer:**

```bash
# Syntax: --shard=<current>/<total>

npx playwright test --shard=1/4  # Run the 1st quarter of tests
npx playwright test --shard=2/4  # Run the 2nd quarter
npx playwright test --shard=3/4  # Run the 3rd quarter
npx playwright test --shard=4/4  # Run the 4th quarter
```

**How Playwright divides tests:**
- Takes all test files and sorts them alphabetically
- Divides them into N roughly equal groups by file count
- Each shard gets its group

```
Files: [auth.spec.ts, cart.spec.ts, checkout.spec.ts, inventory.spec.ts]
Shard 1/2: [auth.spec.ts, cart.spec.ts]
Shard 2/2: [checkout.spec.ts, inventory.spec.ts]
```

**Important:** Sharding splits by FILE, not by individual test. A file with 50 tests stays together in one shard.

---

### Q. Show a complete GitHub Actions matrix strategy using shards.

**Answer:**

```yaml
# .github/workflows/playwright.yml
name: Playwright Tests

on: [push, pull_request]

jobs:
  test:
    name: Tests (Shard ${{ matrix.shardIndex }}/${{ matrix.shardTotal }})
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false   # Don't cancel other shards if one fails
      matrix:
        shardIndex: [1, 2, 3, 4]
        shardTotal: [4]

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps

      - name: Run tests (Shard ${{ matrix.shardIndex }}/${{ matrix.shardTotal }})
        run: npx playwright test --shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }}

      - name: Upload blob report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: blob-report-${{ matrix.shardIndex }}  # unique name per shard
          path: blob-report/
          retention-days: 1

  # Merge all shard reports into one HTML report
  merge-reports:
    name: Merge Reports
    needs: test        # waits for ALL shards to finish
    runs-on: ubuntu-latest
    if: always()

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci

      - name: Download all blob reports
        uses: actions/download-artifact@v4
        with:
          path: all-blob-reports/
          pattern: blob-report-*
          merge-multiple: true

      - name: Merge reports
        run: npx playwright merge-reports --reporter html ./all-blob-reports

      - name: Upload merged HTML report
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report-merged
          path: playwright-report/
          retention-days: 14
```

---

### Q. What is a blob reporter and why is it needed for sharding?

**Answer:**

When tests run on different machines, each machine generates its own report. To get a **single unified report**, you need to:

1. Each shard outputs a **blob report** (binary format — not human-readable)
2. All blobs are collected (downloaded as artifacts)
3. `merge-reports` command combines them into one HTML report

```typescript
// playwright.config.ts — use blob reporter in CI for sharding
reporter: process.env.CI
  ? [['blob']]           // outputs to blob-report/ folder
  : [['html', { open: 'on-failure' }]],
```

```bash
# After downloading all blobs from CI artifacts:
npx playwright merge-reports --reporter html ./all-blob-reports
# Generates a single playwright-report/index.html from all shards
```

**Without blob reporter:** Each shard generates its own HTML report independently. You get 4 separate reports with no unified view of the full suite.

---

### Q. What is the difference between workers and shards?

**Answer:**

| | Workers | Shards |
|--|---------|--------|
| **Scope** | Single machine | Multiple machines |
| **What runs in parallel** | Tests within one machine | Different subsets on different machines |
| **Configuration** | `workers: 4` in config | `--shard=1/4` CLI flag |
| **Isolation** | Separate Node.js processes | Separate CI runners/VMs |
| **Use case** | Use available CPU cores | Scale beyond one machine |
| **Requires CI matrix?** | No | Yes |
| **Shares artifacts?** | No (same machine) | Yes (blob reports must be merged) |

**They work together:**
```
4 machines (shards) × 4 workers per machine = 16 parallel browser instances
```

```typescript
// playwright.config.ts
workers: 4,         // 4 workers on EACH machine
fullyParallel: true,

// GitHub Actions
// --shard=1/4 → machine 1 of 4
// --shard=2/4 → machine 2 of 4
```

---

### Q. How do you ensure tests are evenly distributed across shards?

**Answer:**

Playwright distributes by file count, not test count. If you have:
```
shard 1/2: auth.spec.ts       (2 tests)   → finishes in 1 min
shard 2/2: checkout.spec.ts   (50 tests)  → finishes in 15 min
```
Shard 2 takes much longer — the shards are **unbalanced**.

**Solutions:**

**1. Split large spec files into smaller ones:**
```
checkout.spec.ts (50 tests) →
  checkout-payment.spec.ts     (15 tests)
  checkout-shipping.spec.ts    (15 tests)
  checkout-confirmation.spec.ts (20 tests)
```

**2. Use more shards so large files have less relative impact:**
```bash
# Instead of 2 shards, use 10
--shard=1/10
```

**3. Split by tag instead of file:**
```bash
# Machine 1: smoke tests
npx playwright test --grep "@smoke"

# Machine 2: regression only
npx playwright test --grep-invert "@smoke"
```

---

### Q. Can you combine sharding with browser projects?

**Answer:**

Yes — this is the most scalable approach:

```yaml
strategy:
  matrix:
    browser: [chromium, firefox, webkit]
    shardIndex: [1, 2, 3]
    shardTotal: [3]

steps:
  - run: npx playwright test
      --project=${{ matrix.browser }}
      --shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }}
```

This creates **9 parallel jobs** (3 browsers × 3 shards), each running 1/3 of the tests on one browser.

---

### Q. What are the gotchas of sharding?

**Answer:**

**1. Tests must be completely independent:**
Shard 1 and Shard 2 run on different machines. If a test on Shard 2 depends on a test on Shard 1 having run first — it will fail.

**2. Global setup runs on EVERY shard:**
```typescript
// global-setup.ts runs on machine 1, machine 2, machine 3...
// If it creates test data, you may get duplicate records
// Solution: use unique identifiers per run (e.g., faker UUIDs)
```

**3. `--shard` cannot split a single file:**
Tests within the same file always stay together in the same shard.

**4. Blob artifacts must be explicitly uploaded:**
If you forget `upload-artifact` on a shard, that shard's results are lost and `merge-reports` produces an incomplete report.

---

### Q. How do you debug a failure that only happens on a specific shard?

**Answer:**

```bash
# Reproduce locally by running the exact same shard
npx playwright test --shard=2/4

# Combined with headed mode
npx playwright test --shard=2/4 --headed

# With full trace recording
npx playwright test --shard=2/4 --trace on

# Specific project
npx playwright test --shard=2/4 --project=chromium
```

Also download the blob report artifact from that specific shard's CI job:
```bash
npx playwright show-report  # view locally after download
```

---

### Workers & Shards — Quick Reference

| Question | Answer |
|----------|--------|
| Default workers locally | Half of CPU cores |
| Default workers in CI | 1 (set explicitly to more) |
| `fullyParallel: true` means | Every test can run in any worker |
| Worker scope fixture created | Once per worker process |
| Shard splits tests by | File |
| Blob reporter purpose | Enables merging reports from multiple shards |
| Workers + Shards together | Workers = parallelism on one machine; Shards = parallelism across machines |
| `fail-fast: false` in matrix | All shards finish even if one fails |
| Serial mode use case | Ordered workflow tests that share state |

---

---

## 12a. FIXTURES — DEEP DIVE

---

### Q. What is a fixture in Playwright and why does it exist?

**Answer:**

**The problem fixtures solve:**

Without fixtures, every test repeats the same setup:
```typescript
test('test 1', async ({ page }) => {
  const loginPage = new LoginPage(page);       // repeated
  const inventoryPage = new InventoryPage(page); // repeated
});

test('test 2', async ({ page }) => {
  const loginPage = new LoginPage(page);       // repeated again
  const inventoryPage = new InventoryPage(page); // repeated again
});
// × 10 tests = same boilerplate everywhere
```

With fixtures, you define setup ONCE and it is **injected automatically** by parameter name:
```typescript
test('test 1', async ({ loginPage, inventoryPage }) => {
  // loginPage and inventoryPage just APPEAR — no manual creation
});

test('test 2', async ({ loginPage, inventoryPage }) => {
  // Same — Playwright handles creation and cleanup
});
```

A fixture is a **named setup + teardown block** that Playwright automatically runs and injects into any test that asks for it by name.

---

### Q. Explain the `use` pattern in fixtures. What happens before and after `use()`?

**Answer:**

Every fixture follows this exact structure:

```typescript
fixtureName: async ({ otherFixtures }, use) => {
  // 1. SETUP — runs BEFORE your test
  const thing = new Thing();

  // 2. INJECT — test runs here, receives 'thing'
  await use(thing);

  // 3. TEARDOWN — runs AFTER your test (even if test fails)
  await thing.cleanup();
}
```

`use` is the dividing line:
- **Before `use()`** = setup code
- **`use(thing)`** = hand the value to the test — test runs now
- **After `use()`** = teardown code — always runs, even on failure

**Real example with setup and teardown:**
```typescript
loggedInPage: async ({ page, loginPage }, use) => {

  // SETUP — runs before test
  await loginPage.navigate();
  await loginPage.loginAs('standard_user', 'secret_sauce');
  await page.waitForURL('/inventory');

  // INJECT — test runs with the logged-in page
  await use(page);

  // TEARDOWN — runs after test, even if test failed
  await page.goto('/logout');
},
```

---

### Q. How do you define and use custom fixtures in Playwright?

**Answer:**

**Step 1 — Define the fixture type and setup:**
```typescript
// fixtures/base.fixture.ts
import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { InventoryPage } from '../pages/inventory.page';

type MyFixtures = {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
};

export const test = base.extend<MyFixtures>({

  loginPage: async ({ page }, use) => {
    // 'page' is Playwright's built-in fixture — injected automatically
    const loginPage = new LoginPage(page);  // SETUP
    await use(loginPage);                   // INJECT → test runs
                                            // nothing to clean up
  },

  inventoryPage: async ({ page }, use) => {
    await use(new InventoryPage(page));
  },

});

export { expect } from '@playwright/test';
```

**Step 2 — Import YOUR test (not Playwright's base test):**
```typescript
// tests/e2e/login/login.spec.ts
import { test, expect } from '../../fixtures/base.fixture'; // ← YOUR test

test('login works', async ({ loginPage, inventoryPage }) => {
  await loginPage.navigate();
  await loginPage.loginAs('standard_user', 'secret_sauce');
  await expect(inventoryPage.heading).toBeVisible();
});
```

**What Playwright does behind the scenes:**
```
You write:  async ({ loginPage, inventoryPage })

Playwright:
1. Sees 'loginPage' requested → runs loginPage fixture setup → creates LoginPage(page)
2. Sees 'inventoryPage' requested → runs inventoryPage fixture setup → creates InventoryPage(page)
3. Calls your test function, injecting both objects
4. Test runs
5. Runs inventoryPage teardown (code after use())
6. Runs loginPage teardown (code after use())
```

---

### Q. How do fixtures compose (depend on each other)?

**Answer:**

Fixtures can use other fixtures as ingredients — Playwright resolves the dependency chain automatically:

```typescript
export const test = base.extend<MyFixtures>({

  // loginPage depends on 'page' (Playwright built-in)
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  inventoryPage: async ({ page }, use) => {
    await use(new InventoryPage(page));
  },

  // loggedInInventory depends on loginPage AND inventoryPage
  loggedInInventory: async ({ loginPage, inventoryPage }, use) => {
    await loginPage.navigate();
    await loginPage.loginAs('standard_user', 'secret_sauce');
    await use(inventoryPage); // test receives inventory page, already logged in
  },
});
```

Test using the composed fixture:
```typescript
test('add to cart', async ({ loggedInInventory, cartPage }) => {
  // No login code — loggedInInventory handled it
  await loggedInInventory.addItemToCart('Sauce Labs Backpack');
});
```

---

### Q. What is the difference between test-scope and worker-scope fixtures?

**Answer:**

| | Test Scope (default) | Worker Scope |
|--|---------------------|-------------|
| Created | Once per test | Once per worker process |
| Destroyed | After each test | When worker shuts down |
| Shared between tests? | ❌ No | ✅ Yes (within same worker) |
| Use for | Page objects, fresh state | DB connections, auth tokens, expensive resources |

```typescript
// Test scope (default) — fresh for every test
loginPage: async ({ page }, use) => {
  await use(new LoginPage(page));
  // created before test 1, destroyed after
  // created again before test 2, destroyed after
},

// Worker scope — created once, shared across all tests in this worker
dbConnection: [async ({}, use) => {
  const db = await Database.connect();
  await use(db);
  await db.disconnect(); // runs when worker shuts down, not after each test
}, { scope: 'worker' }],
```

---

### Q. What is the difference between fixtures and `beforeEach`?

**Answer:**

| | `beforeEach` | Fixtures |
|--|-------------|---------|
| Scope | One spec file | Across all files that import the fixture |
| Reusability | ❌ Must copy to every file | ✅ Define once, use anywhere |
| Teardown | Separate `afterEach` block | Inline after `use()` — never separated |
| Dependency injection | ❌ Manual | ✅ Automatic by parameter name |
| Lazy (only runs if needed) | ❌ Always runs | ✅ Only runs if test requests it |

**`beforeEach` — repeated in every file:**
```typescript
// Must copy this to EVERY spec file that needs it
test.beforeEach(async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.navigate();
});
```

**Fixture — define once, available everywhere:**
```typescript
// Define once in fixtures/base.fixture.ts
navigatedLoginPage: async ({ loginPage }, use) => {
  await loginPage.navigate();
  await use(loginPage);
},

// Use in any spec file — no beforeEach needed
test('test', async ({ navigatedLoginPage }) => { ... });
```

---

### Fixtures — Quick Reference

| Concept | Description |
|---------|-------------|
| `base.extend<T>()` | Creates a new test object with your custom fixtures |
| `await use(value)` | Injects value into the test; code after runs as teardown |
| Test scope | Default — new instance per test |
| Worker scope | Shared across all tests in a worker — `{ scope: 'worker' }` |
| Fixture composition | Fixtures can request other fixtures as parameters |
| Import rule | Always import `test` from YOUR fixture file, not `@playwright/test` |

---

---

## 13. SENIOR QE MINDSET & LEADERSHIP

---

### Q34. How do you decide what to automate and what not to?

**Answer:**

**S – Situation**

In one of my agile teams, there was a push to increase automation coverage rapidly. However, we were seeing diminishing returns — high maintenance effort, flaky UI tests, and long CI execution times — while critical production defects were still slipping through.

This highlighted that not everything should be automated, and we needed a more deliberate approach.

**T – Task**

As a Senior QE, my responsibility was to define a clear decision framework for what to automate and what not to, ensuring automation delivered maximum business value without becoming a maintenance burden.

The goal was to:
- Optimize test effort
- Improve confidence in releases
- Keep automation sustainable

**A – Action**

I introduced a risk- and value-based approach to automation decisions.

**1. Start with business criticality**

I prioritize automating flows that are:
- Revenue-impacting (e.g., checkout, payments)
- Core user journeys (login, onboarding)
- High-usage paths

If a feature failing would cause significant customer impact, it must be automated. These tests provide the highest ROI.

**2. Consider test stability and determinism**

I avoid automating scenarios that are:
- Highly visual or cosmetic
- Frequently changing due to evolving requirements
- Dependent on unstable third-party systems without proper mocks

Instead, I cover such areas with exploratory or manual testing and re-evaluate automation once the feature stabilizes.

**3. Apply the test pyramid intentionally**

I ensure:
- More coverage at API and service level
- Fewer, high-value UI tests

For example:
- Business rules → API tests
- End-to-end user journeys → UI tests
- Edge cases → Lower-level tests

This reduced UI maintenance while improving overall coverage.

**4. Evaluate frequency and reuse**

I automate scenarios that are:
- Repetitive and time-consuming manually
- Needed across multiple test cycles or releases
- Required for regression or smoke testing

I deprioritize:
- One-time scenarios
- Rare edge cases with minimal impact

**5. Assess cost vs value**

Before automating, I ask:
- How often will this test run?
- How likely is it to break?
- What is the long-term maintenance cost?

If maintenance cost outweighs value, I don't automate — even if it's technically possible.

**6. Collaborate with the team**

I make automation decisions with developers and product, not in isolation:
- Align with product risk
- Validate assumptions about usage
- Revisit decisions as the product matures

**R – Result**

By applying this structured approach, we reduced the overall number of UI tests but significantly increased their reliability and impact.

Key outcomes:
- Faster and more stable CI pipelines
- Improved trust in automation results
- Better coverage of critical user flows
- Reduced maintenance effort over time

Automation became strategic rather than checkbox-driven.

> *"I don't aim to automate everything — I aim to automate the right things. My decisions are driven by business risk, stability, and long-term value, ensuring automation accelerates delivery instead of slowing it down."*

---

### Q35. How do you approach test maintenance in an agile team?

**Answer:**

**S – Situation**

In an agile team I worked with, the product was evolving rapidly with frequent UI and API changes. As a result, our automated test suite began to degrade — tests were becoming flaky, failures increased in CI, and the team started losing confidence in automation results.

This created:
- Slower feedback cycles
- Time wasted fixing tests reactively
- Pressure to skip automation during releases

**T – Task**

As a Senior QE, my responsibility was to stabilize and maintain the automation suite while ensuring it continued to support fast, reliable delivery without becoming a bottleneck.

This included:
- Improving test reliability
- Reducing maintenance overhead
- Aligning test changes with agile development pace

**A – Action**

I approached test maintenance as a continuous, proactive activity, not a cleanup task.

**1. Preventive maintenance through better design**
- Refactored brittle tests to follow clear separation of concerns
- Centralized selectors using Page Object Model
- Removed hard waits and relied on Playwright's auto-waiting and assertions

This ensured that when UI changes happened, fixes were localized and low-effort.

**2. Early collaboration (shift-left)**
- Joined backlog grooming and design discussions
- Identified upcoming UI and API changes early
- Collaborated with developers on adding stable `data-testid` attributes and improving testability

**3. Continuous refactoring within sprints**
- Treated test maintenance as part of normal sprint work
- Any test touched during a story was improved if needed
- Reduced duplication, improved naming, and simplified test logic

**4. Flaky test management**
- Used Playwright traces and logs to identify root causes
- Fixed issues like unstable locators, async timing, and shared test data
- Applied retries only as a temporary safeguard, not a long-term fix

**5. Test data and environment stability**
- Moved setup logic to API-level where possible
- Ensured test data isolation to avoid cross-test interference
- Cleaned up or reset state after test execution

**6. Prioritization based on business value**
- Focused maintenance efforts on critical user journeys
- Challenged low-value or high-maintenance tests
- Ensured the most important flows were always reliable

**R – Result**

As a result, the automation suite became significantly more stable and trusted by the team.

Measured outcomes included:
- Fewer CI failures due to flaky tests
- Faster feedback in pipelines
- Reduced time spent on reactive test fixes
- Increased adoption of automation as part of definition of done

Most importantly, automation became an enabler of agile delivery rather than a maintenance burden.

> *"In an agile team, effective test maintenance is about designing for change, collaborating early, and continuously improving tests so they evolve at the same pace as the product."*

---

### Q36. How do you handle a situation where developers say "that's not a bug, it's by design"?

**Answer:**

**S – Situation**

In an agile team I worked with, I raised an issue where a feature behaved differently from user expectations and acceptance criteria. The developer responded that the behavior was "by design," and initially did not consider it a defect.

This created a risk that:
- A potential user-impacting issue could be released
- QA and development perspectives could become misaligned

**T – Task**

My responsibility was to ensure product quality while maintaining a collaborative, respectful relationship with developers. The goal was not to prove someone wrong, but to determine whether the behavior genuinely matched the intended requirement and user expectation.

**A – Action**

I handled the situation using a facts-based, collaborative approach rather than debate.

**1. Shifted the conversation from opinion to evidence**

Instead of arguing, I brought:
- Acceptance criteria
- User stories
- Product requirements
- Realistic user scenarios

I framed the conversation as: *"Let's validate whether this behavior aligns with what was intended."*

**2. Clarified intent vs implementation**

I asked neutral questions such as:
- "Is this behavior documented anywhere?"
- "How would a user understand this behavior?"
- "Does this align with the acceptance criteria we agreed on?"

This helped separate implementation choices from product intent and user impact.

**3. Focused on user impact, not blame**

I explained the issue in terms of:
- User confusion or friction
- Business risk
- Inconsistency with similar features

For example: *"Even if it's implemented correctly, users may perceive this as broken because it behaves differently from similar flows."*

**4. Involved product or design when needed**

If ambiguity remained, I:
- Escalated constructively by bringing the Product Owner or Designer into the conversation
- Asked for clarification on expected behavior
- Ensured a shared decision was documented

This made the decision team-owned, not personal.

**5. Accepted decisions but ensured visibility**

If the final decision was truly by design:
- Ensured it was documented
- Adjusted tests and acceptance criteria accordingly

If not:
- A defect or improvement story was logged with clear context

**R – Result**

Most of the time, this approach led to productive discussions where either the behavior was improved, or the design intent was clarified and documented.

Outcomes included:
- Reduced misunderstandings between QA and developers
- Improved acceptance criteria in future stories
- Stronger trust and collaboration within the team

Most importantly, decisions were made based on user value and clarity rather than personal opinions.

> *"When a developer says 'it's by design,' I don't see it as a conflict. I see it as an opportunity to validate intent, user impact, and shared understanding. My focus is always on delivering the right behavior for the user, not winning an argument."*

---

### Q37. How do you measure test quality and coverage in a non-code-coverage sense?

**Answer:**

**S – Situation**

In one of my teams, stakeholders were heavily focused on code coverage numbers, but despite high coverage, we were still seeing production issues and late-cycle defects.

It became clear that code coverage alone was giving a false sense of confidence, and we needed better ways to assess test quality and real coverage.

**T – Task**

As a Senior QE, my responsibility was to define and communicate meaningful quality metrics that reflected actual risk coverage, test effectiveness, and user impact — without relying on traditional code coverage.

The goal was:
- Better release confidence
- Improved prioritization
- Stronger alignment with business risk

**A – Action**

I approached this by shifting the conversation from "how much code is tested" to "how well the product is protected."

**1. Measure coverage by business risk, not lines of code**

Instead of percentages, I focused on risk-based coverage. I evaluated:
- Critical user journeys (login, checkout, payments)
- Revenue-impacting features
- High-usage and customer-facing flows
- Areas with recent changes or incidents

If a failure would significantly impact users or the business, that area must be covered. This helped ensure our test suite aligned with what actually matters.

**2. Track defect detection effectiveness**

I used defect-related metrics to measure test quality:
- Defect leakage (issues found in production)
- Defect escape rate per release
- Severity of escaped defects
- Where defects were found (UI, API, integration)

A high-quality test suite finds high-impact defects early. This allowed us to identify weak testing areas and adjust test focus retrospectively.

**3. Measure test reliability and signal quality**

Flaky or noisy tests reduce test quality regardless of coverage. I tracked:
- Test flakiness rate
- CI failure root causes
- Mean time to diagnose failures

We treated stable, fast, deterministic tests as high quality — and flaky, slow, hard-to-debug tests as low quality. A smaller, trustworthy test suite is more valuable than a large unreliable one.

**4. Evaluate test design quality**

I assessed test quality through structure and maintainability, including:
- Clear test intent and naming
- One assertion per logical outcome
- Independence between tests
- Minimal duplication

During code reviews, I asked: *Is this test easy to understand? Would it break due to unrelated UI changes? Does it test behavior or implementation?*

**5. Analyze coverage across test levels**

Instead of a single metric, I ensured balanced coverage across:
- API and service-level tests
- Contract and integration tests
- UI tests for critical end-to-end flows

If most bugs are integration-related but tests are UI-heavy, coverage is misleading.

**6. Incorporate exploratory and real-user feedback**

Some coverage cannot be automated. I included:
- Exploratory testing insights
- Production monitoring data
- Customer support issues
- Feature usage analytics

This feedback loop helped validate whether our test coverage matched real-world behavior.

**7. Communicate metrics in business language**

Rather than raw numbers, I framed metrics as:
- "Critical journeys covered"
- "Risk areas automated"
- "Production incidents prevented"
- "Confidence level for release readiness"

This made quality discussions clearer and more actionable for non-technical stakeholders.

**R – Result**

By moving away from pure code coverage and adopting risk- and effectiveness-based metrics, the team gained a much clearer picture of product quality.

Outcomes included:
- Fewer high-severity production defects
- Improved trust in test results
- Faster and more confident release decisions
- Better prioritization of automation effort

Most importantly, quality became measurable in terms of business impact rather than abstract percentages.

> *"I don't measure test quality by how much code is covered, but by how well the tests reduce risk, detect meaningful defects early, and give the team confidence to release."*

---

---

## 14. BEHAVIORAL QUESTIONS (STAR FORMAT)

> **STAR Format:** **S**ituation → **T**ask → **A**ction → **R**esult
>
> Replace the placeholder answers with your own real situations.

---

### B1. "Tell me about a time you identified a critical bug before it reached production."

**Situation:**
When I was working as a Principal Quality Engineer at Westpac, we were preparing a major mobile release where three interdependent functionalities had to be released together. The application was a hybrid app, combining native and web components.

**Task:**
My responsibility was to ensure release readiness and identify any critical risks that could impact customers, especially given the complexity of native-to-web navigation.

**Action:**
During exploratory testing, I noticed that under certain navigation patterns — when users transitioned from native screens to embedded web views and back — the app would freeze or crash intermittently. Although it didn't happen every time, I identified a specific sequence of steps that reliably reproduced the issue.

I recognized this as a showstopper defect, because once the app got stuck, users had to force-close and restart, making the app unusable. I immediately documented the reproduction steps, impact, and severity, and communicated it clearly to the Product Owner, engineering team, and business stakeholders.

**Result:**
The team agreed not to proceed with the release until the issue was fixed. The defect was addressed before production, preventing a major customer-impacting incident during a high-visibility release.

---

### B2. "Describe a time you had to push back on unrealistic testing timelines."

**Situation:**
After the critical navigation issue was fixed at Westpac, we had only three days to complete full regression testing across Android, iOS, tablets, multiple OS versions, and multiple builds.

**Task:**
My task was to ensure adequate test coverage and confidence for production without compromising quality, despite the aggressive deadline.

**Action:**
Instead of simply saying "it's not possible," I created a data-driven testing strategy. I detailed the required device and OS coverage, estimated execution time, defect-fix feedback loops, and tester capacity. I presented this plan to the business stakeholders and explained the risk of releasing without sufficient coverage.

I also proposed a phased rollout strategy, starting with a small percentage of users and gradually increasing exposure.

**Result:**
The business agreed to extend testing time and approved a percentage-based rollout (1%, 5%, 10%, then 100%). This approach resulted in fewer customer-reported defects and a much safer production release.

---

### B3. "Tell me about a time you introduced automation that significantly improved team efficiency."

**Situation:**
When I joined TWG as a Senior Automation Test Engineer, I was the only QE in the mobile team, and there was no real automation framework — only a few Katalon record-and-playback scripts. Manual regression took four days and was growing with the product.

**Task:**
My goal was to reduce regression time and build a scalable automation solution, even with limited resources.

**Action:**
Outside of core hours, I designed and implemented a cross-platform mobile automation framework using Serenity, Cucumber, and Appium. The framework supported Android, iOS, and API testing, with shared feature files for both mobile platforms. I scheduled nightly runs via cron jobs to understand test stability.

Over time, I built reusable components and automated over 100 scenarios, reducing full regression to around 8 hours overnight.

**Result:**
This drastically reduced regression effort and increased release confidence. When two additional QEs joined later, we collaborated to refactor and further stabilize the framework, making it reliable and maintainable long-term.

---

### B4. "Describe a conflict you had with a developer about a bug. How did you resolve it?"

**Situation:**
At TWG, I discovered an issue where some users' carts became empty after being idle for about 30 minutes, but the developer could not reproduce it and initially believed it was a test data issue.

**Task:**
My role was to ensure we correctly assessed whether this was a real user-impacting bug, without turning it into a personal disagreement.

**Action:**
I provided detailed reproduction steps, screenshots, and used the exact user data experiencing the issue. When the issue still seemed unconvincing, I gathered evidence from app store reviews where users described the same behavior.

I then brought the issue to the wider team with the BA and PO, framing it around user experience and business impact, not blame.

**Result:**
As a team, we identified the root cause and fixed the issue. The conflict was resolved collaboratively, and the process improved trust between QA, development, and product.

---

### B5. "Tell me about a time you had to learn a new technology quickly."

**Situation:**
At Westpac, the organisation decided to nativize the mobile app and move away from Appium to Espresso for Android and XCUITest for iOS.

**Task:**
I was required to upskill quickly and help the team adopt these tools to improve execution speed and enable developer contributions.

**Action:**
I proactively learned both frameworks, designed a screen-based automation framework, and presented the approach to the team. I collaborated with developers to enhance it with reusable functions and integrated a mock server for testing native component behavior.

**Result:**
The result was faster test execution, improved collaboration between QA and developers, and a more scalable native automation strategy.

---

### B6. "Tell me about a time you mentored a junior QA engineer."

**Situation:**
At TWG, a new Senior QE joined the team without prior mobile testing experience.

**Task:**
My responsibility was to help him become productive and confident quickly.

**Action:**
I mentored him on mobile testing fundamentals, build installation, device and OS coverage strategies, and best practices for both manual and automation testing. I also introduced bug bash sessions involving the entire team.

**Result:**
This significantly improved team confidence, testing ownership, and release quality.

---

### B7. "Describe a time you improved a broken or ineffective CI/CD pipeline."

**Situation:**
When I joined TWG, there was no CI/CD pipeline for mobile automation at all. All regression testing was manual, and even after automation was introduced, tests were mostly run locally and inconsistently, which limited their value.

**Task:**
As the only QE in the mobile team at the time, my responsibility was to establish a reliable CI/CD pipeline that could run mobile automation consistently, provide fast feedback to the team, and scale as the product and test suite grew.

**Action:**
I designed and implemented the first mobile automation pipeline from scratch. Key actions I took:
- Integrated the automation framework with the CI system
- Configured scheduled nightly runs to validate test stability
- Ensured separate execution for Android and iOS builds
- Set up clear logging and reporting so failures were easy to diagnose
- Optimised execution to run long regressions overnight rather than blocking developers during the day

As the framework matured and more QEs joined, we:
- Stabilised flaky tests identified through CI runs
- Improved test reliability before expanding coverage
- Made CI results visible and actionable for the whole team

**Result:**
The pipeline became a trusted source of feedback. Regression time dropped significantly, tests ran consistently without manual intervention, and the team gained confidence in release readiness. Automation shifted from being optional to being a core part of our delivery process.

> *"An effective pipeline doesn't need to be complex — it needs to be reliable, visible, and actionable."*

---

### B8. "Tell me about a time you advocated for quality when there was pressure to release fast."

**Situation:**
At Westpac, we were preparing a high-impact mobile release that included three interdependent features. Due to regulatory commitments and customer expectations, the business was pushing hard to release quickly, even while defects were still being fixed.

**Task:**
As the Principal Quality Engineer, my responsibility was to ensure that we did not compromise product quality or customer experience, while still supporting the business goals.

**Action:**
Instead of opposing the release emotionally, I took a risk-based and evidence-driven approach. I:
- Created a risk-based testing matrix, classifying scenarios by: high risk/high value, high risk/low value, and low risk/high value
- Prioritised execution of scenarios that would most impact customers if they failed
- Clearly communicated residual risks that we were not covering due to time constraints

I ensured that:
- Critical flows were fully validated
- Known risks were transparent and documented
- Stakeholders understood the consequences of cutting corners

**Result:**
We released confidently within the available timeframe without critical issues in production. The business appreciated the transparency, and the release achieved its goals without sacrificing customer trust.

> *"Advocating for quality doesn't mean blocking releases — it means making risks visible and informed."*

---

### B9. "Where do you see yourself in 5 years in the QA/Engineering space?"

**Answer:**

Over the next five years, I see myself evolving from a traditional QE mindset into a technology-driven quality and AI-enabled engineering leader.

As AI continues to transform software delivery, I believe testing will shift from manual execution and static automation — toward AI-accelerated validation, intelligent test generation, and continuous risk assessment.

I have already started working in this direction by:
- Learning AI fundamentals and applying AI concepts to real testing problems
- Participating in agentic AI approaches — for example, using custom agents to migrate tests from Guidewire frameworks to Playwright

Instead of migrating hundreds of tests manually, we:
- Defined framework structure, guardrails, and coding standards
- Built agents with clear instructions and domain-specific knowledge
- Accelerated migration while maintaining consistency and quality

In five years, I see myself as:
- A Senior/Principal-level engineer who bridges QA, automation, and AI
- Someone who enables teams to test faster, smarter, and with higher confidence
- A leader who helps organisations modernise quality practices rather than cling to outdated ones

> *"My goal is not just to keep up with change, but to help shape how quality engineering evolves in the AI era."*

---

### B10. "What is the hardest technical problem you solved as a QA engineer?"

**Situation:**
One of the hardest technical challenges I faced was designing a scalable, parallel-safe mobile automation framework that could support Android, iOS, and API testing simultaneously while remaining stable in CI. Mobile automation is inherently difficult due to device and OS fragmentation, app state dependencies, and flaky environment behaviour.

**Task:**
My goal was to build a framework that avoided cross-test data collisions, supported shared test logic across platforms, and remained stable under parallel and CI execution.

**Action:**
I approached this as a framework design problem, not just test writing. I:
- Designed platform-agnostic feature files with platform-specific implementations
- Built reusable components with strong abstraction boundaries
- Ensured clean test data setup and teardown per test
- Used nightly scheduled runs to identify non-deterministic failures
- Refactored aggressively to eliminate flaky patterns early

As the framework grew, I continuously improved test isolation, execution consistency, and failure diagnostics.

**Result:**
The framework scaled successfully to 100+ scenarios, ran reliably overnight across platforms, and significantly reduced manual regression effort. It became a long-term asset for the team and formed the foundation for future automation improvements.

> *"The hardest technical problems in QA are rarely single bugs — they are system-level design challenges."*

---

---

## RAPID FIRE — Quick Answers for Common One-Liners

| Question | Answer |
|----------|--------|
| What is the difference between `==` and `===`? | `==` coerces types; `===` checks type AND value. Always use `===` in TypeScript. |
| What is a closure? | A function that retains access to variables from its outer scope even after the outer function has returned. |
| What is `Promise.all()` vs `Promise.allSettled()`? | `Promise.all()` rejects immediately if any promise rejects. `Promise.allSettled()` waits for all and reports each result. |
| What is `page.waitForLoadState()`? | Waits for a specific network state: `'load'`, `'domcontentloaded'`, or `'networkidle'`. |
| What is a test fixture scope? | `'test'` (default) — created per test. `'worker'` — created once per worker process. |
| What does `forbidOnly` do in playwright.config? | In CI, it makes the build fail if any `test.only()` is committed — prevents accidentally running only one test. |
| What is `storageState`? | A JSON snapshot of cookies and local storage that can be reloaded to pre-authenticate a test without going through the login UI. |
| What is `playwright.config.ts` `use` property? | Shared browser options applied to all tests: `baseURL`, `screenshot`, `trace`, `video`, `actionTimeout`, etc. |
| What is the `--reporter` flag? | Selects the output format: `html`, `list`, `junit`, `json`, `github`, `dot`. |
| What is `expect.soft()`? | An assertion that records failure but allows the test to continue, collecting all failures at once. |
| Difference between `page.goto()` and `page.reload()`? | `goto()` navigates to a URL; `reload()` refreshes the current page. |
| What is `locator.filter()`? | Narrows a locator to elements matching additional criteria: `hasText`, `has`, `hasNot`. |
| What does `--shard` do? | Splits the test suite across multiple CI machines: `--shard=1/3` runs the first third of tests. |

---

---

## CODING CHALLENGES TO PRACTICE

### Challenge 1 — Write a generic retry utility:
```typescript
// Implement this:
async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number,
  delayMs: number
): Promise<T> {
  // Your implementation
}
```

### Challenge 2 — Write a data-driven test:
```typescript
const testCases = [
  { user: 'standard_user', expectedURL: '/inventory' },
  { user: 'locked_out_user', expectedError: 'locked out' },
  { user: 'problem_user', expectedURL: '/inventory' },
];

// Write a parameterized test that runs for each case
```

### Challenge 3 — Refactor this flaky test:
```typescript
// Fix this:
test('login', async ({ page }) => {
  await page.goto('https://www.saucedemo.com');
  await page.waitForTimeout(2000);
  await page.click('#user-name');
  await page.type('#user-name', 'standard_user');
  await page.waitForTimeout(1000);
  await page.type('#password', 'secret_sauce');
  await page.click('#login-button');
  await page.waitForTimeout(3000);
  expect(page.url()).toContain('inventory');
});
```

### Challenge 4 — Write a network mock test:
Write a test that mocks the products API to return an empty array and verifies the UI shows an appropriate empty state message.

### Challenge 5 — Design a fixture:
Design a fixture called `cartWithItems` that pre-adds 2 specific products to the cart via API before the test receives control.

---

---

*Good luck in your interview. Practice the coding challenges by actually writing and running the code in this project.*
