/**
 * Custom Playwright Assertions for Campfire
 *
 * This file provides Campfire-specific assertions that make tests more readable
 * and provide better error messages.
 *
 * Usage:
 *   const { expect } = require('./helpers/custom-assertions');
 *   await expect(page).toHaveMessage('Hello World');
 */

const { expect: baseExpect } = require('@playwright/test');

/**
 * Extend Playwright's expect with custom matchers
 */
exports.expect = baseExpect.extend({
  /**
   * Assert that a page has a message with specific content
   */
  async toHaveMessage(page, messageContent) {
    const messageLocator = page.locator('.message__body', { hasText: messageContent });
    const isVisible = await messageLocator.isVisible({ timeout: 5000 }).catch(() => false);

    return {
      message: () => `expected page to have message "${messageContent}"`,
      pass: isVisible,
      actual: isVisible ? 'message found' : 'message not found',
      expected: 'message found',
    };
  },

  /**
   * Assert that a page does not have a message with specific content
   */
  async notToHaveMessage(page, messageContent) {
    const messageLocator = page.locator('.message__body', { hasText: messageContent });
    const count = await messageLocator.count();

    return {
      message: () => `expected page not to have message "${messageContent}"`,
      pass: count === 0,
      actual: count > 0 ? 'message found' : 'message not found',
      expected: 'message not found',
    };
  },

  /**
   * Assert that a page is in a specific room
   */
  async toBeInRoom(page, roomName) {
    const roomLocator = page.locator('text=' + roomName).first();
    const isVisible = await roomLocator.isVisible({ timeout: 5000 }).catch(() => false);

    return {
      message: () => `expected to be in room "${roomName}"`,
      pass: isVisible,
      actual: isVisible ? 'in correct room' : 'not in room',
      expected: 'in correct room',
    };
  },

  /**
   * Assert that a room exists in the sidebar
   */
  async toHaveRoomInSidebar(page, roomName) {
    const roomLocator = page.locator('.room', { hasText: roomName });
    const isVisible = await roomLocator.isVisible({ timeout: 5000 }).catch(() => false);

    return {
      message: () => `expected room "${roomName}" to be in sidebar`,
      pass: isVisible,
      actual: isVisible ? 'room in sidebar' : 'room not in sidebar',
      expected: 'room in sidebar',
    };
  },

  /**
   * Assert that page is authenticated (user is logged in)
   */
  async toBeAuthenticated(page) {
    const sidebarVisible = await page.locator('.sidebar__container').isVisible({ timeout: 5000 }).catch(() => false);

    return {
      message: () => 'expected page to be authenticated',
      pass: sidebarVisible,
      actual: sidebarVisible ? 'authenticated' : 'not authenticated',
      expected: 'authenticated',
    };
  },

  /**
   * Assert that a message has formatting (bold, italic, code, etc.)
   */
  async toHaveFormatting(messageLocator, formattingType) {
    const formatMap = {
      bold: 'strong, b',
      italic: 'em, i',
      code: 'code',
      strikethrough: 'del, s, strike',
      link: 'a[href]',
      list: 'ul, ol',
      heading: 'h1, h2, h3, h4, h5, h6',
    };

    const selector = formatMap[formattingType] || formattingType;
    const formattedElement = messageLocator.locator(selector);
    const count = await formattedElement.count();

    return {
      message: () => `expected message to have ${formattingType} formatting`,
      pass: count > 0,
      actual: count > 0 ? `has ${formattingType}` : `no ${formattingType}`,
      expected: `has ${formattingType}`,
    };
  },

  /**
   * Assert that the composer is ready for input
   */
  async toHaveActiveComposer(page) {
    const composerLocator = page.locator('trix-editor');
    const isVisible = await composerLocator.isVisible({ timeout: 5000 }).catch(() => false);
    const isEnabled = !await composerLocator.isDisabled().catch(() => true);

    const isReady = isVisible && isEnabled;

    return {
      message: () => 'expected composer to be active and ready',
      pass: isReady,
      actual: isReady ? 'composer ready' : 'composer not ready',
      expected: 'composer ready',
    };
  },

  /**
   * Assert that a specific number of messages are visible
   */
  async toHaveMessageCount(page, expectedCount) {
    const messages = page.locator('.message');
    const actualCount = await messages.count();

    return {
      message: () => `expected ${expectedCount} messages, found ${actualCount}`,
      pass: actualCount === expectedCount,
      actual: actualCount,
      expected: expectedCount,
    };
  },

  /**
   * Assert that a typing indicator is visible
   */
  async toShowTypingIndicator(page) {
    const indicator = page.locator('.typing-indicator');
    const isVisible = await indicator.isVisible({ timeout: 5000 }).catch(() => false);

    return {
      message: () => 'expected typing indicator to be visible',
      pass: isVisible,
      actual: isVisible ? 'indicator visible' : 'indicator not visible',
      expected: 'indicator visible',
    };
  },

  /**
   * Assert that load time is within acceptable range
   */
  async toLoadWithin(page, maxMilliseconds) {
    const metrics = await page.evaluate(() => {
      const perfData = window.performance.timing;
      return perfData.loadEventEnd - perfData.navigationStart;
    });

    return {
      message: () => `expected page to load within ${maxMilliseconds}ms, took ${metrics}ms`,
      pass: metrics <= maxMilliseconds,
      actual: `${metrics}ms`,
      expected: `<= ${maxMilliseconds}ms`,
    };
  },

  /**
   * Assert that an element has accessible ARIA attributes
   */
  async toBeAccessible(locator) {
    const hasAriaLabel = await locator.getAttribute('aria-label').then(val => !!val).catch(() => false);
    const hasAriaLabelledBy = await locator.getAttribute('aria-labelledby').then(val => !!val).catch(() => false);
    const hasRole = await locator.getAttribute('role').then(val => !!val).catch(() => false);

    const isAccessible = hasAriaLabel || hasAriaLabelledBy || hasRole;

    return {
      message: () => 'expected element to have accessibility attributes',
      pass: isAccessible,
      actual: isAccessible ? 'has aria attributes' : 'missing aria attributes',
      expected: 'has aria attributes',
    };
  },

  /**
   * Assert that a boost/reaction exists on a message
   */
  async toHaveBoost(messageLocator, emoji) {
    const boostLocator = messageLocator.locator('.boost, .boosts', { hasText: emoji });
    const isVisible = await boostLocator.isVisible({ timeout: 5000 }).catch(() => false);

    return {
      message: () => `expected message to have boost "${emoji}"`,
      pass: isVisible,
      actual: isVisible ? 'has boost' : 'no boost',
      expected: 'has boost',
    };
  },

  /**
   * Assert that a room has unread messages indicator
   */
  async toHaveUnreadIndicator(page, roomName) {
    const roomLocator = page.locator('.room', { hasText: roomName });
    const unreadIndicator = roomLocator.locator('.unread, .badge');
    const hasIndicator = await unreadIndicator.count() > 0;

    return {
      message: () => `expected room "${roomName}" to have unread indicator`,
      pass: hasIndicator,
      actual: hasIndicator ? 'has indicator' : 'no indicator',
      expected: 'has indicator',
    };
  },
});

/**
 * Export additional utility matchers
 */
exports.customMatchers = {
  /**
   * Helper to check if text contains markdown formatting
   */
  hasMarkdown: (text, markdownType) => {
    const patterns = {
      bold: /\*\*(.*?)\*\*/,
      italic: /_(.*?)_/,
      code: /`(.*?)`/,
      link: /\[(.*?)\]\((.*?)\)/,
    };

    return patterns[markdownType]?.test(text) || false;
  },

  /**
   * Helper to validate email format
   */
  isValidEmail: (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  /**
   * Helper to check if string is a valid room name
   */
  isValidRoomName: (name) => {
    return typeof name === 'string' && name.trim().length > 0 && name.length <= 255;
  },
};
