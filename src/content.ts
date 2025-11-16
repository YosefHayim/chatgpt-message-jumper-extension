/**
 * Main Content Script
 * Entry point for the extension, runs on ChatGPT/Claude/Gemini pages
 */

import platformDetector from './services/platformDetector';
import messageService from './services/messageService';
import navigationService from './services/navigationService';
import searchService from './services/searchService';
import storageService from './services/storageService';
import { NavigationDirection } from './types';
import { formatTokenCount, formatCharacterCount } from './utils/tokenEstimator';

class AIConversationNavigator {
  private container: HTMLDivElement | null = null;
  private statsPanel: HTMLDivElement | null = null;
  private navButton: HTMLButtonElement | null = null;
  private searchPanel: HTMLDivElement | null = null;
  private searchInput: HTMLInputElement | null = null;
  private isLoading: boolean = false;
  private enabled: boolean = true;
  private observer: MutationObserver | null = null;
  private refreshTimeout: number | null = null;

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

    // Setup search functionality
    this.setupSearch();

    // Observe DOM changes
    this.observeDOMChanges();
  }

  private setupSearch(): void {
    // Intercept Ctrl+F to use custom search
    document.addEventListener('keydown', (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
        // Prevent default browser search
        event.preventDefault();
        event.stopPropagation();
        this.showSearchPanel();
      }

      // Escape to close search
      if (event.key === 'Escape' && this.searchPanel && this.searchPanel.style.display !== 'none') {
        this.hideSearchPanel();
      }
    }, true); // Use capture phase to intercept before browser
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
      pointerEvents: 'none', // Don't block clicks on the page
      maxWidth: '300px', // Prevent overflow
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
      pointerEvents: 'auto', // Allow interactions with stats panel
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
      pointerEvents: 'auto', // Allow button clicks
    });

    this.navButton.addEventListener('click', () => this.handleNavigation());
    this.navButton.addEventListener('mouseenter', () => this.onButtonHover(true));
    this.navButton.addEventListener('mouseleave', () => this.onButtonHover(false));

    this.container!.appendChild(this.navButton);
  }

  private createSearchPanel(): void {
    this.searchPanel = document.createElement('div');
    Object.assign(this.searchPanel.style, {
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(0, 0, 0, 0.95)',
      backdropFilter: 'blur(10px)',
      color: 'white',
      padding: '16px 20px',
      borderRadius: '12px',
      fontSize: '14px',
      zIndex: '10000',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
      minWidth: '400px',
      display: 'none',
      pointerEvents: 'auto',
    });

    this.searchPanel.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
        <input
          type="text"
          id="ai-search-input"
          placeholder="Search in AI responses only..."
          style="
            flex: 1;
            padding: 8px 12px;
            border: 1px solid #444;
            border-radius: 6px;
            background: #1a1a1a;
            color: white;
            font-size: 14px;
            outline: none;
          "
        />
        <button
          id="ai-search-prev"
          style="
            padding: 8px 12px;
            background: #333;
            border: none;
            border-radius: 6px;
            color: white;
            cursor: pointer;
            font-size: 16px;
          "
          title="Previous result (Shift+Enter)"
        >▲</button>
        <button
          id="ai-search-next"
          style="
            padding: 8px 12px;
            background: #333;
            border: none;
            border-radius: 6px;
            color: white;
            cursor: pointer;
            font-size: 16px;
          "
          title="Next result (Enter)"
        >▼</button>
        <button
          id="ai-search-close"
          style="
            padding: 8px 12px;
            background: #333;
            border: none;
            border-radius: 6px;
            color: white;
            cursor: pointer;
          "
          title="Close search (Esc)"
        >✕</button>
      </div>
      <div id="ai-search-stats" style="font-size: 12px; color: #aaa; text-align: center;"></div>
    `;

    document.body.appendChild(this.searchPanel);

    // Get elements
    this.searchInput = document.getElementById('ai-search-input') as HTMLInputElement;
    const prevBtn = document.getElementById('ai-search-prev');
    const nextBtn = document.getElementById('ai-search-next');
    const closeBtn = document.getElementById('ai-search-close');
    const statsDiv = document.getElementById('ai-search-stats');

    // Event listeners
    this.searchInput?.addEventListener('input', (e) => {
      const term = (e.target as HTMLInputElement).value;
      const results = searchService.search(term);
      const stats = searchService.getSearchStats();

      if (statsDiv) {
        if (results.length > 0) {
          statsDiv.textContent = `${stats.currentIndex} of ${stats.totalResults} results (${stats.totalMatches} matches in AI responses)`;
          statsDiv.style.color = '#10a37f';
        } else if (term.trim()) {
          statsDiv.textContent = 'No matches found in AI responses';
          statsDiv.style.color = '#ff6b6b';
        } else {
          statsDiv.textContent = 'Type to search within AI responses';
          statsDiv.style.color = '#aaa';
        }
      }
    });

    this.searchInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) {
          searchService.previousResult();
        } else {
          searchService.nextResult();
        }
        this.updateSearchStats();
      }
    });

    prevBtn?.addEventListener('click', () => {
      searchService.previousResult();
      this.updateSearchStats();
    });

    nextBtn?.addEventListener('click', () => {
      searchService.nextResult();
      this.updateSearchStats();
    });

    closeBtn?.addEventListener('click', () => {
      this.hideSearchPanel();
    });
  }

  private showSearchPanel(): void {
    if (!this.searchPanel) {
      this.createSearchPanel();
    }

    if (this.searchPanel) {
      this.searchPanel.style.display = 'block';
      this.searchInput?.focus();
      this.searchInput?.select();
    }
  }

  private hideSearchPanel(): void {
    if (this.searchPanel) {
      this.searchPanel.style.display = 'none';
      searchService.clearSearch();
    }
  }

  private updateSearchStats(): void {
    const statsDiv = document.getElementById('ai-search-stats');
    const stats = searchService.getSearchStats();

    if (statsDiv && stats.totalResults > 0) {
      statsDiv.textContent = `${stats.currentIndex} of ${stats.totalResults} results (${stats.totalMatches} matches in AI responses)`;
      statsDiv.style.color = '#10a37f';
    }
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
        // Debounce refresh to avoid performance issues
        if (this.refreshTimeout) {
          clearTimeout(this.refreshTimeout);
        }
        this.refreshTimeout = window.setTimeout(() => {
          this.refreshExtension();
          this.refreshTimeout = null;
        }, 500); // Wait 500ms after last change before refreshing
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
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
      this.refreshTimeout = null;
    }

    if (this.container) {
      this.container.remove();
      this.container = null;
    }

    if (this.searchPanel) {
      this.searchPanel.remove();
      this.searchPanel = null;
    }

    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    searchService.clearSearch();
  }
}

// Initialize the extension
new AIConversationNavigator();
