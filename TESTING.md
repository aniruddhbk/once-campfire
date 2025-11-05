# Campfire E2E Testing Documentation

## 📖 Table of Contents

1. [Overview](#overview)
2. [Test Suite Architecture](#test-suite-architecture)
3. [Quick Start](#quick-start)
4. [Test Coverage](#test-coverage)
5. [Running Tests](#running-tests)
6. [Writing Tests](#writing-tests)
7. [Troubleshooting](#troubleshooting)
8. [CI/CD Integration](#cicd-integration)

## 🎯 Overview

This document provides comprehensive information about the Playwright end-to-end test suite for the Campfire application. The test suite is designed to:

- **Ensure quality**: Comprehensive coverage of all major features
- **Prevent regressions**: Catch bugs before they reach production
- **Document behavior**: Tests serve as living documentation
- **Enable confidence**: Deploy with confidence knowing tests pass

### Technology Stack

- **Test Framework**: [Playwright](https://playwright.dev/) v1.56+
- **Language**: JavaScript (Node.js)
- **Browser**: Chromium (can be extended to Firefox, WebKit)
- **Application**: Ruby on Rails 8 with Hotwire

## 🏗️ Test Suite Architecture

### Layered Architecture

```
┌─────────────────────────────────────────┐
│         Test Specifications             │  ← High-level test cases
│    (01-core-flows.spec.js, etc.)       │
├─────────────────────────────────────────┤
│         Campfire DSL Layer              │  ← Domain-specific methods
│      (campfire-dsl.js)                  │
├─────────────────────────────────────────┤
│         Playwright API                   │  ← Low-level browser automation
└─────────────────────────────────────────┘
```

### Key Principles

1. **Domain Specific Language (DSL)**: Custom high-level API that reads like user stories
2. **Page Object Pattern**: Encapsulation of page interactions
3. **Test Independence**: Each test can run in isolation
4. **Resilience**: Automatic waiting and retry logic
5. **Maintainability**: Changes to UI only require DSL updates

### Directory Structure

```
e2e-tests/
├── fixtures/           # Test data and constants
├── helpers/            # DSL and utility functions
├── tests/              # Test specifications
├── global-setup.js     # One-time setup before all tests
└── README.md           # Test suite documentation

playwright.config.js    # Playwright configuration
TESTING.md             # This file
```

## ⚡ Quick Start

### Prerequisites

```bash
# Node.js 16+
node --version

# Ruby 3.2+
ruby --version

# Rails 8
rails --version
```

### Installation

1. **Install test dependencies:**

```bash
npm install
```

2. **Install Playwright browsers:**

```bash
npx playwright install chromium
```

3. **Set up test database:**

```bash
# Create and migrate test database
RAILS_ENV=test bundle exec rails db:create db:migrate

# Seed test data (done automatically, but can be run manually)
npm run test:setup
```

### Run Your First Test

```bash
# Run all tests
npm test

# Or run a specific test file
npm run test:core
```

### View Results

```bash
# Open HTML report
npm run test:report
```

## 📊 Test Coverage

### Summary Statistics

- **Total Test Suites**: 3
- **Total Test Cases**: 30+
- **Coverage Areas**:
  - Core Flows (6 tests)
  - Markdown Formatting (13 tests)
  - Chaos/Edge Cases (12 tests)

### Detailed Coverage

#### 1. Core User Flows (`01-core-flows.spec.js`)

| Test | Description | Status |
|------|-------------|--------|
| 1.1 | Basic Channel Creation and Messaging | ✅ |
| 1.2 | Multi-Channel Navigation | ✅ |
| 1.3 | Complex Message Interactions | ✅ |
| 1.4 | Message Editing | ✅ |
| 1.5 | Empty Channel State | ✅ |
| 1.6 | Multiple Messages in Sequence | ✅ |

#### 2. Markdown & Formatting (`02-markdown-formatting.spec.js`)

| Test | Description | Markdown Syntax | Status |
|------|-------------|-----------------|--------|
| 2.1 | Bold Text | `**text**` | ✅ |
| 2.2 | Italic Text | `_text_` | ✅ |
| 2.3 | Strikethrough | `~~text~~` | ✅ |
| 2.4 | Inline Code | `` `code` `` | ✅ |
| 2.5 | Code Blocks | `` ```code``` `` | ✅ |
| 2.6 | Links | `[text](url)` | ✅ |
| 2.7 | Ordered Lists | `1. item` | ✅ |
| 2.8 | Unordered Lists | `- item` | ✅ |
| 2.9 | Headings | `# H1` | ✅ |
| 2.10 | Mixed Formatting | Multiple | ✅ |
| 2.11 | Emoji Support | 😀👍 | ✅ |
| 2.12 | Multiline Messages | `\n` | ✅ |
| 2.13 | RTL Text | Arabic/Hebrew | ✅ |

#### 3. Chaos & Edge Cases (`03-chaos-testing.spec.js`)

| Test | Description | Test Type | Status |
|------|-------------|-----------|--------|
| 3.1 | Rapid Channel Creation | Stress | ✅ |
| 3.2 | Very Long Messages (5000+ chars) | Boundary | ✅ |
| 3.3 | Special Characters & Unicode | Edge | ✅ |
| 3.4 | XSS & SQL Injection | Security | ✅ |
| 3.5 | Rapid Message Sending | Stress | ✅ |
| 3.6 | Empty/Whitespace Messages | Validation | ✅ |
| 3.7 | Rapid Edit/Delete | Stress | ✅ |
| 3.8 | Channel Name Edge Cases | Edge | ✅ |
| 3.9 | Concurrent Navigation | Stress | ✅ |
| 3.10 | Page Reload Resilience | Recovery | ✅ |
| 3.11 | Character Boundaries | Boundary | ✅ |
| 3.12 | Combined Stress Test | Stress | ✅ |

## 🚀 Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run with visible browser
npm run test:headed

# Run in debug mode (pause on breakpoints)
npm run test:debug

# Run specific test suite
npm run test:core          # Core flows only
npm run test:markdown      # Markdown tests only
npm run test:chaos         # Chaos tests only
```

### Advanced Options

```bash
# Run specific test by name
npx playwright test -g "Basic Channel Creation"

# Run in UI mode (interactive)
npm run test:ui

# Run with custom timeout
npx playwright test --timeout=120000

# Run with specific number of workers
npx playwright test --workers=1

# Generate trace for debugging
npx playwright test --trace on
```

### Environment Variables

```bash
# Custom base URL
BASE_URL=http://localhost:4000 npm test

# Skip web server start (if already running)
CI=true npm test
```

## 🔧 Writing Tests

### Basic Test Structure

```javascript
const { test, expect } = require('@playwright/test');
const CampfireDSL = require('../helpers/campfire-dsl');
const testData = require('../fixtures/test-data');

test.describe('My Feature', () => {
  let campfire;

  test.beforeEach(async ({ page }) => {
    campfire = new CampfireDSL(page);
    await campfire.goto('/session/new');
    await campfire.login(
      testData.users.testUser.email,
      testData.users.testUser.password
    );
  });

  test('should do something', async () => {
    // Arrange
    await campfire.createRoom('Test Room');

    // Act
    await campfire.sendMessage('Hello World');

    // Assert
    await campfire.verifyMessageExists('Hello World');
  });
});
```

### Using the DSL

The `CampfireDSL` class provides high-level methods:

```javascript
// Navigation
await campfire.goto('/path');
await campfire.waitForTurboLoad();

// Authentication
await campfire.login(email, password);
await campfire.logout();

// Rooms
await campfire.createRoom('Room Name');
await campfire.navigateToRoom('Room Name');
await campfire.verifyCurrentRoom('Room Name');
await campfire.deleteCurrentRoom();
await campfire.getRoomsList();

// Messages
await campfire.sendMessage('Text');
await campfire.sendRichMessage('<b>HTML</b>');
await campfire.verifyMessageExists('Text');
await campfire.getAllMessages();
await campfire.getLatestMessage();
await campfire.getMessageCount();

// Message Actions
await campfire.editMessage('Old', 'New');
await campfire.deleteMessage('Text');
await campfire.boostMessage('Text', '👍');
await campfire.verifyMessageBoost('Text', '👍');

// Formatting
await campfire.toggleRichTextToolbar();
await campfire.formatText('bold', 'Text');
await campfire.insertCodeBlock('code');
await campfire.insertLink('text', 'url');

// Utilities
await campfire.wait(1000);
await campfire.reload();
await campfire.screenshot('name');
campfire.log('message');
```

### Best Practices

1. **Use descriptive test names**: `test('should allow users to edit messages')`
2. **Follow AAA pattern**: Arrange, Act, Assert
3. **Keep tests independent**: Don't rely on other test state
4. **Use the DSL**: Don't use raw Playwright selectors
5. **Add logging**: Use `campfire.log()` for debugging
6. **Handle timing**: Let DSL handle waits, avoid `sleep`
7. **Clean assertions**: Use specific `expect()` statements

### Adding New DSL Methods

To extend the DSL, edit `e2e-tests/helpers/campfire-dsl.js`:

```javascript
/**
 * Description of what this method does
 * @param {string} param - Parameter description
 * @returns {Promise<void>}
 */
async myNewMethod(param) {
  // Find elements
  const element = await this.page.locator('.selector');

  // Perform actions
  await element.click();

  // Wait for effects
  await this.waitForTurboLoad();

  // Verify
  await this.verifyMessageExists('expected text');
}
```

## 🐛 Troubleshooting

### Common Issues

#### 1. "Element not found" errors

**Cause**: Selector changed or page loading slowly

**Solution**:
```javascript
// Increase timeout
await campfire.waitForElement('.selector', { timeout: 15000 });

// Or update selector in DSL
```

#### 2. "Authentication failed"

**Cause**: Test user not seeded

**Solution**:
```bash
# Re-run setup
npm run test:setup

# Or manually seed
RAILS_ENV=test bundle exec rails runner "
  User.find_or_create_by!(email_address: 'test@campfire.local') do |u|
    u.name = 'Test User'
    u.password = 'password123'
    u.active = true
  end
"
```

#### 3. "Port 3000 already in use"

**Cause**: Rails server already running

**Solution**:
```bash
# Kill existing server
lsof -ti:3000 | xargs kill -9

# Or use different port
BASE_URL=http://localhost:4000 npm test
```

#### 4. "Database locked" errors

**Cause**: SQLite concurrent access

**Solution**:
```javascript
// In playwright.config.js, set workers to 1
workers: 1
```

#### 5. Flaky tests

**Causes**: Race conditions, timing issues

**Solutions**:
- Use DSL methods (they have built-in waits)
- Increase timeouts for slow operations
- Add explicit waits: `await campfire.wait(500)`
- Check for loading states before assertions

### Debug Mode

Run tests in debug mode to step through:

```bash
# Open Playwright Inspector
npm run test:debug

# Or add pause in code
await page.pause();
```

### View Traces

Failed tests generate traces:

```bash
# View trace file
npx playwright show-trace trace.zip

# Or view from report
npm run test:report
```

## 🔄 CI/CD Integration

### GitHub Actions

Create `.github/workflows/e2e-tests.yml`:

```yaml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Setup Ruby
        uses: ruby/setup-ruby@v1
        with:
          ruby-version: '3.2'
          bundler-cache: true

      - name: Install Node dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Setup test database
        run: |
          RAILS_ENV=test bundle exec rails db:create db:migrate
        env:
          DATABASE_URL: sqlite3:db/test.sqlite3

      - name: Run E2E tests
        run: npm test
        env:
          CI: true
          RAILS_ENV: test

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30

      - name: Upload test videos
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: test-videos
          path: test-results/
          retention-days: 7
```

### GitLab CI

Create `.gitlab-ci.yml`:

```yaml
e2e-tests:
  image: mcr.microsoft.com/playwright:v1.56.0-focal

  services:
    - redis:7-alpine

  before_script:
    - apt-get update
    - apt-get install -y ruby-full
    - gem install bundler
    - bundle install
    - npm ci
    - RAILS_ENV=test bundle exec rails db:create db:migrate

  script:
    - npm test

  artifacts:
    when: always
    paths:
      - playwright-report/
      - test-results/
    expire_in: 1 week
```

### Local Pre-commit Hook

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash

echo "Running E2E tests..."

npm test

if [ $? -ne 0 ]; then
  echo "E2E tests failed. Commit aborted."
  exit 1
fi

echo "E2E tests passed!"
```

## 📈 Metrics and Reporting

### Test Execution Time

Typical execution times:
- Core flows: ~2-3 minutes
- Markdown tests: ~3-4 minutes
- Chaos tests: ~5-7 minutes
- **Total**: ~10-15 minutes

### Coverage Metrics

Track these metrics over time:
- Total tests: 30+
- Pass rate: Target 100%
- Average execution time
- Flakiness rate: Target <5%

### Reports

Available reports:
1. **HTML Report**: `npm run test:report`
2. **Console Output**: Real-time during test run
3. **JUnit XML**: Configure in `playwright.config.js`
4. **JSON**: Configure in `playwright.config.js`

## 📚 Additional Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Test Suite README](./e2e-tests/README.md)

---

## 🎯 Next Steps

1. **Run the tests**: `npm test`
2. **Explore the DSL**: Check `e2e-tests/helpers/campfire-dsl.js`
3. **Write your own test**: Follow the examples in this doc
4. **Set up CI**: Use the GitHub Actions example above

**Happy Testing! 🚀**
