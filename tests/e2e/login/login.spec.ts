import { test, expect } from '../../../fixtures/base.fixture';
import users from '../../../data/test-data/users.json';

test.describe('Feature: Login', () => {

  test.beforeEach(async ({ loginPage }) => {
    await loginPage.navigate();
  });

  // ── Positive Tests ────────────────────────────────────────────────────────

  test('@smoke should login successfully with valid standard user credentials', async ({ loginPage, inventoryPage }) => {
    await loginPage.fillCredentials(users.standard.username, users.standard.password);
    await loginPage.submit();

    await expect(inventoryPage.heading).toBeVisible();
    await expect(inventoryPage.heading).toHaveText('Products');
  });

  test('@regression should redirect to inventory URL after successful login', async ({ loginPage, page }) => {
    await loginPage.fillCredentials(users.standard.username, users.standard.password);
    await loginPage.submit();

    await expect(page).toHaveURL(/inventory\.html/);
  });

  test('@regression should login successfully with problem_user credentials', async ({ loginPage, inventoryPage }) => {
    await loginPage.fillCredentials(users.problem.username, users.problem.password);
    await loginPage.submit();

    await expect(inventoryPage.heading).toBeVisible();
    await expect(inventoryPage.heading).toHaveText('Products');
  });

  test('@regression should login successfully with performance_glitch_user credentials', async ({ loginPage, inventoryPage }) => {
    await loginPage.fillCredentials(users.performance.username, users.performance.password);
    await loginPage.submit();

    await expect(inventoryPage.heading).toBeVisible();
    await expect(inventoryPage.heading).toHaveText('Products');
  });

  test('@regression should display login page elements correctly', async ({ page }) => {
    await expect(page.locator('[data-test="username"]')).toBeVisible();
    await expect(page.locator('[data-test="password"]')).toBeVisible();
    await expect(page.locator('[data-test="login-button"]')).toBeVisible();
    await expect(page.locator('.login_logo')).toBeVisible();
  });

  // ── Negative Tests ────────────────────────────────────────────────────────

  test('@regression should show error message when password is incorrect', async ({ loginPage }) => {
    await loginPage.fillCredentials(users.standard.username, 'wrong_password');
    await loginPage.submit();

    await expect(loginPage.errorMessage).toBeVisible();
    await expect(loginPage.errorMessage).toContainText('Username and password do not match');
  });

  test('@regression should show error message when username is invalid', async ({ loginPage }) => {
    await loginPage.fillCredentials(users.invalid.username, users.invalid.password);
    await loginPage.submit();

    await expect(loginPage.errorMessage).toBeVisible();
    await expect(loginPage.errorMessage).toContainText('Username and password do not match');
  });

  test('@regression should show error message when locked out user attempts login', async ({ loginPage }) => {
    await loginPage.fillCredentials(users.locked.username, users.locked.password);
    await loginPage.submit();

    await expect(loginPage.errorMessage).toBeVisible();
    await expect(loginPage.errorMessage).toContainText('locked out');
  });

  test('@regression should show error message when username is empty', async ({ loginPage }) => {
    await loginPage.fillCredentials('', users.standard.password);
    await loginPage.submit();

    await expect(loginPage.errorMessage).toBeVisible();
    await expect(loginPage.errorMessage).toContainText('Username is required');
  });

  test('@regression should show error message when password is empty', async ({ loginPage }) => {
    await loginPage.fillCredentials(users.standard.username, '');
    await loginPage.submit();

    await expect(loginPage.errorMessage).toBeVisible();
    await expect(loginPage.errorMessage).toContainText('Password is required');
  });

  test('@regression should show error message when both username and password are empty', async ({ loginPage }) => {
    await loginPage.fillCredentials('', '');
    await loginPage.submit();

    await expect(loginPage.errorMessage).toBeVisible();
    await expect(loginPage.errorMessage).toContainText('Username is required');
  });

  test('@regression should remain on login page after failed login attempt', async ({ loginPage, page }) => {
    await loginPage.fillCredentials(users.invalid.username, users.invalid.password);
    await loginPage.submit();

    await expect(page).toHaveURL(/saucedemo\.com\/?$/);
    await expect(page.locator('[data-test="login-button"]')).toBeVisible();
  });

  test('@regression should dismiss error message when close button is clicked', async ({ loginPage }) => {
    await loginPage.fillCredentials('', '');
    await loginPage.submit();

    await expect(loginPage.errorMessage).toBeVisible();

    await loginPage.errorMessage.locator('[data-test="error-button"]').click();

    await expect(loginPage.errorMessage).not.toBeVisible();
  });

});
