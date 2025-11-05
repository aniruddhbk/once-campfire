// Playwright configuration for Campfire E2E tests
// @see https://playwright.dev/docs/test-configuration

const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e-tests/tests',

  // Global setup - runs once before all tests (with authentication state)
  globalSetup: require.resolve('./e2e-tests/global-setup-auth.js'),

  // Maximum time one test can run
  timeout: 60 * 1000,

  expect: {
    // Maximum time expect() should wait for the condition to be met
    timeout: 10000
  },

  // Run tests in files in parallel
  fullyParallel: false,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : 1,

  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['./e2e-tests/helpers/custom-reporter.js', { verbose: false }],
    ['list']
  ],

  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Maximum time for each action
    actionTimeout: 10000,

    // Navigation timeout
    navigationTimeout: 30000,
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Use authenticated state by default (will be set up in global setup)
        viewport: { width: 1280, height: 720 },
      },
    },
  ],

  // Run your local dev server before starting the tests
  // Note: For Rails app, you'll need to start the server manually
  // or configure this section to start the Rails server
  webServer: process.env.CI ? undefined : {
    command: 'bundle exec rails server -e test -p 3000',
    port: 3000,
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
