/**
 * Storage Service
 * Handles Chrome storage API interactions for settings persistence
 */

import { ExtensionSettings } from '~/src/types';
import logger from '../utils/logger';

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
      logger.debug('StorageService', 'Loading settings from Chrome storage');
      const result = await chrome.storage.sync.get('settings');
      this.settings = result.settings ? { ...DEFAULT_SETTINGS, ...result.settings } : DEFAULT_SETTINGS;
      logger.info('StorageService', 'Settings loaded successfully', this.settings);
      return this.settings;
    } catch (error) {
      logger.error('StorageService', 'Failed to load settings', error);
      console.error('Failed to load settings:', error);
      return DEFAULT_SETTINGS;
    }
  }

  /**
   * Save settings to Chrome storage
   */
  public async saveSettings(settings: Partial<ExtensionSettings>): Promise<void> {
    try {
      logger.debug('StorageService', 'Saving settings to Chrome storage', settings);
      this.settings = { ...this.settings, ...settings };
      await chrome.storage.sync.set({ settings: this.settings });
      logger.info('StorageService', 'Settings saved successfully');
    } catch (error) {
      logger.error('StorageService', 'Failed to save settings', error);
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
    logger.info('StorageService', 'Resetting settings to defaults');
    this.settings = DEFAULT_SETTINGS;
    await chrome.storage.sync.set({ settings: DEFAULT_SETTINGS });
    logger.info('StorageService', 'Settings reset successfully');
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
