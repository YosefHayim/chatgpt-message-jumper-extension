/**
 * Popup Script
 * Settings and information panel for the extension
 */

import storageService from './services/storageService';
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
    this.bindEvents();
    this.updateTheme();
  }

  private cacheElements(): void {
    this.elements.enableToggle = document.getElementById('enable-toggle') as HTMLInputElement;
    this.elements.themeSelect = document.getElementById('theme-select') as HTMLSelectElement;
    this.elements.showStatsCheckbox = document.getElementById('show-stats') as HTMLInputElement;
    this.elements.showTokenWarningCheckbox = document.getElementById('show-token-warning') as HTMLInputElement;
    this.elements.thresholdSlider = document.getElementById('threshold-slider') as HTMLInputElement;
    this.elements.thresholdValue = document.getElementById('threshold-value') as HTMLSpanElement;
    this.elements.thresholdContainer = document.getElementById('threshold-container') as HTMLDivElement;
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
}

// Initialize popup
new PopupUI();
