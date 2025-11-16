/**
 * Bookmark Service
 * Manages message bookmarks with custom tags and notes
 */

export interface Bookmark {
  messageIndex: number;
  tag: string;
  note: string;
  timestamp: number;
  platform: string;
  conversationId?: string;
}

export class BookmarkService {
  private static instance: BookmarkService;
  private bookmarks: Map<number, Bookmark> = new Map();
  private storageKey = 'message_bookmarks';

  private constructor() {
    this.loadBookmarks();
  }

  public static getInstance(): BookmarkService {
    if (!BookmarkService.instance) {
      BookmarkService.instance = new BookmarkService();
    }
    return BookmarkService.instance;
  }

  /**
   * Load bookmarks from storage
   */
  private async loadBookmarks(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(this.storageKey);
      const stored = result[this.storageKey];
      if (stored && Array.isArray(stored)) {
        this.bookmarks.clear();
        stored.forEach((bookmark: Bookmark) => {
          this.bookmarks.set(bookmark.messageIndex, bookmark);
        });
      }
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
    }
  }

  /**
   * Save bookmarks to storage
   */
  private async saveBookmarks(): Promise<void> {
    try {
      const bookmarksArray = Array.from(this.bookmarks.values());
      await chrome.storage.local.set({ [this.storageKey]: bookmarksArray });
    } catch (error) {
      console.error('Failed to save bookmarks:', error);
    }
  }

  /**
   * Add or update a bookmark
   */
  public async addBookmark(
    messageIndex: number,
    tag: string,
    note: string = '',
    platform: string = '',
    conversationId?: string
  ): Promise<void> {
    const bookmark: Bookmark = {
      messageIndex,
      tag: tag.trim(),
      note: note.trim(),
      timestamp: Date.now(),
      platform,
      conversationId,
    };

    this.bookmarks.set(messageIndex, bookmark);
    await this.saveBookmarks();
  }

  /**
   * Remove a bookmark
   */
  public async removeBookmark(messageIndex: number): Promise<void> {
    this.bookmarks.delete(messageIndex);
    await this.saveBookmarks();
  }

  /**
   * Check if a message is bookmarked
   */
  public isBookmarked(messageIndex: number): boolean {
    return this.bookmarks.has(messageIndex);
  }

  /**
   * Get a specific bookmark
   */
  public getBookmark(messageIndex: number): Bookmark | undefined {
    return this.bookmarks.get(messageIndex);
  }

  /**
   * Get all bookmarks
   */
  public getAllBookmarks(): Bookmark[] {
    return Array.from(this.bookmarks.values()).sort((a, b) => a.messageIndex - b.messageIndex);
  }

  /**
   * Search bookmarks by tag
   */
  public searchByTag(searchTerm: string): Bookmark[] {
    const term = searchTerm.toLowerCase();
    return this.getAllBookmarks().filter(
      (bookmark) =>
        bookmark.tag.toLowerCase().includes(term) || bookmark.note.toLowerCase().includes(term)
    );
  }

  /**
   * Get bookmarks for current conversation
   */
  public getConversationBookmarks(conversationId?: string): Bookmark[] {
    if (!conversationId) {
      return this.getAllBookmarks();
    }
    return this.getAllBookmarks().filter((bookmark) => bookmark.conversationId === conversationId);
  }

  /**
   * Clear all bookmarks
   */
  public async clearAll(): Promise<void> {
    this.bookmarks.clear();
    await this.saveBookmarks();
  }

  /**
   * Get bookmark statistics
   */
  public getStats(): {
    total: number;
    byPlatform: Record<string, number>;
    byTag: Record<string, number>;
  } {
    const bookmarks = this.getAllBookmarks();
    const byPlatform: Record<string, number> = {};
    const byTag: Record<string, number> = {};

    bookmarks.forEach((bookmark) => {
      // Count by platform
      if (bookmark.platform) {
        byPlatform[bookmark.platform] = (byPlatform[bookmark.platform] || 0) + 1;
      }

      // Count by tag
      if (bookmark.tag) {
        byTag[bookmark.tag] = (byTag[bookmark.tag] || 0) + 1;
      }
    });

    return {
      total: bookmarks.length,
      byPlatform,
      byTag,
    };
  }

  /**
   * Export bookmarks to JSON
   */
  public exportBookmarks(): string {
    const bookmarks = this.getAllBookmarks();
    return JSON.stringify(bookmarks, null, 2);
  }

  /**
   * Import bookmarks from JSON
   */
  public async importBookmarks(jsonData: string): Promise<void> {
    try {
      const bookmarks = JSON.parse(jsonData) as Bookmark[];
      if (!Array.isArray(bookmarks)) {
        throw new Error('Invalid bookmark data');
      }

      bookmarks.forEach((bookmark) => {
        this.bookmarks.set(bookmark.messageIndex, bookmark);
      });

      await this.saveBookmarks();
    } catch (error) {
      console.error('Failed to import bookmarks:', error);
      throw error;
    }
  }
}

export default BookmarkService.getInstance();
