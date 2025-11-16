/**
 * Search Service
 * Enhanced search functionality that searches within individual messages
 */

import { SearchResult } from '~/src/types';
import messageService from './messageService';

export class SearchService {
  private static instance: SearchService;
  private currentSearchTerm: string = '';
  private searchResults: SearchResult[] = [];
  private currentResultIndex: number = -1;
  private isSearchActive: boolean = false;

  private constructor() {
    this.initializeSearchListener();
  }

  public static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService();
    }
    return SearchService.instance;
  }

  /**
   * Initialize keyboard listener for Ctrl+F
   */
  private initializeSearchListener(): void {
    document.addEventListener('keydown', (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
        // Let default browser search work, but enhance it
        this.isSearchActive = true;
      }
    });

    // Listen for search input changes
    document.addEventListener('keyup', () => {
      if (this.isSearchActive) {
        this.performSearch();
      }
    });
  }

  /**
   * Search within messages for a term
   */
  public search(searchTerm: string): SearchResult[] {
    this.currentSearchTerm = searchTerm.toLowerCase();
    this.searchResults = [];
    this.currentResultIndex = -1;

    if (!searchTerm.trim()) {
      return [];
    }

    const messages = messageService.getAssistantMessages();

    messages.forEach((message) => {
      const content = message.content.toLowerCase();
      const matches = this.countMatches(content, this.currentSearchTerm);

      if (matches > 0) {
        const preview = this.generatePreview(message.content, searchTerm);
        this.searchResults.push({
          messageIndex: message.index,
          element: message.element,
          matches,
          preview,
        });
      }
    });

    // If we have results, start at the first one and scroll to it
    if (this.searchResults.length > 0) {
      this.currentResultIndex = 0;
      this.scrollToResult(0);
    }

    return this.searchResults;
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Count how many times a term appears in text
   */
  private countMatches(text: string, term: string): number {
    if (!term) return 0;
    const escapedTerm = this.escapeRegex(term);
    const regex = new RegExp(escapedTerm, 'gi');
    const matches = text.match(regex);
    return matches ? matches.length : 0;
  }

  /**
   * Generate a preview snippet showing the match context
   */
  private generatePreview(content: string, searchTerm: string, contextLength: number = 50): string {
    const lowerContent = content.toLowerCase();
    const lowerTerm = searchTerm.toLowerCase();
    const index = lowerContent.indexOf(lowerTerm);

    if (index === -1) return '';

    const start = Math.max(0, index - contextLength);
    const end = Math.min(content.length, index + searchTerm.length + contextLength);

    let preview = content.substring(start, end);

    if (start > 0) preview = '...' + preview;
    if (end < content.length) preview = preview + '...';

    return preview;
  }

  /**
   * Navigate to next search result
   */
  public nextResult(): void {
    if (this.searchResults.length === 0) return;

    this.currentResultIndex = (this.currentResultIndex + 1) % this.searchResults.length;
    this.scrollToResult(this.currentResultIndex);
  }

  /**
   * Navigate to previous search result
   */
  public previousResult(): void {
    if (this.searchResults.length === 0) return;

    this.currentResultIndex =
      (this.currentResultIndex - 1 + this.searchResults.length) % this.searchResults.length;
    this.scrollToResult(this.currentResultIndex);
  }

  /**
   * Scroll to a specific search result
   */
  private scrollToResult(index: number): void {
    const result = this.searchResults[index];
    if (!result) return;

    result.element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });

    this.highlightResult(result.element);
  }

  /**
   * Highlight a search result message
   */
  private highlightResult(element: HTMLElement): void {
    const originalOutline = element.style.outline;

    element.style.outline = '2px solid #ff9800';

    setTimeout(() => {
      element.style.outline = originalOutline;
    }, 1500);
  }

  /**
   * Get current search results
   */
  public getResults(): SearchResult[] {
    return this.searchResults;
  }

  /**
   * Get search statistics
   */
  public getSearchStats(): {
    totalResults: number;
    currentIndex: number;
    totalMatches: number;
  } {
    const totalMatches = this.searchResults.reduce((sum, result) => sum + result.matches, 0);

    return {
      totalResults: this.searchResults.length,
      currentIndex: Math.max(1, this.currentResultIndex + 1),
      totalMatches,
    };
  }

  /**
   * Clear search
   */
  public clearSearch(): void {
    this.currentSearchTerm = '';
    this.searchResults = [];
    this.currentResultIndex = -1;
    this.isSearchActive = false;
  }

  /**
   * Perform search based on browser's find dialog
   */
  private performSearch(): void {
    // This is a placeholder for enhanced search integration
    // In practice, we'd need to intercept the browser's search or provide our own UI
  }

  /**
   * Check if search is active
   */
  public isActive(): boolean {
    return this.isSearchActive;
  }

  /**
   * Reset service state (primarily for testing)
   */
  public reset(): void {
    this.currentSearchTerm = '';
    this.searchResults = [];
    this.currentResultIndex = -1;
    this.isSearchActive = false;
  }
}

export default SearchService.getInstance();
