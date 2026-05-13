import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { test } from '../../fixtures/bdd.fixture';

/**
 * Step definitions for login.feature.
 *
 * Each step maps one-to-one to a Gherkin step in the .feature file.
 * The first argument is always the fixtures object (Playwright page objects etc.).
 * Cucumber expression parameters like {string} follow as typed arguments.
 */
const { Given, When, Then } = createBdd(test);

// ─── Given ───────────────────────────────────────────────────────────────────

Given('I am on the login page', async ({ loginPage }) => {
  await loginPage.navigate();
});

// ─── When ────────────────────────────────────────────────────────────────────

When(
  'I enter username {string} and password {string}',
  async ({ loginPage }, username: string, password: string) => {
    await loginPage.fillCredentials(username, password);
  },
);

When('I click the login button', async ({ loginPage }) => {
  await loginPage.submit();
});

// ─── Then ────────────────────────────────────────────────────────────────────

Then('I should be on the inventory page', async ({ page }) => {
  await expect(page).toHaveURL('/inventory.html');
});

Then('I should see the {string} heading', async ({ inventoryPage }, heading: string) => {
  await expect(inventoryPage.heading).toHaveText(heading);
});

Then(
  'I should see an error message containing {string}',
  async ({ loginPage }, message: string) => {
    await expect(loginPage.errorMessage).toContainText(message);
  },
);
