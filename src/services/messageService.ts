/**
 * Message Service
 * Handles message detection, counting, and analysis across all platforms
 */

import { Message, MessageRole, ConversationStats } from '~/src/types';
import platformDetector from './platformDetector';

export class MessageService {
  private static instance: MessageService;
  private messages: Message[] = [];
  private assistantMessages: Message[] = [];

  private constructor() {}

  public static getInstance(): MessageService {
    if (!MessageService.instance) {
      MessageService.instance = new MessageService();
    }
    return MessageService.instance;
  }

  /**
   * Scan the page and collect all messages
   */
  public scanMessages(): Message[] {
    const config = platformDetector.getConfig();

    // Find all assistant messages
    const elements = document.querySelectorAll<HTMLElement>(config.messageSelector);

    this.assistantMessages = Array.from(elements)
      .map((element, index) => this.parseMessage(element, index))
      .filter((msg): msg is Message => msg !== null);

    // For complete conversation stats, we'd also want user messages
    this.messages = [...this.assistantMessages];

    return this.assistantMessages;
  }

  /**
   * Parse a message element into a Message object
   */
  private parseMessage(
    element: HTMLElement,
    index: number
  ): Message | null {
    const content = this.extractContent(element);

    if (!content) {
      return null;
    }

    const characterCount = content.length;
    const wordCount = content.split(/\s+/).filter((word) => word.length > 0).length;

    return {
      element,
      role: MessageRole.ASSISTANT,
      content,
      index,
      characterCount,
      wordCount,
    };
  }

  /**
   * Extract text content from a message element
   */
  private extractContent(element: HTMLElement): string {
    const config = platformDetector.getConfig();

    if (config.contentSelector) {
      const contentElement = element.querySelector<HTMLElement>(config.contentSelector);
      return contentElement?.innerText.trim() || element.innerText.trim();
    }

    return element.innerText.trim();
  }

  /**
   * Get all assistant messages
   */
  public getAssistantMessages(): Message[] {
    return this.assistantMessages;
  }

  /**
   * Get all messages (including user messages if detectable)
   */
  public getAllMessages(): Message[] {
    const config = platformDetector.getConfig();
    const allElements = document.querySelectorAll<HTMLElement>(config.messageSelector);
    const allMessages: Message[] = [];

    allElements.forEach((element, index) => {
      const content = this.extractContent(element);
      if (!content) return;

      // Try to determine if this is a user or assistant message
      // This is a simple heuristic - could be improved per platform
      const isUserMessage = element.getAttribute('data-role') === 'user' ||
        element.classList.contains('user') ||
        element.querySelector('[data-role="user"]') !== null;

      const characterCount = content.length;
      const wordCount = content.split(/\s+/).filter((word) => word.length > 0).length;

      allMessages.push({
        element,
        role: isUserMessage ? MessageRole.USER : MessageRole.ASSISTANT,
        content,
        index,
        characterCount,
        wordCount,
      });
    });

    return allMessages;
  }

  /**
   * Get a specific message by index
   */
  public getMessage(index: number): Message | undefined {
    return this.assistantMessages[index];
  }

  /**
   * Get conversation statistics
   */
  public getConversationStats(): ConversationStats {
    const totalCharacters = this.assistantMessages.reduce(
      (sum, msg) => sum + msg.characterCount,
      0
    );
    const totalWords = this.assistantMessages.reduce((sum, msg) => sum + msg.wordCount, 0);

    // Rough token estimation: ~4 characters per token
    const estimatedTokens = Math.ceil(totalCharacters / 4);

    return {
      totalMessages: this.messages.length,
      userMessages: 0, // Would need to detect user messages separately
      assistantMessages: this.assistantMessages.length,
      totalCharacters,
      totalWords,
      estimatedTokens,
    };
  }

  /**
   * Estimate tokens for context warning
   */
  public estimateTokens(): {
    tokens: number;
    characters: number;
    words: number;
    percentOfContext: number;
  } {
    const stats = this.getConversationStats();
    const config = platformDetector.getConfig();
    const percentOfContext = (stats.estimatedTokens / config.maxContextTokens) * 100;

    return {
      tokens: stats.estimatedTokens,
      characters: stats.totalCharacters,
      words: stats.totalWords,
      percentOfContext: Math.min(percentOfContext, 100),
    };
  }

  /**
   * Find the closest visible message to the current viewport
   */
  public findClosestVisibleMessage(): number {
    const viewportCenter = window.innerHeight / 2;
    let closestIndex = 0;
    let closestDistance = Infinity;

    this.assistantMessages.forEach((message, index) => {
      const rect = message.element.getBoundingClientRect();
      const messageCenter = rect.top + rect.height / 2;
      const distance = Math.abs(messageCenter - viewportCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    return closestIndex;
  }

  /**
   * Refresh messages (re-scan the DOM)
   */
  public refresh(): void {
    this.scanMessages();
  }

  /**
   * Get total message count
   */
  public getMessageCount(): number {
    return this.assistantMessages.length;
  }

  /**
   * Reset service state (primarily for testing)
   */
  public reset(): void {
    this.messages = [];
    this.assistantMessages = [];
  }
}

export default MessageService.getInstance();
