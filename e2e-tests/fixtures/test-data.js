/**
 * Test Data Fixtures
 *
 * This file contains test data that will be used across all Playwright tests.
 * It includes user credentials, test content, and edge case data.
 */

module.exports = {
  // User credentials for testing
  users: {
    testUser: {
      email: 'test@campfire.local',
      password: 'password123',
      name: 'Test User'
    },
    admin: {
      email: 'admin@campfire.local',
      password: 'adminpass123',
      name: 'Admin User'
    }
  },

  // Channel/Room names for testing
  rooms: {
    basic: 'Test Room',
    secondary: 'Secondary Test Room',
    special: 'Special #Characters! Room 🔥',
    long: 'This is a very long room name that might cause layout issues and should be tested carefully',
    emoji: '🚀 Rocket Room 🌟'
  },

  // Message content for testing
  messages: {
    simple: 'Hello, world!',
    multiline: 'This is a message\nwith multiple lines\nfor testing',
    withEmoji: 'Hello 👋 World 🌍',
    withMention: '@Test User how are you?',
    veryLong: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(50),

    // Markdown test content
    markdown: {
      bold: '**Bold text**',
      italic: '_Italic text_',
      strikethrough: '~~Strikethrough text~~',
      code: '`inline code`',
      codeBlock: '```\nfunction hello() {\n  console.log("Hello World");\n}\n```',
      link: '[Click here](https://example.com)',
      orderedList: '1. First item\n2. Second item\n3. Third item',
      unorderedList: '- First item\n- Second item\n- Third item',
      heading1: '# Heading 1',
      heading2: '## Heading 2',
      heading3: '### Heading 3',
      mixed: '# Test Message\n\nThis has **bold** and _italic_ text with `code` and a [link](https://example.com).\n\n```js\nconsole.log("code block");\n```'
    },

    // Edge cases
    edgeCases: {
      empty: '',
      whitespace: '   ',
      specialChars: '!@#$%^&*()_+-={}[]|\\:";\'<>?,./~`',
      html: '<script>alert("xss")</script>',
      sql: "'; DROP TABLE messages; --",
      unicode: '你好世界 مرحبا بالعالم Привет мир',
      rtl: 'مرحبا هذا نص عربي',
      emoji: '😀😃😄😁😆😅🤣😂🙂🙃😉😊😇🥰😍🤩😘😗😚😙😋😛😜🤪😝🤑🤗🤭🤫🤔🤐🤨😐😑😶😏😒🙄😬🤥😌😔😪🤤😴😷🤒🤕🤢🤮🤧🥵🥶🥴😵🤯🤠🥳😎🤓🧐'
    }
  },

  // Timing constants
  timing: {
    short: 500,
    medium: 2000,
    long: 5000,
    veryLong: 10000
  },

  // Selectors (Note: These will be defined in the DSL, but we keep references here)
  selectors: {
    // Auth
    emailInput: 'input[type="email"]',
    passwordInput: 'input[type="password"]',
    loginButton: 'button[name="log_in"]',

    // Rooms/Channels
    newRoomButton: 'a[href="/rooms/opens/new"]',
    roomNameInput: 'input[name="room[name]"]',
    roomInSidebar: (roomName) => `.room:has-text("${roomName}")`,

    // Messages
    messageComposer: 'trix-editor',
    sendButton: 'button[name="send"]',
    messageContent: '.message__body-content',
    messageText: '.message__presentation',

    // Actions
    messageActionMenu: '.message__actions',
    editButton: '.message__edit-btn',
    deleteButton: '.message__delete-btn',
    boostButton: 'a[href*="/boosts/new"]',

    // Rich text toolbar
    richTextToggle: 'button[data-action*="toggleToolbar"]',
    attachmentButton: 'input[type="file"]'
  }
};
