/**
 * Token Estimator Utility
 * Provides rough token estimation for different AI models
 */

import { Platform } from '~/src/types';

/**
 * Estimate tokens from text
 * This is a rough estimation. Real tokenization varies by model.
 */
export function estimateTokens(text: string, platform: Platform): number {
  // Different platforms use different tokenizers
  switch (platform) {
    case Platform.CHATGPT:
      // GPT models: roughly 4 characters per token for English
      return Math.ceil(text.length / 4);

    case Platform.CLAUDE:
      // Claude: roughly 3.5 characters per token
      return Math.ceil(text.length / 3.5);

    case Platform.GEMINI:
      // Gemini: similar to GPT, roughly 4 characters per token
      return Math.ceil(text.length / 4);

    default:
      return Math.ceil(text.length / 4);
  }
}

/**
 * Format token count with K/M suffixes
 */
export function formatTokenCount(tokens: number): string {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`;
  } else if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}K`;
  }
  return tokens.toString();
}

/**
 * Format character count with K/M suffixes
 */
export function formatCharacterCount(chars: number): string {
  if (chars >= 1000000) {
    return `${(chars / 1000000).toFixed(1)}M`;
  } else if (chars >= 1000) {
    return `${(chars / 1000).toFixed(1)}K`;
  }
  return chars.toString();
}

/**
 * Calculate percentage of context used
 */
export function calculateContextPercentage(tokens: number, maxTokens: number): number {
  return Math.min((tokens / maxTokens) * 100, 100);
}

/**
 * Check if near context limit
 */
export function isNearContextLimit(
  tokens: number,
  maxTokens: number,
  threshold: number = 80
): boolean {
  return calculateContextPercentage(tokens, maxTokens) >= threshold;
}

/**
 * Get context warning level
 */
export function getContextWarningLevel(
  percentage: number
): 'safe' | 'warning' | 'critical' {
  if (percentage >= 90) return 'critical';
  if (percentage >= 75) return 'warning';
  return 'safe';
}

/**
 * More accurate token estimation using word count and character count
 */
export function estimateTokensAdvanced(text: string): number {
  const charCount = text.length;
  const wordCount = text.split(/\s+/).filter((w) => w.length > 0).length;

  // Use a weighted formula combining both metrics
  const charBasedEstimate = charCount / 4;
  const wordBasedEstimate = wordCount * 1.3; // Roughly 1.3 tokens per word

  // Average the two estimates for better accuracy
  return Math.ceil((charBasedEstimate + wordBasedEstimate) / 2);
}
