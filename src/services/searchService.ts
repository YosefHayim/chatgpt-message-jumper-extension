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
    console.log('[Search Debug] Starting search for:', searchTerm);

    // Clear previous search highlights
    this.clearHighlights();

    this.currentSearchTerm = searchTerm.toLowerCase();
    this.searchResults = [];
    this.currentResultIndex = -1;

    if (!searchTerm.trim()) {
      console.log('[Search Debug] Empty search term, returning');
      return [];
    }

    const messages = messageService.getAssistantMessages();
    console.log('[Search Debug] Searching in', messages.length, 'messages');

    messages.forEach((message) => {
      const content = message.content.toLowerCase();
      const matches = this.countMatches(content, this.currentSearchTerm);

      if (matches > 0) {
        console.log('[Search Debug] Found', matches, 'matches in message', message.index);
        console.log('[Search Debug] Message element:', message.element);
        console.log('[Search Debug] Message preview:', content.substring(0, 100));

        const preview = this.generatePreview(message.content, searchTerm);
        this.searchResults.push({
          messageIndex: message.index,
          element: message.element,
          matches,
          preview,
        });

        // Highlight all matches in this message (not just the current one)
        this.highlightTextInElement(message.element, searchTerm);
      }
    });

    console.log('[Search Debug] Total results:', this.searchResults.length);

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

    console.log('[Search Debug] Scrolling to result', index + 1, 'of', this.searchResults.length);

    // Remove active outline from all results
    this.searchResults.forEach(r => {
      r.element.style.outline = '';
    });

    result.element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });

    this.highlightResult(result.element);
  }

  /**
   * Highlight a search result message with an outline
   */
  private highlightResult(element: HTMLElement): void {
    console.log('[Search Debug] Adding outline to current result');

    // Add outline to the message container to show it's the active result
    element.style.outline = '3px solid #ff9800';
    element.style.outlineOffset = '2px';
  }

  /**
   * Highlight all occurrences of search term within an element's text
   */
  private highlightTextInElement(element: HTMLElement, searchTerm: string): void {
    if (!searchTerm.trim()) return;

    console.log('[Search Debug] Highlighting text in element:', element);
    console.log('[Search Debug] Search term:', searchTerm);

    // Get all text nodes within the element
    const textNodes = this.getTextNodes(element);
    console.log('[Search Debug] Found text nodes:', textNodes.length);

    const escapedTerm = this.escapeRegex(searchTerm);
    const regex = new RegExp(`(${escapedTerm})`, 'gi');

    textNodes.forEach((textNode) => {
      const text = textNode.textContent || '';
      if (!regex.test(text)) return;

      // Reset regex lastIndex
      regex.lastIndex = 0;

      // Check if text contains the search term
      if (text.toLowerCase().includes(searchTerm.toLowerCase())) {
        console.log('[Search Debug] Found match in text node:', text.substring(0, 100));

        // Create a temporary container
        const span = document.createElement('span');
        span.innerHTML = text.replace(regex, '<mark style="background-color: #ff9800; color: black; padding: 2px 4px; border-radius: 3px; font-weight: 600;">$1</mark>');

        // Replace the text node with the highlighted version
        if (textNode.parentNode) {
          textNode.parentNode.replaceChild(span, textNode);

          // Mark this element as highlighted for cleanup
          span.setAttribute('data-search-highlight', 'true');
        }
      }
    });
  }

  /**
   * Get all text nodes within an element
   */
  private getTextNodes(element: HTMLElement): Text[] {
    const textNodes: Text[] = [];
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // Skip empty text nodes and those already inside mark tags
          if (!node.textContent?.trim()) return NodeFilter.FILTER_REJECT;
          if (node.parentElement?.tagName === 'MARK') return NodeFilter.FILTER_REJECT;
          if (node.parentElement?.tagName === 'SCRIPT') return NodeFilter.FILTER_REJECT;
          if (node.parentElement?.tagName === 'STYLE') return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    let node: Node | null;
    while (node = walker.nextNode()) {
      if (node.nodeType === Node.TEXT_NODE) {
        textNodes.push(node as Text);
      }
    }

    return textNodes;
  }

  /**
   * Clear all search highlights
   */
  private clearHighlights(): void {
    console.log('[Search Debug] Clearing previous highlights');

    // Remove all highlighted elements
    const highlights = document.querySelectorAll('[data-search-highlight="true"]');
    highlights.forEach((span) => {
      // Replace the span with its text content
      const parent = span.parentNode;
      if (parent) {
        const text = document.createTextNode(span.textContent || '');
        parent.replaceChild(text, span);

        // Normalize the parent to merge adjacent text nodes
        parent.normalize();
      }
    });
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
    console.log('[Search Debug] Clearing search');
    this.clearHighlights();

    // Remove outlines from all search results
    this.searchResults.forEach(r => {
      r.element.style.outline = '';
      r.element.style.outlineOffset = '';
    });

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
