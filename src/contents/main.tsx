/**
 * Main Content Script
 * Entry point for the extension, runs on ChatGPT/Claude/Gemini pages
 */

import type { PlasmoCSConfig } from 'plasmo';
import { useEffect, useState } from 'react';
import platformDetector from '~/src/services/platformDetector';
import messageService from '~/src/services/messageService';
import navigationService from '~/src/services/navigationService';
import storageService from '~/src/services/storageService';
import { NavigationDirection } from '~/src/types';
import { formatTokenCount, formatCharacterCount } from '~/src/utils/tokenEstimator';

export const config: PlasmoCSConfig = {
  matches: [
    'https://chatgpt.com/*',
    'https://chat.openai.com/*',
    'https://claude.ai/*',
    'https://gemini.google.com/*',
  ],
  run_at: 'document_end',
};

const NavigationButton = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ current: 0, total: 0 });
  const [direction, setDirection] = useState<NavigationDirection>(NavigationDirection.DOWN);
  const [stats, setStats] = useState({ tokens: 0, chars: 0, messages: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    initializeExtension();
  }, []);

  const initializeExtension = async () => {
    // Check if platform is supported
    if (!platformDetector.isSupported()) {
      console.log('AI Navigator: Platform not supported');
      return;
    }

    // Load settings
    const settings = await storageService.loadSettings();
    setEnabled(settings.enabled);

    if (!settings.enabled) {
      return;
    }

    // Initialize services
    setupExtension();

    // Listen for DOM changes
    observeDOMChanges();

    // Listen for settings changes
    storageService.onSettingsChanged((newSettings) => {
      setEnabled(newSettings.enabled);
      if (newSettings.enabled) {
        refreshExtension();
      }
    });
  };

  const setupExtension = () => {
    // Scan for messages
    messageService.scanMessages();

    // Initialize navigation
    navigationService.initialize();

    // Update UI
    updateUI();

    setIsVisible(true);
  };

  const observeDOMChanges = () => {
    const observer = new MutationObserver((mutations) => {
      // Check if messages were added/removed
      const hasRelevantChanges = mutations.some(
        (mutation) =>
          mutation.type === 'childList' &&
          (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0)
      );

      if (hasRelevantChanges) {
        refreshExtension();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  };

  const refreshExtension = () => {
    navigationService.refresh();
    updateUI();
  };

  const updateUI = () => {
    const posInfo = navigationService.getPositionInfo();
    const convStats = messageService.getConversationStats();

    setPosition({ current: posInfo.current, total: posInfo.total });
    setDirection(posInfo.direction);
    setStats({
      tokens: convStats.estimatedTokens,
      chars: convStats.totalCharacters,
      messages: convStats.assistantMessages,
    });
  };

  const handleNavigation = async () => {
    if (!enabled) return;

    setIsLoading(true);
    navigationService.navigateNext();

    // Update UI after navigation
    setTimeout(() => {
      updateUI();
      setIsLoading(false);
    }, 100);
  };

  if (!isVisible || !enabled) {
    return null;
  }

  const directionIcon = direction === NavigationDirection.DOWN ? '▼' : '▲';
  const showStats = stats.messages > 0;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Stats Panel */}
      {showStats && (
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)',
            color: 'white',
            padding: '12px 16px',
            borderRadius: '12px',
            marginBottom: '12px',
            fontSize: '13px',
            lineHeight: '1.5',
            minWidth: '200px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div style={{ marginBottom: '8px', fontWeight: 600, opacity: 0.9 }}>
            📊 Conversation Stats
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div>
              <span style={{ opacity: 0.7 }}>Messages:</span>{' '}
              <span style={{ fontWeight: 600 }}>{stats.messages}</span>
            </div>
            <div>
              <span style={{ opacity: 0.7 }}>Characters:</span>{' '}
              <span style={{ fontWeight: 600 }}>{formatCharacterCount(stats.chars)}</span>
            </div>
            <div>
              <span style={{ opacity: 0.7 }}>Est. Tokens:</span>{' '}
              <span style={{ fontWeight: 600, color: '#10a37f' }}>
                {formatTokenCount(stats.tokens)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Button */}
      <button
        onClick={handleNavigation}
        disabled={isLoading}
        style={{
          background: 'linear-gradient(135deg, #10a37f 0%, #0d8a6a 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          padding: '14px 20px',
          fontSize: '15px',
          fontWeight: 600,
          cursor: isLoading ? 'wait' : 'pointer',
          boxShadow: '0 4px 12px rgba(16, 163, 127, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          transition: 'all 0.2s ease',
          opacity: isLoading ? 0.7 : 1,
          minWidth: '140px',
        }}
        onMouseEnter={(e) => {
          if (!isLoading) {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 163, 127, 0.4)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 163, 127, 0.3)';
        }}
      >
        <span style={{ fontSize: '18px' }}>{directionIcon}</span>
        <span>
          {position.current}/{position.total}
        </span>
        {isLoading && (
          <div
            style={{
              width: '14px',
              height: '14px',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderTopColor: 'white',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
        )}
      </button>

      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default NavigationButton;
