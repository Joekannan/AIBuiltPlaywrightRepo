import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

// Generates Playwright test files from .feature files into .features-gen/
const bddTestDir = defineBddConfig({
  features: 'features/**/*.feature',
  steps: [
    'features/step-definitions/**/*.ts',
    'features/hooks.ts',
    'fixtures/bdd.fixture.ts',  // v8: include fixture here instead of importTestFrom
  ],
});

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['html']],

  use: {
    baseURL: process.env.BASE_URL ?? 'https://www.saucedemo.com',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    video: 'on-first-retry',
  },

  projects: [
    // ── E2E tests (Playwright-native spec files) ─────────────────────────────
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
    // ── BDD tests (Cucumber / playwright-bdd) ────────────────────────────────
    // Feature files live in features/**/*.feature
    // Step definitions in features/step-definitions/**/*.ts
    // Hooks in features/hooks.ts  (NOT mandatory — remove if unused)
    {
      name: 'bdd',
      testDir: bddTestDir,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
