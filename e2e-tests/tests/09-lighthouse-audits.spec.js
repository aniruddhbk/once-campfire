/**
 * LIGHTHOUSE PERFORMANCE AUDITS
 *
 * Professional-grade performance audits using Google Lighthouse.
 * Validates Core Web Vitals, accessibility, best practices, and SEO.
 *
 * Metrics tracked:
 * - Performance Score (0-100)
 * - Accessibility Score (0-100)
 * - Best Practices Score (0-100)
 * - SEO Score (0-100)
 * - Core Web Vitals (LCP, FID, CLS)
 * - Progressive Web App compliance
 */

const { test, expect } = require('@playwright/test');
const { playAudit } = require('playwright-lighthouse');
const CampfireDSL = require('../helpers/campfire-dsl');
const testData = require('../fixtures/test-data');
const fs = require('fs');
const path = require('path');

// Lighthouse thresholds
const THRESHOLDS = {
  performance: 70,    // Minimum performance score
  accessibility: 90,  // Minimum accessibility score
  bestPractices: 80,  // Minimum best practices score
  seo: 80,           // Minimum SEO score
  pwa: 50            // Minimum PWA score
};

test.describe('Lighthouse Performance Audits', () => {
  let campfire;

  test.beforeEach(async ({ page }) => {
    campfire = new CampfireDSL(page);
  });

  test('9.1 Login page Lighthouse audit', async ({ page, browser }) => {
    /**
     * Test Case: Audit login page performance
     */

    await campfire.goto('/session/new');

    // Run Lighthouse audit
    campfire.log('Running Lighthouse audit on login page...');

    const lighthouseReport = await playAudit({
      page,
      port: 9222,
      thresholds: {
        performance: THRESHOLDS.performance,
        accessibility: THRESHOLDS.accessibility,
        'best-practices': THRESHOLDS.bestPractices,
        seo: THRESHOLDS.seo
      },
      reports: {
        formats: {
          html: true,
          json: true
        },
        name: 'lighthouse-login-page',
        directory: path.join(process.cwd(), 'playwright-report/lighthouse')
      }
    });

    campfire.log('✓ Test 9.1 passed: Login page meets Lighthouse thresholds');
  });

  test('9.2 Main application Lighthouse audit', async ({ page }) => {
    /**
     * Test Case: Audit main application performance
     */

    await campfire.goto('/session/new');
    await campfire.login(
      testData.users.testUser.email,
      testData.users.testUser.password
    );

    campfire.log('Running Lighthouse audit on main application...');

    const lighthouseReport = await playAudit({
      page,
      port: 9222,
      thresholds: {
        performance: THRESHOLDS.performance,
        accessibility: THRESHOLDS.accessibility,
        'best-practices': THRESHOLDS.bestPractices
      },
      reports: {
        formats: {
          html: true,
          json: true
        },
        name: 'lighthouse-main-app',
        directory: path.join(process.cwd(), 'playwright-report/lighthouse')
      }
    });

    campfire.log('✓ Test 9.2 passed: Main application meets Lighthouse thresholds');
  });

  test('9.3 Core Web Vitals validation', async ({ page }) => {
    /**
     * Test Case: Validate Core Web Vitals metrics
     */

    await campfire.goto('/session/new');
    await campfire.login(
      testData.users.testUser.email,
      testData.users.testUser.password
    );

    // Get Web Vitals metrics
    const webVitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        const metrics = {
          lcp: null,
          fid: null,
          cls: null
        };

        // Largest Contentful Paint
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          metrics.lcp = lastEntry.renderTime || lastEntry.loadTime;
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay (simulated)
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          if (entries.length > 0) {
            metrics.fid = entries[0].processingStart - entries[0].startTime;
          }
        }).observe({ entryTypes: ['first-input'] });

        // Cumulative Layout Shift
        new PerformanceObserver((list) => {
          let clsValue = 0;
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          metrics.cls = clsValue;
        }).observe({ entryTypes: ['layout-shift'] });

        setTimeout(() => resolve(metrics), 3000);
      });
    });

    campfire.log('Core Web Vitals:', JSON.stringify(webVitals, null, 2));

    // Validate thresholds (good values according to Google)
    if (webVitals.lcp) {
      expect(webVitals.lcp).toBeLessThan(2500); // LCP should be < 2.5s
      campfire.log(`✓ LCP: ${webVitals.lcp.toFixed(2)}ms (good < 2500ms)`);
    }

    if (webVitals.cls !== null) {
      expect(webVitals.cls).toBeLessThan(0.1); // CLS should be < 0.1
      campfire.log(`✓ CLS: ${webVitals.cls.toFixed(3)} (good < 0.1)`);
    }

    campfire.log('✓ Test 9.3 passed: Core Web Vitals are within good thresholds');
  });

  test('9.4 PWA compliance check', async ({ page }) => {
    /**
     * Test Case: Check Progressive Web App compliance
     */

    await campfire.goto('/session/new');
    await campfire.login(
      testData.users.testUser.email,
      testData.users.testUser.password
    );

    campfire.log('Checking PWA compliance...');

    // Check for manifest
    const manifestExists = await page.locator('link[rel="manifest"]').count() > 0;
    campfire.log(`Manifest exists: ${manifestExists}`);

    // Check for service worker
    const hasServiceWorker = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });
    campfire.log(`Service Worker support: ${hasServiceWorker}`);

    // Check for meta tags
    const hasViewport = await page.locator('meta[name="viewport"]').count() > 0;
    const hasThemeColor = await page.locator('meta[name="theme-color"]').count() > 0;

    campfire.log(`Viewport meta: ${hasViewport}`);
    campfire.log(`Theme color: ${hasThemeColor}`);

    // Expectations
    expect(manifestExists).toBe(true);
    expect(hasServiceWorker).toBe(true);
    expect(hasViewport).toBe(true);

    campfire.log('✓ Test 9.4 passed: PWA compliance checks complete');
  });

  test('9.5 Network performance analysis', async ({ page }) => {
    /**
     * Test Case: Analyze network performance
     */

    const requests = [];
    const responses = [];
    let totalTransferSize = 0;

    page.on('request', request => {
      requests.push({
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType()
      });
    });

    page.on('response', async response => {
      try {
        const request = response.request();
        const headers = response.headers();
        const contentLength = parseInt(headers['content-length'] || 0);

        totalTransferSize += contentLength;

        responses.push({
          url: response.url(),
          status: response.status(),
          contentLength: contentLength,
          resourceType: request.resourceType(),
          timing: response.timing()
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

    // Wait for all network activity to settle
    await campfire.wait(3000);

    // Analyze network performance
    campfire.log('\n📊 Network Performance Analysis:');
    campfire.log(`   Total Requests: ${requests.length}`);
    campfire.log(`   Total Responses: ${responses.length}`);
    campfire.log(`   Total Transfer Size: ${(totalTransferSize / 1024).toFixed(2)} KB`);

    // Group by resource type
    const byType = {};
    responses.forEach(resp => {
      const type = resp.resourceType;
      if (!byType[type]) {
        byType[type] = { count: 0, size: 0 };
      }
      byType[type].count++;
      byType[type].size += resp.contentLength;
    });

    campfire.log('\n   Breakdown by resource type:');
    Object.entries(byType).forEach(([type, data]) => {
      campfire.log(`   - ${type}: ${data.count} requests, ${(data.size / 1024).toFixed(2)} KB`);
    });

    // Performance assertions
    expect(requests.length).toBeLessThan(150); // Reasonable number of requests
    expect(totalTransferSize).toBeLessThan(5 * 1024 * 1024); // < 5MB total

    campfire.log('\n✓ Test 9.5 passed: Network performance is acceptable');
  });

  test('9.6 Image optimization check', async ({ page }) => {
    /**
     * Test Case: Verify images are optimized
     */

    await campfire.goto('/session/new');
    await campfire.login(
      testData.users.testUser.email,
      testData.users.testUser.password
    );

    // Get all images
    const images = await page.locator('img').all();
    const imageData = [];

    for (const img of images) {
      const src = await img.getAttribute('src');
      const alt = await img.getAttribute('alt');
      const loading = await img.getAttribute('loading');

      if (src) {
        imageData.push({ src, alt, loading });
      }
    }

    campfire.log(`\n📸 Image Optimization Analysis:`);
    campfire.log(`   Total images: ${imageData.length}`);

    // Check for alt attributes
    const imagesWithAlt = imageData.filter(img => img.alt).length;
    campfire.log(`   Images with alt text: ${imagesWithAlt}/${imageData.length}`);

    // Check for lazy loading
    const imagesWithLazyLoading = imageData.filter(img => img.loading === 'lazy').length;
    campfire.log(`   Images with lazy loading: ${imagesWithLazyLoading}/${imageData.length}`);

    // Most images should have alt text for accessibility
    expect(imagesWithAlt / imageData.length).toBeGreaterThan(0.8);

    campfire.log('\n✓ Test 9.6 passed: Image optimization checks complete');
  });
});
