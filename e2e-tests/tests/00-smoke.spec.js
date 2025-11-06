/**
 * Smoke Test - Basic server connectivity
 * This test just verifies the server is running and responsive
 */

const { test, expect } = require('@playwright/test');

test.describe('Smoke Tests', () => {
  test('00.1 Server is running and responds to requests', async ({ page }) => {
    // Just try to load the homepage
    const response = await page.goto('/');

    // Check that we got a response (any 2xx or 3xx status is fine)
    expect(response.status()).toBeLessThan(500);
  });

  test('00.2 Login page is accessible', async ({ page }) => {
    await page.goto('/session/new');

    // Check that login page loaded
    await expect(page).toHaveTitle(/Campfire/i);

    // Check for email input
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });
});
