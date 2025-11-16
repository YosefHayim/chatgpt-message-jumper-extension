/**
 * Platform Detector Tests
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { PlatformDetector } from '~/src/services/platformDetector';
import { Platform } from '~/src/types';

describe('PlatformDetector', () => {
  let detector: PlatformDetector;

  beforeEach(() => {
    detector = PlatformDetector.getInstance();
  });

  test('should detect ChatGPT platform', () => {
    Object.defineProperty(window, 'location', {
      value: { hostname: 'chatgpt.com' },
      writable: true,
    });

    detector.refresh();
    expect(detector.getPlatform()).toBe(Platform.CHATGPT);
    expect(detector.isSupported()).toBe(true);
    expect(detector.getPlatformName()).toBe('ChatGPT');
  });

  test('should detect Claude platform', () => {
    Object.defineProperty(window, 'location', {
      value: { hostname: 'claude.ai' },
      writable: true,
    });

    detector.refresh();
    expect(detector.getPlatform()).toBe(Platform.CLAUDE);
    expect(detector.isSupported()).toBe(true);
  });

  test('should detect Gemini platform', () => {
    Object.defineProperty(window, 'location', {
      value: { hostname: 'gemini.google.com' },
      writable: true,
    });

    detector.refresh();
    expect(detector.getPlatform()).toBe(Platform.GEMINI);
    expect(detector.isSupported()).toBe(true);
  });

  test('should return unknown for unsupported platforms', () => {
    Object.defineProperty(window, 'location', {
      value: { hostname: 'example.com' },
      writable: true,
    });

    detector.refresh();
    expect(detector.getPlatform()).toBe(Platform.UNKNOWN);
    expect(detector.isSupported()).toBe(false);
  });

  test('should provide platform configuration', () => {
    Object.defineProperty(window, 'location', {
      value: { hostname: 'chatgpt.com' },
      writable: true,
    });

    detector.refresh();
    const config = detector.getConfig();

    expect(config.platform).toBe(Platform.CHATGPT);
    expect(config.messageSelector).toBeTruthy();
    expect(config.maxContextTokens).toBeGreaterThan(0);
  });
});
