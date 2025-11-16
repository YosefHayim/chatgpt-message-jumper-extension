/**
 * Search Service Tests
 * Tests for search functionality, result navigation, and statistics
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { SearchService } from '~/src/services/searchService';
import { Message, MessageRole } from '~/src/types';
import messageService from '~/src/services/messageService';

describe('SearchService', () => {
  let searchService: SearchService;
  let mockMessages: Message[];

  beforeEach(() => {
    searchService = SearchService.getInstance();

    // Create mock messages
    mockMessages = [
      {
        index: 0,
        content: 'Hello world, this is a test message',
        element: createMockElement(),
        role: MessageRole.ASSISTANT,
        characterCount: 35,
        wordCount: 7,
      },
      {
        index: 1,
        content: 'Another test message with different content',
        element: createMockElement(),
        role: MessageRole.ASSISTANT,
        characterCount: 43,
        wordCount: 6,
      },
      {
        index: 2,
        content: 'The quick brown fox jumps over the lazy dog',
        element: createMockElement(),
        role: MessageRole.ASSISTANT,
        characterCount: 43,
        wordCount: 9,
      },
      {
        index: 3,
        content: 'Test test test - repeated word test',
        element: createMockElement(),
        role: MessageRole.ASSISTANT,
        characterCount: 36,
        wordCount: 6,
      },
    ];

    // Mock messageService
    jest.spyOn(messageService, 'getAssistantMessages').mockReturnValue(mockMessages);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    searchService.clearSearch();
  });

  function createMockElement(): HTMLElement {
    const element = document.createElement('div');
    element.scrollIntoView = jest.fn();
    return element;
  }

  describe('getInstance', () => {
    test('should return singleton instance', () => {
      const instance1 = SearchService.getInstance();
      const instance2 = SearchService.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('search', () => {
    test('should find matches in messages', () => {
      const results = searchService.search('test');

      expect(results.length).toBeGreaterThan(0);
    });

    test('should be case-insensitive', () => {
      const results1 = searchService.search('test');
      const results2 = searchService.search('TEST');
      const results3 = searchService.search('TeSt');

      expect(results1.length).toBe(results2.length);
      expect(results2.length).toBe(results3.length);
    });

    test('should count multiple matches in same message', () => {
      const results = searchService.search('test');

      const messageWithRepeats = results.find(r => r.messageIndex === 3);
      expect(messageWithRepeats).toBeDefined();
      expect(messageWithRepeats!.matches).toBe(4); // "test" appears 4 times
    });

    test('should return empty array for empty search term', () => {
      const results = searchService.search('');

      expect(results).toEqual([]);
    });

    test('should return empty array for whitespace-only search', () => {
      const results = searchService.search('   ');

      expect(results).toEqual([]);
    });

    test('should not find non-existent terms', () => {
      const results = searchService.search('nonexistent');

      expect(results).toEqual([]);
    });

    test('should include message index in results', () => {
      const results = searchService.search('test');

      results.forEach(result => {
        expect(result.messageIndex).toBeGreaterThanOrEqual(0);
        expect(result.messageIndex).toBeLessThan(mockMessages.length);
      });
    });

    test('should include element reference in results', () => {
      const results = searchService.search('test');

      results.forEach(result => {
        expect(result.element).toBeDefined();
        expect(result.element).toBeInstanceOf(HTMLElement);
      });
    });

    test('should generate preview snippets', () => {
      const results = searchService.search('test');

      results.forEach(result => {
        expect(result.preview).toBeTruthy();
        expect(typeof result.preview).toBe('string');
      });
    });

    test('should include search term in preview', () => {
      const results = searchService.search('world');

      const result = results.find(r => r.messageIndex === 0);
      expect(result!.preview.toLowerCase()).toContain('world');
    });

    test('should handle special regex characters', () => {
      // Add message with special characters
      mockMessages.push({
        index: 4,
        content: 'Question? Answer! (maybe)',
        element: createMockElement(),
        role: MessageRole.ASSISTANT,
        characterCount: 25,
        wordCount: 3,
      });

      expect(() => searchService.search('?')).not.toThrow();
      expect(() => searchService.search('!')).not.toThrow();
      expect(() => searchService.search('(')).not.toThrow();
    });

    test('should find partial word matches', () => {
      const results = searchService.search('wor');

      expect(results.length).toBeGreaterThan(0);
      // Should match "world" and "word"
    });

    test('should update search results on subsequent searches', () => {
      const results1 = searchService.search('test');
      const results2 = searchService.search('world');

      expect(results1.length).not.toBe(results2.length);
    });
  });

  describe('nextResult', () => {
    test('should navigate to next search result', () => {
      searchService.search('test');

      searchService.nextResult();

      const stats = searchService.getSearchStats();
      expect(stats.currentIndex).toBe(2); // 1-indexed, so 2nd result
    });

    test('should wrap around to first result from last', () => {
      const results = searchService.search('test');
      const totalResults = results.length;

      // Navigate to end
      for (let i = 0; i < totalResults; i++) {
        searchService.nextResult();
      }

      const stats = searchService.getSearchStats();
      expect(stats.currentIndex).toBe(1); // Wrapped to first
    });

    test('should scroll to result element', () => {
      searchService.search('test');

      searchService.nextResult();

      const results = searchService.getResults();
      expect(results[0].element.scrollIntoView).toHaveBeenCalled();
    });

    test('should do nothing with no search results', () => {
      searchService.search('nonexistent');

      expect(() => searchService.nextResult()).not.toThrow();

      const stats = searchService.getSearchStats();
      expect(stats.currentIndex).toBe(1); // Default
    });
  });

  describe('previousResult', () => {
    test('should navigate to previous search result', () => {
      searchService.search('test');

      searchService.nextResult(); // Go to second
      searchService.nextResult(); // Go to third
      searchService.previousResult(); // Back to second

      const stats = searchService.getSearchStats();
      expect(stats.currentIndex).toBe(2);
    });

    test('should wrap around to last result from first', () => {
      const results = searchService.search('test');

      searchService.previousResult(); // From first to last

      const stats = searchService.getSearchStats();
      expect(stats.currentIndex).toBe(results.length);
    });

    test('should scroll to result element', () => {
      searchService.search('test');

      searchService.nextResult();
      searchService.previousResult();

      const results = searchService.getResults();
      expect(results[0].element.scrollIntoView).toHaveBeenCalled();
    });

    test('should do nothing with no search results', () => {
      searchService.search('nonexistent');

      expect(() => searchService.previousResult()).not.toThrow();
    });
  });

  describe('getResults', () => {
    test('should return current search results', () => {
      const searchResults = searchService.search('test');
      const results = searchService.getResults();

      expect(results).toEqual(searchResults);
    });

    test('should return empty array with no search', () => {
      const results = searchService.getResults();

      expect(results).toEqual([]);
    });
  });

  describe('getSearchStats', () => {
    test('should return total results count', () => {
      searchService.search('test');

      const stats = searchService.getSearchStats();

      expect(stats.totalResults).toBeGreaterThan(0);
    });

    test('should return current index (1-indexed)', () => {
      searchService.search('test');

      const stats = searchService.getSearchStats();

      expect(stats.currentIndex).toBe(1); // Starts at 1
    });

    test('should return total matches across all results', () => {
      searchService.search('test');

      const stats = searchService.getSearchStats();

      // "test" appears multiple times across different messages
      expect(stats.totalMatches).toBeGreaterThan(stats.totalResults);
    });

    test('should update after navigation', () => {
      searchService.search('test');

      searchService.nextResult();

      const stats = searchService.getSearchStats();

      expect(stats.currentIndex).toBe(2);
    });

    test('should return zeros with no search results', () => {
      const stats = searchService.getSearchStats();

      expect(stats.totalResults).toBe(0);
      expect(stats.totalMatches).toBe(0);
    });
  });

  describe('clearSearch', () => {
    test('should clear search results', () => {
      searchService.search('test');

      searchService.clearSearch();

      const results = searchService.getResults();
      expect(results).toEqual([]);
    });

    test('should reset search stats', () => {
      searchService.search('test');
      searchService.nextResult();

      searchService.clearSearch();

      const stats = searchService.getSearchStats();
      expect(stats.totalResults).toBe(0);
      expect(stats.currentIndex).toBe(1);
      expect(stats.totalMatches).toBe(0);
    });

    test('should deactivate search', () => {
      searchService.search('test');

      searchService.clearSearch();

      expect(searchService.isActive()).toBe(false);
    });
  });

  describe('isActive', () => {
    test('should return false initially', () => {
      expect(searchService.isActive()).toBe(false);
    });

    test('should return false after clearing search', () => {
      searchService.search('test');
      searchService.clearSearch();

      expect(searchService.isActive()).toBe(false);
    });
  });

  describe('edge cases', () => {
    test('should handle search with numbers', () => {
      mockMessages.push({
        index: 5,
        content: 'The year is 2025 and the version is 2.0.0',
        element: createMockElement(),
        role: MessageRole.ASSISTANT,
        characterCount: 42,
        wordCount: 9,
      });

      const results = searchService.search('2025');

      expect(results.length).toBeGreaterThan(0);
    });

    test('should handle very long search terms', () => {
      const longTerm = 'a'.repeat(1000);

      expect(() => searchService.search(longTerm)).not.toThrow();
    });

    test('should handle messages with no text content', () => {
      mockMessages.push({
        index: 6,
        content: '',
        element: createMockElement(),
        role: MessageRole.ASSISTANT,
        characterCount: 0,
        wordCount: 0,
      });

      const results = searchService.search('test');

      // Should still work, just skip empty message
      expect(results.length).toBeGreaterThan(0);
    });

    test('should handle unicode characters', () => {
      mockMessages.push({
        index: 7,
        content: 'Hello 世界 🌍 test',
        element: createMockElement(),
        role: MessageRole.ASSISTANT,
        characterCount: 18,
        wordCount: 3,
      });

      const results1 = searchService.search('世界');
      const results2 = searchService.search('🌍');

      expect(results1.length).toBeGreaterThan(0);
      expect(results2.length).toBeGreaterThan(0);
    });

    test('should handle rapid consecutive searches', () => {
      searchService.search('test');
      searchService.search('world');
      searchService.search('message');
      searchService.search('hello');

      const results = searchService.getResults();

      // Should only have results from last search
      expect(results.every(r =>
        mockMessages[r.messageIndex].content.toLowerCase().includes('hello')
      )).toBe(true);
    });

    test('should generate context preview with ellipsis', () => {
      const results = searchService.search('quick');

      const result = results.find(r => r.messageIndex === 2);

      // Preview should have ellipsis if content is long
      if (result!.preview.length < mockMessages[2].content.length) {
        expect(
          result!.preview.includes('...') ||
          result!.preview.startsWith('...') ||
          result!.preview.endsWith('...')
        ).toBe(true);
      }
    });

    test('should handle single character searches', () => {
      const results = searchService.search('a');

      expect(results.length).toBeGreaterThan(0);
    });

    test('should handle search term at start of message', () => {
      const results = searchService.search('Hello');

      expect(results.length).toBeGreaterThan(0);
      const result = results.find(r => r.messageIndex === 0);
      expect(result).toBeDefined();
    });

    test('should handle search term at end of message', () => {
      const results = searchService.search('message');

      expect(results.length).toBeGreaterThan(0);
    });

    test('should navigate through many results', () => {
      searchService.search('e'); // Common letter, many matches

      const stats1 = searchService.getSearchStats();
      const initialTotal = stats1.totalResults;

      // Navigate forward many times
      for (let i = 0; i < 100; i++) {
        searchService.nextResult();
      }

      const stats2 = searchService.getSearchStats();

      // Should wrap around correctly
      expect(stats2.currentIndex).toBeGreaterThan(0);
      expect(stats2.currentIndex).toBeLessThanOrEqual(initialTotal);
    });
  });

  describe('preview generation', () => {
    test('should include context around match', () => {
      const results = searchService.search('brown');

      const result = results.find(r => r.messageIndex === 2);
      expect(result!.preview).toContain('brown');
      expect(result!.preview).toContain('quick'); // Before
      expect(result!.preview).toContain('fox'); // After
    });

    test('should handle match at beginning of content', () => {
      const results = searchService.search('Hello');

      const result = results.find(r => r.messageIndex === 0);
      expect(result!.preview).toBeTruthy();
      expect(result!.preview.toLowerCase()).toContain('hello');
    });

    test('should handle match at end of content', () => {
      const results = searchService.search('dog');

      const result = results.find(r => r.messageIndex === 2);
      expect(result!.preview).toBeTruthy();
      expect(result!.preview.toLowerCase()).toContain('dog');
    });
  });
});
