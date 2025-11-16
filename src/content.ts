/**
 * Main Content Script
 * Entry point for the extension, runs on ChatGPT/Claude/Gemini pages
 */

import platformDetector from './services/platformDetector';
import messageService from './services/messageService';
import navigationService from './services/navigationService';
import searchService from './services/searchService';
import bookmarkService from './services/bookmarkService';
import conversationTrackerService from './services/conversationTrackerService';
import storageService from './services/storageService';
import logger from './utils/logger';
import { NavigationDirection } from './types';
import { formatTokenCount, formatCharacterCount } from './utils/tokenEstimator';

class AIConversationNavigator {
  private container: HTMLDivElement | null = null;
  private statsPanel: HTMLDivElement | null = null;
  private navButton: HTMLButtonElement | null = null;
  private actionsPanel: HTMLDivElement | null = null;
  private searchPanel: HTMLDivElement | null = null;
  private searchInput: HTMLInputElement | null = null;
  private bookmarksPanel: HTMLDivElement | null = null;
  private reaskPanel: HTMLDivElement | null = null;
  private codeOnlyFilter: boolean = false;
  private isLoading: boolean = false;
  private enabled: boolean = true;
  private observer: MutationObserver | null = null;
  private refreshTimeout: number | null = null;
  private originalTitle: string = document.title;
  private messagesCollapsed: boolean = false;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    logger.info('ContentScript', 'Initializing AI Conversation Navigator');

    // Check if platform is supported
    if (!platformDetector.isSupported()) {
      logger.warn('ContentScript', 'Platform not supported', { url: window.location.href });
      console.log('AI Navigator: Platform not supported');
      return;
    }

    const platform = platformDetector.getPlatformName();
    logger.info('ContentScript', `Platform detected: ${platform}`, { url: window.location.href });

    // Load settings
    const settings = await storageService.loadSettings();
    this.enabled = settings.enabled;

    if (!this.enabled) {
      logger.info('ContentScript', 'Extension is disabled in settings');
      return;
    }

    logger.debug('ContentScript', 'Extension enabled, proceeding with setup');

    // Wait for page to be ready
    if (document.readyState === 'loading') {
      logger.debug('ContentScript', 'Document still loading, waiting for DOMContentLoaded');
      document.addEventListener('DOMContentLoaded', () => this.setupExtension());
    } else {
      logger.debug('ContentScript', 'Document ready, setting up extension immediately');
      this.setupExtension();
    }

    // Listen for settings changes
    storageService.onSettingsChanged((newSettings) => {
      logger.info('ContentScript', 'Settings changed', newSettings);
      this.enabled = newSettings.enabled;
      if (newSettings.enabled) {
        logger.info('ContentScript', 'Extension re-enabled, refreshing');
        this.refreshExtension();
      } else {
        logger.info('ContentScript', 'Extension disabled, cleaning up');
        this.cleanup();
      }
    });
  }

  private setupExtension(): void {
    logger.info('ContentScript', 'Setting up extension components');

    // Scan for messages
    logger.debug('ContentScript', 'Scanning for messages');
    messageService.scanMessages();

    // Initialize navigation
    logger.debug('ContentScript', 'Initializing navigation service');
    navigationService.initialize();

    // Create UI
    logger.debug('ContentScript', 'Creating UI components');
    this.createUI();

    // Setup search functionality
    logger.debug('ContentScript', 'Setting up search functionality');
    this.setupSearch();

    // Observe DOM changes
    logger.debug('ContentScript', 'Setting up DOM observer');
    this.observeDOMChanges();

    logger.info('ContentScript', 'Extension setup complete');
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

    // Create action buttons
    this.createActionsPanel();

    // Create navigation button
    this.createNavButton();

    // Append to body
    document.body.appendChild(this.container);

    // Initial UI update
    this.updateUI();
    this.updatePageTitle();
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

  private createActionsPanel(): void {
    this.actionsPanel = document.createElement('div');
    Object.assign(this.actionsPanel.style, {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      marginBottom: '12px',
      pointerEvents: 'auto',
    });

    // Jump to First button
    const firstBtn = this.createActionButton('⬆️ First', 'Jump to first AI response', () => {
      navigationService.jumpToMessage(0);
      this.updateUI();
    });

    // Jump to Last button
    const lastBtn = this.createActionButton('⬇️ Last', 'Jump to last AI response', () => {
      const total = navigationService.getState().totalMessages;
      navigationService.jumpToMessage(total - 1);
      this.updateUI();
    });

    // Copy All Responses button
    const copyBtn = this.createActionButton('📋 Copy All', 'Copy all AI responses to clipboard', () => {
      this.copyAllResponses();
    });

    // Export to Markdown button
    const exportBtn = this.createActionButton('💾 Export', 'Export conversation to Markdown', () => {
      this.exportToMarkdown();
    });

    // Collapse/Expand toggle
    const collapseBtn = this.createActionButton('📏 Collapse', 'Toggle long message collapse', () => {
      this.toggleMessageCollapse();
      collapseBtn.textContent = this.messagesCollapsed ? '📏 Expand' : '📏 Collapse';
      collapseBtn.title = this.messagesCollapsed ? 'Expand long messages' : 'Collapse long messages';
    });

    // Bookmarks panel toggle
    const bookmarksBtn = this.createActionButton('🔖 Bookmarks', 'View bookmarked messages', () => {
      this.toggleBookmarksPanel();
    });

    // Code only filter
    const codeFilterBtn = this.createActionButton('💻 Code Only', 'Show only code responses', () => {
      this.toggleCodeOnlyFilter();
      codeFilterBtn.style.background = this.codeOnlyFilter ? 'rgba(16, 163, 127, 0.3)' : 'rgba(0, 0, 0, 0.8)';
      codeFilterBtn.style.borderColor = this.codeOnlyFilter ? '#10a37f' : 'rgba(255, 255, 255, 0.1)';
    });

    // Re-ask on different platform
    const reaskBtn = this.createActionButton('🔄 Re-ask', 'Ask on different AI platform', () => {
      this.showReaskPanel();
    });

    this.actionsPanel.appendChild(firstBtn);
    this.actionsPanel.appendChild(lastBtn);
    this.actionsPanel.appendChild(copyBtn);
    this.actionsPanel.appendChild(exportBtn);
    this.actionsPanel.appendChild(collapseBtn);
    this.actionsPanel.appendChild(bookmarksBtn);
    this.actionsPanel.appendChild(codeFilterBtn);
    this.actionsPanel.appendChild(reaskBtn);

    this.container!.appendChild(this.actionsPanel);

    // Add bookmark buttons to messages
    this.addBookmarkButtons();
  }

  private createActionButton(text: string, title: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = text;
    button.title = title;

    Object.assign(button.style, {
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(10px)',
      color: 'white',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '8px',
      padding: '10px 14px',
      fontSize: '13px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      textAlign: 'left',
      whiteSpace: 'nowrap',
    });

    button.addEventListener('mouseenter', () => {
      button.style.background = 'rgba(16, 163, 127, 0.2)';
      button.style.borderColor = '#10a37f';
    });

    button.addEventListener('mouseleave', () => {
      button.style.background = 'rgba(0, 0, 0, 0.8)';
      button.style.borderColor = 'rgba(255, 255, 255, 0.1)';
    });

    button.addEventListener('click', onClick);

    return button;
  }

  private copyAllResponses(): void {
    logger.info('ContentScript', 'Copying all AI responses');
    const messages = messageService.getAssistantMessages();
    const content = messages.map((msg, index) => {
      return `--- AI Response ${index + 1} ---\n\n${msg.content}\n`;
    }).join('\n');

    navigator.clipboard.writeText(content).then(() => {
      logger.info('ContentScript', 'Successfully copied all responses', { count: messages.length });
      this.showNotification('✅ Copied all AI responses to clipboard!');
    }).catch((err) => {
      logger.error('ContentScript', 'Failed to copy responses to clipboard', err);
      console.error('Failed to copy:', err);
      this.showNotification('❌ Failed to copy to clipboard');
    });
  }

  private exportToMarkdown(): void {
    logger.info('ContentScript', 'Exporting conversation to Markdown');
    const messages = messageService.getAssistantMessages();
    const stats = messageService.getConversationStats();
    const platform = platformDetector.getPlatformName();
    const date = new Date().toISOString().split('T')[0];

    let markdown = `# ${platform} Conversation Export\n\n`;
    markdown += `**Date**: ${date}\n`;
    markdown += `**Messages**: ${stats.assistantMessages}\n`;
    markdown += `**Characters**: ${stats.totalCharacters}\n`;
    markdown += `**Estimated Tokens**: ${stats.estimatedTokens}\n\n`;
    markdown += `---\n\n`;

    messages.forEach((msg, index) => {
      markdown += `## AI Response ${index + 1}\n\n`;
      markdown += `${msg.content}\n\n`;
      markdown += `---\n\n`;
    });

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const filename = `${platform.toLowerCase()}-conversation-${date}.md`;
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    logger.info('ContentScript', 'Successfully exported to Markdown', {
      filename,
      messageCount: messages.length,
      stats,
    });
    this.showNotification('✅ Conversation exported to Markdown!');
  }

  private toggleMessageCollapse(): void {
    this.messagesCollapsed = !this.messagesCollapsed;
    const messages = messageService.getAssistantMessages();
    const COLLAPSE_THRESHOLD = 1000; // Characters

    messages.forEach((msg) => {
      if (msg.characterCount > COLLAPSE_THRESHOLD) {
        if (this.messagesCollapsed) {
          // Add collapsed class/style
          msg.element.style.maxHeight = '200px';
          msg.element.style.overflow = 'hidden';
          msg.element.style.position = 'relative';

          // Add "Show more" indicator if not already there
          if (!msg.element.querySelector('.expand-indicator')) {
            const indicator = document.createElement('div');
            indicator.className = 'expand-indicator';
            indicator.textContent = '... (click to expand)';
            Object.assign(indicator.style, {
              position: 'absolute',
              bottom: '0',
              left: '0',
              right: '0',
              background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
              padding: '20px 10px 10px',
              textAlign: 'center',
              color: '#10a37f',
              fontSize: '12px',
              cursor: 'pointer',
            });

            indicator.addEventListener('click', (e) => {
              e.stopPropagation();
              msg.element.style.maxHeight = 'none';
              indicator.remove();
            });

            msg.element.appendChild(indicator);
          }
        } else {
          // Expand
          msg.element.style.maxHeight = 'none';
          msg.element.style.overflow = 'visible';
          const indicator = msg.element.querySelector('.expand-indicator');
          if (indicator) {
            indicator.remove();
          }
        }
      }
    });

    this.showNotification(this.messagesCollapsed ? '📏 Long messages collapsed' : '📏 Messages expanded');
  }

  private updatePageTitle(): void {
    const stats = messageService.getConversationStats();
    const platform = platformDetector.getPlatformName();

    if (stats.assistantMessages > 0) {
      document.title = `${platform} (${stats.assistantMessages} messages)`;
    }
  }

  private showNotification(message: string): void {
    const notification = document.createElement('div');
    notification.textContent = message;

    Object.assign(notification.style, {
      position: 'fixed',
      top: '80px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      padding: '12px 24px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      zIndex: '10001',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      pointerEvents: 'none',
    });

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.transition = 'opacity 0.3s ease';
      notification.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 2000);
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
    const convStats = conversationTrackerService.getStats();

    // Record this conversation
    conversationTrackerService.recordConversation(stats.assistantMessages, stats.totalCharacters);

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
            <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); margin-top: 8px; padding-top: 8px;">
              <div style="font-size: 11px; opacity: 0.6; margin-bottom: 4px;">Your Activity</div>
              <div style="font-size: 12px;">
                <span style="opacity: 0.7;">This week:</span>
                <span style="font-weight: 600; color: #10a37f;"> ${convStats.thisWeek}</span>
              </div>
              <div style="font-size: 12px;">
                <span style="opacity: 0.7;">This month:</span>
                <span style="font-weight: 600; color: #10a37f;"> ${convStats.thisMonth}</span>
              </div>
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
    logger.debug('ContentScript', 'Refreshing extension');
    navigationService.refresh();
    this.updateUI();
    this.updatePageTitle();
    logger.debug('ContentScript', 'Extension refresh complete');
  }

  private addBookmarkButtons(): void {
    const messages = messageService.getAssistantMessages();
    const platform = platformDetector.getPlatformName();

    messages.forEach((msg, index) => {
      // Skip if bookmark button already exists
      if (msg.element.querySelector('.ai-bookmark-btn')) {
        return;
      }

      const isBookmarked = bookmarkService.isBookmarked(index);
      const bookmarkBtn = document.createElement('button');
      bookmarkBtn.className = 'ai-bookmark-btn';
      bookmarkBtn.innerHTML = isBookmarked ? '🔖' : '🔖';
      bookmarkBtn.title = isBookmarked ? 'Remove bookmark' : 'Bookmark this response';

      Object.assign(bookmarkBtn.style, {
        position: 'absolute',
        top: '8px',
        right: '8px',
        background: isBookmarked ? 'rgba(16, 163, 127, 0.2)' : 'rgba(0, 0, 0, 0.6)',
        border: isBookmarked ? '1px solid #10a37f' : '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '6px',
        padding: '6px 10px',
        fontSize: '14px',
        cursor: 'pointer',
        zIndex: '100',
        opacity: isBookmarked ? '1' : '0',
        transition: 'all 0.2s ease',
      });

      bookmarkBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await this.toggleBookmark(index, msg.element, bookmarkBtn);
      });

      // Make message container relative for positioning
      if (msg.element.style.position !== 'relative' && msg.element.style.position !== 'absolute') {
        msg.element.style.position = 'relative';
      }

      // Show button on hover
      msg.element.addEventListener('mouseenter', () => {
        if (!bookmarkService.isBookmarked(index)) {
          bookmarkBtn.style.opacity = '1';
        }
      });

      msg.element.addEventListener('mouseleave', () => {
        if (!bookmarkService.isBookmarked(index)) {
          bookmarkBtn.style.opacity = '0';
        }
      });

      msg.element.appendChild(bookmarkBtn);
    });
  }

  private async toggleBookmark(index: number, element: HTMLElement, button: HTMLButtonElement): Promise<void> {
    const isCurrentlyBookmarked = bookmarkService.isBookmarked(index);
    const platform = platformDetector.getPlatformName();

    if (isCurrentlyBookmarked) {
      await bookmarkService.removeBookmark(index);
      button.style.background = 'rgba(0, 0, 0, 0.6)';
      button.style.borderColor = 'rgba(255, 255, 255, 0.2)';
      button.title = 'Bookmark this response';
      this.showNotification('🔖 Bookmark removed');
    } else {
      // Show prompt for tag
      const tag = prompt('Add a tag for this bookmark (e.g., "working code", "good explanation"):', '');
      if (tag !== null) {
        await bookmarkService.addBookmark(index, tag || 'Untitled', '', platform);
        button.style.background = 'rgba(16, 163, 127, 0.2)';
        button.style.borderColor = '#10a37f';
        button.style.opacity = '1';
        button.title = 'Remove bookmark';
        this.showNotification('🔖 Bookmark added!');
      }
    }

    // Refresh bookmarks panel if open
    if (this.bookmarksPanel && this.bookmarksPanel.style.display !== 'none') {
      this.updateBookmarksPanel();
    }
  }

  private toggleBookmarksPanel(): void {
    if (!this.bookmarksPanel) {
      this.createBookmarksPanel();
    }

    if (this.bookmarksPanel) {
      const isVisible = this.bookmarksPanel.style.display !== 'none';
      if (isVisible) {
        this.bookmarksPanel.style.display = 'none';
      } else {
        this.updateBookmarksPanel();
        this.bookmarksPanel.style.display = 'block';
      }
    }
  }

  private createBookmarksPanel(): void {
    this.bookmarksPanel = document.createElement('div');
    Object.assign(this.bookmarksPanel.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      width: '350px',
      maxHeight: '500px',
      background: 'rgba(0, 0, 0, 0.95)',
      backdropFilter: 'blur(10px)',
      color: 'white',
      padding: '16px',
      borderRadius: '12px',
      fontSize: '14px',
      zIndex: '10000',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
      display: 'none',
      pointerEvents: 'auto',
      overflowY: 'auto',
    });

    document.body.appendChild(this.bookmarksPanel);
  }

  private updateBookmarksPanel(): void {
    if (!this.bookmarksPanel) return;

    const bookmarks = bookmarkService.getAllBookmarks();

    if (bookmarks.length === 0) {
      this.bookmarksPanel.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="margin: 0; font-size: 16px; font-weight: 600;">📚 Bookmarks</h3>
          <button id="close-bookmarks" style="
            background: transparent;
            border: none;
            color: white;
            cursor: pointer;
            fontSize: 20px;
            padding: 0;
          ">✕</button>
        </div>
        <div style="text-align: center; padding: 40px 20px; color: #888;">
          No bookmarks yet.<br/>
          Hover over any AI response and click the bookmark icon.
        </div>
      `;
    } else {
      let bookmarksHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="margin: 0; font-size: 16px; font-weight: 600;">📚 Bookmarks (${bookmarks.length})</h3>
          <button id="close-bookmarks" style="
            background: transparent;
            border: none;
            color: white;
            cursor: pointer;
            fontSize: 20px;
            padding: 0;
          ">✕</button>
        </div>
        <div style="display: flex; flex-direction: column; gap: 12px;">
      `;

      bookmarks.forEach((bookmark) => {
        const date = new Date(bookmark.timestamp).toLocaleDateString();
        bookmarksHTML += `
          <div class="bookmark-item" data-index="${bookmark.messageIndex}" style="
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            borderRadius: 8px;
            padding: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
          ">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 6px;">
              <div style="font-weight: 600; color: #10a37f;">${bookmark.tag || 'Untitled'}</div>
              <div style="font-size: 11px; color: #888;">${date}</div>
            </div>
            <div style="font-size: 12px; color: #aaa;">
              Response #${bookmark.messageIndex + 1}
              ${bookmark.platform ? ` • ${bookmark.platform}` : ''}
            </div>
          </div>
        `;
      });

      bookmarksHTML += '</div>';
      this.bookmarksPanel.innerHTML = bookmarksHTML;

      // Add event listeners
      const bookmarkItems = this.bookmarksPanel.querySelectorAll('.bookmark-item');
      bookmarkItems.forEach((item) => {
        const element = item as HTMLElement;
        const index = parseInt(element.dataset.index || '0');

        element.addEventListener('click', () => {
          navigationService.jumpToMessage(index);
          this.updateUI();
          this.bookmarksPanel!.style.display = 'none';
        });

        element.addEventListener('mouseenter', () => {
          element.style.background = 'rgba(16, 163, 127, 0.1)';
          element.style.borderColor = '#10a37f';
        });

        element.addEventListener('mouseleave', () => {
          element.style.background = 'rgba(255, 255, 255, 0.05)';
          element.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        });
      });
    }

    // Close button handler
    const closeBtn = this.bookmarksPanel.querySelector('#close-bookmarks');
    closeBtn?.addEventListener('click', () => {
      if (this.bookmarksPanel) {
        this.bookmarksPanel.style.display = 'none';
      }
    });
  }

  private toggleCodeOnlyFilter(): void {
    this.codeOnlyFilter = !this.codeOnlyFilter;
    const messages = messageService.getAssistantMessages();

    messages.forEach((msg) => {
      // Check if message contains code (look for code blocks or pre tags)
      const hasCode = msg.element.querySelector('code, pre') !== null;

      if (this.codeOnlyFilter) {
        if (hasCode) {
          msg.element.style.display = '';
        } else {
          msg.element.style.display = 'none';
        }
      } else {
        msg.element.style.display = '';
      }
    });

    const visibleCount = messages.filter((msg) =>
      !this.codeOnlyFilter || msg.element.querySelector('code, pre') !== null
    ).length;

    this.showNotification(
      this.codeOnlyFilter
        ? `💻 Showing ${visibleCount} code responses`
        : '💻 Filter disabled - showing all responses'
    );
  }

  private showReaskPanel(): void {
    if (!this.reaskPanel) {
      this.createReaskPanel();
    }

    if (this.reaskPanel) {
      this.updateReaskPanel();
      this.reaskPanel.style.display = 'block';
    }
  }

  private createReaskPanel(): void {
    this.reaskPanel = document.createElement('div');
    Object.assign(this.reaskPanel.style, {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '500px',
      maxHeight: '600px',
      background: 'rgba(0, 0, 0, 0.95)',
      backdropFilter: 'blur(10px)',
      color: 'white',
      padding: '20px',
      borderRadius: '12px',
      fontSize: '14px',
      zIndex: '10001',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
      display: 'none',
      pointerEvents: 'auto',
      overflowY: 'auto',
    });

    document.body.appendChild(this.reaskPanel);
  }

  private updateReaskPanel(): void {
    if (!this.reaskPanel) return;

    const currentPlatform = platformDetector.getPlatformName();
    const allMessages = messageService.getAllMessages();
    const userMessages = allMessages.filter((msg) => msg.role.toString() === 'user');

    const platformUrls = {
      ChatGPT: 'https://chat.openai.com/',
      Claude: 'https://claude.ai/new',
      Gemini: 'https://gemini.google.com/',
    };

    let html = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h3 style="margin: 0; font-size: 18px; font-weight: 600;">🔄 Re-ask on Different Platform</h3>
        <button id="close-reask" style="
          background: transparent;
          border: none;
          color: white;
          cursor: pointer;
          fontSize: 20px;
          padding: 0;
        ">✕</button>
      </div>

      <div style="margin-bottom: 20px; padding: 12px; background: rgba(16, 163, 127, 0.1); border-radius: 8px; border-left: 3px solid #10a37f;">
        <div style="font-size: 12px; color: #aaa; margin-bottom: 4px;">Current Platform</div>
        <div style="font-weight: 600;">${currentPlatform}</div>
      </div>

      <div style="margin-bottom: 20px;">
        <div style="font-size: 13px; font-weight: 600; margin-bottom: 12px;">Quick Actions</div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <button id="copy-last-message" style="
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: white;
            padding: 10px 14px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            text-align: left;
            transition: all 0.2s ease;
          ">
            📋 Copy Last User Message
          </button>
          <button id="copy-all-user-messages" style="
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: white;
            padding: 10px 14px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            text-align: left;
            transition: all 0.2s ease;
          ">
            📋 Copy All User Messages
          </button>
        </div>
      </div>

      <div style="margin-bottom: 16px;">
        <div style="font-size: 13px; font-weight: 600; margin-bottom: 12px;">Open in Different Platform</div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
    `;

    // Add platform links
    Object.entries(platformUrls).forEach(([platform, url]) => {
      if (platform !== currentPlatform) {
        html += `
          <a href="${url}" target="_blank" style="
            display: block;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: white;
            padding: 10px 14px;
            border-radius: 6px;
            text-decoration: none;
            font-size: 13px;
            transition: all 0.2s ease;
          " class="platform-link">
            🚀 Open ${platform}
          </a>
        `;
      }
    });

    html += `
        </div>
      </div>

      <div style="font-size: 12px; color: #888; padding: 12px; background: rgba(255, 255, 255, 0.03); border-radius: 6px;">
        💡 Tip: Copy your message(s), then click a platform link to paste and compare responses across different AI models.
      </div>
    `;

    this.reaskPanel.innerHTML = html;

    // Add event listeners
    const closeBtn = this.reaskPanel.querySelector('#close-reask');
    closeBtn?.addEventListener('click', () => {
      if (this.reaskPanel) {
        this.reaskPanel.style.display = 'none';
      }
    });

    const copyLastBtn = this.reaskPanel.querySelector('#copy-last-message');
    copyLastBtn?.addEventListener('click', () => {
      if (userMessages.length > 0) {
        const lastMessage = userMessages[userMessages.length - 1];
        navigator.clipboard.writeText(lastMessage.content).then(() => {
          this.showNotification('📋 Last user message copied!');
        });
      } else {
        this.showNotification('❌ No user messages found');
      }
    });

    const copyAllBtn = this.reaskPanel.querySelector('#copy-all-user-messages');
    copyAllBtn?.addEventListener('click', () => {
      if (userMessages.length > 0) {
        const content = userMessages
          .map((msg, index) => `[Message ${index + 1}]\n${msg.content}`)
          .join('\n\n---\n\n');
        navigator.clipboard.writeText(content).then(() => {
          this.showNotification(`📋 ${userMessages.length} user messages copied!`);
        });
      } else {
        this.showNotification('❌ No user messages found');
      }
    });

    // Add hover effects to platform links
    const platformLinks = this.reaskPanel.querySelectorAll('.platform-link');
    platformLinks.forEach((link) => {
      const element = link as HTMLElement;
      element.addEventListener('mouseenter', () => {
        element.style.background = 'rgba(16, 163, 127, 0.2)';
        element.style.borderColor = '#10a37f';
      });
      element.addEventListener('mouseleave', () => {
        element.style.background = 'rgba(255, 255, 255, 0.05)';
        element.style.borderColor = 'rgba(255, 255, 255, 0.1)';
      });
    });

    // Add hover effects to buttons
    const buttons = this.reaskPanel.querySelectorAll('button[id^="copy-"]');
    buttons.forEach((button) => {
      const element = button as HTMLElement;
      element.addEventListener('mouseenter', () => {
        element.style.background = 'rgba(16, 163, 127, 0.2)';
        element.style.borderColor = '#10a37f';
      });
      element.addEventListener('mouseleave', () => {
        element.style.background = 'rgba(255, 255, 255, 0.05)';
        element.style.borderColor = 'rgba(255, 255, 255, 0.1)';
      });
    });
  }

  private cleanup(): void {
    logger.info('ContentScript', 'Cleaning up extension');

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

    if (this.bookmarksPanel) {
      this.bookmarksPanel.remove();
      this.bookmarksPanel = null;
    }

    if (this.reaskPanel) {
      this.reaskPanel.remove();
      this.reaskPanel = null;
    }

    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    // Restore original page title
    document.title = this.originalTitle;

    searchService.clearSearch();

    logger.info('ContentScript', 'Cleanup complete');
  }
}

// Initialize the extension
new AIConversationNavigator();
