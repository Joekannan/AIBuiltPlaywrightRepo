import { test, expect } from '../../../fixtures/base.fixture';
import users from '../../../data/test-data/users.json';

test.describe('Feature: Shopping Cart', () => {

  test.beforeEach(async ({ loginPage }) => {
    await loginPage.login(users.standard.username, users.standard.password);
  });

  // ── Positive Tests ────────────────────────────────────────────────────────

  test('@smoke should display added item in cart', async ({ inventoryPage, cartPage }) => {
    await inventoryPage.addItemToCart('sauce-labs-backpack');
    await inventoryPage.openCart();

    await expect(cartPage.cartList).toBeVisible();
    const count = await cartPage.getCartItemCount();
    expect(count).toBe(1);
  });

  test('@regression should display correct item name in cart', async ({ inventoryPage, cartPage }) => {
    await inventoryPage.addItemToCart('sauce-labs-backpack');
    await inventoryPage.openCart();

    const titles = await cartPage.getItemTitles();
    expect(titles).toContain('Sauce Labs Backpack');
  });

  test('@regression should display multiple items in cart', async ({ inventoryPage, cartPage }) => {
    await inventoryPage.addItemToCart('sauce-labs-backpack');
    await inventoryPage.addItemToCart('sauce-labs-bike-light');
    await inventoryPage.openCart();

    const count = await cartPage.getCartItemCount();
    expect(count).toBe(2);
  });

  test('@regression should match cart item count with inventory badge count', async ({ inventoryPage, cartPage }) => {
    await inventoryPage.addItemToCart('sauce-labs-backpack');
    await inventoryPage.addItemToCart('sauce-labs-fleece-jacket');
    await inventoryPage.openCart();

    const cartCount = await cartPage.getCartItemCount();
    expect(cartCount).toBe(2);
  });

  test('@regression should remove item from cart and update item list', async ({ inventoryPage, cartPage }) => {
    await inventoryPage.addItemToCart('sauce-labs-backpack');
    await inventoryPage.openCart();

    await cartPage.removeItem('sauce-labs-backpack');

    const count = await cartPage.getCartItemCount();
    expect(count).toBe(0);
  });

  test('@regression should remove badge after removing last item from cart', async ({ inventoryPage, cartPage }) => {
    await inventoryPage.addItemToCart('sauce-labs-backpack');
    await inventoryPage.openCart();
    await cartPage.removeItem('sauce-labs-backpack');

    await expect(inventoryPage.cartBadge).not.toBeVisible();
  });

  test('@regression should navigate back to inventory when Continue Shopping is clicked', async ({ inventoryPage, cartPage }) => {
    await inventoryPage.openCart();
    await cartPage.continueShopping();

    await expect(inventoryPage.heading).toBeVisible();
    await expect(inventoryPage.heading).toHaveText('Products');
  });

  test('@regression should navigate to checkout step one when Checkout is clicked', async ({ inventoryPage, cartPage, page }) => {
    await inventoryPage.addItemToCart('sauce-labs-backpack');
    await inventoryPage.openCart();
    await cartPage.proceedToCheckout();

    await expect(page).toHaveURL(/checkout-step-one/);
  });

  test('@regression should persist cart items after navigating back to inventory', async ({ inventoryPage, cartPage }) => {
    await inventoryPage.addItemToCart('sauce-labs-backpack');
    await inventoryPage.openCart();
    await cartPage.continueShopping();
    await inventoryPage.openCart();

    const count = await cartPage.getCartItemCount();
    expect(count).toBe(1);
  });

  // ── Negative Tests ────────────────────────────────────────────────────────

  test('@regression should show empty cart list when no items have been added', async ({ inventoryPage, cartPage }) => {
    await inventoryPage.openCart();

    await expect(cartPage.cartList).toBeVisible();
    const count = await cartPage.getCartItemCount();
    expect(count).toBe(0);
  });

  test('@regression should not show checkout button as disabled when cart has items', async ({ inventoryPage, cartPage }) => {
    await inventoryPage.addItemToCart('sauce-labs-backpack');
    await inventoryPage.openCart();

    await expect(cartPage.checkoutButton).toBeEnabled();
  });

});
