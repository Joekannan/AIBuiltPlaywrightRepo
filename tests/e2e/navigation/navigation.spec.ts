import { test, expect } from '../../../fixtures/base.fixture';
import users from '../../../data/test-data/users.json';

test.describe('Feature: Navigation & Sidebar', () => {

  test.beforeEach(async ({ loginPage }) => {
    await loginPage.login(users.standard.username, users.standard.password);
  });

  // ── Positive Tests ────────────────────────────────────────────────────────

  test('@smoke should logout via sidebar and redirect to login page', async ({ sidebarPage, page }) => {
    await sidebarPage.logout();

    await expect(page).toHaveURL(/saucedemo\.com\/?$/);
    await expect(page.locator('[data-test="login-button"]')).toBeVisible();
  });

  test('@regression should open sidebar menu when hamburger button is clicked', async ({ sidebarPage }) => {
    await sidebarPage.openMenu();

    await expect(sidebarPage.allItemsLink).toBeVisible();
    await expect(sidebarPage.logoutLink).toBeVisible();
    await expect(sidebarPage.aboutLink).toBeVisible();
    await expect(sidebarPage.resetLink).toBeVisible();
  });

  test('@regression should navigate to inventory when All Items is clicked from sidebar', async ({
    inventoryPage,
    cartPage,
    sidebarPage,
  }) => {
    // Navigate to cart first, then use sidebar to go back to inventory
    await inventoryPage.openCart();
    await sidebarPage.goToAllItems();

    await expect(inventoryPage.heading).toBeVisible();
    await expect(inventoryPage.heading).toHaveText('Products');
  });

  test('@regression should clear cart badge after Reset App State is clicked', async ({
    inventoryPage,
    sidebarPage,
  }) => {
    await inventoryPage.addItemToCart('sauce-labs-backpack');
    await inventoryPage.addItemToCart('sauce-labs-bike-light');
    await expect(inventoryPage.cartBadge).toHaveText('2');

    await sidebarPage.resetAppState();

    await expect(inventoryPage.cartBadge).not.toBeVisible();
  });

  test('@regression should not be able to access inventory page after logout', async ({
    sidebarPage,
    page,
  }) => {
    await sidebarPage.logout();
    await page.goto('/inventory.html');

    await expect(page).toHaveURL(/saucedemo\.com\/?$/);
    await expect(page.locator('[data-test="login-button"]')).toBeVisible();
  });

  test('@regression should show inventory page after login when direct URL is accessed', async ({
    page,
  }) => {
    await expect(page).toHaveURL(/inventory\.html/);
  });

  // ── Negative Tests ────────────────────────────────────────────────────────

  test('@regression should redirect to login when unauthenticated user accesses inventory URL', async ({
    page,
  }) => {
    // Open a fresh context without login
    await page.context().clearCookies();
    await page.goto('/inventory.html');

    await expect(page.locator('[data-test="login-button"]')).toBeVisible();
  });

  test('@regression should redirect to login when unauthenticated user accesses cart URL', async ({
    page,
  }) => {
    await page.context().clearCookies();
    await page.goto('/cart.html');

    await expect(page.locator('[data-test="login-button"]')).toBeVisible();
  });

});
