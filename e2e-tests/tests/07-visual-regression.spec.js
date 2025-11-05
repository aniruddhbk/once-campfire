/**
 * Visual Regression Testing Suite
 *
 * This test suite validates UI consistency by comparing screenshots against baselines.
 * Uses Playwright's built-in visual comparison features.
 *
 * Tests cover:
 * - Login page appearance
 * - Main application layout
 * - Room list rendering
 * - Message display
 * - Composer styling
 * - Modal dialogs
 * - Mobile responsiveness
 */

const { test, expect } = require('@playwright/test');
const CampfireDSL = require('../helpers/campfire-dsl');
const testData = require('../fixtures/test-data');
const { randomRoomName } = require('../helpers/test-setup');

test.describe('Visual Regression Testing', () => {
  test('7.1 Login page visual consistency', async ({ page }) => {
    /**
     * Test Case: Validate login page appearance
     */

    const campfire = new CampfireDSL(page);
    await campfire.goto('/session/new');

    // Wait for page to stabilize
    await campfire.waitForElement('input[type="email"]');

    // Take screenshot and compare with baseline
    await expect(page).toHaveScreenshot('login-page.png', {
      fullPage: true,
      maxDiffPixels: 100, // Allow small differences
    });

    campfire.log('✓ Test 7.1 passed: Login page visual check');
  });

  test('7.2 Main application layout visual consistency', async ({ page }) => {
    /**
     * Test Case: Validate main app layout
     */

    const campfire = new CampfireDSL(page);
    await campfire.goto('/session/new');
    await campfire.login(
      testData.users.testUser.email,
      testData.users.testUser.password
    );

    // Wait for sidebar to load
    await campfire.waitForElement('.sidebar__container');

    // Take screenshot
    await expect(page).toHaveScreenshot('main-layout.png', {
      fullPage: true,
      maxDiffPixels: 150,
    });

    campfire.log('✓ Test 7.2 passed: Main layout visual check');
  });

  test('7.3 Message display visual consistency', async ({ page }) => {
    /**
     * Test Case: Validate message rendering
     */

    const campfire = new CampfireDSL(page);
    await campfire.goto('/session/new');
    await campfire.login(
      testData.users.testUser.email,
      testData.users.testUser.password
    );

    const roomName = randomRoomName();
    await campfire.createRoom(roomName);

    // Send a few messages with different formatting
    await campfire.sendMessage('Regular message');
    await campfire.sendMessage('**Bold message**');
    await campfire.sendMessage('_Italic message_');
    await campfire.sendMessage('Message with emoji 🎉');

    // Take screenshot of message list
    const messagesArea = page.locator('.messages, #messages');
    await expect(messagesArea).toHaveScreenshot('messages-display.png', {
      maxDiffPixels: 100,
    });

    campfire.log('✓ Test 7.3 passed: Message display visual check');
  });

  test('7.4 Composer visual consistency', async ({ page }) => {
    /**
     * Test Case: Validate composer appearance
     */

    const campfire = new CampfireDSL(page);
    await campfire.goto('/session/new');
    await campfire.login(
      testData.users.testUser.email,
      testData.users.testUser.password
    );

    const roomName = randomRoomName();
    await campfire.createRoom(roomName);

    // Focus on composer
    await campfire.page.click('trix-editor');

    // Take screenshot of composer
    const composer = page.locator('.composer');
    await expect(composer).toHaveScreenshot('composer.png', {
      maxDiffPixels: 50,
    });

    campfire.log('✓ Test 7.4 passed: Composer visual check');
  });

  test('7.5 Mobile viewport visual consistency', async ({ page }) => {
    /**
     * Test Case: Validate mobile responsiveness
     */

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    const campfire = new CampfireDSL(page);
    await campfire.goto('/session/new');
    await campfire.login(
      testData.users.testUser.email,
      testData.users.testUser.password
    );

    // Wait for layout
    await campfire.waitForElement('.sidebar__container');

    // Take screenshot
    await expect(page).toHaveScreenshot('mobile-layout.png', {
      fullPage: true,
      maxDiffPixels: 150,
    });

    campfire.log('✓ Test 7.5 passed: Mobile visual check');
  });

  test('7.6 Room creation dialog visual consistency', async ({ page }) => {
    /**
     * Test Case: Validate room creation UI
     */

    const campfire = new CampfireDSL(page);
    await campfire.goto('/session/new');
    await campfire.login(
      testData.users.testUser.email,
      testData.users.testUser.password
    );

    // Open room creation
    await campfire.page.click('a.rooms__new-btn');
    await campfire.waitForTurboLoad();

    // Take screenshot
    await expect(page).toHaveScreenshot('room-creation.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });

    campfire.log('✓ Test 7.6 passed: Room creation visual check');
  });

  test('7.7 Dark mode visual consistency (if supported)', async ({ page }) => {
    /**
     * Test Case: Validate dark mode appearance
     */

    const campfire = new CampfireDSL(page);
    await campfire.goto('/session/new');
    await campfire.login(
      testData.users.testUser.email,
      testData.users.testUser.password
    );

    // Try to enable dark mode (implementation-dependent)
    const darkModeToggle = page.locator('[data-theme="dark"], .dark-mode-toggle');
    const exists = await darkModeToggle.count() > 0;

    if (exists) {
      await darkModeToggle.click();
      await campfire.wait(1000);

      await expect(page).toHaveScreenshot('dark-mode.png', {
        fullPage: true,
        maxDiffPixels: 200,
      });

      campfire.log('✓ Test 7.7 passed: Dark mode visual check');
    } else {
      campfire.log('⚠ Test 7.7 skipped: Dark mode not available');
    }
  });
});
