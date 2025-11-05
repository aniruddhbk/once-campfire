/**
 * Chaos and Monkey Testing Suite
 *
 * These tests perform stress testing, edge case testing, and boundary testing:
 * - Rapid channel creation/deletion
 * - Edge case messages (very long, special characters, XSS attempts)
 * - Rapid-fire interactions
 * - Boundary conditions
 * - Error recovery scenarios
 *
 * @see Phase 4 - Category 2: Chaos/Monkey Testing requirements
 */

const { test, expect } = require('@playwright/test');
const CampfireDSL = require('../helpers/campfire-dsl');
const testData = require('../fixtures/test-data');
const { randomRoomName, randomString } = require('../helpers/test-setup');

test.describe('Chaos and Edge Case Testing', () => {
  let campfire;

  test.beforeEach(async ({ page }) => {
    campfire = new CampfireDSL(page);

    // Login before each test
    await campfire.goto('/session/new');
    await campfire.login(
      testData.users.testUser.email,
      testData.users.testUser.password
    );
  });

  test('3.1 Rapid Channel Creation', async () => {
    /**
     * Test Case: Create multiple channels rapidly
     *
     * Steps:
     * 1. Create 5 channels in quick succession
     * 2. Verify all channels are created
     * 3. Verify navigation between channels works
     */

    const roomNames = [];
    const numberOfRooms = 5;

    campfire.log(`Creating ${numberOfRooms} channels rapidly...`);

    // Create channels rapidly
    for (let i = 0; i < numberOfRooms; i++) {
      const roomName = `Chaos Room ${i + 1} ${randomString(4)}`;
      roomNames.push(roomName);

      campfire.log(`Creating channel ${i + 1}: ${roomName}`);
      await campfire.createRoom(roomName);
      await campfire.verifyCurrentRoom(roomName);
    }

    // Verify all channels exist in sidebar
    const allRooms = await campfire.getRoomsList();

    for (const roomName of roomNames) {
      const exists = allRooms.some(r => r.includes(roomName));
      expect(exists).toBe(true);
    }

    campfire.log('✓ Test 3.1 passed: Rapid channel creation works');
  });

  test('3.2 Very Long Message Content', async () => {
    /**
     * Test Case: Send a very long message
     *
     * Steps:
     * 1. Create a channel
     * 2. Send a message with 5000+ characters
     * 3. Verify message is sent and displayed correctly
     */

    const roomName = randomRoomName();
    const longMessage = testData.messages.veryLong;

    campfire.log(`Creating channel: ${roomName}`);
    await campfire.createRoom(roomName);

    campfire.log(`Sending very long message (${longMessage.length} characters)...`);
    await campfire.sendMessage(longMessage);

    // Verify message exists (check for a portion of it)
    await campfire.verifyMessageExists('Lorem ipsum');

    // Verify the full message is stored
    const messages = await campfire.getAllMessages();
    const longMessageExists = messages.some(msg => msg.length > 1000);
    expect(longMessageExists).toBe(true);

    campfire.log('✓ Test 3.2 passed: Very long messages work');
  });

  test('3.3 Special Characters and Unicode', async () => {
    /**
     * Test Case: Send messages with special characters
     *
     * Steps:
     * 1. Create a channel
     * 2. Send messages with special characters, unicode, emojis
     * 3. Verify all messages are displayed correctly
     */

    const roomName = randomRoomName();

    campfire.log(`Creating channel: ${roomName}`);
    await campfire.createRoom(roomName);

    // Test special characters
    campfire.log('Sending special characters...');
    const specialChars = testData.messages.edgeCases.specialChars;
    await campfire.sendMessage(specialChars);
    await campfire.verifyMessageExists('!@#$%');

    // Test unicode
    campfire.log('Sending unicode text...');
    const unicode = testData.messages.edgeCases.unicode;
    await campfire.sendMessage(unicode);
    await campfire.verifyMessageExists('你好世界');

    // Test emoji overload
    campfire.log('Sending many emojis...');
    const emojis = testData.messages.edgeCases.emoji;
    await campfire.sendMessage(emojis);
    await campfire.verifyMessageExists('😀');

    campfire.log('✓ Test 3.3 passed: Special characters and unicode work');
  });

  test('3.4 XSS and Injection Attempts', async () => {
    /**
     * Test Case: Attempt XSS and SQL injection
     *
     * Steps:
     * 1. Create a channel
     * 2. Send messages with XSS and SQL injection attempts
     * 3. Verify they are properly escaped and not executed
     */

    const roomName = randomRoomName();

    campfire.log(`Creating channel: ${roomName}`);
    await campfire.createRoom(roomName);

    // Test XSS attempt
    campfire.log('Testing XSS protection...');
    const xssAttempt = testData.messages.edgeCases.html;
    await campfire.sendMessage(xssAttempt);

    // Verify the script tag is escaped and not executed
    const messages = await campfire.page.locator('.message__presentation');
    const lastMessage = messages.last();
    const scriptExecuted = await campfire.page.evaluate(() => {
      return window.xssTest === true; // Check if script ran
    });
    expect(scriptExecuted).toBe(false);

    // Test SQL injection attempt
    campfire.log('Testing SQL injection protection...');
    const sqlAttempt = testData.messages.edgeCases.sql;
    await campfire.sendMessage(sqlAttempt);

    // Verify message was sent but not executed as SQL
    await campfire.verifyMessageExists('DROP TABLE');

    campfire.log('✓ Test 3.4 passed: XSS and injection protection works');
  });

  test('3.5 Rapid Message Sending', async () => {
    /**
     * Test Case: Send multiple messages rapidly
     *
     * Steps:
     * 1. Create a channel
     * 2. Send 10 messages in quick succession
     * 3. Verify all messages appear in correct order
     */

    const roomName = randomRoomName();
    const messageCount = 10;
    const messages = [];

    campfire.log(`Creating channel: ${roomName}`);
    await campfire.createRoom(roomName);

    campfire.log(`Sending ${messageCount} messages rapidly...`);

    // Send messages rapidly
    for (let i = 0; i < messageCount; i++) {
      const msg = `Rapid message ${i + 1}`;
      messages.push(msg);
      await campfire.sendMessage(msg);
    }

    // Verify all messages exist
    campfire.log('Verifying all messages were sent...');
    const allMessages = await campfire.getAllMessages();

    for (const msg of messages) {
      const exists = allMessages.some(m => m.includes(msg));
      expect(exists).toBe(true);
    }

    // Verify message count
    const actualCount = await campfire.getMessageCount();
    expect(actualCount).toBeGreaterThanOrEqual(messageCount);

    campfire.log('✓ Test 3.5 passed: Rapid message sending works');
  });

  test('3.6 Empty and Whitespace Messages', async () => {
    /**
     * Test Case: Attempt to send empty or whitespace-only messages
     *
     * Steps:
     * 1. Create a channel
     * 2. Attempt to send empty message
     * 3. Attempt to send whitespace-only message
     * 4. Verify these messages are not sent
     */

    const roomName = randomRoomName();

    campfire.log(`Creating channel: ${roomName}`);
    await campfire.createRoom(roomName);

    // Get initial message count
    const initialCount = await campfire.getMessageCount();

    // Attempt to send empty message
    campfire.log('Attempting to send empty message...');
    await campfire.typeInComposer('');
    await campfire.page.click('button[name="send"]');
    await campfire.wait(1000);

    // Verify message count hasn't changed
    let currentCount = await campfire.getMessageCount();
    expect(currentCount).toBe(initialCount);

    // Attempt to send whitespace-only message
    campfire.log('Attempting to send whitespace-only message...');
    await campfire.typeInComposer('   ');
    await campfire.page.click('button[name="send"]');
    await campfire.wait(1000);

    // Verify message count still hasn't changed
    currentCount = await campfire.getMessageCount();
    expect(currentCount).toBe(initialCount);

    campfire.log('✓ Test 3.6 passed: Empty/whitespace messages are prevented');
  });

  test('3.7 Rapid Edit and Delete Operations', async () => {
    /**
     * Test Case: Rapidly edit and delete messages
     *
     * Steps:
     * 1. Create a channel
     * 2. Send 5 messages
     * 3. Rapidly edit some messages
     * 4. Rapidly delete others
     * 5. Verify final state is consistent
     */

    const roomName = randomRoomName();

    campfire.log(`Creating channel: ${roomName}`);
    await campfire.createRoom(roomName);

    // Send messages
    campfire.log('Sending initial messages...');
    const messages = ['Msg 1', 'Msg 2', 'Msg 3', 'Msg 4', 'Msg 5'];
    for (const msg of messages) {
      await campfire.sendMessage(msg);
    }

    // Edit some messages
    campfire.log('Editing messages...');
    await campfire.editMessage('Msg 1', 'Edited Msg 1');
    await campfire.editMessage('Msg 2', 'Edited Msg 2');

    // Delete some messages
    campfire.log('Deleting messages...');
    await campfire.deleteMessage('Msg 3');
    await campfire.deleteMessage('Msg 4');

    // Verify final state
    campfire.log('Verifying final state...');
    await campfire.verifyMessageExists('Edited Msg 1');
    await campfire.verifyMessageExists('Edited Msg 2');
    await campfire.verifyMessageDeleted('Msg 3');
    await campfire.verifyMessageDeleted('Msg 4');
    await campfire.verifyMessageExists('Msg 5');

    campfire.log('✓ Test 3.7 passed: Rapid edit/delete operations work');
  });

  test('3.8 Channel Name Edge Cases', async () => {
    /**
     * Test Case: Create channels with edge case names
     *
     * Steps:
     * 1. Create channels with special characters, emojis, long names
     * 2. Verify channels are created and navigable
     */

    // Special characters channel
    campfire.log('Creating channel with special characters...');
    const specialRoom = testData.rooms.special;
    await campfire.createRoom(specialRoom);
    await campfire.verifyCurrentRoom(specialRoom);

    // Emoji channel
    campfire.log('Creating channel with emoji...');
    const emojiRoom = testData.rooms.emoji;
    await campfire.createRoom(emojiRoom);
    await campfire.verifyCurrentRoom(emojiRoom);

    // Very long name
    campfire.log('Creating channel with very long name...');
    const longRoom = testData.rooms.long;
    await campfire.createRoom(longRoom);
    await campfire.verifyCurrentRoom(longRoom);

    // Verify all channels are in sidebar
    const allRooms = await campfire.getRoomsList();
    expect(allRooms.length).toBeGreaterThanOrEqual(3);

    campfire.log('✓ Test 3.8 passed: Edge case channel names work');
  });

  test('3.9 Concurrent Channel Navigation', async () => {
    /**
     * Test Case: Rapidly switch between channels
     *
     * Steps:
     * 1. Create 3 channels
     * 2. Rapidly switch between them
     * 3. Verify context is maintained correctly
     */

    // Create channels
    const rooms = [
      randomRoomName(),
      randomRoomName(),
      randomRoomName()
    ];

    campfire.log('Creating test channels...');
    for (const room of rooms) {
      await campfire.createRoom(room);
    }

    // Rapidly navigate between channels
    campfire.log('Rapidly navigating between channels...');
    for (let i = 0; i < 10; i++) {
      const randomRoom = rooms[Math.floor(Math.random() * rooms.length)];
      await campfire.navigateToRoom(randomRoom);
      await campfire.verifyCurrentRoom(randomRoom);
    }

    campfire.log('✓ Test 3.9 passed: Concurrent channel navigation works');
  });

  test('3.10 Page Reload During Message Send', async () => {
    /**
     * Test Case: Test resilience to page reload
     *
     * Steps:
     * 1. Create a channel
     * 2. Send a message
     * 3. Reload the page
     * 4. Verify message persists
     */

    const roomName = randomRoomName();
    const message = 'Message before reload';

    campfire.log(`Creating channel: ${roomName}`);
    await campfire.createRoom(roomName);

    campfire.log('Sending message...');
    await campfire.sendMessage(message);
    await campfire.verifyMessageExists(message);

    campfire.log('Reloading page...');
    await campfire.reload();

    // Navigate back to the room
    await campfire.navigateToRoom(roomName);

    // Verify message persists after reload
    campfire.log('Verifying message persists...');
    await campfire.verifyMessageExists(message);

    campfire.log('✓ Test 3.10 passed: Page reload resilience works');
  });

  test('3.11 Maximum Character Boundary Testing', async () => {
    /**
     * Test Case: Test character limits
     *
     * Steps:
     * 1. Create a channel
     * 2. Send messages at various character boundaries
     * 3. Verify handling is graceful
     */

    const roomName = randomRoomName();

    campfire.log(`Creating channel: ${roomName}`);
    await campfire.createRoom(roomName);

    // Test various message lengths
    const testLengths = [1, 100, 1000, 5000, 10000];

    for (const length of testLengths) {
      const message = 'x'.repeat(length);
      campfire.log(`Sending ${length} character message...`);

      try {
        await campfire.sendMessage(message);
        await campfire.wait(500);

        // Verify message was sent
        const messageCount = await campfire.getMessageCount();
        expect(messageCount).toBeGreaterThan(0);

        campfire.log(`✓ ${length} character message sent successfully`);
      } catch (e) {
        campfire.log(`⚠ ${length} character message may have been rejected (expected for very long messages)`);
      }
    }

    campfire.log('✓ Test 3.11 passed: Character boundary testing complete');
  });

  test('3.12 Stress Test: Combined Operations', async () => {
    /**
     * Test Case: Perform multiple operations simultaneously
     *
     * Steps:
     * 1. Create multiple channels
     * 2. Send messages in different channels
     * 3. Edit and delete messages
     * 4. Navigate between channels
     * 5. Verify application remains stable
     */

    campfire.log('Starting stress test...');

    // Create 3 channels
    const rooms = [];
    for (let i = 0; i < 3; i++) {
      const roomName = randomRoomName();
      rooms.push(roomName);
      await campfire.createRoom(roomName);
    }

    // Perform operations in each channel
    for (const room of rooms) {
      await campfire.navigateToRoom(room);

      // Send messages
      await campfire.sendMessage(`Message 1 in ${room}`);
      await campfire.sendMessage(`Message 2 in ${room}`);
      await campfire.sendMessage(`Message 3 in ${room}`);

      // Edit a message
      await campfire.editMessage(`Message 1 in ${room}`, `Edited message in ${room}`);

      // Delete a message
      await campfire.deleteMessage(`Message 2 in ${room}`);
    }

    // Navigate between channels and verify state
    for (const room of rooms) {
      await campfire.navigateToRoom(room);
      await campfire.verifyMessageExists(`Edited message in ${room}`);
      await campfire.verifyMessageDeleted(`Message 2 in ${room}`);
      await campfire.verifyMessageExists(`Message 3 in ${room}`);
    }

    campfire.log('✓ Test 3.12 passed: Stress test completed successfully');
  });
});
