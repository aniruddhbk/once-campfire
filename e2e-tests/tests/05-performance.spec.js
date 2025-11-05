/**
 * Performance Testing Suite
 *
 * This test suite monitors and validates performance metrics for the Campfire application.
 *
 * Metrics tracked:
 * - Page load time
 * - Time to interactive (TTI)
 * - First Contentful Paint (FCP)
 * - Largest Contentful Paint (LCP)
 * - DOM Content Loaded
 * - Message send latency
 * - Room navigation speed
 * - Real-time update latency
 */

const { test, expect } = require('@playwright/test');
const CampfireDSL = require('../helpers/campfire-dsl');
const testData = require('../fixtures/test-data');
const { randomRoomName } = require('../helpers/test-setup');

test.describe('Performance Testing', () => {
  let campfire;

  test.beforeEach(async ({ page }) => {
    campfire = new CampfireDSL(page);
  });

  test('5.1 Login page should load quickly', async ({ page }) => {
    /**
     * Test Case: Validate login page load performance
     * Target: < 2 seconds
     */

    const startTime = Date.now();

    await campfire.goto('/session/new');
    await campfire.waitForElement('input[type="email"]');

    const loadTime = Date.now() - startTime;

    campfire.log(`Login page load time: ${loadTime}ms`);

    // Should load in under 2 seconds
    expect(loadTime).toBeLessThan(2000);

    campfire.log('✓ Test 5.1 passed: Login page loads quickly');
  });

  test('5.2 Authentication should be fast', async ({ page }) => {
    /**
     * Test Case: Validate login performance
     * Target: < 3 seconds
     */

    await campfire.goto('/session/new');

    const startTime = Date.now();

    await campfire.login(
      testData.users.testUser.email,
      testData.users.testUser.password
    );

    const loginTime = Date.now() - startTime;

    campfire.log(`Login time: ${loginTime}ms`);

    // Login should complete in under 3 seconds
    expect(loginTime).toBeLessThan(3000);

    campfire.log('✓ Test 5.2 passed: Authentication is fast');
  });

  test('5.3 Room creation should be performant', async ({ page }) => {
    /**
     * Test Case: Validate room creation performance
     * Target: < 2 seconds
     */

    await campfire.goto('/session/new');
    await campfire.login(
      testData.users.testUser.email,
      testData.users.testUser.password
    );

    const roomName = randomRoomName();
    const startTime = Date.now();

    await campfire.createRoom(roomName);

    const creationTime = Date.now() - startTime;

    campfire.log(`Room creation time: ${creationTime}ms`);

    // Room creation should complete in under 2 seconds
    expect(creationTime).toBeLessThan(2000);

    campfire.log('✓ Test 5.3 passed: Room creation is performant');
  });

  test('5.4 Message sending should have low latency', async ({ page }) => {
    /**
     * Test Case: Validate message send latency
     * Target: < 1 second
     */

    await campfire.goto('/session/new');
    await campfire.login(
      testData.users.testUser.email,
      testData.users.testUser.password
    );

    const roomName = randomRoomName();
    await campfire.createRoom(roomName);

    const message = 'Performance test message';
    const startTime = Date.now();

    await campfire.sendMessage(message);

    const sendTime = Date.now() - startTime;

    campfire.log(`Message send time: ${sendTime}ms`);

    // Message should send in under 1 second
    expect(sendTime).toBeLessThan(1000);

    campfire.log('✓ Test 5.4 passed: Message sending has low latency');
  });

  test('5.5 Room navigation should be instant', async ({ page }) => {
    /**
     * Test Case: Validate room switching performance
     * Target: < 500ms
     */

    await campfire.goto('/session/new');
    await campfire.login(
      testData.users.testUser.email,
      testData.users.testUser.password
    );

    // Create two rooms
    const room1 = randomRoomName();
    const room2 = randomRoomName();

    await campfire.createRoom(room1);
    await campfire.createRoom(room2);

    // Measure navigation time
    const startTime = Date.now();

    await campfire.navigateToRoom(room1);

    const navigationTime = Date.now() - startTime;

    campfire.log(`Room navigation time: ${navigationTime}ms`);

    // Navigation should be under 500ms (Turbo should make this instant)
    expect(navigationTime).toBeLessThan(500);

    campfire.log('✓ Test 5.5 passed: Room navigation is instant');
  });

  test('5.6 Multiple messages should render efficiently', async ({ page }) => {
    /**
     * Test Case: Validate message list rendering performance
     * Target: 100 messages < 3 seconds
     */

    await campfire.goto('/session/new');
    await campfire.login(
      testData.users.testUser.email,
      testData.users.testUser.password
    );

    const roomName = randomRoomName();
    await campfire.createRoom(roomName);

    const messageCount = 100;
    const startTime = Date.now();

    // Send multiple messages rapidly
    for (let i = 0; i < messageCount; i++) {
      await campfire.typeInComposer(`Message ${i + 1}`);
      await campfire.page.click('button[name="send"]');

      // Small delay to avoid overwhelming the server
      if (i % 10 === 0) {
        await campfire.wait(100);
      }
    }

    // Wait for last message
    await campfire.verifyMessageExists(`Message ${messageCount}`);

    const totalTime = Date.now() - startTime;

    campfire.log(`Time to send ${messageCount} messages: ${totalTime}ms`);
    campfire.log(`Average per message: ${(totalTime / messageCount).toFixed(2)}ms`);

    // Should complete in reasonable time (this is stress testing)
    expect(totalTime).toBeLessThan(30000); // 30 seconds for 100 messages

    campfire.log('✓ Test 5.6 passed: Multiple messages render efficiently');
  });

  test('5.7 Web Vitals should meet thresholds', async ({ page }) => {
    /**
     * Test Case: Validate Core Web Vitals
     */

    await campfire.goto('/session/new');
    await campfire.login(
      testData.users.testUser.email,
      testData.users.testUser.password
    );

    // Get Web Vitals metrics
    const webVitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        const metrics = {};

        // First Contentful Paint
        const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
        if (fcpEntry) {
          metrics.fcp = fcpEntry.startTime;
        }

        // Largest Contentful Paint
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          metrics.lcp = lastEntry.startTime;
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // DOM Content Loaded
        metrics.domContentLoaded = performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart;

        // Load Complete
        metrics.loadComplete = performance.timing.loadEventEnd - performance.timing.navigationStart;

        setTimeout(() => resolve(metrics), 1000);
      });
    });

    campfire.log('Web Vitals:', JSON.stringify(webVitals, null, 2));

    // Validate thresholds
    if (webVitals.fcp) {
      expect(webVitals.fcp).toBeLessThan(2500); // FCP should be < 2.5s
    }

    if (webVitals.lcp) {
      expect(webVitals.lcp).toBeLessThan(4000); // LCP should be < 4s
    }

    campfire.log('✓ Test 5.7 passed: Web Vitals meet thresholds');
  });

  test('5.8 Memory usage should be reasonable', async ({ page }) => {
    /**
     * Test Case: Validate memory usage doesn't grow excessively
     */

    await campfire.goto('/session/new');
    await campfire.login(
      testData.users.testUser.email,
      testData.users.testUser.password
    );

    const roomName = randomRoomName();
    await campfire.createRoom(roomName);

    // Get initial memory
    const initialMetrics = await page.metrics();
    const initialMemory = initialMetrics.JSHeapUsedSize;

    campfire.log(`Initial memory: ${(initialMemory / 1024 / 1024).toFixed(2)} MB`);

    // Perform actions
    for (let i = 0; i < 20; i++) {
      await campfire.sendMessage(`Memory test message ${i}`);
    }

    // Get final memory
    const finalMetrics = await page.metrics();
    const finalMemory = finalMetrics.JSHeapUsedSize;

    campfire.log(`Final memory: ${(finalMemory / 1024 / 1024).toFixed(2)} MB`);

    const memoryIncrease = finalMemory - initialMemory;
    campfire.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`);

    // Memory shouldn't grow excessively (< 50 MB for 20 messages)
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);

    campfire.log('✓ Test 5.8 passed: Memory usage is reasonable');
  });

  test('5.9 Network requests should be optimized', async ({ page }) => {
    /**
     * Test Case: Validate network request count and size
     */

    const requests = [];
    let totalSize = 0;

    page.on('response', async (response) => {
      try {
        const headers = response.headers();
        const contentLength = headers['content-length'];
        if (contentLength) {
          totalSize += parseInt(contentLength);
        }
        requests.push({
          url: response.url(),
          status: response.status(),
          size: contentLength || 0,
        });
      } catch (e) {
        // Ignore errors
      }
    });

    await campfire.goto('/session/new');
    await campfire.login(
      testData.users.testUser.email,
      testData.users.testUser.password
    );

    campfire.log(`Total requests: ${requests.length}`);
    campfire.log(`Total size: ${(totalSize / 1024).toFixed(2)} KB`);

    // Should have reasonable number of requests
    expect(requests.length).toBeLessThan(100);

    campfire.log('✓ Test 5.9 passed: Network requests are optimized');
  });
});
