/**
 * Navigation Service Tests
 * Tests for message navigation, direction switching, and scroll behavior
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NavigationService } from '~/src/services/navigationService';
import { NavigationDirection, Message, MessageRole } from '~/src/types';
import messageService from '~/src/services/messageService';

describe('NavigationService', () => {
  let navService: NavigationService;
  let mockMessages: Message[];

  beforeEach(() => {
    navService = NavigationService.getInstance();

    // Create mock messages
    mockMessages = [
      {
        index: 0,
        content: 'First message',
        element: document.createElement('div'),
        role: MessageRole.ASSISTANT,
        characterCount: 13,
        wordCount: 2,
      },
      {
        index: 1,
        content: 'Second message',
        element: document.createElement('div'),
        role: MessageRole.ASSISTANT,
        characterCount: 14,
        wordCount: 2,
      },
      {
        index: 2,
        content: 'Third message',
        element: document.createElement('div'),
        role: MessageRole.ASSISTANT,
        characterCount: 13,
        wordCount: 2,
      },
    ];

    // Mock scrollIntoView
    mockMessages.forEach((msg) => {
      msg.element.scrollIntoView = jest.fn();
    });

    // Mock messageService methods
    jest.spyOn(messageService, 'getAssistantMessages').mockReturnValue(mockMessages);
    jest.spyOn(messageService, 'getMessage').mockImplementation((index: number) => mockMessages[index]);
    jest.spyOn(messageService, 'findClosestVisibleMessage').mockReturnValue(0);
    jest.spyOn(messageService, 'getMessageCount').mockReturnValue(mockMessages.length);
    jest.spyOn(messageService, 'refresh').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getInstance', () => {
    test('should return singleton instance', () => {
      const instance1 = NavigationService.getInstance();
      const instance2 = NavigationService.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('initialize', () => {
    test('should initialize with correct message count', () => {
      navService.initialize();

      const state = navService.getState();
      expect(state.totalMessages).toBe(3);
    });

    test('should start at closest visible message', () => {
      jest.spyOn(messageService, 'findClosestVisibleMessage').mockReturnValue(1);

      navService.initialize();

      const state = navService.getState();
      expect(state.currentIndex).toBe(1);
    });

    test('should handle empty message list', () => {
      jest.spyOn(messageService, 'getAssistantMessages').mockReturnValue([]);

      navService.initialize();

      const state = navService.getState();
      expect(state.totalMessages).toBe(0);
      expect(state.currentIndex).toBe(0);
    });
  });

  describe('navigateNext', () => {
    beforeEach(() => {
      navService.initialize();
    });

    test('should navigate down from first message', () => {
      navService.navigateNext();

      const position = navService.getPositionInfo();
      expect(position.current).toBe(2); // 1-indexed
      expect(position.direction).toBe(NavigationDirection.DOWN);
    });

    test('should scroll to message when navigating', () => {
      navService.navigateNext();

      expect(mockMessages[1].element.scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'center',
      });
    });

    test('should switch direction at end of conversation', () => {
      // Navigate to end
      navService.navigateNext(); // index 1
      navService.navigateNext(); // index 2 (last)
      navService.navigateNext(); // Should switch to UP

      const state = navService.getState();
      expect(state.direction).toBe(NavigationDirection.UP);
      expect(state.currentIndex).toBe(2); // Stay at last message
    });

    test('should navigate up after direction switch', () => {
      // Navigate to end and switch direction
      navService.navigateNext(); // index 1
      navService.navigateNext(); // index 2
      navService.navigateNext(); // switch to UP

      // Now navigate up
      navService.navigateNext();

      const position = navService.getPositionInfo();
      expect(position.current).toBe(2); // index 1, displayed as 2
      expect(position.direction).toBe(NavigationDirection.UP);
    });

    test('should switch direction at beginning of conversation', () => {
      // Manually set to UP direction and first message
      const state = navService.getState();
      (state as any).direction = NavigationDirection.UP;
      (state as any).currentIndex = 0;

      navService.navigateNext();

      const newState = navService.getState();
      expect(newState.direction).toBe(NavigationDirection.DOWN);
      expect(newState.currentIndex).toBe(0);
    });

    test('should not navigate when disabled', () => {
      navService.setEnabled(false);

      const initialPosition = navService.getPositionInfo();
      navService.navigateNext();

      const finalPosition = navService.getPositionInfo();
      expect(finalPosition.current).toBe(initialPosition.current);
    });

    test('should handle navigation with no messages', () => {
      jest.spyOn(messageService, 'getAssistantMessages').mockReturnValue([]);

      navService.initialize();
      navService.navigateNext(); // Should not throw

      const state = navService.getState();
      expect(state.currentIndex).toBe(0);
    });
  });

  describe('jumpToMessage', () => {
    beforeEach(() => {
      navService.initialize();
    });

    test('should jump to specific message index', () => {
      navService.jumpToMessage(2);

      const position = navService.getPositionInfo();
      expect(position.current).toBe(3); // 1-indexed
    });

    test('should scroll to message when jumping', () => {
      navService.jumpToMessage(1);

      expect(mockMessages[1].element.scrollIntoView).toHaveBeenCalled();
    });

    test('should reject negative index', () => {
      const initialPosition = navService.getPositionInfo();

      navService.jumpToMessage(-1);

      const finalPosition = navService.getPositionInfo();
      expect(finalPosition.current).toBe(initialPosition.current);
    });

    test('should reject index beyond message count', () => {
      const initialPosition = navService.getPositionInfo();

      navService.jumpToMessage(999);

      const finalPosition = navService.getPositionInfo();
      expect(finalPosition.current).toBe(initialPosition.current);
    });
  });

  describe('getState', () => {
    test('should return copy of state, not reference', () => {
      navService.initialize();

      const state1 = navService.getState();
      const state2 = navService.getState();

      expect(state1).toEqual(state2);
      expect(state1).not.toBe(state2); // Different objects
    });

    test('should return correct initial state', () => {
      navService.initialize();

      const state = navService.getState();

      expect(state.currentIndex).toBe(0);
      expect(state.direction).toBe(NavigationDirection.DOWN);
      expect(state.totalMessages).toBe(3);
      expect(state.enabled).toBe(true);
    });
  });

  describe('setEnabled', () => {
    test('should enable navigation', () => {
      navService.setEnabled(true);

      const state = navService.getState();
      expect(state.enabled).toBe(true);
    });

    test('should disable navigation', () => {
      navService.setEnabled(false);

      const state = navService.getState();
      expect(state.enabled).toBe(false);
    });
  });

  describe('getPositionInfo', () => {
    beforeEach(() => {
      navService.initialize();
    });

    test('should return 1-indexed position for display', () => {
      const position = navService.getPositionInfo();

      expect(position.current).toBe(1); // index 0, displayed as 1
      expect(position.total).toBe(3);
    });

    test('should include current direction', () => {
      const position = navService.getPositionInfo();

      expect(position.direction).toBe(NavigationDirection.DOWN);
    });

    test('should update after navigation', () => {
      navService.navigateNext();

      const position = navService.getPositionInfo();

      expect(position.current).toBe(2);
      expect(position.total).toBe(3);
    });
  });

  describe('refresh', () => {
    test('should call messageService.refresh', () => {
      navService.refresh();

      expect(messageService.refresh).toHaveBeenCalled();
    });

    test('should update total message count', () => {
      navService.initialize();

      // Add more messages
      const newMockMessages = [...mockMessages, {
        index: 3,
        content: 'Fourth message',
        element: document.createElement('div'),
        role: MessageRole.ASSISTANT,
        characterCount: 14,
        wordCount: 2,
      }];

      jest.spyOn(messageService, 'getMessageCount').mockReturnValue(newMockMessages.length);

      navService.refresh();

      const state = navService.getState();
      expect(state.totalMessages).toBe(4);
    });

    test('should adjust current index if beyond new total', () => {
      navService.initialize();
      navService.jumpToMessage(2); // Go to last message

      // Simulate messages being removed
      jest.spyOn(messageService, 'getMessageCount').mockReturnValue(1);

      navService.refresh();

      const state = navService.getState();
      expect(state.currentIndex).toBe(0); // Adjusted to valid index
    });

    test('should handle refresh with no messages', () => {
      navService.initialize();

      jest.spyOn(messageService, 'getMessageCount').mockReturnValue(0);

      navService.refresh();

      const state = navService.getState();
      expect(state.totalMessages).toBe(0);
      expect(state.currentIndex).toBe(0);
    });
  });

  describe('edge cases', () => {
    test('should handle single message conversation', () => {
      const singleMessage = [mockMessages[0]];
      jest.spyOn(messageService, 'getAssistantMessages').mockReturnValue(singleMessage);
      jest.spyOn(messageService, 'getMessageCount').mockReturnValue(1);

      navService.initialize();
      navService.navigateNext();

      const state = navService.getState();
      expect(state.currentIndex).toBe(0); // Can't go beyond
      expect(state.direction).toBe(NavigationDirection.UP); // Should switch
    });

    test('should handle very long conversation', () => {
      const longMessages = Array.from({ length: 1000 }, (_, i) => ({
        index: i,
        content: `Message ${i}`,
        element: document.createElement('div'),
        role: MessageRole.ASSISTANT,
        characterCount: 10,
        wordCount: 2,
      }));

      jest.spyOn(messageService, 'getAssistantMessages').mockReturnValue(longMessages);
      jest.spyOn(messageService, 'getMessageCount').mockReturnValue(1000);

      navService.initialize();

      const state = navService.getState();
      expect(state.totalMessages).toBe(1000);
    });

    test('should handle rapid navigation calls', () => {
      navService.initialize();

      // Rapid navigation
      for (let i = 0; i < 10; i++) {
        navService.navigateNext();
      }

      // Should handle gracefully without errors
      const state = navService.getState();
      expect(state.currentIndex).toBeGreaterThanOrEqual(0);
      expect(state.currentIndex).toBeLessThan(mockMessages.length);
    });
  });
});
