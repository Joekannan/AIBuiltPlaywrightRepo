import { Page, Response } from '@playwright/test';

/**
 * Clears localStorage and sessionStorage for the current page origin.
 */
export async function clearBrowserStorage(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Waits for a network response matching the given URL pattern.
 * Returns the matched Response object.
 */
export async function waitForApiResponse(
  page: Page,
  urlPattern: string | RegExp,
): Promise<Response> {
  return page.waitForResponse(urlPattern);
}

/**
 * Scrolls the page to the bottom — useful for lazy-loaded content.
 */
export async function scrollToBottom(page: Page): Promise<void> {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
}
