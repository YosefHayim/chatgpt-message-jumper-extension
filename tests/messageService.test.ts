/**
 * Message Service Tests
 * Tests for message scanning, counting, and statistics
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { MessageService } from '~/src/services/messageService';
import { MessageRole } from '~/src/types';
import platformDetector from '~/src/services/platformDetector';

describe('MessageService', () => {
  let messageService: MessageService;

  beforeEach(() => {
    messageService = MessageService.getInstance();
    messageService.reset(); // Reset state between tests

    // Mock platformDetector
    jest.spyOn(platformDetector, 'getConfig').mockReturnValue({
      name: 'ChatGPT',
      platform: 'chatgpt' as any,
      messageSelector: '.test-message',
      contentSelector: '.test-content',
      maxContextTokens: 128000,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    document.body.innerHTML = '';
  });

  describe('getInstance', () => {
    test('should return singleton instance', () => {
      const instance1 = MessageService.getInstance();
      const instance2 = MessageService.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('scanMessages', () => {
    test('should scan and collect messages from DOM', () => {
      document.body.innerHTML = `
        <div class="test-message">
          <div class="test-content">Hello world</div>
        </div>
        <div class="test-message">
          <div class="test-content">How can I help?</div>
        </div>
      `;

      const messages = messageService.scanMessages();

      expect(messages).toHaveLength(2);
      expect(messages[0].content).toContain('Hello world');
      expect(messages[1].content).toContain('How can I help?');
    });

    test('should assign correct indices to messages', () => {
      document.body.innerHTML = `
        <div class="test-message">
          <div class="test-content">First</div>
        </div>
        <div class="test-message">
          <div class="test-content">Second</div>
        </div>
        <div class="test-message">
          <div class="test-content">Third</div>
        </div>
      `;

      const messages = messageService.scanMessages();

      expect(messages[0].index).toBe(0);
      expect(messages[1].index).toBe(1);
      expect(messages[2].index).toBe(2);
    });

    test('should set role to ASSISTANT for all messages', () => {
      document.body.innerHTML = `
        <div class="test-message">
          <div class="test-content">Message</div>
        </div>
      `;

      const messages = messageService.scanMessages();

      expect(messages[0].role).toBe(MessageRole.ASSISTANT);
    });

    test('should calculate character count', () => {
      document.body.innerHTML = `
        <div class="test-message">
          <div class="test-content">Hello</div>
        </div>
      `;

      const messages = messageService.scanMessages();

      expect(messages[0].characterCount).toBe(5);
    });

    test('should calculate word count', () => {
      document.body.innerHTML = `
        <div class="test-message">
          <div class="test-content">Hello world from tests</div>
        </div>
      `;

      const messages = messageService.scanMessages();

      expect(messages[0].wordCount).toBe(4);
    });

    test('should handle empty messages', () => {
      document.body.innerHTML = `
        <div class="test-message">
          <div class="test-content"></div>
        </div>
      `;

      const messages = messageService.scanMessages();

      expect(messages).toHaveLength(0); // Empty messages filtered out
    });

    test('should handle messages with only whitespace', () => {
      document.body.innerHTML = `
        <div class="test-message">
          <div class="test-content">   </div>
        </div>
      `;

      const messages = messageService.scanMessages();

      expect(messages).toHaveLength(0);
    });

    test('should extract content without contentSelector', () => {
      jest.spyOn(platformDetector, 'getConfig').mockReturnValue({
        name: 'Test',
        platform: 'chatgpt' as any,
        messageSelector: '.test-message',
        maxContextTokens: 128000,
      });

      document.body.innerHTML = `
        <div class="test-message">Direct content here</div>
      `;

      const messages = messageService.scanMessages();

      expect(messages[0].content).toBe('Direct content here');
    });

    test('should handle no messages in DOM', () => {
      document.body.innerHTML = '<div>No messages here</div>';

      const messages = messageService.scanMessages();

      expect(messages).toHaveLength(0);
    });

    test('should trim whitespace from content', () => {
      document.body.innerHTML = `
        <div class="test-message">
          <div class="test-content">

            Content with whitespace

          </div>
        </div>
      `;

      const messages = messageService.scanMessages();

      expect(messages[0].content).toBe('Content with whitespace');
    });
  });

  describe('getAssistantMessages', () => {
    test('should return scanned messages', () => {
      document.body.innerHTML = `
        <div class="test-message">
          <div class="test-content">Message 1</div>
        </div>
        <div class="test-message">
          <div class="test-content">Message 2</div>
        </div>
      `;

      messageService.scanMessages();
      const messages = messageService.getAssistantMessages();

      expect(messages).toHaveLength(2);
    });

    test('should return empty array before scanning', () => {
      const messages = messageService.getAssistantMessages();

      expect(messages).toEqual([]);
    });
  });

  describe('getMessage', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div class="test-message">
          <div class="test-content">First</div>
        </div>
        <div class="test-message">
          <div class="test-content">Second</div>
        </div>
      `;

      messageService.scanMessages();
    });

    test('should return message at specific index', () => {
      const message = messageService.getMessage(0);

      expect(message).toBeDefined();
      expect(message?.content).toBe('First');
    });

    test('should return undefined for invalid index', () => {
      const message = messageService.getMessage(999);

      expect(message).toBeUndefined();
    });

    test('should return undefined for negative index', () => {
      const message = messageService.getMessage(-1);

      expect(message).toBeUndefined();
    });
  });

  describe('getConversationStats', () => {
    test('should calculate total characters', () => {
      document.body.innerHTML = `
        <div class="test-message">
          <div class="test-content">Hello</div>
        </div>
        <div class="test-message">
          <div class="test-content">World</div>
        </div>
      `;

      messageService.scanMessages();
      const stats = messageService.getConversationStats();

      expect(stats.totalCharacters).toBe(10); // "Hello" + "World"
    });

    test('should calculate total words', () => {
      document.body.innerHTML = `
        <div class="test-message">
          <div class="test-content">Hello world</div>
        </div>
        <div class="test-message">
          <div class="test-content">Testing messages</div>
        </div>
      `;

      messageService.scanMessages();
      const stats = messageService.getConversationStats();

      expect(stats.totalWords).toBe(4);
    });

    test('should count assistant messages', () => {
      document.body.innerHTML = `
        <div class="test-message">
          <div class="test-content">Message 1</div>
        </div>
        <div class="test-message">
          <div class="test-content">Message 2</div>
        </div>
        <div class="test-message">
          <div class="test-content">Message 3</div>
        </div>
      `;

      messageService.scanMessages();
      const stats = messageService.getConversationStats();

      expect(stats.assistantMessages).toBe(3);
      expect(stats.totalMessages).toBe(3);
    });

    test('should estimate tokens (rough estimation)', () => {
      document.body.innerHTML = `
        <div class="test-message">
          <div class="test-content">This is a test message with multiple words</div>
        </div>
      `;

      messageService.scanMessages();
      const stats = messageService.getConversationStats();

      // Rough estimate: ~4 chars per token
      expect(stats.estimatedTokens).toBeGreaterThan(0);
      expect(stats.estimatedTokens).toBeLessThan(stats.totalCharacters);
    });

    test('should return zero stats for no messages', () => {
      const stats = messageService.getConversationStats();

      expect(stats.totalMessages).toBe(0);
      expect(stats.assistantMessages).toBe(0);
      expect(stats.totalCharacters).toBe(0);
      expect(stats.totalWords).toBe(0);
      expect(stats.estimatedTokens).toBe(0);
    });
  });

  describe('estimateTokens', () => {
    test('should estimate tokens with percentage of context', () => {
      document.body.innerHTML = `
        <div class="test-message">
          <div class="test-content">Test message for token estimation</div>
        </div>
      `;

      messageService.scanMessages();
      const estimation = messageService.estimateTokens();

      expect(estimation.tokens).toBeGreaterThan(0);
      expect(estimation.characters).toBeGreaterThan(0);
      expect(estimation.words).toBeGreaterThan(0);
      expect(estimation.percentOfContext).toBeGreaterThanOrEqual(0);
      expect(estimation.percentOfContext).toBeLessThanOrEqual(100);
    });

    test('should cap percentage at 100', () => {
      // Mock a very large conversation
      document.body.innerHTML = Array.from({ length: 1000 }, () => `
        <div class="test-message">
          <div class="test-content">${'a'.repeat(1000)}</div>
        </div>
      `).join('');

      messageService.scanMessages();
      const estimation = messageService.estimateTokens();

      expect(estimation.percentOfContext).toBeLessThanOrEqual(100);
    });

    test('should return zero values for no messages', () => {
      const estimation = messageService.estimateTokens();

      expect(estimation.tokens).toBe(0);
      expect(estimation.characters).toBe(0);
      expect(estimation.words).toBe(0);
      expect(estimation.percentOfContext).toBe(0);
    });
  });

  describe('findClosestVisibleMessage', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div class="test-message">
          <div class="test-content">First</div>
        </div>
        <div class="test-message">
          <div class="test-content">Second</div>
        </div>
        <div class="test-message">
          <div class="test-content">Third</div>
        </div>
      `;

      messageService.scanMessages();
    });

    test('should return an index', () => {
      const index = messageService.findClosestVisibleMessage();

      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(3);
    });

    test('should return 0 for empty messages', () => {
      document.body.innerHTML = '';
      messageService.scanMessages();

      const index = messageService.findClosestVisibleMessage();

      expect(index).toBe(0);
    });
  });

  describe('refresh', () => {
    test('should rescan messages', () => {
      document.body.innerHTML = `
        <div class="test-message">
          <div class="test-content">Initial</div>
        </div>
      `;

      messageService.scanMessages();
      let messages = messageService.getAssistantMessages();
      expect(messages).toHaveLength(1);

      // Add more messages
      document.body.innerHTML += `
        <div class="test-message">
          <div class="test-content">Added</div>
        </div>
      `;

      messageService.refresh();
      messages = messageService.getAssistantMessages();
      expect(messages).toHaveLength(2);
    });
  });

  describe('getMessageCount', () => {
    test('should return correct message count', () => {
      document.body.innerHTML = `
        <div class="test-message">
          <div class="test-content">1</div>
        </div>
        <div class="test-message">
          <div class="test-content">2</div>
        </div>
        <div class="test-message">
          <div class="test-content">3</div>
        </div>
      `;

      messageService.scanMessages();
      const count = messageService.getMessageCount();

      expect(count).toBe(3);
    });

    test('should return 0 for no messages', () => {
      const count = messageService.getMessageCount();

      expect(count).toBe(0);
    });
  });

  describe('edge cases', () => {
    test('should handle messages with HTML content', () => {
      document.body.innerHTML = `
        <div class="test-message">
          <div class="test-content">
            <strong>Bold</strong> and <em>italic</em> text
          </div>
        </div>
      `;

      const messages = messageService.scanMessages();

      expect(messages[0].content).toContain('Bold');
      expect(messages[0].content).toContain('italic');
    });

    test('should handle messages with code blocks', () => {
      document.body.innerHTML = `
        <div class="test-message">
          <div class="test-content">
            <code>const x = 10;</code>
          </div>
        </div>
      `;

      const messages = messageService.scanMessages();

      expect(messages[0].content).toContain('const x = 10;');
    });

    test('should handle messages with special characters', () => {
      document.body.innerHTML = `
        <div class="test-message">
          <div class="test-content">Special: !@#$%^&*()</div>
        </div>
      `;

      const messages = messageService.scanMessages();

      expect(messages[0].content).toContain('!@#$%^&*()');
    });

    test('should handle very long messages', () => {
      const longText = 'a'.repeat(10000);
      document.body.innerHTML = `
        <div class="test-message">
          <div class="test-content">${longText}</div>
        </div>
      `;

      const messages = messageService.scanMessages();

      expect(messages[0].characterCount).toBe(10000);
      expect(messages[0].content).toHaveLength(10000);
    });

    test('should handle messages with line breaks', () => {
      document.body.innerHTML = `
        <div class="test-message">
          <div class="test-content">Line 1\nLine 2\nLine 3</div>
        </div>
      `;

      const messages = messageService.scanMessages();

      expect(messages[0].wordCount).toBe(6); // 3 words + 3 "Line"
    });

    test('should handle mixed content (text and elements)', () => {
      document.body.innerHTML = `
        <div class="test-message">
          <div class="test-content">
            Text before
            <div>Nested div</div>
            Text after
          </div>
        </div>
      `;

      const messages = messageService.scanMessages();

      expect(messages[0].content).toBeTruthy();
      expect(messages[0].wordCount).toBeGreaterThan(0);
    });
  });
});
