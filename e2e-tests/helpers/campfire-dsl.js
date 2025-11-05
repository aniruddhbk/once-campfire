/**
 * Campfire Test DSL (Domain Specific Language)
 *
 * This class provides a high-level, intuitive API for testing the Campfire application.
 * It abstracts away the low-level Playwright API and provides methods that match
 * the domain language of the application.
 *
 * Benefits:
 * - Readable tests that read like user stories
 * - Resilient to UI changes (selectors are centralized)
 * - Reusable across all test cases
 * - Easy to maintain and extend
 *
 * Usage:
 *   const campfire = new CampfireDSL(page);
 *   await campfire.login('user@example.com', 'password');
 *   await campfire.createRoom('My Room');
 *   await campfire.sendMessage('Hello!');
 */

const { expect } = require('@playwright/test');

class CampfireDSL {
  constructor(page) {
    this.page = page;
    this.baseURL = process.env.BASE_URL || 'http://localhost:3000';
  }

  // ============================================================================
  // NAVIGATION & SETUP
  // ============================================================================

  /**
   * Navigate to the home page
   */
  async goto(path = '/') {
    await this.page.goto(`${this.baseURL}${path}`, { waitUntil: 'networkidle' });
  }

  /**
   * Wait for Turbo/Hotwire to finish loading
   */
  async waitForTurboLoad() {
    // Wait for turbo:load event which indicates page is ready
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(500); // Small buffer for ActionCable connections
  }

  /**
   * Wait for a specific element to be visible
   */
  async waitForElement(selector, options = {}) {
    return await this.page.waitForSelector(selector, {
      state: 'visible',
      timeout: 10000,
      ...options
    });
  }

  // ============================================================================
  // AUTHENTICATION
  // ============================================================================

  /**
   * Login to the application
   * @param {string} email - User email address
   * @param {string} password - User password
   */
  async login(email, password) {
    // Go to login page
    await this.goto('/session/new');

    // Fill in credentials
    await this.page.fill('input[type="email"]', email);
    await this.page.fill('input[type="password"]', password);

    // Click login button
    await this.page.click('button[name="log_in"]');

    // Wait for redirect to complete
    await this.waitForTurboLoad();

    // Verify we're logged in by checking for sidebar or rooms
    await this.waitForElement('.sidebar__container', { timeout: 15000 });
  }

  /**
   * Logout from the application
   */
  async logout() {
    // Click user profile/settings
    await this.page.click('a[href*="/users/me/profile"]');
    await this.waitForTurboLoad();

    // Find and click logout button
    await this.page.click('a[href="/session"]');
    await this.waitForTurboLoad();
  }

  // ============================================================================
  // ROOM/CHANNEL MANAGEMENT
  // ============================================================================

  /**
   * Create a new room/channel
   * @param {string} roomName - Name of the room to create
   * @param {object} options - Additional options (type: 'open' | 'closed')
   */
  async createRoom(roomName, options = { type: 'open' }) {
    // Click the new room button in the sidebar
    await this.page.click('a.rooms__new-btn');
    await this.waitForTurboLoad();

    // Wait for the room form to appear
    await this.waitForElement('input[name="room[name]"]');

    // Clear default name and enter new room name
    await this.page.fill('input[name="room[name]"]', roomName);

    // Submit the form
    await this.page.click('button[type="submit"]');

    // Wait for room to be created and loaded
    await this.waitForTurboLoad();

    // Verify we're in the new room
    await this.verifyCurrentRoom(roomName);
  }

  /**
   * Navigate to a specific room by name
   * @param {string} roomName - Name of the room to navigate to
   */
  async navigateToRoom(roomName) {
    // Find the room in the sidebar and click it
    const roomLink = await this.page.locator('.room', { hasText: roomName }).first();
    await roomLink.click();

    // Wait for room to load
    await this.waitForTurboLoad();

    // Verify we're in the correct room
    await this.verifyCurrentRoom(roomName);
  }

  /**
   * Get the current room name
   */
  async getCurrentRoomName() {
    // The room name is in the nav header
    const roomHeader = await this.page.locator('.room-header__name, nav h1').first();
    return await roomHeader.textContent();
  }

  /**
   * Verify we're in a specific room
   */
  async verifyCurrentRoom(expectedRoomName) {
    // Check the room appears in the sidebar as active or in the header
    const isVisible = await this.page.locator('text=' + expectedRoomName).first().isVisible();
    expect(isVisible).toBe(true);
  }

  /**
   * Delete the current room
   */
  async deleteCurrentRoom() {
    // Click room settings/options
    await this.page.click('[data-action*="popup"]');

    // Click delete button
    await this.page.click('button:has-text("Delete")');

    // Confirm deletion if there's a confirmation dialog
    await this.page.click('button:has-text("Confirm")').catch(() => {});

    await this.waitForTurboLoad();
  }

  /**
   * Get list of all rooms in sidebar
   */
  async getRoomsList() {
    const rooms = await this.page.locator('.room').allTextContents();
    return rooms.filter(text => text.trim().length > 0);
  }

  // ============================================================================
  // MESSAGING
  // ============================================================================

  /**
   * Send a message in the current room
   * @param {string} content - The message content to send
   * @param {object} options - Additional options (pressEnter: boolean)
   */
  async sendMessage(content, options = { pressEnter: true }) {
    // Focus on the composer
    const composer = await this.page.locator('trix-editor').first();
    await composer.click();

    // Type the message
    await composer.fill(content);

    // Send the message
    if (options.pressEnter) {
      await this.page.keyboard.press('Enter');
    } else {
      await this.page.click('button[name="send"]');
    }

    // Wait for message to be sent and appear
    await this.page.waitForTimeout(1000); // Wait for optimistic update + server confirmation

    // Verify message appears
    await this.verifyMessageExists(content);
  }

  /**
   * Send a message using the rich text editor
   * @param {string} content - HTML content to insert
   */
  async sendRichMessage(content) {
    const composer = await this.page.locator('trix-editor').first();

    // Use JavaScript to set HTML content directly
    await composer.evaluate((el, html) => {
      el.editor.loadHTML(html);
    }, content);

    // Click send button
    await this.page.click('button[name="send"]');

    // Wait for message to appear
    await this.page.waitForTimeout(1000);
  }

  /**
   * Type text in the composer without sending
   * @param {string} content - Text to type
   */
  async typeInComposer(content) {
    const composer = await this.page.locator('trix-editor').first();
    await composer.click();
    await composer.fill(content);
  }

  /**
   * Clear the composer
   */
  async clearComposer() {
    const composer = await this.page.locator('trix-editor').first();
    await composer.click();
    await composer.fill('');
  }

  /**
   * Get the composer content
   */
  async getComposerContent() {
    const composer = await this.page.locator('trix-editor').first();
    return await composer.textContent();
  }

  /**
   * Verify a message exists in the current room
   * @param {string} content - The message content to look for
   */
  async verifyMessageExists(content) {
    const message = await this.page.locator('.message__body', { hasText: content }).first();
    await expect(message).toBeVisible({ timeout: 10000 });
  }

  /**
   * Get all messages in the current room
   */
  async getAllMessages() {
    const messages = await this.page.locator('.message__body-content').allTextContents();
    return messages.map(msg => msg.trim()).filter(msg => msg.length > 0);
  }

  /**
   * Get the latest message in the room
   */
  async getLatestMessage() {
    const messages = await this.page.locator('.message__body-content').all();
    if (messages.length === 0) return null;

    const lastMessage = messages[messages.length - 1];
    return await lastMessage.textContent();
  }

  /**
   * Get message count in current room
   */
  async getMessageCount() {
    const messages = await this.page.locator('.message').count();
    return messages;
  }

  // ============================================================================
  // MESSAGE INTERACTIONS
  // ============================================================================

  /**
   * Get a message element by its content or index
   * @param {string|number} identifier - Message content or index
   */
  async getMessageElement(identifier) {
    if (typeof identifier === 'number') {
      return await this.page.locator('.message').nth(identifier);
    } else {
      return await this.page.locator('.message', { hasText: identifier }).first();
    }
  }

  /**
   * Hover over a message to reveal actions
   * @param {string|number} messageIdentifier - Message content or index
   */
  async hoverOverMessage(messageIdentifier) {
    const message = await this.getMessageElement(messageIdentifier);
    await message.hover();
    await this.page.waitForTimeout(300); // Wait for hover effects
  }

  /**
   * Edit a message
   * @param {string|number} messageIdentifier - Original message content or index
   * @param {string} newContent - New message content
   */
  async editMessage(messageIdentifier, newContent) {
    // Hover over message to show actions
    await this.hoverOverMessage(messageIdentifier);

    // Click edit button
    const message = await this.getMessageElement(messageIdentifier);
    const editButton = await message.locator('a[href*="/edit"], button.message__edit-btn').first();
    await editButton.click();

    // Wait for edit form
    await this.waitForElement('trix-editor');

    // Clear and type new content
    const editor = await this.page.locator('trix-editor').first();
    await editor.click();
    await editor.fill(newContent);

    // Submit the edit
    await this.page.click('button[type="submit"]');

    // Wait for update
    await this.page.waitForTimeout(1000);
  }

  /**
   * Delete a message
   * @param {string|number} messageIdentifier - Message content or index
   */
  async deleteMessage(messageIdentifier) {
    // Hover over message to show actions
    await this.hoverOverMessage(messageIdentifier);

    // Click delete button
    const message = await this.getMessageElement(messageIdentifier);
    const deleteButton = await message.locator('button[data-turbo-method="delete"], .message__delete-btn').first();
    await deleteButton.click();

    // Wait for deletion
    await this.page.waitForTimeout(1000);
  }

  /**
   * Verify message is deleted
   * @param {string} content - Message content that should be deleted
   */
  async verifyMessageDeleted(content) {
    const message = this.page.locator('.message__body', { hasText: content });
    await expect(message).toHaveCount(0, { timeout: 5000 });
  }

  /**
   * Add a boost/reaction to a message
   * @param {string|number} messageIdentifier - Message content or index
   * @param {string} emoji - Emoji to use as reaction (default: '👍')
   */
  async boostMessage(messageIdentifier, emoji = '👍') {
    // Hover over message
    await this.hoverOverMessage(messageIdentifier);

    // Click boost button
    const message = await this.getMessageElement(messageIdentifier);
    const boostButton = await message.locator('a[href*="/boosts"], .boost__action').first();
    await boostButton.click();

    // Wait for boost modal/form
    await this.page.waitForTimeout(500);

    // Type emoji
    await this.page.locator('input[name="boost[content]"], trix-editor').first().fill(emoji);

    // Submit boost
    await this.page.click('button[type="submit"]');

    // Wait for boost to appear
    await this.page.waitForTimeout(1000);
  }

  /**
   * Verify a message has a specific boost
   * @param {string|number} messageIdentifier - Message content or index
   * @param {string} emoji - Expected emoji
   */
  async verifyMessageBoost(messageIdentifier, emoji) {
    const message = await this.getMessageElement(messageIdentifier);
    const boost = await message.locator('.boost, .boosts', { hasText: emoji });
    await expect(boost).toBeVisible();
  }

  // ============================================================================
  // RICH TEXT / MARKDOWN FORMATTING
  // ============================================================================

  /**
   * Toggle the rich text toolbar
   */
  async toggleRichTextToolbar() {
    await this.page.click('button[data-action*="toggleToolbar"]');
    await this.page.waitForTimeout(300);
  }

  /**
   * Apply formatting to text in the composer
   * @param {string} formatting - Type of formatting ('bold', 'italic', 'strike', 'code', 'link', 'heading1', etc.)
   * @param {string} text - Text to format
   */
  async formatText(formatting, text) {
    const composer = await this.page.locator('trix-editor').first();
    await composer.click();

    // Show toolbar if not visible
    await this.toggleRichTextToolbar();

    // Type the text
    await composer.fill(text);

    // Select all text
    await this.page.keyboard.press('Control+A');

    // Apply formatting based on type
    const formatMap = {
      'bold': () => this.page.keyboard.press('Control+B'),
      'italic': () => this.page.keyboard.press('Control+I'),
      'strike': () => this.page.click('button[data-trix-attribute="strike"]'),
      'code': () => this.page.click('button[data-trix-attribute="code"]'),
      'heading1': () => this.page.click('button[data-trix-attribute="heading1"]'),
      'quote': () => this.page.click('button[data-trix-attribute="quote"]'),
      'list': () => this.page.keyboard.press('Control+Shift+7'),
      'bullet': () => this.page.keyboard.press('Control+Shift+8'),
    };

    if (formatMap[formatting]) {
      await formatMap[formatting]();
    }

    // Click at the end to deselect
    await this.page.keyboard.press('End');
  }

  /**
   * Insert a code block
   * @param {string} code - Code to insert
   * @param {string} language - Programming language (optional)
   */
  async insertCodeBlock(code, language = '') {
    const composer = await this.page.locator('trix-editor').first();
    await composer.click();

    // Show toolbar
    await this.toggleRichTextToolbar();

    // Click code button
    await this.page.click('button[data-trix-attribute="code"]');

    // Type code
    await composer.fill(code);
  }

  /**
   * Insert a link
   * @param {string} text - Link text
   * @param {string} url - URL
   */
  async insertLink(text, url) {
    const composer = await this.page.locator('trix-editor').first();
    await composer.click();

    // Show toolbar
    await this.toggleRichTextToolbar();

    // Type text
    await composer.fill(text);

    // Select text
    await this.page.keyboard.press('Control+A');

    // Click link button
    await this.page.click('button[data-trix-action="link"]');

    // Fill URL in dialog
    await this.page.fill('input[name="href"]', url);

    // Confirm
    await this.page.keyboard.press('Enter');
  }

  /**
   * Verify message has specific formatting
   * @param {string|number} messageIdentifier - Message to check
   * @param {string} formattingSelector - CSS selector for formatting element (e.g., 'strong', 'em', 'code')
   */
  async verifyMessageFormatting(messageIdentifier, formattingSelector) {
    const message = await this.getMessageElement(messageIdentifier);
    const formatted = await message.locator(formattingSelector);
    await expect(formatted).toBeVisible();
  }

  // ============================================================================
  // FILE ATTACHMENTS
  // ============================================================================

  /**
   * Attach a file to a message
   * @param {string} filePath - Path to file to attach
   */
  async attachFile(filePath) {
    const fileInput = await this.page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(filePath);

    // Wait for file to be processed
    await this.page.waitForTimeout(1000);
  }

  /**
   * Send a message with an attachment
   * @param {string} filePath - Path to file
   * @param {string} message - Optional message text
   */
  async sendMessageWithAttachment(filePath, message = '') {
    await this.attachFile(filePath);

    if (message) {
      await this.typeInComposer(message);
    }

    await this.page.click('button[name="send"]');
    await this.page.waitForTimeout(2000); // Wait for upload
  }

  // ============================================================================
  // SEARCH
  // ============================================================================

  /**
   * Search for messages
   * @param {string} query - Search query
   */
  async searchMessages(query) {
    // Click search button
    await this.page.click('a[href="/searches"]');
    await this.waitForTurboLoad();

    // Type search query
    await this.page.fill('input[type="search"]', query);

    // Submit search
    await this.page.keyboard.press('Enter');

    // Wait for results
    await this.waitForTurboLoad();
  }

  /**
   * Get search results count
   */
  async getSearchResultsCount() {
    const results = await this.page.locator('.search-result, .message').count();
    return results;
  }

  // ============================================================================
  // PRESENCE & TYPING INDICATORS
  // ============================================================================

  /**
   * Verify typing indicator is shown
   */
  async verifyTypingIndicator() {
    const indicator = await this.page.locator('.typing-indicator');
    await expect(indicator).toBeVisible();
  }

  /**
   * Verify user is shown as online
   * @param {string} userName - User name to check
   */
  async verifyUserOnline(userName) {
    const userElement = await this.page.locator('.user', { hasText: userName });
    const onlineIndicator = await userElement.locator('.online, .presence--online');
    await expect(onlineIndicator).toBeVisible();
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Take a screenshot
   * @param {string} name - Screenshot name
   */
  async screenshot(name) {
    await this.page.screenshot({ path: `e2e-tests/screenshots/${name}.png`, fullPage: true });
  }

  /**
   * Wait for a specific time
   * @param {number} ms - Milliseconds to wait
   */
  async wait(ms) {
    await this.page.waitForTimeout(ms);
  }

  /**
   * Reload the page
   */
  async reload() {
    await this.page.reload();
    await this.waitForTurboLoad();
  }

  /**
   * Get page title
   */
  async getTitle() {
    return await this.page.title();
  }

  /**
   * Check if element exists
   * @param {string} selector - CSS selector
   */
  async elementExists(selector) {
    return await this.page.locator(selector).count() > 0;
  }

  /**
   * Get element text content
   * @param {string} selector - CSS selector
   */
  async getTextContent(selector) {
    return await this.page.locator(selector).textContent();
  }

  /**
   * Assert page contains text
   * @param {string} text - Text to find
   */
  async assertPageContains(text) {
    await expect(this.page.locator(`text=${text}`)).toBeVisible();
  }

  /**
   * Assert page does not contain text
   * @param {string} text - Text that should not be present
   */
  async assertPageNotContains(text) {
    await expect(this.page.locator(`text=${text}`)).toHaveCount(0);
  }

  /**
   * Execute JavaScript in the browser context
   * @param {Function} fn - Function to execute
   * @param {any} arg - Argument to pass to function
   */
  async evaluate(fn, arg) {
    return await this.page.evaluate(fn, arg);
  }

  /**
   * Console log in the test output
   * @param {string} message - Message to log
   */
  log(message) {
    console.log(`[Campfire DSL] ${message}`);
  }
}

module.exports = CampfireDSL;
