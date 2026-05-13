import { createBdd } from 'playwright-bdd';
import { test } from '../fixtures/bdd.fixture';

/**
 * Cucumber Hooks for BDD scenarios.
 *
 * ┌─────────────────────────────────────────────────────────┐
 * │  ARE HOOKS MANDATORY TO RUN BDD TESTS?  NO.            │
 * │  Feature files + step definitions are sufficient.      │
 * │  This file exists to provide setup/teardown behaviour. │
 * └─────────────────────────────────────────────────────────┘
 *
 * Lifecycle order (per scenario):
 *   BeforeAll → Before → [steps] → After → AfterAll
 *
 * Common uses:
 *   - Reset browser state between scenarios
 *   - Set up / tear down auth sessions
 *   - Extra failure logging or custom reporting
 *
 * NOTE: Playwright already handles:
 *   - Fresh browser context per test (isolation)
 *   - Screenshots on failure (playwright.config.ts → screenshot: 'only-on-failure')
 *   - Traces on retry (playwright.config.ts → trace: 'on-first-retry')
 * So many hooks that other frameworks need are already handled here automatically.
 */
const { Before, After, BeforeAll, AfterAll } = createBdd(test);

// ─── Suite-level ─────────────────────────────────────────────────────────────

/**
 * BeforeAll: Runs ONCE before the entire BDD test suite.
 * Use for: starting mock servers, seeding a database, one-time config.
 */
BeforeAll(async () => {
  // Currently no global setup needed for SauceDemo.
  // Add here when required (e.g. spin up an API mock server).
});

/**
 * AfterAll: Runs ONCE after the entire BDD test suite completes.
 * Use for: stopping servers, cleaning up seeded data.
 */
AfterAll(async () => {
  // Currently no global teardown needed.
});

// ─── Scenario-level ──────────────────────────────────────────────────────────

/**
 * Before: Runs before EACH scenario (equivalent to test.beforeEach).
 * Playwright gives each scenario a clean page by default — no extra cleanup needed.
 */
Before(async ({ page }) => {
  // page is already fresh for each scenario (Playwright's default isolation).
  // Uncomment below to set extra headers or intercept network calls globally:
  // await page.setExtraHTTPHeaders({ 'X-Test-Run': 'bdd' });
});

/**
 * After: Runs after EACH scenario (equivalent to test.afterEach).
 * In playwright-bdd v8, the hook only receives the fixture object.
 * Playwright config already handles screenshots ('only-on-failure')
 * and traces ('on-first-retry') — no manual capture needed here.
 */
After(async ({ page: _page }) => {
  // Playwright handles screenshots and traces automatically.
  // Add custom teardown here if needed (e.g. clear cookies, reset state).
});
