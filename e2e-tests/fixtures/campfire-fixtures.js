/**
 * Custom Playwright Fixtures for Campfire
 *
 * This file defines custom fixtures that extend Playwright's built-in capabilities
 * with Campfire-specific functionality.
 *
 * Features:
 * - Automatic authentication using saved state
 * - Pre-configured CampfireDSL instance
 * - Performance monitoring
 * - Screenshot helpers
 * - Database cleanup
 * - Network mocking utilities
 */

const { test as base, expect } = require('@playwright/test');
const CampfireDSL = require('../helpers/campfire-dsl');
const path = require('path');
const fs = require('fs');

// Path to saved authentication state
const AUTH_FILE = path.join(__dirname, '../../.auth/user.json');

/**
 * Extended test with custom fixtures
 */
exports.test = base.extend({
  /**
   * Authenticated page - automatically logged in
   */
  authenticatedPage: async ({ browser }, use) => {
    // Check if auth file exists
    if (!fs.existsSync(AUTH_FILE)) {
      throw new Error('Authentication state file not found. Run global setup first.');
    }

    // Create context with saved authentication state
    const context = await browser.newContext({
      storageState: AUTH_FILE,
    });

    const page = await context.newPage();

    // Provide page to test
    await use(page);

    // Cleanup
    await context.close();
  },

  /**
   * CampfireDSL instance - ready to use
   */
  campfire: async ({ authenticatedPage }, use) => {
    const campfire = new CampfireDSL(authenticatedPage);

    // Navigate to home page and wait for load
    await campfire.goto('/');
    await campfire.waitForTurboLoad();

    // Provide DSL instance to test
    await use(campfire);

    // Cleanup could go here if needed
  },

  /**
   * Performance monitor - tracks page performance metrics
   */
  performanceMonitor: async ({ authenticatedPage }, use) => {
    const metrics = {
      navigationStart: 0,
      loadComplete: 0,
      domContentLoaded: 0,
      firstPaint: 0,
      customMetrics: {},
    };

    // Start monitoring
    authenticatedPage.on('load', async () => {
      const performanceMetrics = await authenticatedPage.evaluate(() => {
        const perfData = window.performance.timing;
        const navigation = perfData.navigationStart;

        return {
          navigationStart: 0,
          loadComplete: perfData.loadEventEnd - navigation,
          domContentLoaded: perfData.domContentLoadedEventEnd - navigation,
          firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0,
        };
      });

      Object.assign(metrics, performanceMetrics);
    });

    const monitor = {
      getMetrics: () => metrics,
      markCustomMetric: async (name) => {
        const timestamp = await authenticatedPage.evaluate(() => performance.now());
        metrics.customMetrics[name] = timestamp;
      },
      assertLoadTime: (maxMs) => {
        expect(metrics.loadComplete).toBeLessThan(maxMs);
      },
    };

    await use(monitor);

    // Log metrics after test
    console.log('📊 Performance Metrics:', JSON.stringify(metrics, null, 2));
  },

  /**
   * Screenshot helper - advanced screenshot utilities
   */
  screenshot: async ({ authenticatedPage }, use) => {
    const screenshotHelper = {
      capture: async (name, options = {}) => {
        const screenshotPath = path.join(__dirname, '../screenshots', `${name}.png`);
        await authenticatedPage.screenshot({
          path: screenshotPath,
          fullPage: true,
          ...options,
        });
        return screenshotPath;
      },

      captureElement: async (selector, name) => {
        const element = await authenticatedPage.locator(selector);
        const screenshotPath = path.join(__dirname, '../screenshots', `${name}.png`);
        await element.screenshot({ path: screenshotPath });
        return screenshotPath;
      },

      compareWithBaseline: async (name) => {
        // Placeholder for visual regression testing
        // Would integrate with pixelmatch or similar library
        console.log(`Visual comparison for ${name} would happen here`);
      },
    };

    // Ensure screenshots directory exists
    const screenshotsDir = path.join(__dirname, '../screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    await use(screenshotHelper);
  },

  /**
   * Network interceptor - mock and spy on network requests
   */
  networkInterceptor: async ({ authenticatedPage }, use) => {
    const requests = [];
    const responses = [];

    // Track all requests
    authenticatedPage.on('request', request => {
      requests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        timestamp: Date.now(),
      });
    });

    // Track all responses
    authenticatedPage.on('response', response => {
      responses.push({
        url: response.url(),
        status: response.status(),
        headers: response.headers(),
        timestamp: Date.now(),
      });
    });

    const interceptor = {
      getRequests: () => requests,
      getResponses: () => responses,

      waitForRequest: async (urlPattern, timeout = 10000) => {
        return authenticatedPage.waitForRequest(urlPattern, { timeout });
      },

      waitForResponse: async (urlPattern, timeout = 10000) => {
        return authenticatedPage.waitForResponse(urlPattern, { timeout });
      },

      mockResponse: async (urlPattern, mockData) => {
        await authenticatedPage.route(urlPattern, route => {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockData),
          });
        });
      },

      blockRequests: async (urlPattern) => {
        await authenticatedPage.route(urlPattern, route => route.abort());
      },

      getRequestsByType: (type) => {
        return requests.filter(req => req.url.includes(type));
      },

      assertRequestMade: (urlPattern) => {
        const found = requests.some(req => req.url.match(urlPattern));
        expect(found).toBe(true);
      },
    };

    await use(interceptor);

    // Log network summary
    console.log(`📡 Network Summary: ${requests.length} requests, ${responses.length} responses`);
  },

  /**
   * Test data factory - create test data easily
   */
  testData: async ({}, use) => {
    const { randomRoomName, randomString, randomEmail } = require('../helpers/test-setup');

    const factory = {
      createRoom: () => randomRoomName(),
      createEmail: () => randomEmail(),
      createMessage: (length = 20) => `Test message ${randomString(length)}`,
      createUser: () => ({
        email: randomEmail(),
        name: `Test User ${randomString(5)}`,
        password: 'password123',
      }),
      createMultipleRooms: (count) => {
        return Array.from({ length: count }, () => randomRoomName());
      },
      createMultipleMessages: (count) => {
        return Array.from({ length: count }, (_, i) => `Message ${i + 1}: ${randomString(10)}`);
      },
    };

    await use(factory);
  },
});

/**
 * Export expect for convenience
 */
exports.expect = expect;
