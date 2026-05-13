import { test, expect } from '@playwright/test';
import { ENV } from '../../utils/env.utils';

/**
 * Placeholder API tests for SauceDemo.
 * SauceDemo does not expose a public REST API, so these tests serve as
 * structural examples. Replace with real API endpoints when available.
 */
test.describe('API: Auth (Placeholder)', () => {

  test('@api should reach the application base URL', async ({ request }) => {
    const response = await request.get(ENV.BASE_URL);

    expect(response.status()).toBe(200);
    expect(response.ok()).toBeTruthy();
  });

});
