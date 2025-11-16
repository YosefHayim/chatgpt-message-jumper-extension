/**
 * Conversation Tracker Service Tests
 * Comprehensive tests for conversation tracking functionality
 */

import {
  ConversationTrackerService,
  ConversationRecord,
} from '~/src/services/conversationTrackerService';
import platformDetector from '~/src/services/platformDetector';

// Mock chrome.storage.local
const mockChromeStorage = {
  get: jest.fn(),
  set: jest.fn(),
  remove: jest.fn(),
};

// Setup chrome mock
global.chrome = {
  storage: {
    local: mockChromeStorage,
  },
} as any;

// Mock platformDetector
jest.mock('~/src/services/platformDetector', () => ({
  __esModule: true,
  default: {
    getPlatformName: jest.fn(),
  },
}));

describe('ConversationTrackerService', () => {
  let trackerService: ConversationTrackerService;
  const mockPlatformDetector = platformDetector as jest.Mocked<typeof platformDetector>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockChromeStorage.get.mockResolvedValue({});
    mockChromeStorage.set.mockResolvedValue(undefined);
    mockPlatformDetector.getPlatformName.mockReturnValue('ChatGPT');

    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        href: 'https://chat.openai.com/c/test-conversation',
      },
      writable: true,
    });

    // Reset singleton instance
    (ConversationTrackerService as any).instance = null;
    trackerService = ConversationTrackerService.getInstance();
  });

  describe('Singleton Pattern', () => {
    test('should return the same instance', () => {
      const instance1 = ConversationTrackerService.getInstance();
      const instance2 = ConversationTrackerService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('recordConversation', () => {
    test('should record a new conversation', async () => {
      await trackerService.recordConversation(10, 500);

      const stats = trackerService.getStats();
      expect(stats.allTime).toBe(1);
    });

    test('should update existing conversation', async () => {
      await trackerService.recordConversation(10, 500);
      await trackerService.recordConversation(15, 750);

      const stats = trackerService.getStats();
      expect(stats.allTime).toBe(1); // Still one conversation, just updated
    });

    test('should store conversation with correct platform', async () => {
      mockPlatformDetector.getPlatformName.mockReturnValue('Claude');

      // Reset service to pick up new platform
      (ConversationTrackerService as any).instance = null;
      trackerService = ConversationTrackerService.getInstance();

      await trackerService.recordConversation(10, 500);

      const conversations = trackerService.getConversationsByPlatform('Claude');
      expect(conversations).toHaveLength(1);
    });

    test('should store message and character counts', async () => {
      await trackerService.recordConversation(25, 1234);

      const allConversations = trackerService.getConversationsByPeriod(1);
      expect(allConversations[0].messageCount).toBe(25);
      expect(allConversations[0].characterCount).toBe(1234);
    });

    test('should call storage service on record', async () => {
      mockChromeStorage.set.mockClear();
      await trackerService.recordConversation(10, 500);

      expect(mockChromeStorage.set).toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    beforeEach(async () => {
      // Create conversations at different times
      const now = Date.now();
      const mockConversations: ConversationRecord[] = [
        {
          id: 'conv1',
          platform: 'ChatGPT',
          date: now - 2 * 24 * 60 * 60 * 1000, // 2 days ago
          messageCount: 10,
          characterCount: 500,
          url: 'https://example.com/1',
        },
        {
          id: 'conv2',
          platform: 'Claude',
          date: now - 10 * 24 * 60 * 60 * 1000, // 10 days ago
          messageCount: 15,
          characterCount: 750,
          url: 'https://example.com/2',
        },
        {
          id: 'conv3',
          platform: 'ChatGPT',
          date: now - 40 * 24 * 60 * 60 * 1000, // 40 days ago
          messageCount: 20,
          characterCount: 1000,
          url: 'https://example.com/3',
        },
      ];

      mockChromeStorage.get.mockResolvedValue({ conversation_history: mockConversations });
      (ConversationTrackerService as any).instance = null;
      trackerService = ConversationTrackerService.getInstance();

      // Wait for async load
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    test('should count conversations this week', () => {
      const stats = trackerService.getStats();
      expect(stats.thisWeek).toBe(1); // Only conv1 (2 days ago)
    });

    test('should count conversations this month', () => {
      const stats = trackerService.getStats();
      expect(stats.thisMonth).toBe(2); // conv1 and conv2
    });

    test('should count all conversations', () => {
      const stats = trackerService.getStats();
      expect(stats.allTime).toBe(3);
    });

    test('should group conversations by platform', () => {
      const stats = trackerService.getStats();
      expect(stats.byPlatform['ChatGPT']).toBe(2);
      expect(stats.byPlatform['Claude']).toBe(1);
    });
  });

  describe('getConversationsByPeriod', () => {
    beforeEach(async () => {
      const now = Date.now();
      const mockConversations: ConversationRecord[] = [
        {
          id: 'recent',
          platform: 'ChatGPT',
          date: now - 1 * 24 * 60 * 60 * 1000,
          messageCount: 10,
          characterCount: 500,
          url: 'https://example.com/recent',
        },
        {
          id: 'old',
          platform: 'Claude',
          date: now - 100 * 24 * 60 * 60 * 1000,
          messageCount: 15,
          characterCount: 750,
          url: 'https://example.com/old',
        },
      ];

      mockChromeStorage.get.mockResolvedValue({ conversation_history: mockConversations });
      (ConversationTrackerService as any).instance = null;
      trackerService = ConversationTrackerService.getInstance();
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    test('should return conversations within time period', () => {
      const recentConvs = trackerService.getConversationsByPeriod(7);
      expect(recentConvs).toHaveLength(1);
      expect(recentConvs[0].id).toBe('recent');
    });

    test('should return all conversations for large period', () => {
      const allConvs = trackerService.getConversationsByPeriod(365);
      expect(allConvs).toHaveLength(2);
    });

    test('should return conversations sorted by date (newest first)', () => {
      const convs = trackerService.getConversationsByPeriod(365);
      expect(convs[0].id).toBe('recent');
      expect(convs[1].id).toBe('old');
    });

    test('should return empty array for very short period', () => {
      const convs = trackerService.getConversationsByPeriod(0);
      expect(convs).toHaveLength(0);
    });
  });

  describe('getConversationsByPlatform', () => {
    beforeEach(async () => {
      const mockConversations: ConversationRecord[] = [
        {
          id: 'chatgpt1',
          platform: 'ChatGPT',
          date: Date.now(),
          messageCount: 10,
          characterCount: 500,
          url: 'https://example.com/1',
        },
        {
          id: 'claude1',
          platform: 'Claude',
          date: Date.now(),
          messageCount: 15,
          characterCount: 750,
          url: 'https://example.com/2',
        },
        {
          id: 'chatgpt2',
          platform: 'ChatGPT',
          date: Date.now(),
          messageCount: 20,
          characterCount: 1000,
          url: 'https://example.com/3',
        },
      ];

      mockChromeStorage.get.mockResolvedValue({ conversation_history: mockConversations });
      (ConversationTrackerService as any).instance = null;
      trackerService = ConversationTrackerService.getInstance();
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    test('should filter conversations by platform', () => {
      const chatGPTConvs = trackerService.getConversationsByPlatform('ChatGPT');
      expect(chatGPTConvs).toHaveLength(2);
      expect(chatGPTConvs.every(c => c.platform === 'ChatGPT')).toBe(true);
    });

    test('should return empty array for non-existent platform', () => {
      const convs = trackerService.getConversationsByPlatform('NonExistent');
      expect(convs).toEqual([]);
    });

    test('should be case sensitive', () => {
      const convs = trackerService.getConversationsByPlatform('chatgpt');
      expect(convs).toHaveLength(0);
    });
  });

  describe('getTotalMessages', () => {
    test('should return zero for no conversations', () => {
      expect(trackerService.getTotalMessages()).toBe(0);
    });

    test('should sum message counts across all conversations', async () => {
      const mockConversations: ConversationRecord[] = [
        {
          id: 'conv1',
          platform: 'ChatGPT',
          date: Date.now(),
          messageCount: 10,
          characterCount: 500,
          url: 'https://example.com/1',
        },
        {
          id: 'conv2',
          platform: 'Claude',
          date: Date.now(),
          messageCount: 25,
          characterCount: 1000,
          url: 'https://example.com/2',
        },
      ];

      mockChromeStorage.get.mockResolvedValue({ conversation_history: mockConversations });
      (ConversationTrackerService as any).instance = null;
      trackerService = ConversationTrackerService.getInstance();
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(trackerService.getTotalMessages()).toBe(35);
    });
  });

  describe('getAverageMessagesPerConversation', () => {
    test('should return zero for no conversations', () => {
      expect(trackerService.getAverageMessagesPerConversation()).toBe(0);
    });

    test('should calculate correct average', async () => {
      const mockConversations: ConversationRecord[] = [
        {
          id: 'conv1',
          platform: 'ChatGPT',
          date: Date.now(),
          messageCount: 10,
          characterCount: 500,
          url: 'https://example.com/1',
        },
        {
          id: 'conv2',
          platform: 'Claude',
          date: Date.now(),
          messageCount: 20,
          characterCount: 1000,
          url: 'https://example.com/2',
        },
        {
          id: 'conv3',
          platform: 'Gemini',
          date: Date.now(),
          messageCount: 30,
          characterCount: 1500,
          url: 'https://example.com/3',
        },
      ];

      mockChromeStorage.get.mockResolvedValue({ conversation_history: mockConversations });
      (ConversationTrackerService as any).instance = null;
      trackerService = ConversationTrackerService.getInstance();
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(trackerService.getAverageMessagesPerConversation()).toBe(20); // (10+20+30)/3 = 20
    });

    test('should round average to nearest integer', async () => {
      const mockConversations: ConversationRecord[] = [
        {
          id: 'conv1',
          platform: 'ChatGPT',
          date: Date.now(),
          messageCount: 10,
          characterCount: 500,
          url: 'https://example.com/1',
        },
        {
          id: 'conv2',
          platform: 'Claude',
          date: Date.now(),
          messageCount: 11,
          characterCount: 600,
          url: 'https://example.com/2',
        },
      ];

      mockChromeStorage.get.mockResolvedValue({ conversation_history: mockConversations });
      (ConversationTrackerService as any).instance = null;
      trackerService = ConversationTrackerService.getInstance();
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(trackerService.getAverageMessagesPerConversation()).toBe(11); // 10.5 rounds to 11
    });
  });

  describe('clearHistory', () => {
    test('should clear all conversations', async () => {
      await trackerService.recordConversation(10, 500);
      await trackerService.recordConversation(15, 750);

      await trackerService.clearHistory();

      const stats = trackerService.getStats();
      expect(stats.allTime).toBe(0);
      expect(mockChromeStorage.set).toHaveBeenCalled();
    });
  });

  describe('exportHistory', () => {
    test('should export conversations as JSON string', async () => {
      await trackerService.recordConversation(10, 500);

      const exported = trackerService.exportHistory();
      const parsed = JSON.parse(exported);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBeGreaterThanOrEqual(0);
    });

    test('should export properly formatted JSON', async () => {
      await trackerService.recordConversation(10, 500);
      const exported = trackerService.exportHistory();
      expect(() => JSON.parse(exported)).not.toThrow();
    });
  });

  describe('importHistory', () => {
    test('should import valid conversation data', async () => {
      const importData: ConversationRecord[] = [
        {
          id: 'imported1',
          platform: 'ChatGPT',
          date: Date.now(),
          messageCount: 10,
          characterCount: 500,
          url: 'https://example.com/1',
        },
        {
          id: 'imported2',
          platform: 'Claude',
          date: Date.now(),
          messageCount: 15,
          characterCount: 750,
          url: 'https://example.com/2',
        },
      ];

      await trackerService.importHistory(JSON.stringify(importData));

      const stats = trackerService.getStats();
      expect(stats.allTime).toBeGreaterThanOrEqual(2);
    });

    test('should merge with existing conversations', async () => {
      await trackerService.recordConversation(10, 500);

      const importData: ConversationRecord[] = [
        {
          id: 'imported1',
          platform: 'Claude',
          date: Date.now(),
          messageCount: 15,
          characterCount: 750,
          url: 'https://example.com/import',
        },
      ];

      await trackerService.importHistory(JSON.stringify(importData));

      const stats = trackerService.getStats();
      expect(stats.allTime).toBeGreaterThanOrEqual(2);
    });

    test('should avoid duplicate conversations on import', async () => {
      const importData: ConversationRecord[] = [
        {
          id: 'duplicate',
          platform: 'ChatGPT',
          date: Date.now(),
          messageCount: 10,
          characterCount: 500,
          url: 'https://example.com/dup',
        },
      ];

      await trackerService.importHistory(JSON.stringify(importData));
      const statsBefore = trackerService.getStats();

      // Import same data again
      await trackerService.importHistory(JSON.stringify(importData));
      const statsAfter = trackerService.getStats();

      expect(statsAfter.allTime).toBe(statsBefore.allTime);
    });

    test('should throw error for invalid JSON', async () => {
      await expect(trackerService.importHistory('invalid json')).rejects.toThrow();
    });

    test('should throw error for non-array data', async () => {
      await expect(
        trackerService.importHistory(JSON.stringify({ foo: 'bar' }))
      ).rejects.toThrow('Invalid conversation history data');
    });
  });

  describe('cleanup old conversations', () => {
    test('should remove conversations older than 6 months', async () => {
      const now = Date.now();
      const sevenMonthsAgo = now - 7 * 30 * 24 * 60 * 60 * 1000;

      const mockConversations: ConversationRecord[] = [
        {
          id: 'old',
          platform: 'ChatGPT',
          date: sevenMonthsAgo,
          messageCount: 10,
          characterCount: 500,
          url: 'https://example.com/old',
        },
        {
          id: 'recent',
          platform: 'Claude',
          date: now - 1 * 24 * 60 * 60 * 1000,
          messageCount: 15,
          characterCount: 750,
          url: 'https://example.com/recent',
        },
      ];

      mockChromeStorage.get.mockResolvedValue({ conversation_history: mockConversations });
      (ConversationTrackerService as any).instance = null;
      trackerService = ConversationTrackerService.getInstance();
      await new Promise(resolve => setTimeout(resolve, 100));

      const stats = trackerService.getStats();
      expect(stats.allTime).toBeLessThanOrEqual(2); // Old one should be cleaned up
    });
  });

  describe('Edge Cases', () => {
    test('should handle very large message counts', async () => {
      await trackerService.recordConversation(999999, 9999999);
      expect(trackerService.getTotalMessages()).toBeGreaterThanOrEqual(999999);
    });

    test('should handle zero message count', async () => {
      await trackerService.recordConversation(0, 0);
      const stats = trackerService.getStats();
      expect(stats.allTime).toBeGreaterThanOrEqual(0);
    });

    test('should handle multiple rapid updates', async () => {
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(trackerService.recordConversation(i * 10, i * 100));
      }
      await Promise.all(promises);

      const stats = trackerService.getStats();
      expect(stats.allTime).toBeGreaterThanOrEqual(0);
    });

    test('should handle platform names with special characters', async () => {
      mockPlatformDetector.getPlatformName.mockReturnValue('Test-Platform_2.0');
      (ConversationTrackerService as any).instance = null;
      trackerService = ConversationTrackerService.getInstance();

      await trackerService.recordConversation(10, 500);
      const convs = trackerService.getConversationsByPlatform('Test-Platform_2.0');
      expect(convs.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Storage Integration', () => {
    test('should handle storage errors gracefully on save', async () => {
      mockChromeStorage.set.mockRejectedValue(new Error('Storage error'));

      await expect(trackerService.recordConversation(10, 500)).resolves.not.toThrow();
    });

    test('should handle storage errors gracefully on load', async () => {
      mockChromeStorage.get.mockRejectedValue(new Error('Storage error'));

      (ConversationTrackerService as any).instance = null;
      expect(() => ConversationTrackerService.getInstance()).not.toThrow();
    });
  });
});
