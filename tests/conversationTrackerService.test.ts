/**
 * ConversationTrackerService Tests
 * Comprehensive test coverage for conversation tracking functionality
 */

import {
  ConversationTrackerService,
  ConversationRecord,
} from '../src/services/conversationTrackerService';
import storageService from '../src/services/storageService';

// Mock dependencies
jest.mock('../src/services/storageService', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    set: jest.fn(),
  },
}));

jest.mock('../src/services/platformDetector', () => ({
  __esModule: true,
  default: {
    getPlatformName: jest.fn(() => 'ChatGPT'),
  },
}));

describe('ConversationTrackerService', () => {
  let trackerService: ConversationTrackerService;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset singleton instance
    (ConversationTrackerService as any).instance = null;
    (storageService.get as jest.Mock).mockResolvedValue(null);
    trackerService = ConversationTrackerService.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ConversationTrackerService.getInstance();
      const instance2 = ConversationTrackerService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('recordConversation', () => {
    it('should record a new conversation', async () => {
      (storageService.set as jest.Mock).mockResolvedValue(undefined);

      await trackerService.recordConversation(10, 500);

      expect(storageService.set).toHaveBeenCalledWith(
        'conversation_history',
        expect.arrayContaining([
          expect.objectContaining({
            platform: 'ChatGPT',
            messageCount: 10,
            characterCount: 500,
          }),
        ])
      );
    });

    it('should update existing conversation with same ID', async () => {
      (storageService.set as jest.Mock).mockResolvedValue(undefined);

      await trackerService.recordConversation(5, 200);
      await trackerService.recordConversation(10, 500);

      const stats = trackerService.getStats();
      expect(stats.allTime).toBe(1); // Should be 1, not 2 (updated, not added)
    });

    it('should include conversation URL', async () => {
      (storageService.set as jest.Mock).mockResolvedValue(undefined);

      await trackerService.recordConversation(5, 100);

      expect(storageService.set).toHaveBeenCalledWith(
        'conversation_history',
        expect.arrayContaining([
          expect.objectContaining({
            url: window.location.href,
          }),
        ])
      );
    });

    it('should generate conversation ID if not present', async () => {
      (storageService.set as jest.Mock).mockResolvedValue(undefined);

      // Access private property to null it out
      (trackerService as any).currentConversationId = null;

      await trackerService.recordConversation(1, 50);

      // Should not throw and should have created an ID
      expect(storageService.set).toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    beforeEach(async () => {
      (storageService.set as jest.Mock).mockResolvedValue(undefined);
    });

    it('should return zero stats when no conversations', () => {
      const stats = trackerService.getStats();

      expect(stats).toEqual({
        thisWeek: 0,
        thisMonth: 0,
        allTime: 0,
        byPlatform: {},
      });
    });

    it('should count conversations by time period', async () => {
      const now = Date.now();
      const conversations = [
        {
          id: 'test-1',
          platform: 'ChatGPT',
          date: now - 2 * 24 * 60 * 60 * 1000, // 2 days ago (this week)
          messageCount: 5,
          characterCount: 100,
          url: 'https://chatgpt.com',
        },
        {
          id: 'test-2',
          platform: 'Claude',
          date: now - 10 * 24 * 60 * 60 * 1000, // 10 days ago (this month, not this week)
          messageCount: 3,
          characterCount: 50,
          url: 'https://claude.ai',
        },
        {
          id: 'test-3',
          platform: 'Gemini',
          date: now - 40 * 24 * 60 * 60 * 1000, // 40 days ago (all time only)
          messageCount: 7,
          characterCount: 200,
          url: 'https://gemini.google.com',
        },
      ];

      // Inject conversations directly
      (trackerService as any).conversations = conversations;

      const stats = trackerService.getStats();

      expect(stats.thisWeek).toBe(1);
      expect(stats.thisMonth).toBe(2);
      expect(stats.allTime).toBe(3);
    });

    it('should count conversations by platform', async () => {
      const now = Date.now();
      const conversations = [
        {
          id: 'test-1',
          platform: 'ChatGPT',
          date: now,
          messageCount: 5,
          characterCount: 100,
          url: 'https://chatgpt.com',
        },
        {
          id: 'test-2',
          platform: 'ChatGPT',
          date: now,
          messageCount: 3,
          characterCount: 50,
          url: 'https://chatgpt.com',
        },
        {
          id: 'test-3',
          platform: 'Claude',
          date: now,
          messageCount: 7,
          characterCount: 200,
          url: 'https://claude.ai',
        },
      ];

      (trackerService as any).conversations = conversations;

      const stats = trackerService.getStats();

      expect(stats.byPlatform).toEqual({
        ChatGPT: 2,
        Claude: 1,
      });
    });
  });

  describe('getConversationsByPeriod', () => {
    beforeEach(() => {
      const now = Date.now();
      const conversations = [
        {
          id: 'test-1',
          platform: 'ChatGPT',
          date: now - 1 * 24 * 60 * 60 * 1000, // 1 day ago
          messageCount: 5,
          characterCount: 100,
          url: 'https://chatgpt.com',
        },
        {
          id: 'test-2',
          platform: 'Claude',
          date: now - 5 * 24 * 60 * 60 * 1000, // 5 days ago
          messageCount: 3,
          characterCount: 50,
          url: 'https://claude.ai',
        },
        {
          id: 'test-3',
          platform: 'Gemini',
          date: now - 10 * 24 * 60 * 60 * 1000, // 10 days ago
          messageCount: 7,
          characterCount: 200,
          url: 'https://gemini.google.com',
        },
      ];

      (trackerService as any).conversations = conversations;
    });

    it('should return conversations within specified days', () => {
      const results = trackerService.getConversationsByPeriod(7);
      expect(results).toHaveLength(2); // 1 and 5 days ago
    });

    it('should sort conversations by date descending', () => {
      const results = trackerService.getConversationsByPeriod(30);
      expect(results).toHaveLength(3);
      expect(results[0].id).toBe('test-1'); // Most recent first
      expect(results[2].id).toBe('test-3'); // Oldest last
    });

    it('should return empty array if no conversations in period', () => {
      const results = trackerService.getConversationsByPeriod(0.5); // Last 12 hours
      expect(results).toEqual([]);
    });
  });

  describe('getConversationsByPlatform', () => {
    beforeEach(() => {
      const now = Date.now();
      const conversations = [
        {
          id: 'test-1',
          platform: 'ChatGPT',
          date: now - 1000,
          messageCount: 5,
          characterCount: 100,
          url: 'https://chatgpt.com/c/1',
        },
        {
          id: 'test-2',
          platform: 'Claude',
          date: now - 2000,
          messageCount: 3,
          characterCount: 50,
          url: 'https://claude.ai/chat/1',
        },
        {
          id: 'test-3',
          platform: 'ChatGPT',
          date: now - 3000,
          messageCount: 7,
          characterCount: 200,
          url: 'https://chatgpt.com/c/2',
        },
      ];

      (trackerService as any).conversations = conversations;
    });

    it('should return conversations for specific platform', () => {
      const results = trackerService.getConversationsByPlatform('ChatGPT');
      expect(results).toHaveLength(2);
      expect(results.every((c) => c.platform === 'ChatGPT')).toBe(true);
    });

    it('should sort by date descending', () => {
      const results = trackerService.getConversationsByPlatform('ChatGPT');
      expect(results[0].id).toBe('test-1');
      expect(results[1].id).toBe('test-3');
    });

    it('should return empty array for platform with no conversations', () => {
      const results = trackerService.getConversationsByPlatform('Gemini');
      expect(results).toEqual([]);
    });
  });

  describe('getTotalMessages', () => {
    it('should return sum of all message counts', () => {
      const conversations = [
        {
          id: 'test-1',
          platform: 'ChatGPT',
          date: Date.now(),
          messageCount: 10,
          characterCount: 100,
          url: 'https://chatgpt.com',
        },
        {
          id: 'test-2',
          platform: 'Claude',
          date: Date.now(),
          messageCount: 5,
          characterCount: 50,
          url: 'https://claude.ai',
        },
        {
          id: 'test-3',
          platform: 'Gemini',
          date: Date.now(),
          messageCount: 15,
          characterCount: 200,
          url: 'https://gemini.google.com',
        },
      ];

      (trackerService as any).conversations = conversations;

      const total = trackerService.getTotalMessages();
      expect(total).toBe(30);
    });

    it('should return 0 for no conversations', () => {
      const total = trackerService.getTotalMessages();
      expect(total).toBe(0);
    });
  });

  describe('getAverageMessagesPerConversation', () => {
    it('should calculate average correctly', () => {
      const conversations = [
        {
          id: 'test-1',
          platform: 'ChatGPT',
          date: Date.now(),
          messageCount: 10,
          characterCount: 100,
          url: 'https://chatgpt.com',
        },
        {
          id: 'test-2',
          platform: 'Claude',
          date: Date.now(),
          messageCount: 20,
          characterCount: 200,
          url: 'https://claude.ai',
        },
      ];

      (trackerService as any).conversations = conversations;

      const average = trackerService.getAverageMessagesPerConversation();
      expect(average).toBe(15); // (10 + 20) / 2
    });

    it('should return 0 for no conversations', () => {
      const average = trackerService.getAverageMessagesPerConversation();
      expect(average).toBe(0);
    });

    it('should round to nearest integer', () => {
      const conversations = [
        { id: '1', platform: 'ChatGPT', date: Date.now(), messageCount: 10, characterCount: 100, url: 'https://chatgpt.com' },
        { id: '2', platform: 'ChatGPT', date: Date.now(), messageCount: 11, characterCount: 100, url: 'https://chatgpt.com' },
        { id: '3', platform: 'ChatGPT', date: Date.now(), messageCount: 12, characterCount: 100, url: 'https://chatgpt.com' },
      ];

      (trackerService as any).conversations = conversations;

      const average = trackerService.getAverageMessagesPerConversation();
      expect(average).toBe(11); // (10 + 11 + 12) / 3 = 11
    });
  });

  describe('clearHistory', () => {
    it('should remove all conversations', async () => {
      (storageService.set as jest.Mock).mockResolvedValue(undefined);

      const conversations = [
        { id: '1', platform: 'ChatGPT', date: Date.now(), messageCount: 10, characterCount: 100, url: 'https://chatgpt.com' },
      ];

      (trackerService as any).conversations = conversations;
      expect(trackerService.getStats().allTime).toBe(1);

      await trackerService.clearHistory();

      expect(trackerService.getStats().allTime).toBe(0);
      expect(storageService.set).toHaveBeenCalledWith('conversation_history', []);
    });
  });

  describe('exportHistory', () => {
    it('should export conversations as JSON string', () => {
      const conversations = [
        {
          id: 'test-1',
          platform: 'ChatGPT',
          date: 1234567890,
          messageCount: 10,
          characterCount: 100,
          url: 'https://chatgpt.com',
        },
      ];

      (trackerService as any).conversations = conversations;

      const exported = trackerService.exportHistory();
      expect(typeof exported).toBe('string');

      const parsed = JSON.parse(exported);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].id).toBe('test-1');
    });

    it('should export empty array when no conversations', () => {
      const exported = trackerService.exportHistory();
      expect(exported).toBe('[]');
    });
  });

  describe('importHistory', () => {
    it('should import conversations from JSON', async () => {
      (storageService.set as jest.Mock).mockResolvedValue(undefined);

      const importData: ConversationRecord[] = [
        {
          id: 'imported-1',
          platform: 'Claude',
          date: Date.now(),
          messageCount: 5,
          characterCount: 100,
          url: 'https://claude.ai',
        },
      ];

      await trackerService.importHistory(JSON.stringify(importData));

      const stats = trackerService.getStats();
      expect(stats.allTime).toBe(1);
    });

    it('should merge with existing conversations', async () => {
      (storageService.set as jest.Mock).mockResolvedValue(undefined);

      // Add existing conversation
      (trackerService as any).conversations = [
        { id: 'existing-1', platform: 'ChatGPT', date: Date.now(), messageCount: 10, characterCount: 100, url: 'https://chatgpt.com' },
      ];

      const importData: ConversationRecord[] = [
        { id: 'imported-1', platform: 'Claude', date: Date.now(), messageCount: 5, characterCount: 50, url: 'https://claude.ai' },
      ];

      await trackerService.importHistory(JSON.stringify(importData));

      const stats = trackerService.getStats();
      expect(stats.allTime).toBe(2);
    });

    it('should not duplicate conversations with same ID', async () => {
      (storageService.set as jest.Mock).mockResolvedValue(undefined);

      // Add existing conversation
      (trackerService as any).conversations = [
        { id: 'same-id', platform: 'ChatGPT', date: Date.now(), messageCount: 10, characterCount: 100, url: 'https://chatgpt.com' },
      ];

      const importData: ConversationRecord[] = [
        { id: 'same-id', platform: 'ChatGPT', date: Date.now(), messageCount: 15, characterCount: 150, url: 'https://chatgpt.com' },
      ];

      await trackerService.importHistory(JSON.stringify(importData));

      const stats = trackerService.getStats();
      expect(stats.allTime).toBe(1); // Should still be 1, not 2
    });

    it('should throw error for invalid JSON', async () => {
      await expect(trackerService.importHistory('invalid json')).rejects.toThrow();
    });

    it('should throw error for non-array data', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(trackerService.importHistory('{"not": "array"}')).rejects.toThrow('Invalid conversation history data');

      consoleErrorSpy.mockRestore();
    });
  });

  describe('cleanupOldConversations', () => {
    it('should remove conversations older than 6 months', async () => {
      (storageService.set as jest.Mock).mockResolvedValue(undefined);
      (storageService.get as jest.Mock).mockResolvedValue([
        {
          id: 'old-1',
          platform: 'ChatGPT',
          date: Date.now() - 7 * 30 * 24 * 60 * 60 * 1000, // 7 months ago
          messageCount: 5,
          characterCount: 100,
          url: 'https://chatgpt.com',
        },
        {
          id: 'recent-1',
          platform: 'Claude',
          date: Date.now() - 1 * 30 * 24 * 60 * 60 * 1000, // 1 month ago
          messageCount: 10,
          characterCount: 200,
          url: 'https://claude.ai',
        },
      ]);

      // Create new instance to trigger load and cleanup
      (ConversationTrackerService as any).instance = null;
      const newService = ConversationTrackerService.getInstance();

      // Wait for async load
      await new Promise((resolve) => setTimeout(resolve, 10));

      const stats = newService.getStats();
      expect(stats.allTime).toBe(1); // Only recent conversation should remain
    });

    it('should save after cleanup if conversations were removed', async () => {
      (storageService.set as jest.Mock).mockResolvedValue(undefined);
      (storageService.get as jest.Mock).mockResolvedValue([
        {
          id: 'old-1',
          platform: 'ChatGPT',
          date: Date.now() - 7 * 30 * 24 * 60 * 60 * 1000,
          messageCount: 5,
          characterCount: 100,
          url: 'https://chatgpt.com',
        },
      ]);

      // Create new instance
      (ConversationTrackerService as any).instance = null;
      ConversationTrackerService.getInstance();

      // Wait for async load and cleanup
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should have called set to save after cleanup
      expect(storageService.set).toHaveBeenCalledWith('conversation_history', []);
    });
  });

  describe('Error Handling', () => {
    it('should handle storage errors when loading', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (storageService.get as jest.Mock).mockRejectedValue(new Error('Load error'));

      // Create new instance
      (ConversationTrackerService as any).instance = null;
      ConversationTrackerService.getInstance();

      // Wait for async load
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to load conversation history:',
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });

    it('should handle storage errors when saving', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (storageService.set as jest.Mock).mockRejectedValue(new Error('Save error'));

      await trackerService.recordConversation(5, 100);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to save conversation history:',
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Hash Function', () => {
    it('should generate consistent hashes for same input', () => {
      const hash1 = (trackerService as any).hashString('test-url');
      const hash2 = (trackerService as any).hashString('test-url');
      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different inputs', () => {
      const hash1 = (trackerService as any).hashString('test-url-1');
      const hash2 = (trackerService as any).hashString('test-url-2');
      expect(hash1).not.toBe(hash2);
    });

    it('should return a string in base36 format', () => {
      const hash = (trackerService as any).hashString('test');
      expect(typeof hash).toBe('string');
      expect(/^[0-9a-z]+$/.test(hash)).toBe(true);
    });
  });
});
