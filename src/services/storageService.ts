/**
 * Storage Service
 * Handles Chrome storage API interactions for settings persistence
 */

import { ExtensionSettings } from '~/src/types';

const DEFAULT_SETTINGS: ExtensionSettings = {
  enabled: true,
  theme: 'dark',
  showStats: true,
  showTokenWarning: true,
  tokenWarningThreshold: 80,
};

export class StorageService {
  private static instance: StorageService;
  private settings: ExtensionSettings = DEFAULT_SETTINGS;

  private constructor() {}

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  /**
   * Load settings from Chrome storage
   */
  public async loadSettings(): Promise<ExtensionSettings> {
    try {
      const result = await chrome.storage.sync.get('settings');
      this.settings = result.settings ? { ...DEFAULT_SETTINGS, ...result.settings } : DEFAULT_SETTINGS;
      return this.settings;
    } catch (error) {
      console.error('Failed to load settings:', error);
      return DEFAULT_SETTINGS;
    }
  }

  /**
   * Save settings to Chrome storage
   */
  public async saveSettings(settings: Partial<ExtensionSettings>): Promise<void> {
    try {
      this.settings = { ...this.settings, ...settings };
      await chrome.storage.sync.set({ settings: this.settings });
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }

  /**
   * Get current settings (from memory)
   */
  public getSettings(): ExtensionSettings {
    return { ...this.settings };
  }

  /**
   * Get a specific setting
   */
  public getSetting<K extends keyof ExtensionSettings>(key: K): ExtensionSettings[K] {
    return this.settings[key];
  }

  /**
   * Update a specific setting
   */
  public async updateSetting<K extends keyof ExtensionSettings>(
    key: K,
    value: ExtensionSettings[K]
  ): Promise<void> {
    await this.saveSettings({ [key]: value } as Partial<ExtensionSettings>);
  }

  /**
   * Reset to default settings
   */
  public async resetSettings(): Promise<void> {
    this.settings = DEFAULT_SETTINGS;
    await chrome.storage.sync.set({ settings: DEFAULT_SETTINGS });
  }

  /**
   * Listen for storage changes
   */
  public onSettingsChanged(callback: (settings: ExtensionSettings) => void): void {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'sync' && changes.settings) {
        this.settings = changes.settings.newValue;
        callback(this.settings);
      }
    });
  }
}

export default StorageService.getInstance();
