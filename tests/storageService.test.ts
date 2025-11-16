/**
 * Storage Service Tests
 * Tests for Chrome storage integration and settings persistence
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { StorageService } from '~/src/services/storageService';
import { ExtensionSettings } from '~/src/types';

describe('StorageService', () => {
  let storageService: StorageService;
  let mockStorageData: any;
  let mockOnChangedListeners: Function[];

  beforeEach(() => {
    storageService = StorageService.getInstance();
    mockStorageData = {};
    mockOnChangedListeners = [];

    // Mock Chrome storage API
    global.chrome = {
      storage: {
        sync: {
          get: jest.fn((keys) => {
            return Promise.resolve(mockStorageData);
          }),
          set: jest.fn((data) => {
            mockStorageData = { ...mockStorageData, ...data };
            return Promise.resolve();
          }),
        },
        onChanged: {
          addListener: jest.fn((callback) => {
            mockOnChangedListeners.push(callback);
          }),
        },
      },
    } as any;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    mockStorageData = {};
    mockOnChangedListeners = [];
  });

  describe('getInstance', () => {
    test('should return singleton instance', () => {
      const instance1 = StorageService.getInstance();
      const instance2 = StorageService.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('loadSettings', () => {
    test('should load settings from Chrome storage', async () => {
      const savedSettings: Partial<ExtensionSettings> = {
        enabled: false,
        theme: 'light',
      };

      mockStorageData = { settings: savedSettings };

      const settings = await storageService.loadSettings();

      expect(settings.enabled).toBe(false);
      expect(settings.theme).toBe('light');
      expect(chrome.storage.sync.get).toHaveBeenCalledWith('settings');
    });

    test('should merge with default settings', async () => {
      const partialSettings: Partial<ExtensionSettings> = {
        enabled: false,
      };

      mockStorageData = { settings: partialSettings };

      const settings = await storageService.loadSettings();

      expect(settings.enabled).toBe(false); // From storage
      expect(settings.theme).toBe('dark'); // From defaults
      expect(settings.showStats).toBe(true); // From defaults
    });

    test('should return defaults when no settings in storage', async () => {
      mockStorageData = {};

      const settings = await storageService.loadSettings();

      expect(settings.enabled).toBe(true);
      expect(settings.theme).toBe('dark');
      expect(settings.showStats).toBe(true);
      expect(settings.showTokenWarning).toBe(true);
      expect(settings.tokenWarningThreshold).toBe(80);
    });

    test('should handle storage errors gracefully', async () => {
      (chrome.storage.sync.get as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const settings = await storageService.loadSettings();

      // Should return defaults on error
      expect(settings.enabled).toBe(true);
      expect(settings.theme).toBe('dark');
    });

    test('should cache settings in memory', async () => {
      mockStorageData = { settings: { enabled: false } };

      await storageService.loadSettings();
      const settings = storageService.getSettings();

      expect(settings.enabled).toBe(false);
    });
  });

  describe('saveSettings', () => {
    test('should save settings to Chrome storage', async () => {
      const newSettings: Partial<ExtensionSettings> = {
        enabled: false,
        theme: 'light',
      };

      await storageService.saveSettings(newSettings);

      expect(chrome.storage.sync.set).toHaveBeenCalled();
      expect(mockStorageData.settings.enabled).toBe(false);
      expect(mockStorageData.settings.theme).toBe('light');
    });

    test('should merge with existing settings', async () => {
      // Load initial settings
      mockStorageData = {
        settings: {
          enabled: true,
          theme: 'dark',
          showStats: true,
          showTokenWarning: true,
          tokenWarningThreshold: 80,
        },
      };

      await storageService.loadSettings();

      // Update only one setting
      await storageService.saveSettings({ theme: 'light' });

      const settings = storageService.getSettings();
      expect(settings.enabled).toBe(true); // Unchanged
      expect(settings.theme).toBe('light'); // Changed
    });

    test('should handle storage errors', async () => {
      (chrome.storage.sync.set as jest.Mock).mockRejectedValue(new Error('Storage error'));

      await expect(storageService.saveSettings({ enabled: false })).rejects.toThrow('Storage error');
    });

    test('should update memory cache', async () => {
      await storageService.saveSettings({ enabled: false });

      const settings = storageService.getSettings();
      expect(settings.enabled).toBe(false);
    });
  });

  describe('getSettings', () => {
    test('should return current settings from memory', async () => {
      mockStorageData = {
        settings: {
          enabled: false,
          theme: 'light',
          showStats: false,
          showTokenWarning: true,
          tokenWarningThreshold: 90,
        },
      };

      await storageService.loadSettings();
      const settings = storageService.getSettings();

      expect(settings.enabled).toBe(false);
      expect(settings.theme).toBe('light');
      expect(settings.showStats).toBe(false);
    });

    test('should return copy of settings, not reference', async () => {
      await storageService.loadSettings();

      const settings1 = storageService.getSettings();
      const settings2 = storageService.getSettings();

      expect(settings1).toEqual(settings2);
      expect(settings1).not.toBe(settings2); // Different objects
    });

    test('should return defaults before loading', () => {
      const settings = storageService.getSettings();

      expect(settings.enabled).toBe(true);
      expect(settings.theme).toBe('dark');
    });
  });

  describe('getSetting', () => {
    test('should get specific setting by key', async () => {
      mockStorageData = {
        settings: {
          enabled: true,
          theme: 'dark',
          showStats: true,
          showTokenWarning: true,
          tokenWarningThreshold: 85,
        },
      };

      await storageService.loadSettings();

      expect(storageService.getSetting('enabled')).toBe(true);
      expect(storageService.getSetting('theme')).toBe('dark');
      expect(storageService.getSetting('tokenWarningThreshold')).toBe(85);
    });

    test('should return default value for unloaded settings', () => {
      expect(storageService.getSetting('enabled')).toBe(true);
      expect(storageService.getSetting('theme')).toBe('dark');
    });
  });

  describe('updateSetting', () => {
    test('should update single setting', async () => {
      await storageService.updateSetting('enabled', false);

      expect(chrome.storage.sync.set).toHaveBeenCalled();
      expect(storageService.getSetting('enabled')).toBe(false);
    });

    test('should preserve other settings', async () => {
      await storageService.loadSettings();

      await storageService.updateSetting('theme', 'light');

      const settings = storageService.getSettings();
      expect(settings.theme).toBe('light');
      expect(settings.enabled).toBe(true); // Unchanged
      expect(settings.showStats).toBe(true); // Unchanged
    });

    test('should work with different setting types', async () => {
      await storageService.updateSetting('enabled', false);
      await storageService.updateSetting('theme', 'light');
      await storageService.updateSetting('tokenWarningThreshold', 95);

      expect(storageService.getSetting('enabled')).toBe(false);
      expect(storageService.getSetting('theme')).toBe('light');
      expect(storageService.getSetting('tokenWarningThreshold')).toBe(95);
    });
  });

  describe('resetSettings', () => {
    test('should reset to default settings', async () => {
      // Change settings
      await storageService.saveSettings({
        enabled: false,
        theme: 'light',
        showStats: false,
      });

      // Reset
      await storageService.resetSettings();

      const settings = storageService.getSettings();
      expect(settings.enabled).toBe(true);
      expect(settings.theme).toBe('dark');
      expect(settings.showStats).toBe(true);
      expect(settings.showTokenWarning).toBe(true);
      expect(settings.tokenWarningThreshold).toBe(80);
    });

    test('should save defaults to storage', async () => {
      await storageService.resetSettings();

      expect(chrome.storage.sync.set).toHaveBeenCalled();
    });
  });

  describe('onSettingsChanged', () => {
    test('should register change listener', () => {
      const callback = jest.fn();

      storageService.onSettingsChanged(callback);

      expect(chrome.storage.onChanged.addListener).toHaveBeenCalled();
    });

    test('should call callback when settings change', async () => {
      const callback = jest.fn();

      storageService.onSettingsChanged(callback);

      // Simulate storage change
      const changes = {
        settings: {
          newValue: {
            enabled: false,
            theme: 'light',
            showStats: true,
            showTokenWarning: true,
            tokenWarningThreshold: 80,
          },
        },
      };

      mockOnChangedListeners.forEach(listener => {
        listener(changes, 'sync');
      });

      expect(callback).toHaveBeenCalledWith(changes.settings.newValue);
    });

    test('should update memory cache when settings change', async () => {
      const callback = jest.fn();

      storageService.onSettingsChanged(callback);

      // Simulate storage change
      const newSettings: ExtensionSettings = {
        enabled: false,
        theme: 'light',
        showStats: false,
        showTokenWarning: false,
        tokenWarningThreshold: 90,
      };

      const changes = {
        settings: {
          newValue: newSettings,
        },
      };

      mockOnChangedListeners.forEach(listener => {
        listener(changes, 'sync');
      });

      const settings = storageService.getSettings();
      expect(settings.enabled).toBe(false);
      expect(settings.theme).toBe('light');
    });

    test('should ignore changes from other storage areas', () => {
      const callback = jest.fn();

      storageService.onSettingsChanged(callback);

      // Simulate local storage change (not sync)
      const changes = {
        settings: {
          newValue: { enabled: false },
        },
      };

      mockOnChangedListeners.forEach(listener => {
        listener(changes, 'local'); // Not 'sync'
      });

      expect(callback).not.toHaveBeenCalled();
    });

    test('should ignore changes to other keys', () => {
      const callback = jest.fn();

      storageService.onSettingsChanged(callback);

      // Simulate change to different key
      const changes = {
        otherKey: {
          newValue: 'some value',
        },
      };

      mockOnChangedListeners.forEach(listener => {
        listener(changes, 'sync');
      });

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    test('should handle corrupted storage data', async () => {
      mockStorageData = { settings: 'invalid data' }; // Not an object

      const settings = await storageService.loadSettings();

      // Should return defaults when data is invalid
      expect(settings.enabled).toBe(true);
    });

    test('should handle partial settings in storage', async () => {
      mockStorageData = {
        settings: {
          enabled: false,
          // Missing other required fields
        },
      };

      const settings = await storageService.loadSettings();

      expect(settings.enabled).toBe(false); // From storage
      expect(settings.theme).toBe('dark'); // From defaults
      expect(settings.showStats).toBe(true); // From defaults
    });

    test('should handle saving empty object', async () => {
      await expect(storageService.saveSettings({})).resolves.not.toThrow();
    });

    test('should handle concurrent save operations', async () => {
      const savePromises = [
        storageService.saveSettings({ enabled: false }),
        storageService.saveSettings({ theme: 'light' }),
        storageService.saveSettings({ showStats: false }),
      ];

      await Promise.all(savePromises);

      // All changes should be persisted
      const settings = storageService.getSettings();
      expect(settings.enabled).toBe(false);
      expect(settings.theme).toBe('light');
      expect(settings.showStats).toBe(false);
    });

    test('should handle very high threshold values', async () => {
      await storageService.updateSetting('tokenWarningThreshold', 95);

      expect(storageService.getSetting('tokenWarningThreshold')).toBe(95);
    });

    test('should handle very low threshold values', async () => {
      await storageService.updateSetting('tokenWarningThreshold', 50);

      expect(storageService.getSetting('tokenWarningThreshold')).toBe(50);
    });

    test('should handle all theme options', async () => {
      await storageService.updateSetting('theme', 'light');
      expect(storageService.getSetting('theme')).toBe('light');

      await storageService.updateSetting('theme', 'dark');
      expect(storageService.getSetting('theme')).toBe('dark');

      await storageService.updateSetting('theme', 'auto');
      expect(storageService.getSetting('theme')).toBe('auto');
    });

    test('should handle rapid setting changes', async () => {
      for (let i = 0; i < 100; i++) {
        await storageService.updateSetting('tokenWarningThreshold', 50 + i % 45);
      }

      // Should handle without errors
      const threshold = storageService.getSetting('tokenWarningThreshold');
      expect(threshold).toBeGreaterThanOrEqual(50);
      expect(threshold).toBeLessThanOrEqual(95);
    });
  });

  describe('type safety', () => {
    test('should maintain type safety for boolean settings', async () => {
      await storageService.updateSetting('enabled', true);
      const value = storageService.getSetting('enabled');

      expect(typeof value).toBe('boolean');
    });

    test('should maintain type safety for string settings', async () => {
      await storageService.updateSetting('theme', 'light');
      const value = storageService.getSetting('theme');

      expect(typeof value).toBe('string');
      expect(['light', 'dark', 'auto']).toContain(value);
    });

    test('should maintain type safety for number settings', async () => {
      await storageService.updateSetting('tokenWarningThreshold', 85);
      const value = storageService.getSetting('tokenWarningThreshold');

      expect(typeof value).toBe('number');
    });
  });
});
