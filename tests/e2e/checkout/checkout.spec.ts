import { test, expect } from '../../../fixtures/base.fixture';
import users from '../../../data/test-data/users.json';

const CUSTOMER = {
  firstName: 'John',
  lastName: 'Doe',
  postalCode: 'SW1A 1AA',
};

test.describe('Feature: Checkout', () => {

  test.beforeEach(async ({ loginPage }) => {
    await loginPage.login(users.standard.username, users.standard.password);
  });

  // ── Positive Tests ────────────────────────────────────────────────────────

  test('@smoke should complete full checkout flow successfully', async ({
    inventoryPage,
    cartPage,
    checkoutPage,
  }) => {
    await inventoryPage.addItemToCart('sauce-labs-backpack');
    await inventoryPage.openCart();

    await expect(cartPage.cartList).toBeVisible();
    await expect(cartPage.cartItems.first()).toBeVisible();

    await cartPage.proceedToCheckout();

    await checkoutPage.fillCustomerInfo(CUSTOMER.firstName, CUSTOMER.lastName, CUSTOMER.postalCode);
    await checkoutPage.continue();

    await expect(checkoutPage.summaryContainer).toBeVisible();
    await expect(checkoutPage.subtotalLabel).toBeVisible();
    await expect(checkoutPage.taxLabel).toBeVisible();
    await expect(checkoutPage.totalLabel).toBeVisible();

    await checkoutPage.finish();

    await expect(checkoutPage.completeHeader).toBeVisible();
    await expect(checkoutPage.completeHeader).toHaveText('Thank you for your order!');
    await expect(checkoutPage.completeText).toBeVisible();
    await expect(checkoutPage.backToProductsButton).toBeVisible();
  });

  test('@regression should complete checkout with multiple items', async ({
    inventoryPage,
    cartPage,
    checkoutPage,
  }) => {
    await inventoryPage.addItemToCart('sauce-labs-backpack');
    await inventoryPage.addItemToCart('sauce-labs-bike-light');
    await inventoryPage.addItemToCart('sauce-labs-onesie');
    await inventoryPage.openCart();

    const cartCount = await cartPage.getCartItemCount();
    expect(cartCount).toBe(3);

    await cartPage.proceedToCheckout();
    await checkoutPage.fillCustomerInfo(CUSTOMER.firstName, CUSTOMER.lastName, CUSTOMER.postalCode);
    await checkoutPage.continue();

    await expect(checkoutPage.summaryContainer).toBeVisible();
    await checkoutPage.finish();

    await expect(checkoutPage.completeHeader).toHaveText('Thank you for your order!');
  });

  test('@regression should display correct subtotal for single item at checkout step two', async ({
    inventoryPage,
    cartPage,
    checkoutPage,
  }) => {
    // Backpack is $29.99
    await inventoryPage.addItemToCart('sauce-labs-backpack');
    await inventoryPage.openCart();
    await cartPage.proceedToCheckout();
    await checkoutPage.fillCustomerInfo(CUSTOMER.firstName, CUSTOMER.lastName, CUSTOMER.postalCode);
    await checkoutPage.continue();

    await expect(checkoutPage.subtotalLabel).toContainText('29.99');
  });

  test('@regression should display tax label at checkout step two', async ({
    inventoryPage,
    cartPage,
    checkoutPage,
  }) => {
    await inventoryPage.addItemToCart('sauce-labs-backpack');
    await inventoryPage.openCart();
    await cartPage.proceedToCheckout();
    await checkoutPage.fillCustomerInfo(CUSTOMER.firstName, CUSTOMER.lastName, CUSTOMER.postalCode);
    await checkoutPage.continue();

    await expect(checkoutPage.taxLabel).toBeVisible();
    await expect(checkoutPage.taxLabel).toContainText('Tax:');
  });

  test('@regression should display total label at checkout step two', async ({
    inventoryPage,
    cartPage,
    checkoutPage,
  }) => {
    await inventoryPage.addItemToCart('sauce-labs-backpack');
    await inventoryPage.openCart();
    await cartPage.proceedToCheckout();
    await checkoutPage.fillCustomerInfo(CUSTOMER.firstName, CUSTOMER.lastName, CUSTOMER.postalCode);
    await checkoutPage.continue();

    await expect(checkoutPage.totalLabel).toBeVisible();
    await expect(checkoutPage.totalLabel).toContainText('Total:');
  });

  test('@regression should return to inventory after completing order via back-to-products button', async ({
    inventoryPage,
    cartPage,
    checkoutPage,
  }) => {
    await inventoryPage.addItemToCart('sauce-labs-bike-light');
    await inventoryPage.openCart();
    await cartPage.proceedToCheckout();

    await checkoutPage.fillCustomerInfo(CUSTOMER.firstName, CUSTOMER.lastName, CUSTOMER.postalCode);
    await checkoutPage.continue();
    await checkoutPage.finish();

    await expect(checkoutPage.completeHeader).toHaveText('Thank you for your order!');

    await checkoutPage.backToProductsButton.click();

    await expect(inventoryPage.heading).toHaveText('Products');
  });

  test('@regression should navigate back to cart when cancel is clicked on checkout step two', async ({
    inventoryPage,
    cartPage,
    checkoutPage,
    page,
  }) => {
    await inventoryPage.addItemToCart('sauce-labs-backpack');
    await inventoryPage.openCart();
    await cartPage.proceedToCheckout();
    await checkoutPage.fillCustomerInfo(CUSTOMER.firstName, CUSTOMER.lastName, CUSTOMER.postalCode);
    await checkoutPage.continue();

    await checkoutPage.cancel();

    await expect(page).toHaveURL(/inventory\.html/);
  });

  // ── Negative Tests ────────────────────────────────────────────────────────

  test('@regression should show error when first name is missing at checkout step one', async ({
    inventoryPage,
    cartPage,
    checkoutPage,
  }) => {
    await inventoryPage.addItemToCart('sauce-labs-backpack');
    await inventoryPage.openCart();
    await cartPage.proceedToCheckout();

    await checkoutPage.fillCustomerInfo('', CUSTOMER.lastName, CUSTOMER.postalCode);
    await checkoutPage.continue();

    await expect(checkoutPage.errorMessage).toBeVisible();
    await expect(checkoutPage.errorMessage).toContainText('First Name is required');
  });

  test('@regression should show error when last name is missing at checkout step one', async ({
    inventoryPage,
    cartPage,
    checkoutPage,
  }) => {
    await inventoryPage.addItemToCart('sauce-labs-backpack');
    await inventoryPage.openCart();
    await cartPage.proceedToCheckout();

    await checkoutPage.fillCustomerInfo(CUSTOMER.firstName, '', CUSTOMER.postalCode);
    await checkoutPage.continue();

    await expect(checkoutPage.errorMessage).toBeVisible();
    await expect(checkoutPage.errorMessage).toContainText('Last Name is required');
  });

  test('@regression should show error when postal code is missing at checkout step one', async ({
    inventoryPage,
    cartPage,
    checkoutPage,
  }) => {
    await inventoryPage.addItemToCart('sauce-labs-backpack');
    await inventoryPage.openCart();
    await cartPage.proceedToCheckout();

    await checkoutPage.fillCustomerInfo(CUSTOMER.firstName, CUSTOMER.lastName, '');
    await checkoutPage.continue();

    await expect(checkoutPage.errorMessage).toBeVisible();
    await expect(checkoutPage.errorMessage).toContainText('Postal Code is required');
  });

  test('@regression should show error when all checkout fields are empty', async ({
    inventoryPage,
    cartPage,
    checkoutPage,
  }) => {
    await inventoryPage.addItemToCart('sauce-labs-backpack');
    await inventoryPage.openCart();
    await cartPage.proceedToCheckout();

    await checkoutPage.fillCustomerInfo('', '', '');
    await checkoutPage.continue();

    await expect(checkoutPage.errorMessage).toBeVisible();
    await expect(checkoutPage.errorMessage).toContainText('First Name is required');
  });

  test('@regression should navigate back to cart when cancel is clicked on checkout step one', async ({
    inventoryPage,
    cartPage,
    checkoutPage,
  }) => {
    await inventoryPage.addItemToCart('sauce-labs-backpack');
    await inventoryPage.openCart();
    await cartPage.proceedToCheckout();

    await checkoutPage.cancel();

    await expect(cartPage.cartList).toBeVisible();
  });

});
