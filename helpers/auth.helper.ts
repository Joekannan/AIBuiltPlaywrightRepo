import { Page } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { ENV } from '../utils/env.utils';

/**
 * Logs in as the standard demo user.
 * Use this in beforeEach for tests that require an authenticated session.
 */
export async function loginAsStandardUser(page: Page): Promise<void> {
  const loginPage = new LoginPage(page);
  await loginPage.login(ENV.STANDARD_USER, ENV.STANDARD_PASSWORD);
}
