/**
 * Conversation Tracker Service
 * Tracks conversations across platforms with time-based analytics
 */

import storageService from './storageService';
import platformDetector from './platformDetector';

export interface ConversationRecord {
  id: string;
  platform: string;
  date: number; // timestamp
  messageCount: number;
  characterCount: number;
  url: string;
}

export interface ConversationStats {
  thisWeek: number;
  thisMonth: number;
  allTime: number;
  byPlatform: Record<string, number>;
}

export class ConversationTrackerService {
  private static instance: ConversationTrackerService;
  private conversations: ConversationRecord[] = [];
  private storageKey = 'conversation_history';
  private currentConversationId: string | null = null;

  private constructor() {
    this.loadConversations();
    this.generateConversationId();
  }

  public static getInstance(): ConversationTrackerService {
    if (!ConversationTrackerService.instance) {
      ConversationTrackerService.instance = new ConversationTrackerService();
    }
    return ConversationTrackerService.instance;
  }

  /**
   * Generate a unique conversation ID based on URL and timestamp
   */
  private generateConversationId(): void {
    const url = window.location.href;
    const platform = platformDetector.getPlatformName();
    const urlHash = this.hashString(url);
    this.currentConversationId = `${platform}_${urlHash}`;
  }

  /**
   * Simple hash function for strings
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Load conversations from storage
   */
  private async loadConversations(): Promise<void> {
    try {
      const stored = await storageService.get(this.storageKey);
      if (stored && Array.isArray(stored)) {
        this.conversations = stored;
        // Clean up old conversations (older than 6 months)
        this.cleanupOldConversations();
      }
    } catch (error) {
      console.error('Failed to load conversation history:', error);
    }
  }

  /**
   * Save conversations to storage
   */
  private async saveConversations(): Promise<void> {
    try {
      await storageService.set(this.storageKey, this.conversations);
    } catch (error) {
      console.error('Failed to save conversation history:', error);
    }
  }

  /**
   * Clean up conversations older than 6 months
   */
  private cleanupOldConversations(): void {
    const sixMonthsAgo = Date.now() - 6 * 30 * 24 * 60 * 60 * 1000;
    const originalLength = this.conversations.length;
    this.conversations = this.conversations.filter((conv) => conv.date > sixMonthsAgo);

    if (this.conversations.length < originalLength) {
      this.saveConversations();
    }
  }

  /**
   * Record or update current conversation
   */
  public async recordConversation(messageCount: number, characterCount: number): Promise<void> {
    if (!this.currentConversationId) {
      this.generateConversationId();
    }

    const platform = platformDetector.getPlatformName();
    const url = window.location.href;

    // Find existing conversation or create new one
    const existingIndex = this.conversations.findIndex(
      (conv) => conv.id === this.currentConversationId
    );

    const conversationRecord: ConversationRecord = {
      id: this.currentConversationId!,
      platform,
      date: Date.now(),
      messageCount,
      characterCount,
      url,
    };

    if (existingIndex >= 0) {
      // Update existing conversation
      this.conversations[existingIndex] = conversationRecord;
    } else {
      // Add new conversation
      this.conversations.push(conversationRecord);
    }

    await this.saveConversations();
  }

  /**
   * Get conversation statistics
   */
  public getStats(): ConversationStats {
    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

    const byPlatform: Record<string, number> = {};
    let thisWeek = 0;
    let thisMonth = 0;

    this.conversations.forEach((conv) => {
      // Count by time period
      if (conv.date >= oneWeekAgo) {
        thisWeek++;
      }
      if (conv.date >= oneMonthAgo) {
        thisMonth++;
      }

      // Count by platform
      byPlatform[conv.platform] = (byPlatform[conv.platform] || 0) + 1;
    });

    return {
      thisWeek,
      thisMonth,
      allTime: this.conversations.length,
      byPlatform,
    };
  }

  /**
   * Get conversations for a specific time period
   */
  public getConversationsByPeriod(days: number): ConversationRecord[] {
    const cutoffDate = Date.now() - days * 24 * 60 * 60 * 1000;
    return this.conversations
      .filter((conv) => conv.date >= cutoffDate)
      .sort((a, b) => b.date - a.date);
  }

  /**
   * Get conversations by platform
   */
  public getConversationsByPlatform(platform: string): ConversationRecord[] {
    return this.conversations
      .filter((conv) => conv.platform === platform)
      .sort((a, b) => b.date - a.date);
  }

  /**
   * Get total message count across all conversations
   */
  public getTotalMessages(): number {
    return this.conversations.reduce((sum, conv) => sum + conv.messageCount, 0);
  }

  /**
   * Get average messages per conversation
   */
  public getAverageMessagesPerConversation(): number {
    if (this.conversations.length === 0) return 0;
    return Math.round(this.getTotalMessages() / this.conversations.length);
  }

  /**
   * Clear all conversation history
   */
  public async clearHistory(): Promise<void> {
    this.conversations = [];
    await this.saveConversations();
  }

  /**
   * Export conversation history as JSON
   */
  public exportHistory(): string {
    return JSON.stringify(this.conversations, null, 2);
  }

  /**
   * Import conversation history from JSON
   */
  public async importHistory(jsonData: string): Promise<void> {
    try {
      const imported = JSON.parse(jsonData) as ConversationRecord[];
      if (!Array.isArray(imported)) {
        throw new Error('Invalid conversation history data');
      }

      // Merge with existing conversations (avoid duplicates)
      const existingIds = new Set(this.conversations.map((c) => c.id));
      const newConversations = imported.filter((c) => !existingIds.has(c.id));

      this.conversations.push(...newConversations);
      await this.saveConversations();
    } catch (error) {
      console.error('Failed to import conversation history:', error);
      throw error;
    }
  }
}

export default ConversationTrackerService.getInstance();
