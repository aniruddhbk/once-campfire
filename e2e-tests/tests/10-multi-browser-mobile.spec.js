/**
 * MULTI-BROWSER AND MOBILE DEVICE TESTING
 *
 * Tests application across multiple browsers and mobile devices.
 * Ensures consistent behavior and responsive design.
 *
 * Browsers tested:
 * - Chromium (Desktop Chrome)
 * - Firefox
 * - WebKit (Safari)
 *
 * Mobile devices tested:
 * - iPhone 13
 * - iPad Pro
 * - Samsung Galaxy
 * - Pixel 5
 */

const { test, expect, devices } = require('@playwright/test');
const CampfireDSL = require('../helpers/campfire-dsl');
const testData = require('../fixtures/test-data');
const { randomRoomName } = require('../helpers/test-setup');

// Device configurations
const MOBILE_DEVICES = {
  iphone: devices['iPhone 13'],
  ipad: devices['iPad Pro'],
  galaxy: devices['Galaxy S9+'],
  pixel: devices['Pixel 5']
};

test.describe('Multi-Browser Testing', () => {
  // Test on Chromium
  test.describe('Chromium Browser', () => {
    test.use({ ...devices['Desktop Chrome'] });

    test('10.1 Core flows work on Chromium', async ({ page }) => {
      const campfire = new CampfireDSL(page);

      await campfire.goto('/session/new');
      await campfire.login(
        testData.users.testUser.email,
        testData.users.testUser.password
      );

      const roomName = randomRoomName();
      await campfire.createRoom(roomName);
      await campfire.sendMessage('Testing on Chromium');
      await campfire.verifyMessageExists('Testing on Chromium');

      campfire.log('✓ Test 10.1 passed: Core flows work on Chromium');
    });
  });

  // Test on Firefox
  test.describe('Firefox Browser', () => {
    test.use({ ...devices['Desktop Firefox'] });

    test('10.2 Core flows work on Firefox', async ({ page }) => {
      const campfire = new CampfireDSL(page);

      await campfire.goto('/session/new');
      await campfire.login(
        testData.users.testUser.email,
        testData.users.testUser.password
      );

      const roomName = randomRoomName();
      await campfire.createRoom(roomName);
      await campfire.sendMessage('Testing on Firefox');
      await campfire.verifyMessageExists('Testing on Firefox');

      campfire.log('✓ Test 10.2 passed: Core flows work on Firefox');
    });
  });

  // Test on WebKit (Safari)
  test.describe('WebKit Browser', () => {
    test.use({ ...devices['Desktop Safari'] });

    test('10.3 Core flows work on WebKit/Safari', async ({ page }) => {
      const campfire = new CampfireDSL(page);

      await campfire.goto('/session/new');
      await campfire.login(
        testData.users.testUser.email,
        testData.users.testUser.password
      );

      const roomName = randomRoomName();
      await campfire.createRoom(roomName);
      await campfire.sendMessage('Testing on Safari');
      await campfire.verifyMessageExists('Testing on Safari');

      campfire.log('✓ Test 10.3 passed: Core flows work on WebKit/Safari');
    });
  });
});

test.describe('Mobile Device Testing', () => {
  // iPhone 13
  test.describe('iPhone 13', () => {
    test.use(MOBILE_DEVICES.iphone);

    test('10.4 Mobile UI works on iPhone 13', async ({ page }) => {
      const campfire = new CampfireDSL(page);

      await campfire.goto('/session/new');
      await campfire.login(
        testData.users.testUser.email,
        testData.users.testUser.password
      );

      // Verify mobile layout
      const viewport = page.viewportSize();
      expect(viewport.width).toBe(390); // iPhone 13 width

      // Test mobile-specific features
      const roomName = randomRoomName();
      await campfire.createRoom(roomName);
      await campfire.sendMessage('Testing on iPhone 13');
      await campfire.verifyMessageExists('Testing on iPhone 13');

      campfire.log('✓ Test 10.4 passed: Mobile UI works on iPhone 13');
    });
  });

  // iPad Pro
  test.describe('iPad Pro', () => {
    test.use(MOBILE_DEVICES.ipad);

    test('10.5 Tablet UI works on iPad Pro', async ({ page }) => {
      const campfire = new CampfireDSL(page);

      await campfire.goto('/session/new');
      await campfire.login(
        testData.users.testUser.email,
        testData.users.testUser.password
      );

      // Verify tablet layout
      const viewport = page.viewportSize();
      expect(viewport.width).toBe(1024); // iPad Pro width

      const roomName = randomRoomName();
      await campfire.createRoom(roomName);
      await campfire.sendMessage('Testing on iPad Pro');
      await campfire.verifyMessageExists('Testing on iPad Pro');

      campfire.log('✓ Test 10.5 passed: Tablet UI works on iPad Pro');
    });
  });

  // Samsung Galaxy
  test.describe('Samsung Galaxy', () => {
    test.use(MOBILE_DEVICES.galaxy);

    test('10.6 Android UI works on Galaxy', async ({ page }) => {
      const campfire = new CampfireDSL(page);

      await campfire.goto('/session/new');
      await campfire.login(
        testData.users.testUser.email,
        testData.users.testUser.password
      );

      const roomName = randomRoomName();
      await campfire.createRoom(roomName);
      await campfire.sendMessage('Testing on Galaxy');
      await campfire.verifyMessageExists('Testing on Galaxy');

      campfire.log('✓ Test 10.6 passed: Android UI works on Galaxy');
    });
  });

  // Google Pixel
  test.describe('Google Pixel 5', () => {
    test.use(MOBILE_DEVICES.pixel);

    test('10.7 Mobile UI works on Pixel 5', async ({ page }) => {
      const campfire = new CampfireDSL(page);

      await campfire.goto('/session/new');
      await campfire.login(
        testData.users.testUser.email,
        testData.users.testUser.password
      );

      const roomName = randomRoomName();
      await campfire.createRoom(roomName);
      await campfire.sendMessage('Testing on Pixel 5');
      await campfire.verifyMessageExists('Testing on Pixel 5');

      campfire.log('✓ Test 10.7 passed: Mobile UI works on Pixel 5');
    });
  });
});

test.describe('Responsive Design Validation', () => {
  test('10.8 Layout adapts to different screen sizes', async ({ page }) => {
    const campfire = new CampfireDSL(page);

    await campfire.goto('/session/new');
    await campfire.login(
      testData.users.testUser.email,
      testData.users.testUser.password
    );

    const viewports = [
      { width: 375, height: 667, name: 'iPhone SE' },
      { width: 768, height: 1024, name: 'iPad' },
      { width: 1024, height: 768, name: 'iPad Landscape' },
      { width: 1280, height: 720, name: 'Laptop' },
      { width: 1920, height: 1080, name: 'Desktop' }
    ];

    for (const viewport of viewports) {
      campfire.log(`Testing viewport: ${viewport.name} (${viewport.width}x${viewport.height})`);

      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await campfire.wait(500); // Wait for reflow

      // Verify key elements are visible
      const sidebarVisible = await campfire.elementExists('.sidebar__container');
      const composerVisible = await campfire.elementExists('trix-editor');

      campfire.log(`  Sidebar: ${sidebarVisible}, Composer: ${composerVisible}`);

      // At minimum, composer should always be visible
      expect(composerVisible).toBe(true);
    }

    campfire.log('✓ Test 10.8 passed: Layout adapts to all screen sizes');
  });

  test('10.9 Touch interactions work on mobile', async ({ page, context }) => {
    // Emulate touch device
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'maxTouchPoints', {
        get: () => 5
      });
    });

    const campfire = new CampfireDSL(page);

    await page.setViewportSize({ width: 375, height: 667 });

    await campfire.goto('/session/new');
    await campfire.login(
      testData.users.testUser.email,
      testData.users.testUser.password
    );

    // Test touch interaction (tap)
    const roomName = randomRoomName();
    await campfire.createRoom(roomName);

    // Tap on composer
    const composer = await page.locator('trix-editor');
    await composer.tap();

    // Type message
    await campfire.sendMessage('Touch interaction test');
    await campfire.verifyMessageExists('Touch interaction test');

    campfire.log('✓ Test 10.9 passed: Touch interactions work correctly');
  });

  test('10.10 Orientation change handling', async ({ page }) => {
    const campfire = new CampfireDSL(page);

    await campfire.goto('/session/new');
    await campfire.login(
      testData.users.testUser.email,
      testData.users.testUser.password
    );

    // Portrait orientation
    campfire.log('Testing portrait orientation');
    await page.setViewportSize({ width: 375, height: 667 });
    await campfire.wait(500);

    const roomName = randomRoomName();
    await campfire.createRoom(roomName);

    // Landscape orientation
    campfire.log('Testing landscape orientation');
    await page.setViewportSize({ width: 667, height: 375 });
    await campfire.wait(500);

    // Verify app still works
    await campfire.sendMessage('Orientation test');
    await campfire.verifyMessageExists('Orientation test');

    campfire.log('✓ Test 10.10 passed: Orientation change handled correctly');
  });
});

test.describe('Cross-Browser Feature Parity', () => {
  const browsers = ['chromium', 'firefox', 'webkit'];

  browsers.forEach(browserName => {
    test(`10.11 ${browserName} - Feature parity check`, async ({ page, browserName: currentBrowser }) => {
      // Skip if not the right browser
      if (currentBrowser !== browserName) {
        test.skip();
      }

      const campfire = new CampfireDSL(page);

      await campfire.goto('/session/new');
      await campfire.login(
        testData.users.testUser.email,
        testData.users.testUser.password
      );

      // Check feature availability
      const features = {
        localStorage: await page.evaluate(() => 'localStorage' in window),
        sessionStorage: await page.evaluate(() => 'sessionStorage' in window),
        webSocket: await page.evaluate(() => 'WebSocket' in window),
        serviceWorker: await page.evaluate(() => 'serviceWorker' in navigator),
        indexedDB: await page.evaluate(() => 'indexedDB' in window),
        pushAPI: await page.evaluate(() => 'PushManager' in window),
        notifications: await page.evaluate(() => 'Notification' in window)
      };

      campfire.log(`\n${browserName} Feature Support:`);
      Object.entries(features).forEach(([feature, supported]) => {
        campfire.log(`  ${feature}: ${supported ? '✓' : '✗'}`);
      });

      // Essential features should be available
      expect(features.localStorage).toBe(true);
      expect(features.webSocket).toBe(true);

      campfire.log(`✓ Test 10.11 passed: ${browserName} feature parity verified`);
    });
  });
});
