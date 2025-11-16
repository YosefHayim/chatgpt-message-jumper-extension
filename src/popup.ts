/**
 * Popup Script
 * Settings and information panel for the extension
 */

import storageService from './services/storageService';
import logger from './utils/logger';
import type { ExtensionSettings } from './types';

class PopupUI {
  private settings: ExtensionSettings = {
    enabled: true,
    theme: 'dark',
    showStats: true,
    showTokenWarning: true,
    tokenWarningThreshold: 80,
  };

  private elements = {
    enableToggle: null as HTMLInputElement | null,
    themeSelect: null as HTMLSelectElement | null,
    showStatsCheckbox: null as HTMLInputElement | null,
    showTokenWarningCheckbox: null as HTMLInputElement | null,
    thresholdSlider: null as HTMLInputElement | null,
    thresholdValue: null as HTMLSpanElement | null,
    thresholdContainer: null as HTMLDivElement | null,
    loggerEnabled: null as HTMLInputElement | null,
    logLevelSelect: null as HTMLSelectElement | null,
    logTotal: null as HTMLSpanElement | null,
    logErrors: null as HTMLSpanElement | null,
    logWarnings: null as HTMLSpanElement | null,
    downloadLogsBtn: null as HTMLButtonElement | null,
    clearLogsBtn: null as HTMLButtonElement | null,
  };

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  private async setup(): Promise<void> {
    this.cacheElements();
    await this.loadSettings();
    await this.loadLoggerState();
    this.bindEvents();
    this.updateTheme();
    await this.updateLogStats();
  }

  private cacheElements(): void {
    this.elements.enableToggle = document.getElementById('enable-toggle') as HTMLInputElement;
    this.elements.themeSelect = document.getElementById('theme-select') as HTMLSelectElement;
    this.elements.showStatsCheckbox = document.getElementById('show-stats') as HTMLInputElement;
    this.elements.showTokenWarningCheckbox = document.getElementById('show-token-warning') as HTMLInputElement;
    this.elements.thresholdSlider = document.getElementById('threshold-slider') as HTMLInputElement;
    this.elements.thresholdValue = document.getElementById('threshold-value') as HTMLSpanElement;
    this.elements.thresholdContainer = document.getElementById('threshold-container') as HTMLDivElement;

    // Logger elements
    this.elements.loggerEnabled = document.getElementById('logger-enabled') as HTMLInputElement;
    this.elements.logLevelSelect = document.getElementById('log-level-select') as HTMLSelectElement;
    this.elements.logTotal = document.getElementById('log-total') as HTMLSpanElement;
    this.elements.logErrors = document.getElementById('log-errors') as HTMLSpanElement;
    this.elements.logWarnings = document.getElementById('log-warnings') as HTMLSpanElement;
    this.elements.downloadLogsBtn = document.getElementById('download-logs') as HTMLButtonElement;
    this.elements.clearLogsBtn = document.getElementById('clear-logs') as HTMLButtonElement;
  }

  private async loadSettings(): Promise<void> {
    this.settings = await storageService.loadSettings();
    this.updateUI();
  }

  private updateUI(): void {
    if (this.elements.enableToggle) {
      this.elements.enableToggle.checked = this.settings.enabled;
    }

    if (this.elements.themeSelect) {
      this.elements.themeSelect.value = this.settings.theme;
    }

    if (this.elements.showStatsCheckbox) {
      this.elements.showStatsCheckbox.checked = this.settings.showStats;
    }

    if (this.elements.showTokenWarningCheckbox) {
      this.elements.showTokenWarningCheckbox.checked = this.settings.showTokenWarning;
    }

    if (this.elements.thresholdSlider) {
      this.elements.thresholdSlider.value = this.settings.tokenWarningThreshold.toString();
    }

    if (this.elements.thresholdValue) {
      this.elements.thresholdValue.textContent = `${this.settings.tokenWarningThreshold}%`;
    }

    if (this.elements.thresholdContainer) {
      this.elements.thresholdContainer.style.display = this.settings.showTokenWarning ? 'block' : 'none';
    }
  }

  private bindEvents(): void {
    this.elements.enableToggle?.addEventListener('change', (e) => {
      this.updateSetting('enabled', (e.target as HTMLInputElement).checked);
    });

    this.elements.themeSelect?.addEventListener('change', (e) => {
      this.updateSetting('theme', (e.target as HTMLSelectElement).value as 'light' | 'dark' | 'auto');
      this.updateTheme();
    });

    this.elements.showStatsCheckbox?.addEventListener('change', (e) => {
      this.updateSetting('showStats', (e.target as HTMLInputElement).checked);
    });

    this.elements.showTokenWarningCheckbox?.addEventListener('change', (e) => {
      this.updateSetting('showTokenWarning', (e.target as HTMLInputElement).checked);
      if (this.elements.thresholdContainer) {
        this.elements.thresholdContainer.style.display = (e.target as HTMLInputElement).checked ? 'block' : 'none';
      }
    });

    this.elements.thresholdSlider?.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value);
      if (this.elements.thresholdValue) {
        this.elements.thresholdValue.textContent = `${value}%`;
      }
    });

    this.elements.thresholdSlider?.addEventListener('change', (e) => {
      this.updateSetting('tokenWarningThreshold', parseInt((e.target as HTMLInputElement).value));
    });

    // Logger events
    this.elements.loggerEnabled?.addEventListener('change', async (e) => {
      const enabled = (e.target as HTMLInputElement).checked;
      await logger.updateConfig({ enabled });
      await this.updateLogStats();
    });

    this.elements.logLevelSelect?.addEventListener('change', async (e) => {
      const level = parseInt((e.target as HTMLSelectElement).value);
      await logger.updateConfig({ level });
      await this.updateLogStats();
    });

    this.elements.downloadLogsBtn?.addEventListener('click', async () => {
      await logger.downloadLogs();
    });

    this.elements.clearLogsBtn?.addEventListener('click', async () => {
      if (confirm('Are you sure you want to clear all logs?')) {
        await logger.clearLogs();
        await this.updateLogStats();
      }
    });
  }

  private async updateSetting<K extends keyof ExtensionSettings>(
    key: K,
    value: ExtensionSettings[K]
  ): Promise<void> {
    this.settings[key] = value;
    await storageService.updateSetting(key, value);
  }

  private updateTheme(): void {
    const isDark = this.settings.theme === 'dark' ||
      (this.settings.theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }

  private async loadLoggerState(): Promise<void> {
    const config = logger.getConfig();

    if (this.elements.loggerEnabled) {
      this.elements.loggerEnabled.checked = config.enabled;
    }

    if (this.elements.logLevelSelect) {
      this.elements.logLevelSelect.value = config.level.toString();
    }
  }

  private async updateLogStats(): Promise<void> {
    const stats = await logger.getStats();

    if (this.elements.logTotal) {
      this.elements.logTotal.textContent = stats.total.toString();
    }

    if (this.elements.logErrors) {
      this.elements.logErrors.textContent = stats.byLevel.ERROR.toString();
    }

    if (this.elements.logWarnings) {
      this.elements.logWarnings.textContent = stats.byLevel.WARN.toString();
    }
  }
}

// Initialize popup
new PopupUI();
