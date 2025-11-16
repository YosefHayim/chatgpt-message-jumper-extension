/**
 * Navigation Service
 * Handles navigation between messages with smart direction control
 */

import { NavigationDirection, NavigationState } from '~/src/types';
import messageService from './messageService';

export class NavigationService {
  private static instance: NavigationService;
  private state: NavigationState = {
    currentIndex: 0,
    direction: NavigationDirection.DOWN,
    totalMessages: 0,
    enabled: true,
  };

  private constructor() {}

  public static getInstance(): NavigationService {
    if (!NavigationService.instance) {
      NavigationService.instance = new NavigationService();
    }
    return NavigationService.instance;
  }

  /**
   * Initialize navigation state
   */
  public initialize(): void {
    const messages = messageService.getAssistantMessages();
    this.state.totalMessages = messages.length;

    if (messages.length > 0) {
      // Start at the closest visible message
      this.state.currentIndex = messageService.findClosestVisibleMessage();
    }
  }

  /**
   * Navigate to the next message based on current direction
   */
  public navigateNext(): void {
    if (!this.state.enabled) return;

    const messages = messageService.getAssistantMessages();
    if (messages.length === 0) return;

    if (this.state.direction === NavigationDirection.DOWN) {
      this.navigateDown();
    } else {
      this.navigateUp();
    }

    this.scrollToCurrentMessage();
  }

  /**
   * Navigate down (to next message)
   */
  private navigateDown(): void {
    if (this.state.currentIndex < this.state.totalMessages - 1) {
      this.state.currentIndex++;
    } else {
      // Reached the end, switch direction
      this.state.direction = NavigationDirection.UP;
      this.state.currentIndex = this.state.totalMessages - 1;
    }
  }

  /**
   * Navigate up (to previous message)
   */
  private navigateUp(): void {
    if (this.state.currentIndex > 0) {
      this.state.currentIndex--;
    } else {
      // Reached the beginning, switch direction
      this.state.direction = NavigationDirection.DOWN;
      this.state.currentIndex = 0;
    }
  }

  /**
   * Scroll to the current message with visual feedback
   */
  private scrollToCurrentMessage(): void {
    const message = messageService.getMessage(this.state.currentIndex);
    if (!message) return;

    // Smooth scroll to the message
    message.element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });

    // Add visual highlight
    this.highlightMessage(message.element);
  }

  /**
   * Add a temporary highlight to a message
   */
  private highlightMessage(element: HTMLElement): void {
    const originalOutline = element.style.outline;
    const originalOutlineOffset = element.style.outlineOffset;

    element.style.outline = '2px solid #10a37f';
    element.style.outlineOffset = '4px';

    setTimeout(() => {
      element.style.outline = originalOutline;
      element.style.outlineOffset = originalOutlineOffset;
    }, 800);
  }

  /**
   * Jump to a specific message index
   */
  public jumpToMessage(index: number): void {
    if (index < 0 || index >= this.state.totalMessages) return;

    this.state.currentIndex = index;
    this.scrollToCurrentMessage();
  }

  /**
   * Get current navigation state
   */
  public getState(): NavigationState {
    return { ...this.state };
  }

  /**
   * Set enabled state
   */
  public setEnabled(enabled: boolean): void {
    this.state.enabled = enabled;
  }

  /**
   * Get current position info for display
   */
  public getPositionInfo(): { current: number; total: number; direction: NavigationDirection } {
    return {
      current: this.state.currentIndex + 1, // 1-indexed for display
      total: this.state.totalMessages,
      direction: this.state.direction,
    };
  }

  /**
   * Refresh navigation (rescan messages and update state)
   */
  public refresh(): void {
    messageService.refresh();
    this.state.totalMessages = messageService.getMessageCount();

    // Ensure current index is still valid
    if (this.state.currentIndex >= this.state.totalMessages) {
      this.state.currentIndex = Math.max(0, this.state.totalMessages - 1);
    }
  }

  /**
   * Reset navigation state (primarily for testing)
   */
  public reset(): void {
    this.state = {
      currentIndex: 0,
      direction: NavigationDirection.DOWN,
      totalMessages: 0,
      enabled: true,
    };
  }
}

export default NavigationService.getInstance();
