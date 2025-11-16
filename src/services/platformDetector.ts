/**
 * Platform Detection Service
 * Detects which AI platform (ChatGPT, Claude, Gemini) the user is on
 */

import { Platform, PlatformConfig } from '~/src/types';

const PLATFORM_CONFIGS: Record<Platform, PlatformConfig> = {
  [Platform.CHATGPT]: {
    name: 'ChatGPT',
    platform: Platform.CHATGPT,
    messageSelector: '[data-message-author-role="assistant"]',
    userMessageSelector: '[data-message-author-role="user"]',
    roleAttribute: 'data-message-author-role',
    maxContextTokens: 128000, // GPT-4 Turbo context window
  },
  [Platform.CLAUDE]: {
    name: 'Claude',
    platform: Platform.CLAUDE,
    messageSelector: '[data-test-render-count]',
    contentSelector: '.font-claude-message',
    maxContextTokens: 200000, // Claude 3 context window
  },
  [Platform.GEMINI]: {
    name: 'Gemini',
    platform: Platform.GEMINI,
    messageSelector: '.model-response-text',
    containerSelector: '.conversation-container',
    maxContextTokens: 1000000, // Gemini 1.5 Pro context window
  },
  [Platform.UNKNOWN]: {
    name: 'Unknown',
    platform: Platform.UNKNOWN,
    messageSelector: '',
    maxContextTokens: 0,
  },
};

export class PlatformDetector {
  private static instance: PlatformDetector;
  private currentPlatform: Platform = Platform.UNKNOWN;
  private config: PlatformConfig | null = null;

  private constructor() {
    this.detectPlatform();
  }

  public static getInstance(): PlatformDetector {
    if (!PlatformDetector.instance) {
      PlatformDetector.instance = new PlatformDetector();
    }
    return PlatformDetector.instance;
  }

  private detectPlatform(): void {
    const hostname = window.location.hostname;

    if (hostname.includes('chatgpt.com') || hostname.includes('chat.openai.com')) {
      this.currentPlatform = Platform.CHATGPT;
    } else if (hostname.includes('claude.ai')) {
      this.currentPlatform = Platform.CLAUDE;
    } else if (hostname.includes('gemini.google.com')) {
      this.currentPlatform = Platform.GEMINI;
    } else {
      this.currentPlatform = Platform.UNKNOWN;
    }

    this.config = PLATFORM_CONFIGS[this.currentPlatform];
  }

  public getPlatform(): Platform {
    return this.currentPlatform;
  }

  public getConfig(): PlatformConfig {
    if (!this.config) {
      throw new Error('Platform not detected');
    }
    return this.config;
  }

  public isSupported(): boolean {
    return this.currentPlatform !== Platform.UNKNOWN;
  }

  public getPlatformName(): string {
    return this.config?.name || 'Unknown';
  }

  /**
   * Re-detect platform (useful if URL changes)
   */
  public refresh(): void {
    this.detectPlatform();
  }
}

export default PlatformDetector.getInstance();
