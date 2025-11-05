/**
 * Test Setup Helpers
 *
 * This file contains helpers for setting up the test environment,
 * including database seeding and cleanup.
 */

const { execSync } = require('child_process');
const path = require('path');

/**
 * Setup test database
 * This should be called before running tests
 */
async function setupTestDatabase() {
  try {
    console.log('Setting up test database...');

    // Set Rails environment to test
    process.env.RAILS_ENV = 'test';

    // Create test database if it doesn't exist
    try {
      execSync('bundle exec rails db:create RAILS_ENV=test', {
        cwd: path.join(__dirname, '../..'),
        stdio: 'pipe'
      });
    } catch (e) {
      // Database might already exist
    }

    // Run migrations
    execSync('bundle exec rails db:migrate RAILS_ENV=test', {
      cwd: path.join(__dirname, '../..'),
      stdio: 'inherit'
    });

    console.log('Test database setup complete');
  } catch (error) {
    console.error('Error setting up test database:', error.message);
    throw error;
  }
}

/**
 * Reset test database
 * Clears all data and resets to a clean state
 */
async function resetTestDatabase() {
  try {
    console.log('Resetting test database...');

    execSync('bundle exec rails db:reset RAILS_ENV=test', {
      cwd: path.join(__dirname, '../..'),
      stdio: 'inherit'
    });

    console.log('Test database reset complete');
  } catch (error) {
    console.error('Error resetting test database:', error.message);
    throw error;
  }
}

/**
 * Seed test data
 * Creates a test user and initial data for testing
 */
async function seedTestData() {
  try {
    console.log('Seeding test data...');

    // Create a test user using Rails console
    const seedScript = `
      # Create test user
      user = User.find_or_create_by!(email_address: 'test@campfire.local') do |u|
        u.name = 'Test User'
        u.password = 'password123'
        u.active = true
        u.role = :member
      end

      # Create admin user
      admin = User.find_or_create_by!(email_address: 'admin@campfire.local') do |u|
        u.name = 'Admin User'
        u.password = 'adminpass123'
        u.active = true
        u.role = :administrator
      end

      # Create account if needed
      unless Account.exists?
        Account.create!(name: 'Test Campfire')
      end

      puts "Test data seeded successfully"
      puts "Test user: test@campfire.local / password123"
      puts "Admin user: admin@campfire.local / adminpass123"
    `.trim();

    execSync(`bundle exec rails runner "${seedScript}" RAILS_ENV=test`, {
      cwd: path.join(__dirname, '../..'),
      stdio: 'inherit'
    });

    console.log('Test data seeded');
  } catch (error) {
    console.error('Error seeding test data:', error.message);
    throw error;
  }
}

/**
 * Clean up test data after each test
 */
async function cleanupTestData() {
  try {
    const cleanupScript = `
      # Delete all messages
      Message.delete_all

      # Delete all rooms except system rooms
      Room.where.not(name: ['General', 'Random']).delete_all

      # Reset user state
      User.where.not(email_address: ['test@campfire.local', 'admin@campfire.local']).delete_all

      puts "Cleanup complete"
    `.trim();

    execSync(`bundle exec rails runner "${cleanupScript}" RAILS_ENV=test`, {
      cwd: path.join(__dirname, '../..'),
      stdio: 'pipe'
    });
  } catch (error) {
    // Silently handle cleanup errors to avoid breaking tests
    console.warn('Warning: Cleanup had issues:', error.message);
  }
}

/**
 * Wait for Rails server to be ready
 */
async function waitForServer(url = 'http://localhost:3000', timeout = 30000) {
  console.log('Waiting for Rails server to be ready...');

  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const response = await fetch(url);
      if (response.status < 500) {
        console.log('Rails server is ready');
        return true;
      }
    } catch (e) {
      // Server not ready yet
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  throw new Error('Rails server failed to start within timeout');
}

/**
 * Generate random string for unique test data
 */
function randomString(length = 10) {
  return Math.random().toString(36).substring(2, length + 2);
}

/**
 * Generate random email
 */
function randomEmail() {
  return `test-${randomString()}@campfire.local`;
}

/**
 * Generate random room name
 */
function randomRoomName() {
  return `Test Room ${randomString(5)}`;
}

module.exports = {
  setupTestDatabase,
  resetTestDatabase,
  seedTestData,
  cleanupTestData,
  waitForServer,
  randomString,
  randomEmail,
  randomRoomName
};
