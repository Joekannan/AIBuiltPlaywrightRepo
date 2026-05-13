import { test as base } from 'playwright-bdd';
import { LoginPage } from '../pages/login.page';
import { InventoryPage } from '../pages/inventory.page';

/**
 * BDD-specific fixture that extends playwright-bdd's base test
 * and injects the same Page Objects used by the E2E suite.
 *
 * Referenced by playwright.config.ts via `importTestFrom`.
 */
type BddFixtures = {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
};

export const test = base.extend<BddFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  inventoryPage: async ({ page }, use) => {
    await use(new InventoryPage(page));
  },
});
