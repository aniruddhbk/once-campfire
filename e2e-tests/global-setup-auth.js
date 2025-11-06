/**
 * Global Authentication Setup
 *
 * This file creates an authenticated browser state that can be reused across all tests.
 * This dramatically speeds up test execution by avoiding login for every test.
 *
 * Benefits:
 * - 10-20x faster test startup
 * - Shared authentication state
 * - Automatic session management
 * - Works with Playwright's storage state
 */

const { chromium } = require('@playwright/test');
const path = require('path');
const { setupTestDatabase, seedTestData } = require('./helpers/test-setup');

const AUTH_FILE = path.join(__dirname, '../.auth/user.json');

async function globalSetup(config) {
  console.log('\n=================================================');
  console.log('🚀 CAMPFIRE PLAYWRIGHT TEST SUITE - GLOBAL SETUP');
  console.log('=================================================\n');

  // Set Rails environment
  process.env.RAILS_ENV = 'test';

  // 1. Seed test data (skip database setup - assume it's already done)
  console.log('🌱 Seeding test data...');
  try {
    await seedTestData();
  } catch (error) {
    console.warn('Warning: Could not seed test data:', error.message);
    console.log('Continuing anyway...');
  }

  // 3. Create authenticated browser state
  console.log('🔐 Creating authenticated browser state...');
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Navigate to login page
  const baseURL = process.env.BASE_URL || 'http://localhost:3000';
  await page.goto(`${baseURL}/session/new`);

  // Login as test user
  await page.fill('input[type="email"]', 'test@campfire.local');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[name="log_in"]');

  // Wait for authentication to complete
  await page.waitForSelector('.sidebar__container', { timeout: 15000 });

  // Save authenticated state
  await page.context().storageState({ path: AUTH_FILE });

  await browser.close();

  console.log('✅ Authentication state saved to:', AUTH_FILE);
  console.log('\n🎉 Global setup completed successfully!\n');
  console.log('=================================================\n');
}

module.exports = globalSetup;
