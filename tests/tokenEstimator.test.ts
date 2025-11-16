/**
 * Token Estimator Tests
 */

import { describe, test, expect } from '@jest/globals';
import {
  estimateTokens,
  formatTokenCount,
  formatCharacterCount,
  calculateContextPercentage,
  isNearContextLimit,
  getContextWarningLevel,
} from '~/src/utils/tokenEstimator';
import { Platform } from '~/src/types';

describe('Token Estimator', () => {
  describe('estimateTokens', () => {
    test('should estimate tokens for ChatGPT', () => {
      const text = 'Hello world!'; // 12 characters
      const tokens = estimateTokens(text, Platform.CHATGPT);
      expect(tokens).toBe(3); // ~4 chars per token
    });

    test('should estimate tokens for Claude', () => {
      const text = 'Hello world!';
      const tokens = estimateTokens(text, Platform.CLAUDE);
      expect(tokens).toBeGreaterThan(0);
    });

    test('should handle empty strings', () => {
      const tokens = estimateTokens('', Platform.CHATGPT);
      expect(tokens).toBe(0);
    });
  });

  describe('formatTokenCount', () => {
    test('should format small numbers', () => {
      expect(formatTokenCount(500)).toBe('500');
    });

    test('should format thousands with K', () => {
      expect(formatTokenCount(5000)).toBe('5.0K');
    });

    test('should format millions with M', () => {
      expect(formatTokenCount(5000000)).toBe('5.0M');
    });
  });

  describe('formatCharacterCount', () => {
    test('should format character counts', () => {
      expect(formatCharacterCount(999)).toBe('999');
      expect(formatCharacterCount(1500)).toBe('1.5K');
      expect(formatCharacterCount(2500000)).toBe('2.5M');
    });
  });

  describe('calculateContextPercentage', () => {
    test('should calculate percentage correctly', () => {
      expect(calculateContextPercentage(1000, 10000)).toBe(10);
      expect(calculateContextPercentage(5000, 10000)).toBe(50);
    });

    test('should cap at 100%', () => {
      expect(calculateContextPercentage(15000, 10000)).toBe(100);
    });
  });

  describe('isNearContextLimit', () => {
    test('should detect when near limit', () => {
      expect(isNearContextLimit(8500, 10000, 80)).toBe(true);
      expect(isNearContextLimit(7000, 10000, 80)).toBe(false);
    });
  });

  describe('getContextWarningLevel', () => {
    test('should return correct warning levels', () => {
      expect(getContextWarningLevel(50)).toBe('safe');
      expect(getContextWarningLevel(80)).toBe('warning');
      expect(getContextWarningLevel(95)).toBe('critical');
    });
  });
});
