import { test, expect } from '../../../fixtures/base.fixture';
import users from '../../../data/test-data/users.json';
import products from '../../../data/test-data/products.json';

test.describe('Feature: Product Detail Page', () => {

  test.beforeEach(async ({ loginPage }) => {
    await loginPage.login(users.standard.username, users.standard.password);
  });

  // ── Positive Tests ────────────────────────────────────────────────────────

  test('@smoke should display correct product name on detail page', async ({ inventoryPage, productDetailPage }) => {
    await inventoryPage.navigateToProductDetail(products.backpack.name);

    await expect(productDetailPage.productName).toBeVisible();
    await expect(productDetailPage.productName).toHaveText(products.backpack.name);
  });

  test('@regression should display product price on detail page', async ({ inventoryPage, productDetailPage }) => {
    await inventoryPage.navigateToProductDetail(products.backpack.name);

    await expect(productDetailPage.productPrice).toBeVisible();
    await expect(productDetailPage.productPrice).toHaveText(products.backpack.price);
  });

  test('@regression should display product description on detail page', async ({ inventoryPage, productDetailPage }) => {
    await inventoryPage.navigateToProductDetail(products.backpack.name);

    await expect(productDetailPage.productDescription).toBeVisible();
    await expect(productDetailPage.productDescription).not.toBeEmpty();
  });

  test('@regression should display Add to Cart button on detail page', async ({ inventoryPage, productDetailPage }) => {
    await inventoryPage.navigateToProductDetail(products.backpack.name);

    await expect(productDetailPage.addToCartButton).toBeVisible();
  });

  test('@regression should add product to cart from detail page and show cart badge', async ({
    inventoryPage,
    productDetailPage,
  }) => {
    await inventoryPage.navigateToProductDetail(products.backpack.name);
    await productDetailPage.addToCart();

    await expect(inventoryPage.cartBadge).toBeVisible();
    await expect(inventoryPage.cartBadge).toHaveText('1');
  });

  test('@regression should show Remove button after adding product to cart on detail page', async ({
    inventoryPage,
    productDetailPage,
  }) => {
    await inventoryPage.navigateToProductDetail(products.backpack.name);
    await productDetailPage.addToCart();

    await expect(productDetailPage.removeButton).toBeVisible();
    await expect(productDetailPage.addToCartButton).not.toBeVisible();
  });

  test('@regression should remove product from cart on detail page and restore Add to Cart button', async ({
    inventoryPage,
    productDetailPage,
  }) => {
    await inventoryPage.navigateToProductDetail(products.backpack.name);
    await productDetailPage.addToCart();
    await productDetailPage.removeFromCart();

    await expect(productDetailPage.addToCartButton).toBeVisible();
    await expect(productDetailPage.removeButton).not.toBeVisible();
  });

  test('@regression should remove product from cart badge when removed on detail page', async ({
    inventoryPage,
    productDetailPage,
  }) => {
    await inventoryPage.navigateToProductDetail(products.backpack.name);
    await productDetailPage.addToCart();
    await productDetailPage.removeFromCart();

    await expect(inventoryPage.cartBadge).not.toBeVisible();
  });

  test('@regression should navigate back to inventory page via Back to Products button', async ({
    inventoryPage,
    productDetailPage,
  }) => {
    await inventoryPage.navigateToProductDetail(products.backpack.name);
    await productDetailPage.goBack();

    await expect(inventoryPage.heading).toBeVisible();
    await expect(inventoryPage.heading).toHaveText('Products');
  });

  test('@regression should navigate to correct detail page for Bike Light product', async ({
    inventoryPage,
    productDetailPage,
  }) => {
    await inventoryPage.navigateToProductDetail(products.bikeLight.name);

    await expect(productDetailPage.productName).toHaveText(products.bikeLight.name);
    await expect(productDetailPage.productPrice).toHaveText(products.bikeLight.price);
  });

  test('@regression should navigate to correct detail page for Fleece Jacket product', async ({
    inventoryPage,
    productDetailPage,
  }) => {
    await inventoryPage.navigateToProductDetail(products.fleeceJacket.name);

    await expect(productDetailPage.productName).toHaveText(products.fleeceJacket.name);
    await expect(productDetailPage.productPrice).toHaveText(products.fleeceJacket.price);
  });

  // ── Negative Tests ────────────────────────────────────────────────────────

  test('@regression should not show Remove button before item is added to cart on detail page', async ({
    inventoryPage,
    productDetailPage,
  }) => {
    await inventoryPage.navigateToProductDetail(products.backpack.name);

    await expect(productDetailPage.addToCartButton).toBeVisible();
    await expect(productDetailPage.removeButton).not.toBeVisible();
  });

});
