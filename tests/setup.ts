/**
 * Test setup file
 * Configures the testing environment
 */

import '@testing-library/jest-dom';

// Mock Chrome APIs
global.chrome = {
  storage: {
    sync: {
      get: jest.fn((keys) => Promise.resolve({})),
      set: jest.fn(() => Promise.resolve()),
    },
    onChanged: {
      addListener: jest.fn(),
    },
  },
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
    },
  },
  tabs: {
    query: jest.fn(() => Promise.resolve([])),
    sendMessage: jest.fn(),
  },
} as any;

// Mock window.location
delete (window as any).location;
window.location = {
  hostname: 'chatgpt.com',
  href: 'https://chatgpt.com',
  origin: 'https://chatgpt.com',
} as any;
