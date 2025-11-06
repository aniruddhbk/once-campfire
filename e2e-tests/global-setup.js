/**
 * Global Setup for Playwright Tests
 *
 * This file runs once before all tests to set up the test environment.
 * It ensures the database is ready and test data is seeded.
 */

const { setupTestDatabase, seedTestData } = require('./helpers/test-setup');

async function globalSetup() {
  console.log('\n=================================================');
  console.log('🚀 Starting Playwright Test Suite Setup');
  console.log('=================================================\n');

  try {
    // Set Rails environment
    process.env.RAILS_ENV = 'test';

    // Setup test database
    console.log('📦 Setting up test database...');
    await setupTestDatabase();

    // Seed test data
    console.log('🌱 Seeding test data...');
    await seedTestData();

    console.log('\n✅ Global setup completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Global setup failed:', error.message);
    console.error(error.stack);
    throw error;
  }
}

module.exports = globalSetup;
