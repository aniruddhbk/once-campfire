# Campfire E2E Test Suite

## 📋 Overview

This is a comprehensive end-to-end (E2E) test suite for the Campfire chat application, built with [Playwright](https://playwright.dev/). The test suite covers all major features of the application, including channel management, messaging, rich text formatting, and edge case handling.

## 🎯 Test Coverage

### Category 1: Core User Flows (`01-core-flows.spec.js`)

Tests the essential workflows that users perform in the application:

1. **Basic Channel Creation and Messaging**
   - Create a new channel
   - Send a message
   - Verify message appears correctly

2. **Multi-Channel Navigation**
   - Create multiple channels
   - Navigate between channels
   - Verify context is maintained correctly

3. **Complex Message Interactions**
   - Send multiple messages
   - Like/boost messages
   - Edit messages
   - Delete messages
   - Verify all operations work correctly

4. **Message Editing**
   - Edit existing messages
   - Verify updates are reflected

5. **Empty Channel State**
   - Verify new channels display correctly
   - Verify composer is available

6. **Multiple Messages in Sequence**
   - Send multiple messages rapidly
   - Verify order and display

### Category 2: Markdown and Rich Text Formatting (`02-markdown-formatting.spec.js`)

Tests all text formatting capabilities:

- **Bold** text (`**text**`)
- **Italic** text (`_text_`)
- **Strikethrough** text (`~~text~~`)
- **Inline code** (`` `code` ``)
- **Code blocks** (`` ``` code ``` ``)
- **Links** (`[text](url)`)
- **Ordered lists** (`1. item`)
- **Unordered lists** (`- item`)
- **Headings** (`# H1`, `## H2`, `### H3`)
- **Mixed formatting** (multiple formats in one message)
- **Emoji support** (😀👍🎉)
- **Multiline messages**
- **RTL (Right-to-Left) text** support (Arabic, Hebrew)

### Category 3: Chaos and Edge Case Testing (`03-chaos-testing.spec.js`)

Stress tests and edge case validation:

- **Rapid channel creation** - Create many channels quickly
- **Very long messages** - Test 5000+ character messages
- **Special characters and Unicode** - Test international characters, emojis
- **XSS and injection attempts** - Verify security protections
- **Rapid message sending** - Send many messages quickly
- **Empty/whitespace messages** - Verify validation works
- **Rapid edit/delete operations** - Test concurrent modifications
- **Channel name edge cases** - Special characters, emojis, long names
- **Concurrent navigation** - Rapidly switch between channels
- **Page reload resilience** - Verify data persists
- **Character boundary testing** - Test various message lengths
- **Stress test** - Combined operations to test stability

## 🏗️ Architecture

### Test DSL (Domain Specific Language)

The test suite uses a custom DSL (`CampfireDSL`) that provides high-level, readable methods for interacting with the application. This makes tests:

- **Readable**: Tests read like user stories
- **Maintainable**: Changes to UI only require updating the DSL
- **Reusable**: Common operations are abstracted into methods
- **Resilient**: Handles timing and waiting automatically

**Example DSL usage:**

```javascript
const campfire = new CampfireDSL(page);

// Login
await campfire.login('user@example.com', 'password');

// Create and navigate to a room
await campfire.createRoom('My Test Room');
await campfire.navigateToRoom('My Test Room');

// Send and verify a message
await campfire.sendMessage('Hello, world!');
await campfire.verifyMessageExists('Hello, world!');

// Interact with messages
await campfire.editMessage('Hello, world!', 'Hello, Campfire!');
await campfire.boostMessage('Hello, Campfire!', '👍');
await campfire.deleteMessage('Hello, Campfire!');
```

### Directory Structure

```
e2e-tests/
├── fixtures/
│   └── test-data.js          # Test data and constants
├── helpers/
│   ├── campfire-dsl.js       # Main DSL for Campfire interactions
│   └── test-setup.js         # Database setup and utilities
├── tests/
│   ├── 01-core-flows.spec.js       # Core user flow tests
│   ├── 02-markdown-formatting.spec.js  # Formatting tests
│   └── 03-chaos-testing.spec.js    # Edge case and stress tests
├── global-setup.js           # Global test setup
└── README.md                 # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Ruby on Rails (for running the Campfire application)
- Bundler

### Installation

1. **Install dependencies:**

```bash
npm install
```

2. **Install Playwright browsers:**

```bash
npx playwright install chromium
```

3. **Set up test database:**

```bash
RAILS_ENV=test bundle exec rails db:create db:migrate
```

4. **Seed test data:**

The test suite will automatically seed test data when you run tests. If you need to manually seed:

```bash
RAILS_ENV=test bundle exec rails runner "
  User.find_or_create_by!(email_address: 'test@campfire.local') do |u|
    u.name = 'Test User'
    u.password = 'password123'
    u.active = true
  end

  Account.find_or_create_by!(name: 'Test Campfire')
"
```

## 🧪 Running Tests

### Run all tests:

```bash
npm test
```

Or using npx:

```bash
npx playwright test
```

### Run specific test file:

```bash
npx playwright test e2e-tests/tests/01-core-flows.spec.js
```

### Run tests in headed mode (see browser):

```bash
npx playwright test --headed
```

### Run tests in debug mode:

```bash
npx playwright test --debug
```

### Run tests with specific browser:

```bash
npx playwright test --project=chromium
```

### Run a specific test by name:

```bash
npx playwright test -g "Basic Channel Creation"
```

## 📊 Viewing Test Results

### HTML Report

After running tests, view the HTML report:

```bash
npx playwright show-report
```

This opens a detailed report showing:
- Test results (passed/failed)
- Screenshots of failures
- Video recordings
- Trace files for debugging

### Console Output

Tests provide detailed console output showing:
- Test progress
- DSL method calls
- Verification steps
- Pass/fail status

## 🔧 Configuration

### Playwright Configuration

Edit `playwright.config.js` to customize:

- Test timeout
- Number of workers (parallel execution)
- Browsers to test
- Base URL
- Screenshot/video settings
- Retry logic

### Test Data

Edit `e2e-tests/fixtures/test-data.js` to customize:

- User credentials
- Test messages
- Edge case data
- Timing constants

## 🐛 Debugging Tests

### 1. Run in Headed Mode

See what's happening in the browser:

```bash
npx playwright test --headed --slowMo=1000
```

### 2. Use Playwright Inspector

Step through tests interactively:

```bash
npx playwright test --debug
```

### 3. Add Breakpoints

Add `await page.pause()` in your test to pause execution:

```javascript
await campfire.sendMessage('Hello');
await page.pause(); // Execution pauses here
await campfire.verifyMessageExists('Hello');
```

### 4. View Traces

If a test fails, view the trace:

```bash
npx playwright show-trace trace.zip
```

### 5. Screenshots

Failed tests automatically capture screenshots. Find them in `test-results/`.

## 📝 Writing New Tests

### Basic Test Structure

```javascript
const { test, expect } = require('@playwright/test');
const CampfireDSL = require('../helpers/campfire-dsl');
const testData = require('../fixtures/test-data');

test.describe('My Feature Tests', () => {
  let campfire;

  test.beforeEach(async ({ page }) => {
    campfire = new CampfireDSL(page);

    // Login
    await campfire.goto('/session/new');
    await campfire.login(
      testData.users.testUser.email,
      testData.users.testUser.password
    );
  });

  test('My test case', async () => {
    // Your test code here
    await campfire.createRoom('Test Room');
    await campfire.sendMessage('Test Message');
    await campfire.verifyMessageExists('Test Message');
  });
});
```

### Best Practices

1. **Use the DSL**: Always use `CampfireDSL` methods instead of raw Playwright API
2. **Meaningful names**: Use descriptive test names that explain what's being tested
3. **Single responsibility**: Each test should test one specific feature
4. **Independent tests**: Tests should not depend on each other
5. **Clean up**: Tests should clean up any data they create (or use test database reset)
6. **Assertions**: Always verify the expected outcome with assertions
7. **Logging**: Use `campfire.log()` to add helpful log messages

### Adding New DSL Methods

To add a new DSL method in `campfire-dsl.js`:

```javascript
/**
 * My new method description
 * @param {string} param - Parameter description
 */
async myNewMethod(param) {
  // Implementation
  await this.page.click(selector);
  await this.waitForTurboLoad();
}
```

## 🔍 Test Data

### Default Test Users

- **Regular User**
  - Email: `test@campfire.local`
  - Password: `password123`

- **Admin User**
  - Email: `admin@campfire.local`
  - Password: `adminpass123`

### Test Database

Tests run in `RAILS_ENV=test` environment. The database is:

- Created before tests run
- Seeded with test users
- Reset between test runs (optional)

## 🚨 Troubleshooting

### Tests fail with "Element not found"

- The page might be loading slowly. Increase timeout in `playwright.config.js`
- The selector might have changed. Update the DSL or fixture

### Tests fail with "Authentication failed"

- Ensure test users are seeded in the database
- Check `e2e-tests/helpers/test-setup.js` seed script
- Manually run: `RAILS_ENV=test bundle exec rails runner "...seed script..."`

### Rails server not starting

- Ensure no other server is running on port 3000
- Check `RAILS_ENV=test` environment is set
- Try starting manually: `RAILS_ENV=test bundle exec rails s -p 3000`

### Tests are slow

- Reduce parallelism: Set `workers: 1` in config
- Disable video recording: Set `video: 'off'` in config
- Run specific tests instead of full suite

### Database issues

Reset the test database:

```bash
RAILS_ENV=test bundle exec rails db:reset
```

## 📈 Continuous Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v2

    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'

    - name: Setup Ruby
      uses: ruby/setup-ruby@v1
      with:
        ruby-version: '3.2'

    - name: Install dependencies
      run: |
        npm install
        bundle install

    - name: Setup database
      run: |
        RAILS_ENV=test bundle exec rails db:create db:migrate

    - name: Install Playwright
      run: npx playwright install --with-deps chromium

    - name: Run tests
      run: npm test

    - name: Upload test results
      if: always()
      uses: actions/upload-artifact@v2
      with:
        name: playwright-report
        path: playwright-report/
```

## 🤝 Contributing

When adding new tests:

1. Follow existing test structure
2. Use the DSL for consistency
3. Add appropriate logging
4. Update this README if needed
5. Ensure tests pass locally before committing

## 📚 Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)

## 📄 License

This test suite is part of the Campfire project.

---

**Happy Testing! 🎉**

For questions or issues, please contact the development team or open an issue in the repository.
