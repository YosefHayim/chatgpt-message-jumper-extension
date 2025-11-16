/**
 * Main Content Script
 * Entry point for the extension, runs on ChatGPT/Claude/Gemini pages
 */

import platformDetector from './services/platformDetector';
import messageService from './services/messageService';
import navigationService from './services/navigationService';
import storageService from './services/storageService';
import { NavigationDirection } from './types';
import { formatTokenCount, formatCharacterCount } from './utils/tokenEstimator';

class AIConversationNavigator {
  private container: HTMLDivElement | null = null;
  private statsPanel: HTMLDivElement | null = null;
  private navButton: HTMLButtonElement | null = null;
  private isLoading: boolean = false;
  private enabled: boolean = true;
  private observer: MutationObserver | null = null;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    // Check if platform is supported
    if (!platformDetector.isSupported()) {
      console.log('AI Navigator: Platform not supported');
      return;
    }

    // Load settings
    const settings = await storageService.loadSettings();
    this.enabled = settings.enabled;

    if (!this.enabled) {
      return;
    }

    // Wait for page to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupExtension());
    } else {
      this.setupExtension();
    }

    // Listen for settings changes
    storageService.onSettingsChanged((newSettings) => {
      this.enabled = newSettings.enabled;
      if (newSettings.enabled) {
        this.refreshExtension();
      } else {
        this.cleanup();
      }
    });
  }

  private setupExtension(): void {
    // Scan for messages
    messageService.scanMessages();

    // Initialize navigation
    navigationService.initialize();

    // Create UI
    this.createUI();

    // Observe DOM changes
    this.observeDOMChanges();
  }

  private createUI(): void {
    // Create container
    this.container = document.createElement('div');
    this.container.id = 'ai-navigator-container';
    Object.assign(this.container.style, {
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: '9999',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    });

    // Create stats panel
    this.createStatsPanel();

    // Create navigation button
    this.createNavButton();

    // Append to body
    document.body.appendChild(this.container);

    // Initial UI update
    this.updateUI();
  }

  private createStatsPanel(): void {
    const stats = messageService.getConversationStats();

    if (stats.assistantMessages === 0) {
      return;
    }

    this.statsPanel = document.createElement('div');
    Object.assign(this.statsPanel.style, {
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
    });

    this.statsPanel.innerHTML = `
      <div style="margin-bottom: 8px; font-weight: 600; opacity: 0.9;">
        📊 Conversation Stats
      </div>
      <div id="stats-content"></div>
    `;

    this.container!.appendChild(this.statsPanel);
  }

  private createNavButton(): void {
    this.navButton = document.createElement('button');
    this.navButton.id = 'ai-navigator-button';

    Object.assign(this.navButton.style, {
      background: 'linear-gradient(135deg, #10a37f 0%, #0d8a6a 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      padding: '14px 20px',
      fontSize: '15px',
      fontWeight: '600',
      cursor: 'pointer',
      boxShadow: '0 4px 12px rgba(16, 163, 127, 0.3)',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      transition: 'all 0.2s ease',
      minWidth: '140px',
    });

    this.navButton.addEventListener('click', () => this.handleNavigation());
    this.navButton.addEventListener('mouseenter', () => this.onButtonHover(true));
    this.navButton.addEventListener('mouseleave', () => this.onButtonHover(false));

    this.container!.appendChild(this.navButton);
  }

  private onButtonHover(isHovering: boolean): void {
    if (!this.navButton || this.isLoading) return;

    if (isHovering) {
      this.navButton.style.transform = 'translateY(-2px)';
      this.navButton.style.boxShadow = '0 6px 16px rgba(16, 163, 127, 0.4)';
    } else {
      this.navButton.style.transform = 'translateY(0)';
      this.navButton.style.boxShadow = '0 4px 12px rgba(16, 163, 127, 0.3)';
    }
  }

  private updateUI(): void {
    const posInfo = navigationService.getPositionInfo();
    const stats = messageService.getConversationStats();

    // Update button
    if (this.navButton) {
      const directionIcon = posInfo.direction === NavigationDirection.DOWN ? '▼' : '▲';
      this.navButton.innerHTML = `
        <span style="font-size: 18px">${directionIcon}</span>
        <span>${posInfo.current}/${posInfo.total}</span>
        ${this.isLoading ? '<div class="spinner"></div>' : ''}
      `;
    }

    // Update stats
    if (this.statsPanel) {
      const statsContent = this.statsPanel.querySelector('#stats-content');
      if (statsContent) {
        statsContent.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <div>
              <span style="opacity: 0.7;">Messages:</span>
              <span style="font-weight: 600;"> ${stats.assistantMessages}</span>
            </div>
            <div>
              <span style="opacity: 0.7;">Characters:</span>
              <span style="font-weight: 600;"> ${formatCharacterCount(stats.totalCharacters)}</span>
            </div>
            <div>
              <span style="opacity: 0.7;">Est. Tokens:</span>
              <span style="font-weight: 600; color: #10a37f;"> ${formatTokenCount(stats.estimatedTokens)}</span>
            </div>
          </div>
        `;
      }
    }
  }

  private async handleNavigation(): Promise<void> {
    if (!this.enabled || this.isLoading) return;

    this.isLoading = true;
    if (this.navButton) {
      this.navButton.style.opacity = '0.7';
      this.navButton.style.cursor = 'wait';
    }

    navigationService.navigateNext();

    setTimeout(() => {
      this.updateUI();
      this.isLoading = false;
      if (this.navButton) {
        this.navButton.style.opacity = '1';
        this.navButton.style.cursor = 'pointer';
      }
    }, 100);
  }

  private observeDOMChanges(): void {
    this.observer = new MutationObserver((mutations) => {
      const hasRelevantChanges = mutations.some(
        (mutation) =>
          mutation.type === 'childList' &&
          (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0)
      );

      if (hasRelevantChanges) {
        this.refreshExtension();
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  private refreshExtension(): void {
    navigationService.refresh();
    this.updateUI();
  }

  private cleanup(): void {
    if (this.container) {
      this.container.remove();
      this.container = null;
    }

    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

// Initialize the extension
new AIConversationNavigator();
