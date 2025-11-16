/**
 * Core types and interfaces for the AI Conversation Navigator extension
 */

export enum Platform {
  CHATGPT = 'chatgpt',
  CLAUDE = 'claude',
  GEMINI = 'gemini',
  UNKNOWN = 'unknown',
}

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
}

export enum NavigationDirection {
  UP = 'up',
  DOWN = 'down',
}

export interface Message {
  element: HTMLElement;
  role: MessageRole;
  content: string;
  index: number;
  characterCount: number;
  wordCount: number;
}

export interface ConversationStats {
  totalMessages: number;
  userMessages: number;
  assistantMessages: number;
  totalCharacters: number;
  totalWords: number;
  estimatedTokens: number;
}

export interface PlatformConfig {
  name: string;
  platform: Platform;
  messageSelector: string;
  roleAttribute?: string;
  contentSelector?: string;
  containerSelector?: string;
  maxContextTokens: number;
}

export interface NavigationState {
  currentIndex: number;
  direction: NavigationDirection;
  totalMessages: number;
  enabled: boolean;
}

export interface ExtensionSettings {
  enabled: boolean;
  theme: 'light' | 'dark' | 'auto';
  showStats: boolean;
  showTokenWarning: boolean;
  tokenWarningThreshold: number; // Percentage (e.g., 80 = 80%)
}

export interface SearchResult {
  messageIndex: number;
  element: HTMLElement;
  matches: number;
  preview: string;
}

export interface TokenEstimate {
  characters: number;
  words: number;
  estimatedTokens: number;
  percentOfContext: number;
  nearLimit: boolean;
}
