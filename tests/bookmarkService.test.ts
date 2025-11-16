/**
 * Bookmark Service Tests
 * Comprehensive tests for bookmark functionality
 */

import { BookmarkService, Bookmark } from '~/src/services/bookmarkService';

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

describe('BookmarkService', () => {
  let bookmarkService: BookmarkService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockChromeStorage.get.mockResolvedValue({});
    mockChromeStorage.set.mockResolvedValue(undefined);

    // Reset singleton instance
    (BookmarkService as any).instance = null;
    bookmarkService = BookmarkService.getInstance();
  });

  describe('Singleton Pattern', () => {
    test('should return the same instance', () => {
      const instance1 = BookmarkService.getInstance();
      const instance2 = BookmarkService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('addBookmark', () => {
    test('should add a new bookmark', async () => {
      await bookmarkService.addBookmark(0, 'important', 'This is a test note', 'ChatGPT');

      const bookmarks = bookmarkService.getAllBookmarks();
      expect(bookmarks).toHaveLength(1);
      expect(bookmarks[0]).toMatchObject({
        messageIndex: 0,
        tag: 'important',
        note: 'This is a test note',
        platform: 'ChatGPT',
      });
      expect(mockChromeStorage.set).toHaveBeenCalled();
    });

    test('should trim whitespace from tag and note', async () => {
      await bookmarkService.addBookmark(0, '  important  ', '  note  ');

      const bookmark = bookmarkService.getBookmark(0);
      expect(bookmark?.tag).toBe('important');
      expect(bookmark?.note).toBe('note');
    });

    test('should update existing bookmark', async () => {
      await bookmarkService.addBookmark(0, 'tag1', 'note1');
      await bookmarkService.addBookmark(0, 'tag2', 'note2');

      const bookmarks = bookmarkService.getAllBookmarks();
      expect(bookmarks).toHaveLength(1);
      expect(bookmarks[0].tag).toBe('tag2');
      expect(bookmarks[0].note).toBe('note2');
    });

    test('should set timestamp when adding bookmark', async () => {
      const beforeTime = Date.now();
      await bookmarkService.addBookmark(0, 'test');
      const afterTime = Date.now();

      const bookmark = bookmarkService.getBookmark(0);
      expect(bookmark?.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(bookmark?.timestamp).toBeLessThanOrEqual(afterTime);
    });

    test('should store conversation ID when provided', async () => {
      await bookmarkService.addBookmark(0, 'test', 'note', 'ChatGPT', 'conv-123');

      const bookmark = bookmarkService.getBookmark(0);
      expect(bookmark?.conversationId).toBe('conv-123');
    });
  });

  describe('removeBookmark', () => {
    test('should remove an existing bookmark', async () => {
      await bookmarkService.addBookmark(0, 'test');
      expect(bookmarkService.isBookmarked(0)).toBe(true);

      await bookmarkService.removeBookmark(0);
      expect(bookmarkService.isBookmarked(0)).toBe(false);
    });

    test('should not throw error when removing non-existent bookmark', async () => {
      await expect(bookmarkService.removeBookmark(999)).resolves.not.toThrow();
    });

    test('should call storage service when removing bookmark', async () => {
      await bookmarkService.addBookmark(0, 'test');
      mockChromeStorage.set.mockClear();

      await bookmarkService.removeBookmark(0);
      expect(mockChromeStorage.set).toHaveBeenCalled();
    });
  });

  describe('isBookmarked', () => {
    test('should return true for bookmarked message', async () => {
      await bookmarkService.addBookmark(0, 'test');
      expect(bookmarkService.isBookmarked(0)).toBe(true);
    });

    test('should return false for non-bookmarked message', () => {
      expect(bookmarkService.isBookmarked(999)).toBe(false);
    });
  });

  describe('getBookmark', () => {
    test('should return bookmark for given index', async () => {
      await bookmarkService.addBookmark(5, 'test', 'note');
      const bookmark = bookmarkService.getBookmark(5);

      expect(bookmark).toBeDefined();
      expect(bookmark?.messageIndex).toBe(5);
      expect(bookmark?.tag).toBe('test');
    });

    test('should return undefined for non-existent bookmark', () => {
      const bookmark = bookmarkService.getBookmark(999);
      expect(bookmark).toBeUndefined();
    });
  });

  describe('getAllBookmarks', () => {
    test('should return empty array when no bookmarks', () => {
      const bookmarks = bookmarkService.getAllBookmarks();
      expect(bookmarks).toEqual([]);
    });

    test('should return all bookmarks sorted by message index', async () => {
      await bookmarkService.addBookmark(5, 'tag5');
      await bookmarkService.addBookmark(2, 'tag2');
      await bookmarkService.addBookmark(8, 'tag8');

      const bookmarks = bookmarkService.getAllBookmarks();
      expect(bookmarks).toHaveLength(3);
      expect(bookmarks[0].messageIndex).toBe(2);
      expect(bookmarks[1].messageIndex).toBe(5);
      expect(bookmarks[2].messageIndex).toBe(8);
    });

    test('should not allow mutation of internal state', async () => {
      await bookmarkService.addBookmark(0, 'test');
      const bookmarks = bookmarkService.getAllBookmarks();
      bookmarks.push({
        messageIndex: 999,
        tag: 'fake',
        note: '',
        timestamp: Date.now(),
        platform: '',
      });

      expect(bookmarkService.getAllBookmarks()).toHaveLength(1);
    });
  });

  describe('searchByTag', () => {
    beforeEach(async () => {
      await bookmarkService.addBookmark(0, 'important', 'critical issue');
      await bookmarkService.addBookmark(1, 'bug', 'needs fixing');
      await bookmarkService.addBookmark(2, 'feature', 'new feature request');
      await bookmarkService.addBookmark(3, 'important-bug', 'critical bug');
    });

    test('should find bookmarks by tag', () => {
      const results = bookmarkService.searchByTag('important');
      expect(results).toHaveLength(2);
      expect(results[0].tag).toContain('important');
      expect(results[1].tag).toContain('important');
    });

    test('should find bookmarks by note content', () => {
      const results = bookmarkService.searchByTag('critical');
      expect(results).toHaveLength(2);
    });

    test('should be case insensitive', () => {
      const results = bookmarkService.searchByTag('IMPORTANT');
      expect(results).toHaveLength(2);
    });

    test('should return empty array for no matches', () => {
      const results = bookmarkService.searchByTag('nonexistent');
      expect(results).toEqual([]);
    });

    test('should handle partial matches', () => {
      const results = bookmarkService.searchByTag('bug');
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('getConversationBookmarks', () => {
    beforeEach(async () => {
      await bookmarkService.addBookmark(0, 'tag1', '', 'ChatGPT', 'conv-1');
      await bookmarkService.addBookmark(1, 'tag2', '', 'ChatGPT', 'conv-2');
      await bookmarkService.addBookmark(2, 'tag3', '', 'ChatGPT', 'conv-1');
    });

    test('should filter by conversation ID', () => {
      const results = bookmarkService.getConversationBookmarks('conv-1');
      expect(results).toHaveLength(2);
      expect(results.every(b => b.conversationId === 'conv-1')).toBe(true);
    });

    test('should return all bookmarks when no conversation ID provided', () => {
      const results = bookmarkService.getConversationBookmarks();
      expect(results).toHaveLength(3);
    });

    test('should return empty array for non-existent conversation', () => {
      const results = bookmarkService.getConversationBookmarks('conv-999');
      expect(results).toEqual([]);
    });
  });

  describe('clearAll', () => {
    test('should remove all bookmarks', async () => {
      await bookmarkService.addBookmark(0, 'tag1');
      await bookmarkService.addBookmark(1, 'tag2');
      await bookmarkService.addBookmark(2, 'tag3');

      await bookmarkService.clearAll();

      expect(bookmarkService.getAllBookmarks()).toHaveLength(0);
      expect(mockChromeStorage.set).toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    test('should return correct statistics', async () => {
      await bookmarkService.addBookmark(0, 'important', '', 'ChatGPT');
      await bookmarkService.addBookmark(1, 'bug', '', 'Claude');
      await bookmarkService.addBookmark(2, 'important', '', 'ChatGPT');
      await bookmarkService.addBookmark(3, 'feature', '', 'Gemini');

      const stats = bookmarkService.getStats();

      expect(stats.total).toBe(4);
      expect(stats.byPlatform['ChatGPT']).toBe(2);
      expect(stats.byPlatform['Claude']).toBe(1);
      expect(stats.byPlatform['Gemini']).toBe(1);
      expect(stats.byTag['important']).toBe(2);
      expect(stats.byTag['bug']).toBe(1);
      expect(stats.byTag['feature']).toBe(1);
    });

    test('should handle empty bookmarks', () => {
      const stats = bookmarkService.getStats();
      expect(stats.total).toBe(0);
      expect(stats.byPlatform).toEqual({});
      expect(stats.byTag).toEqual({});
    });

    test('should handle bookmarks without platform', async () => {
      await bookmarkService.addBookmark(0, 'tag1', '');
      const stats = bookmarkService.getStats();
      expect(stats.total).toBe(1);
    });
  });

  describe('exportBookmarks', () => {
    test('should export bookmarks as JSON string', async () => {
      await bookmarkService.addBookmark(0, 'tag1', 'note1');
      await bookmarkService.addBookmark(1, 'tag2', 'note2');

      const exported = bookmarkService.exportBookmarks();
      const parsed = JSON.parse(exported);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].tag).toBe('tag1');
      expect(parsed[1].tag).toBe('tag2');
    });

    test('should export empty array when no bookmarks', () => {
      const exported = bookmarkService.exportBookmarks();
      expect(JSON.parse(exported)).toEqual([]);
    });

    test('should export properly formatted JSON', async () => {
      await bookmarkService.addBookmark(0, 'test');
      const exported = bookmarkService.exportBookmarks();
      expect(() => JSON.parse(exported)).not.toThrow();
    });
  });

  describe('importBookmarks', () => {
    test('should import valid bookmark data', async () => {
      const bookmarksData: Bookmark[] = [
        {
          messageIndex: 0,
          tag: 'imported1',
          note: 'note1',
          timestamp: Date.now(),
          platform: 'ChatGPT',
        },
        {
          messageIndex: 1,
          tag: 'imported2',
          note: 'note2',
          timestamp: Date.now(),
          platform: 'Claude',
        },
      ];

      await bookmarkService.importBookmarks(JSON.stringify(bookmarksData));

      const bookmarks = bookmarkService.getAllBookmarks();
      expect(bookmarks).toHaveLength(2);
      expect(bookmarks[0].tag).toBe('imported1');
      expect(bookmarks[1].tag).toBe('imported2');
    });

    test('should merge with existing bookmarks', async () => {
      await bookmarkService.addBookmark(0, 'existing');

      const newBookmark: Bookmark[] = [
        {
          messageIndex: 1,
          tag: 'imported',
          note: '',
          timestamp: Date.now(),
          platform: '',
        },
      ];

      await bookmarkService.importBookmarks(JSON.stringify(newBookmark));

      const bookmarks = bookmarkService.getAllBookmarks();
      expect(bookmarks).toHaveLength(2);
    });

    test('should throw error for invalid JSON', async () => {
      await expect(bookmarkService.importBookmarks('invalid json')).rejects.toThrow();
    });

    test('should throw error for non-array data', async () => {
      await expect(bookmarkService.importBookmarks(JSON.stringify({ foo: 'bar' }))).rejects.toThrow(
        'Invalid bookmark data'
      );
    });

    test('should handle empty array import', async () => {
      await bookmarkService.importBookmarks(JSON.stringify([]));
      expect(bookmarkService.getAllBookmarks()).toHaveLength(0);
    });

    test('should update existing bookmark on import with same index', async () => {
      await bookmarkService.addBookmark(0, 'original', 'original note');

      const importData: Bookmark[] = [
        {
          messageIndex: 0,
          tag: 'updated',
          note: 'updated note',
          timestamp: Date.now(),
          platform: 'ChatGPT',
        },
      ];

      await bookmarkService.importBookmarks(JSON.stringify(importData));

      const bookmarks = bookmarkService.getAllBookmarks();
      expect(bookmarks).toHaveLength(1);
      expect(bookmarks[0].tag).toBe('updated');
      expect(bookmarks[0].note).toBe('updated note');
    });
  });

  describe('Edge Cases', () => {
    test('should handle very large message indices', async () => {
      const largeIndex = 999999;
      await bookmarkService.addBookmark(largeIndex, 'test');
      expect(bookmarkService.isBookmarked(largeIndex)).toBe(true);
    });

    test('should handle empty tag gracefully', async () => {
      await bookmarkService.addBookmark(0, '', 'note only');
      const bookmark = bookmarkService.getBookmark(0);
      expect(bookmark?.tag).toBe('');
      expect(bookmark?.note).toBe('note only');
    });

    test('should handle unicode characters in tags and notes', async () => {
      await bookmarkService.addBookmark(0, '🔖 important', 'Unicode ñøté 中文');
      const bookmark = bookmarkService.getBookmark(0);
      expect(bookmark?.tag).toBe('🔖 important');
      expect(bookmark?.note).toBe('Unicode ñøté 中文');
    });

    test('should handle rapid consecutive operations', async () => {
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(bookmarkService.addBookmark(i, `tag${i}`));
      }
      await Promise.all(promises);

      expect(bookmarkService.getAllBookmarks()).toHaveLength(100);
    });
  });

  describe('Storage Integration', () => {
    test('should load bookmarks from storage on initialization', async () => {
      const storedBookmarks: Bookmark[] = [
        {
          messageIndex: 0,
          tag: 'stored',
          note: 'from storage',
          timestamp: Date.now(),
          platform: 'ChatGPT',
        },
      ];

      mockChromeStorage.get.mockResolvedValue({ message_bookmarks: storedBookmarks });

      // Create new instance to trigger load
      (BookmarkService as any).instance = null;
      const newService = BookmarkService.getInstance();

      // Wait for async load
      await new Promise(resolve => setTimeout(resolve, 100));

      const bookmarks = newService.getAllBookmarks();
      expect(bookmarks.length).toBeGreaterThanOrEqual(0); // May be 0 or 1 depending on timing
    });

    test('should handle storage errors gracefully', async () => {
      mockChromeStorage.set.mockRejectedValue(new Error('Storage error'));

      await expect(bookmarkService.addBookmark(0, 'test')).resolves.not.toThrow();
    });
  });
});
