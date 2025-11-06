/**
 * Markdown Editor Comprehensive Testing
 *
 * These tests cover all markdown and rich text formatting features:
 * - Bold, italic, strikethrough
 * - Code blocks (inline and multiline)
 * - Links
 * - Lists (ordered and unordered)
 * - Headings
 * - Mixed formatting
 *
 * @see Phase 4 - Category 1: Markdown Editor requirements
 */

const { test, expect } = require('@playwright/test');
const CampfireDSL = require('../helpers/campfire-dsl');
const testData = require('../fixtures/test-data');
const { randomRoomName } = require('../helpers/test-setup');

test.describe('Markdown and Rich Text Formatting', () => {
  let campfire;
  let testRoom;

  test.beforeEach(async ({ page }) => {
    campfire = new CampfireDSL(page);

    // Login before each test
    await campfire.goto('/session/new');
    await campfire.login(
      testData.users.testUser.email,
      testData.users.testUser.password
    );

    // Create a test room for all formatting tests
    testRoom = randomRoomName();
    campfire.log(`Creating test room: ${testRoom}`);
    await campfire.createRoom(testRoom);
  });

  test('2.1 Bold Text Formatting', async () => {
    /**
     * Test Case: Apply bold formatting to text
     *
     * Steps:
     * 1. Type text with markdown bold syntax
     * 2. Send message
     * 3. Verify bold formatting is rendered
     */

    const boldText = testData.messages.markdown.bold;

    campfire.log(`Sending bold text: ${boldText}`);
    await campfire.sendMessage(boldText);

    // Verify the message exists
    await campfire.verifyMessageExists('Bold text');

    // Verify bold formatting (the word "Bold" should be in a <strong> tag)
    const messages = await campfire.page.locator('.message__presentation');
    const lastMessage = messages.last();
    const strongTag = await lastMessage.locator('strong').count();

    expect(strongTag).toBeGreaterThanOrEqual(1);

    campfire.log('✓ Test 2.1 passed: Bold formatting works');
  });

  test('2.2 Italic Text Formatting', async () => {
    /**
     * Test Case: Apply italic formatting to text
     *
     * Steps:
     * 1. Type text with markdown italic syntax
     * 2. Send message
     * 3. Verify italic formatting is rendered
     */

    const italicText = testData.messages.markdown.italic;

    campfire.log(`Sending italic text: ${italicText}`);
    await campfire.sendMessage(italicText);

    // Verify the message exists
    await campfire.verifyMessageExists('Italic text');

    // Verify italic formatting (should be in an <em> or <i> tag)
    const messages = await campfire.page.locator('.message__presentation');
    const lastMessage = messages.last();
    const italicTag = await lastMessage.locator('em, i').count();

    expect(italicTag).toBeGreaterThanOrEqual(1);

    campfire.log('✓ Test 2.2 passed: Italic formatting works');
  });

  test('2.3 Strikethrough Text Formatting', async () => {
    /**
     * Test Case: Apply strikethrough formatting to text
     *
     * Steps:
     * 1. Type text with markdown strikethrough syntax
     * 2. Send message
     * 3. Verify strikethrough formatting is rendered
     */

    const strikeText = testData.messages.markdown.strikethrough;

    campfire.log(`Sending strikethrough text: ${strikeText}`);
    await campfire.sendMessage(strikeText);

    // Verify the message exists
    await campfire.verifyMessageExists('Strikethrough text');

    // Verify strikethrough formatting (should be in a <del> or <s> tag)
    const messages = await campfire.page.locator('.message__presentation');
    const lastMessage = messages.last();
    const strikeTag = await lastMessage.locator('del, s, strike').count();

    expect(strikeTag).toBeGreaterThanOrEqual(1);

    campfire.log('✓ Test 2.3 passed: Strikethrough formatting works');
  });

  test('2.4 Inline Code Formatting', async () => {
    /**
     * Test Case: Apply inline code formatting
     *
     * Steps:
     * 1. Type text with markdown inline code syntax
     * 2. Send message
     * 3. Verify code formatting is rendered
     */

    const codeText = testData.messages.markdown.code;

    campfire.log(`Sending inline code: ${codeText}`);
    await campfire.sendMessage(codeText);

    // Verify the message exists
    await campfire.verifyMessageExists('inline code');

    // Verify code formatting (should be in a <code> tag)
    const messages = await campfire.page.locator('.message__presentation');
    const lastMessage = messages.last();
    const codeTag = await lastMessage.locator('code').count();

    expect(codeTag).toBeGreaterThanOrEqual(1);

    campfire.log('✓ Test 2.4 passed: Inline code formatting works');
  });

  test('2.5 Code Block Formatting', async () => {
    /**
     * Test Case: Apply code block formatting
     *
     * Steps:
     * 1. Type text with markdown code block syntax
     * 2. Send message
     * 3. Verify code block formatting is rendered
     */

    const codeBlock = testData.messages.markdown.codeBlock;

    campfire.log(`Sending code block: ${codeBlock}`);
    await campfire.sendMessage(codeBlock);

    // Verify the message exists (check for function name)
    await campfire.verifyMessageExists('hello');

    // Verify code block formatting (should be in a <pre> or <code> tag)
    const messages = await campfire.page.locator('.message__presentation');
    const lastMessage = messages.last();
    const codeBlockTag = await lastMessage.locator('pre, code').count();

    expect(codeBlockTag).toBeGreaterThanOrEqual(1);

    campfire.log('✓ Test 2.5 passed: Code block formatting works');
  });

  test('2.6 Link Formatting', async () => {
    /**
     * Test Case: Create a link in message
     *
     * Steps:
     * 1. Type text with markdown link syntax
     * 2. Send message
     * 3. Verify link is rendered as clickable anchor
     */

    const linkText = testData.messages.markdown.link;

    campfire.log(`Sending link: ${linkText}`);
    await campfire.sendMessage(linkText);

    // Verify the message exists
    await campfire.verifyMessageExists('Click here');

    // Verify link is rendered (should be in an <a> tag)
    const messages = await campfire.page.locator('.message__presentation');
    const lastMessage = messages.last();
    const linkTag = await lastMessage.locator('a[href]').count();

    expect(linkTag).toBeGreaterThanOrEqual(1);

    // Verify the href attribute
    const href = await lastMessage.locator('a').first().getAttribute('href');
    expect(href).toContain('example.com');

    campfire.log('✓ Test 2.6 passed: Link formatting works');
  });

  test('2.7 Ordered List Formatting', async () => {
    /**
     * Test Case: Create an ordered list
     *
     * Steps:
     * 1. Type text with markdown ordered list syntax
     * 2. Send message
     * 3. Verify list is rendered correctly
     */

    const orderedList = testData.messages.markdown.orderedList;

    campfire.log(`Sending ordered list: ${orderedList}`);
    await campfire.sendMessage(orderedList);

    // Verify the message exists
    await campfire.verifyMessageExists('First item');

    // Verify ordered list formatting (should be in an <ol> tag)
    const messages = await campfire.page.locator('.message__presentation');
    const lastMessage = messages.last();
    const olTag = await lastMessage.locator('ol').count();

    expect(olTag).toBeGreaterThanOrEqual(1);

    // Verify list items
    const liCount = await lastMessage.locator('li').count();
    expect(liCount).toBeGreaterThanOrEqual(3);

    campfire.log('✓ Test 2.7 passed: Ordered list formatting works');
  });

  test('2.8 Unordered List Formatting', async () => {
    /**
     * Test Case: Create an unordered list
     *
     * Steps:
     * 1. Type text with markdown unordered list syntax
     * 2. Send message
     * 3. Verify list is rendered correctly
     */

    const unorderedList = testData.messages.markdown.unorderedList;

    campfire.log(`Sending unordered list: ${unorderedList}`);
    await campfire.sendMessage(unorderedList);

    // Verify the message exists
    await campfire.verifyMessageExists('First item');

    // Verify unordered list formatting (should be in a <ul> tag)
    const messages = await campfire.page.locator('.message__presentation');
    const lastMessage = messages.last();
    const ulTag = await lastMessage.locator('ul').count();

    expect(ulTag).toBeGreaterThanOrEqual(1);

    // Verify list items
    const liCount = await lastMessage.locator('li').count();
    expect(liCount).toBeGreaterThanOrEqual(3);

    campfire.log('✓ Test 2.8 passed: Unordered list formatting works');
  });

  test('2.9 Heading Formatting', async () => {
    /**
     * Test Case: Create headings
     *
     * Steps:
     * 1. Send messages with different heading levels
     * 2. Verify headings are rendered correctly
     */

    const heading1 = testData.messages.markdown.heading1;
    const heading2 = testData.messages.markdown.heading2;
    const heading3 = testData.messages.markdown.heading3;

    // Test H1
    campfire.log(`Sending H1: ${heading1}`);
    await campfire.sendMessage(heading1);
    await campfire.verifyMessageExists('Heading 1');

    // Verify H1 tag
    let messages = await campfire.page.locator('.message__presentation');
    let lastMessage = messages.last();
    let h1Tag = await lastMessage.locator('h1').count();
    expect(h1Tag).toBeGreaterThanOrEqual(1);

    // Test H2
    campfire.log(`Sending H2: ${heading2}`);
    await campfire.sendMessage(heading2);
    await campfire.verifyMessageExists('Heading 2');

    // Verify H2 tag
    messages = await campfire.page.locator('.message__presentation');
    lastMessage = messages.last();
    let h2Tag = await lastMessage.locator('h2').count();
    expect(h2Tag).toBeGreaterThanOrEqual(1);

    // Test H3
    campfire.log(`Sending H3: ${heading3}`);
    await campfire.sendMessage(heading3);
    await campfire.verifyMessageExists('Heading 3');

    // Verify H3 tag
    messages = await campfire.page.locator('.message__presentation');
    lastMessage = messages.last();
    let h3Tag = await lastMessage.locator('h3').count();
    expect(h3Tag).toBeGreaterThanOrEqual(1);

    campfire.log('✓ Test 2.9 passed: Heading formatting works');
  });

  test('2.10 Mixed Formatting', async () => {
    /**
     * Test Case: Use multiple formatting types in one message
     *
     * Steps:
     * 1. Send message with multiple formatting types
     * 2. Verify all formatting is rendered correctly
     */

    const mixedText = testData.messages.markdown.mixed;

    campfire.log(`Sending mixed formatting: ${mixedText}`);
    await campfire.sendMessage(mixedText);

    // Verify the message exists
    await campfire.verifyMessageExists('Test Message');

    // Verify multiple formatting elements exist
    const messages = await campfire.page.locator('.message__presentation');
    const lastMessage = messages.last();

    // Check for heading
    const headingCount = await lastMessage.locator('h1, h2, h3, h4, h5, h6').count();
    expect(headingCount).toBeGreaterThanOrEqual(1);

    // Check for bold
    const boldCount = await lastMessage.locator('strong, b').count();
    expect(boldCount).toBeGreaterThanOrEqual(1);

    // Check for italic
    const italicCount = await lastMessage.locator('em, i').count();
    expect(italicCount).toBeGreaterThanOrEqual(1);

    // Check for code
    const codeCount = await lastMessage.locator('code').count();
    expect(codeCount).toBeGreaterThanOrEqual(1);

    // Check for link
    const linkCount = await lastMessage.locator('a[href]').count();
    expect(linkCount).toBeGreaterThanOrEqual(1);

    campfire.log('✓ Test 2.10 passed: Mixed formatting works');
  });

  test('2.11 Emoji Support', async () => {
    /**
     * Test Case: Send messages with emojis
     *
     * Steps:
     * 1. Send message with emoji
     * 2. Verify emoji is displayed correctly
     */

    const emojiMessage = testData.messages.withEmoji;

    campfire.log(`Sending emoji message: ${emojiMessage}`);
    await campfire.sendMessage(emojiMessage);

    // Verify the message exists with emoji
    await campfire.verifyMessageExists('👋');
    await campfire.verifyMessageExists('🌍');

    campfire.log('✓ Test 2.11 passed: Emoji support works');
  });

  test('2.12 Multiline Message', async () => {
    /**
     * Test Case: Send multiline messages
     *
     * Steps:
     * 1. Send message with line breaks
     * 2. Verify line breaks are preserved
     */

    const multilineMessage = testData.messages.multiline;

    campfire.log(`Sending multiline message: ${multilineMessage}`);
    await campfire.sendMessage(multilineMessage);

    // Verify the message exists
    await campfire.verifyMessageExists('This is a message');
    await campfire.verifyMessageExists('with multiple lines');

    campfire.log('✓ Test 2.12 passed: Multiline messages work');
  });

  test('2.13 RTL (Right-to-Left) Text Support', async () => {
    /**
     * Test Case: Send messages with RTL languages
     *
     * Steps:
     * 1. Send message with Arabic text
     * 2. Verify text is displayed correctly
     */

    const rtlMessage = testData.messages.edgeCases.rtl;

    campfire.log(`Sending RTL message: ${rtlMessage}`);
    await campfire.sendMessage(rtlMessage);

    // Verify the message exists
    await campfire.verifyMessageExists('مرحبا');

    // Verify dir="auto" attribute is present (for RTL support)
    const messages = await campfire.page.locator('.message__presentation');
    const lastMessage = messages.last();
    const dirAttr = await lastMessage.getAttribute('dir');

    // Should have dir="auto" for automatic RTL detection
    expect(dirAttr).toBe('auto');

    campfire.log('✓ Test 2.13 passed: RTL text support works');
  });
});
