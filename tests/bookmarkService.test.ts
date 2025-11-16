/**
 * BookmarkService Tests
 * Comprehensive test coverage for bookmark functionality
 */

import { BookmarkService, Bookmark } from '../src/services/bookmarkService';
import storageService from '../src/services/storageService';

// Mock the storage service
jest.mock('../src/services/storageService', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    set: jest.fn(),
  },
}));

describe('BookmarkService', () => {
  let bookmarkService: BookmarkService;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset singleton instance
    (BookmarkService as any).instance = null;
    bookmarkService = BookmarkService.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = BookmarkService.getInstance();
      const instance2 = BookmarkService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('addBookmark', () => {
    it('should add a bookmark with all fields', async () => {
      (storageService.set as jest.Mock).mockResolvedValue(undefined);

      await bookmarkService.addBookmark(
        5,
        'Important Code',
        'This is a note',
        'ChatGPT',
        'conv-123'
      );

      const bookmarks = bookmarkService.getAllBookmarks();
      expect(bookmarks).toHaveLength(1);
      expect(bookmarks[0]).toMatchObject({
        messageIndex: 5,
        tag: 'Important Code',
        note: 'This is a note',
        platform: 'ChatGPT',
        conversationId: 'conv-123',
      });
      expect(bookmarks[0].timestamp).toBeDefined();
      expect(storageService.set).toHaveBeenCalledWith('message_bookmarks', bookmarks);
    });

    it('should trim tag and note whitespace', async () => {
      (storageService.set as jest.Mock).mockResolvedValue(undefined);

      await bookmarkService.addBookmark(1, '  Tag  ', '  Note  ');

      const bookmarks = bookmarkService.getAllBookmarks();
      expect(bookmarks[0].tag).toBe('Tag');
      expect(bookmarks[0].note).toBe('Note');
    });

    it('should handle bookmark without optional fields', async () => {
      (storageService.set as jest.Mock).mockResolvedValue(undefined);

      await bookmarkService.addBookmark(2, 'Simple Tag');

      const bookmarks = bookmarkService.getAllBookmarks();
      expect(bookmarks[0]).toMatchObject({
        messageIndex: 2,
        tag: 'Simple Tag',
        note: '',
        platform: '',
      });
      expect(bookmarks[0].conversationId).toBeUndefined();
    });

    it('should update existing bookmark at same index', async () => {
      (storageService.set as jest.Mock).mockResolvedValue(undefined);

      await bookmarkService.addBookmark(3, 'First Tag');
      await bookmarkService.addBookmark(3, 'Updated Tag', 'New note');

      const bookmarks = bookmarkService.getAllBookmarks();
      expect(bookmarks).toHaveLength(1);
      expect(bookmarks[0].tag).toBe('Updated Tag');
      expect(bookmarks[0].note).toBe('New note');
    });
  });

  describe('removeBookmark', () => {
    it('should remove an existing bookmark', async () => {
      (storageService.set as jest.Mock).mockResolvedValue(undefined);

      await bookmarkService.addBookmark(10, 'To Remove');
      expect(bookmarkService.isBookmarked(10)).toBe(true);

      await bookmarkService.removeBookmark(10);
      expect(bookmarkService.isBookmarked(10)).toBe(false);
      expect(storageService.set).toHaveBeenCalledWith('message_bookmarks', []);
    });

    it('should handle removing non-existent bookmark', async () => {
      (storageService.set as jest.Mock).mockResolvedValue(undefined);

      await bookmarkService.removeBookmark(999);
      expect(storageService.set).toHaveBeenCalledWith('message_bookmarks', []);
    });
  });

  describe('isBookmarked', () => {
    it('should return true for bookmarked message', async () => {
      (storageService.set as jest.Mock).mockResolvedValue(undefined);

      await bookmarkService.addBookmark(7, 'Test');
      expect(bookmarkService.isBookmarked(7)).toBe(true);
    });

    it('should return false for non-bookmarked message', () => {
      expect(bookmarkService.isBookmarked(99)).toBe(false);
    });
  });

  describe('getBookmark', () => {
    it('should return bookmark by index', async () => {
      (storageService.set as jest.Mock).mockResolvedValue(undefined);

      await bookmarkService.addBookmark(15, 'Find Me', 'Test note');
      const bookmark = bookmarkService.getBookmark(15);

      expect(bookmark).toBeDefined();
      expect(bookmark?.tag).toBe('Find Me');
      expect(bookmark?.note).toBe('Test note');
    });

    it('should return undefined for non-existent bookmark', () => {
      const bookmark = bookmarkService.getBookmark(999);
      expect(bookmark).toBeUndefined();
    });
  });

  describe('getAllBookmarks', () => {
    it('should return all bookmarks sorted by messageIndex', async () => {
      (storageService.set as jest.Mock).mockResolvedValue(undefined);

      await bookmarkService.addBookmark(30, 'Third');
      await bookmarkService.addBookmark(10, 'First');
      await bookmarkService.addBookmark(20, 'Second');

      const bookmarks = bookmarkService.getAllBookmarks();
      expect(bookmarks).toHaveLength(3);
      expect(bookmarks[0].messageIndex).toBe(10);
      expect(bookmarks[1].messageIndex).toBe(20);
      expect(bookmarks[2].messageIndex).toBe(30);
    });

    it('should return empty array when no bookmarks', () => {
      const bookmarks = bookmarkService.getAllBookmarks();
      expect(bookmarks).toEqual([]);
    });
  });

  describe('searchByTag', () => {
    beforeEach(async () => {
      (storageService.set as jest.Mock).mockResolvedValue(undefined);

      await bookmarkService.addBookmark(1, 'JavaScript Code', 'Array methods');
      await bookmarkService.addBookmark(2, 'Python Code', 'List comprehension');
      await bookmarkService.addBookmark(3, 'CSS Styles', 'Flexbox layout');
    });

    it('should find bookmarks by tag match', () => {
      const results = bookmarkService.searchByTag('code');
      expect(results).toHaveLength(2);
      expect(results.map(b => b.messageIndex)).toEqual([1, 2]);
    });

    it('should find bookmarks by note match', () => {
      const results = bookmarkService.searchByTag('flexbox');
      expect(results).toHaveLength(1);
      expect(results[0].messageIndex).toBe(3);
    });

    it('should be case-insensitive', () => {
      const results = bookmarkService.searchByTag('PYTHON');
      expect(results).toHaveLength(1);
      expect(results[0].messageIndex).toBe(2);
    });

    it('should return empty array for no matches', () => {
      const results = bookmarkService.searchByTag('nonexistent');
      expect(results).toEqual([]);
    });

    it('should return empty array for empty search term', () => {
      const results = bookmarkService.searchByTag('');
      expect(results).toEqual([]);
    });
  });

  describe('getConversationBookmarks', () => {
    beforeEach(async () => {
      (storageService.set as jest.Mock).mockResolvedValue(undefined);

      await bookmarkService.addBookmark(1, 'Tag1', '', 'ChatGPT', 'conv-A');
      await bookmarkService.addBookmark(2, 'Tag2', '', 'ChatGPT', 'conv-B');
      await bookmarkService.addBookmark(3, 'Tag3', '', 'ChatGPT', 'conv-A');
    });

    it('should return bookmarks for specific conversation', () => {
      const results = bookmarkService.getConversationBookmarks('conv-A');
      expect(results).toHaveLength(2);
      expect(results.map(b => b.messageIndex)).toEqual([1, 3]);
    });

    it('should return all bookmarks when no conversationId provided', () => {
      const results = bookmarkService.getConversationBookmarks();
      expect(results).toHaveLength(3);
    });

    it('should return empty array for non-existent conversation', () => {
      const results = bookmarkService.getConversationBookmarks('conv-X');
      expect(results).toEqual([]);
    });
  });

  describe('clearAll', () => {
    it('should remove all bookmarks', async () => {
      (storageService.set as jest.Mock).mockResolvedValue(undefined);

      await bookmarkService.addBookmark(1, 'Tag1');
      await bookmarkService.addBookmark(2, 'Tag2');
      expect(bookmarkService.getAllBookmarks()).toHaveLength(2);

      await bookmarkService.clearAll();
      expect(bookmarkService.getAllBookmarks()).toEqual([]);
      expect(storageService.set).toHaveBeenCalledWith('message_bookmarks', []);
    });
  });

  describe('getStats', () => {
    beforeEach(async () => {
      (storageService.set as jest.Mock).mockResolvedValue(undefined);

      await bookmarkService.addBookmark(1, 'Code', '', 'ChatGPT');
      await bookmarkService.addBookmark(2, 'Code', '', 'Claude');
      await bookmarkService.addBookmark(3, 'Design', '', 'ChatGPT');
      await bookmarkService.addBookmark(4, 'Code', '', 'Gemini');
    });

    it('should return correct total count', () => {
      const stats = bookmarkService.getStats();
      expect(stats.total).toBe(4);
    });

    it('should count bookmarks by platform', () => {
      const stats = bookmarkService.getStats();
      expect(stats.byPlatform).toEqual({
        ChatGPT: 2,
        Claude: 1,
        Gemini: 1,
      });
    });

    it('should count bookmarks by tag', () => {
      const stats = bookmarkService.getStats();
      expect(stats.byTag).toEqual({
        Code: 3,
        Design: 1,
      });
    });

    it('should handle empty bookmarks', () => {
      (BookmarkService as any).instance = null;
      const newService = BookmarkService.getInstance();
      const stats = newService.getStats();

      expect(stats).toEqual({
        total: 0,
        byPlatform: {},
        byTag: {},
      });
    });
  });

  describe('exportBookmarks', () => {
    it('should export bookmarks as JSON string', async () => {
      (storageService.set as jest.Mock).mockResolvedValue(undefined);

      await bookmarkService.addBookmark(1, 'Test', 'Note', 'ChatGPT');
      const exported = bookmarkService.exportBookmarks();

      expect(typeof exported).toBe('string');
      const parsed = JSON.parse(exported);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].tag).toBe('Test');
    });

    it('should export empty array when no bookmarks', () => {
      const exported = bookmarkService.exportBookmarks();
      expect(exported).toBe('[]');
    });
  });

  describe('importBookmarks', () => {
    it('should import bookmarks from JSON string', async () => {
      (storageService.set as jest.Mock).mockResolvedValue(undefined);

      const testBookmarks: Bookmark[] = [
        {
          messageIndex: 100,
          tag: 'Imported',
          note: 'From file',
          timestamp: Date.now(),
          platform: 'Claude',
        },
      ];

      await bookmarkService.importBookmarks(JSON.stringify(testBookmarks));

      const bookmarks = bookmarkService.getAllBookmarks();
      expect(bookmarks).toHaveLength(1);
      expect(bookmarks[0].tag).toBe('Imported');
    });

    it('should merge with existing bookmarks', async () => {
      (storageService.set as jest.Mock).mockResolvedValue(undefined);

      await bookmarkService.addBookmark(1, 'Existing');

      const newBookmarks: Bookmark[] = [
        {
          messageIndex: 2,
          tag: 'New',
          note: '',
          timestamp: Date.now(),
          platform: 'ChatGPT',
        },
      ];

      await bookmarkService.importBookmarks(JSON.stringify(newBookmarks));

      const bookmarks = bookmarkService.getAllBookmarks();
      expect(bookmarks).toHaveLength(2);
    });

    it('should throw error for invalid JSON', async () => {
      await expect(bookmarkService.importBookmarks('invalid json')).rejects.toThrow();
    });

    it('should throw error for non-array data', async () => {
      await expect(bookmarkService.importBookmarks('{"not": "array"}')).rejects.toThrow('Invalid bookmark data');
    });
  });

  describe('Error Handling', () => {
    it('should handle storage errors when saving', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (storageService.set as jest.Mock).mockRejectedValue(new Error('Storage error'));

      await bookmarkService.addBookmark(1, 'Test');

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to save bookmarks:', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });

    it('should handle storage errors when loading', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (storageService.get as jest.Mock).mockRejectedValue(new Error('Load error'));

      // Create new instance to trigger load
      (BookmarkService as any).instance = null;
      BookmarkService.getInstance();

      // Wait for async load to complete
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load bookmarks:', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Loading from Storage', () => {
    it('should load existing bookmarks on initialization', async () => {
      const existingBookmarks: Bookmark[] = [
        {
          messageIndex: 5,
          tag: 'Loaded',
          note: 'From storage',
          timestamp: Date.now(),
          platform: 'ChatGPT',
        },
      ];

      (storageService.get as jest.Mock).mockResolvedValue(existingBookmarks);

      // Create new instance to trigger load
      (BookmarkService as any).instance = null;
      const newService = BookmarkService.getInstance();

      // Wait for async load to complete
      await new Promise(resolve => setTimeout(resolve, 10));

      const bookmarks = newService.getAllBookmarks();
      expect(bookmarks).toHaveLength(1);
      expect(bookmarks[0].tag).toBe('Loaded');
    });

    it('should handle null storage response', async () => {
      (storageService.get as jest.Mock).mockResolvedValue(null);

      // Create new instance
      (BookmarkService as any).instance = null;
      const newService = BookmarkService.getInstance();

      // Wait for async load
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(newService.getAllBookmarks()).toEqual([]);
    });
  });
});
