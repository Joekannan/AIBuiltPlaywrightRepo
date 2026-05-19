import { test, expect } from '../../../fixtures/base.fixture';
import users from '../../../data/test-data/users.json';

test.describe('Feature: Product Sorting Options', () => {

  test.beforeEach(async ({ loginPage }) => {
    await loginPage.login(users.standard.username, users.standard.password);
  });

  // ── Sort Dropdown UI ──────────────────────────────────────────────────────

  test('@smoke should display sort dropdown on inventory page', async ({ inventoryPage }) => {
    await expect(inventoryPage.sortDropdown).toBeVisible();
  });

  test('@smoke should default to Name (A to Z) sort when landing on inventory page', async ({ inventoryPage }) => {
    await expect(inventoryPage.activeOptionLabel).toHaveText('Name (A to Z)');
  });

  test('@regression should display all 4 sort options in the dropdown', async ({ inventoryPage }) => {
    const options = await inventoryPage.getSortOptions();
    expect(options).toEqual([
      'Name (A to Z)',
      'Name (Z to A)',
      'Price (low to high)',
      'Price (high to low)',
    ]);
  });

  // ── Active Sort Label ─────────────────────────────────────────────────────

  test('@regression should update active sort label when sorted by Name Z to A', async ({ inventoryPage }) => {
    await inventoryPage.sortBy('za');
    await expect(inventoryPage.activeOptionLabel).toHaveText('Name (Z to A)');
  });

  test('@regression should update active sort label when sorted by Price low to high', async ({ inventoryPage }) => {
    await inventoryPage.sortBy('lohi');
    await expect(inventoryPage.activeOptionLabel).toHaveText('Price (low to high)');
  });

  test('@regression should update active sort label when sorted by Price high to low', async ({ inventoryPage }) => {
    await inventoryPage.sortBy('hilo');
    await expect(inventoryPage.activeOptionLabel).toHaveText('Price (high to low)');
  });

  test('@regression should restore active sort label when switched back to Name A to Z', async ({ inventoryPage }) => {
    await inventoryPage.sortBy('hilo');
    await inventoryPage.sortBy('az');
    await expect(inventoryPage.activeOptionLabel).toHaveText('Name (A to Z)');
  });

  // ── Sort Order Correctness ────────────────────────────────────────────────

  test('@regression should sort product names in ascending order when Name A to Z selected', async ({ inventoryPage }) => {
    await inventoryPage.sortBy('az');
    const names = await inventoryPage.getItemNames();
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  test('@regression should sort product names in descending order when Name Z to A selected', async ({ inventoryPage }) => {
    await inventoryPage.sortBy('za');
    const names = await inventoryPage.getItemNames();
    expect(names).toEqual([...names].sort((a, b) => b.localeCompare(a)));
  });

  test('@regression should sort product prices from lowest to highest when Price low to high selected', async ({ inventoryPage }) => {
    await inventoryPage.sortBy('lohi');
    const prices = await inventoryPage.getItemPrices();
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  test('@regression should sort product prices from highest to lowest when Price high to low selected', async ({ inventoryPage }) => {
    await inventoryPage.sortBy('hilo');
    const prices = await inventoryPage.getItemPrices();
    expect(prices).toEqual([...prices].sort((a, b) => b - a));
  });

  // ── Sort Persistence ──────────────────────────────────────────────────────

  test('@regression should maintain sort order after adding item to cart', async ({ inventoryPage }) => {
    await inventoryPage.sortBy('za');
    await inventoryPage.addItemToCart('sauce-labs-backpack');
    const names = await inventoryPage.getItemNames();
    expect(names).toEqual([...names].sort((a, b) => b.localeCompare(a)));
    await expect(inventoryPage.activeOptionLabel).toHaveText('Name (Z to A)');
  });

});
