import { test, expect } from '../../../fixtures/base.fixture';
import users from '../../../data/test-data/users.json';

test.describe('Feature: Inventory / Products Page', () => {

  test.beforeEach(async ({ loginPage }) => {
    await loginPage.login(users.standard.username, users.standard.password);
  });

  // ── Positive Tests ────────────────────────────────────────────────────────

  test('@smoke should display all 6 products on inventory page', async ({ inventoryPage }) => {
    const count = await inventoryPage.getProductCount();
    expect(count).toBe(6);
  });

  test('@regression should display Products heading on inventory page', async ({ inventoryPage }) => {
    await expect(inventoryPage.heading).toBeVisible();
    await expect(inventoryPage.heading).toHaveText('Products');
  });

  test('@regression should display inventory list on inventory page', async ({ inventoryPage }) => {
    await expect(inventoryPage.inventoryList).toBeVisible();
  });

  test('@regression should display name, price and description for each product', async ({ page }) => {
    const items = page.locator('[data-test="inventory-item"]');
    const count = await items.count();

    for (let i = 0; i < count; i++) {
      const item = items.nth(i);
      await expect(item.locator('.inventory_item_name')).not.toBeEmpty();
      await expect(item.locator('[data-test="inventory-item-price"]')).not.toBeEmpty();
      await expect(item.locator('[data-test="inventory-item-desc"]')).not.toBeEmpty();
    }
  });

  test('@regression should display sort dropdown on inventory page', async ({ inventoryPage }) => {
    await expect(inventoryPage.sortDropdown).toBeVisible();
  });

  test('@regression should sort products by name A-Z', async ({ inventoryPage }) => {
    await inventoryPage.sortBy('az');
    const names = await inventoryPage.getItemNames();
    const sorted = [...names].sort((a, b) => a.localeCompare(b));
    expect(names).toEqual(sorted);
  });

  test('@regression should sort products by name Z-A', async ({ inventoryPage }) => {
    await inventoryPage.sortBy('za');
    const names = await inventoryPage.getItemNames();
    const sorted = [...names].sort((a, b) => b.localeCompare(a));
    expect(names).toEqual(sorted);
  });

  test('@regression should sort products by price low to high', async ({ inventoryPage }) => {
    await inventoryPage.sortBy('lohi');
    const prices = await inventoryPage.getItemPrices();
    const sorted = [...prices].sort((a, b) => a - b);
    expect(prices).toEqual(sorted);
  });

  test('@regression should sort products by price high to low', async ({ inventoryPage }) => {
    await inventoryPage.sortBy('hilo');
    const prices = await inventoryPage.getItemPrices();
    const sorted = [...prices].sort((a, b) => b - a);
    expect(prices).toEqual(sorted);
  });

  test('@regression should add single item to cart and show badge count of 1', async ({ inventoryPage }) => {
    await inventoryPage.addItemToCart('sauce-labs-backpack');

    await expect(inventoryPage.cartBadge).toBeVisible();
    await expect(inventoryPage.cartBadge).toHaveText('1');
  });

  test('@regression should add multiple items to cart and update badge count', async ({ inventoryPage }) => {
    await inventoryPage.addItemToCart('sauce-labs-backpack');
    await inventoryPage.addItemToCart('sauce-labs-bike-light');
    await inventoryPage.addItemToCart('sauce-labs-bolt-t-shirt');

    await expect(inventoryPage.cartBadge).toHaveText('3');
  });

  test('@regression should remove item from inventory page and decrement badge', async ({ inventoryPage }) => {
    await inventoryPage.addItemToCart('sauce-labs-backpack');
    await inventoryPage.addItemToCart('sauce-labs-bike-light');
    await expect(inventoryPage.cartBadge).toHaveText('2');

    await inventoryPage.removeItemFromCart('sauce-labs-backpack');

    await expect(inventoryPage.cartBadge).toHaveText('1');
  });

  test('@regression should hide cart badge when all items are removed from inventory', async ({ inventoryPage }) => {
    await inventoryPage.addItemToCart('sauce-labs-backpack');
    await inventoryPage.removeItemFromCart('sauce-labs-backpack');

    await expect(inventoryPage.cartBadge).not.toBeVisible();
  });

  test('@regression should show Remove button after adding item to cart', async ({ inventoryPage, page }) => {
    await inventoryPage.addItemToCart('sauce-labs-backpack');

    await expect(page.locator('[data-test="remove-sauce-labs-backpack"]')).toBeVisible();
  });

  test('@regression should navigate to product detail page when clicking product name', async ({ inventoryPage, productDetailPage }) => {
    await inventoryPage.navigateToProductDetail('Sauce Labs Backpack');

    await expect(productDetailPage.productName).toBeVisible();
    await expect(productDetailPage.productName).toHaveText('Sauce Labs Backpack');
  });

  test('@regression should navigate to cart page when clicking cart icon', async ({ inventoryPage, cartPage }) => {
    await inventoryPage.openCart();

    await expect(cartPage.cartList).toBeVisible();
  });

  // ── Negative Tests ────────────────────────────────────────────────────────

  test('@regression should not show cart badge when no items have been added', async ({ inventoryPage }) => {
    await expect(inventoryPage.cartBadge).not.toBeVisible();
  });

  test('@regression should not display add-to-cart button for already-added items', async ({ inventoryPage, page }) => {
    await inventoryPage.addItemToCart('sauce-labs-onesie');

    await expect(page.locator('[data-test="add-to-cart-sauce-labs-onesie"]')).not.toBeVisible();
    await expect(page.locator('[data-test="remove-sauce-labs-onesie"]')).toBeVisible();
  });

});
