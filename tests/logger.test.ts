/**
 * Logger Tests
 * Comprehensive tests for the logging utility
 */

import logger, { LogLevel, LogEntry, LoggerConfig } from '~/src/utils/logger';

// Mock chrome.storage.local
const mockChromeStorage = {
  get: jest.fn(),
  set: jest.fn(),
  remove: jest.fn(),
};

// Setup chrome mock
global.chrome = {
  storage: {
    local: mockChromeStorage,
  },
} as any;

describe('Logger', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockChromeStorage.get.mockImplementation(() => {
      return Promise.resolve({});
    });
    mockChromeStorage.set.mockResolvedValue(undefined);
    mockChromeStorage.remove.mockResolvedValue(undefined);

    // Mock console methods
    jest.spyOn(console, 'debug').mockImplementation();
    jest.spyOn(console, 'info').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();

    // Reset logger to default config
    await logger.updateConfig({
      enabled: true,
      level: LogLevel.DEBUG,
      consoleOutput: true,
      persistToStorage: true,
      maxEntries: 1000,
    });
    await logger.clearLogs();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('LogLevel', () => {
    test('should have correct log levels', () => {
      expect(LogLevel.DEBUG).toBe(0);
      expect(LogLevel.INFO).toBe(1);
      expect(LogLevel.WARN).toBe(2);
      expect(LogLevel.ERROR).toBe(3);
    });
  });

  describe('Logging Methods', () => {
    test('should log debug messages', () => {
      logger.debug('TestContext', 'Debug message', { data: 'test' });

      expect(console.debug).toHaveBeenCalled();
    });

    test('should log info messages', () => {
      logger.info('TestContext', 'Info message');

      expect(console.info).toHaveBeenCalled();
    });

    test('should log warning messages', () => {
      logger.warn('TestContext', 'Warning message');

      expect(console.warn).toHaveBeenCalled();
    });

    test('should log error messages', () => {
      logger.error('TestContext', 'Error message', new Error('test'));

      expect(console.error).toHaveBeenCalled();
    });

    test('should include timestamp in log output', () => {
      logger.info('Test', 'Message');

      const call = (console.info as jest.Mock).mock.calls[0];
      expect(call[0]).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/); // ISO timestamp format
    });

    test('should include log level in output', () => {
      logger.warn('Test', 'Message');

      const call = (console.warn as jest.Mock).mock.calls[0];
      expect(call[0]).toContain('[WARN]');
    });

    test('should include context in output', () => {
      logger.info('MyContext', 'Message');

      const call = (console.info as jest.Mock).mock.calls[0];
      expect(call[0]).toContain('[MyContext]');
    });

    test('should log data when provided', () => {
      const testData = { foo: 'bar', num: 42 };
      logger.debug('Test', 'Message', testData);

      const call = (console.debug as jest.Mock).mock.calls[0];
      expect(call).toHaveLength(3);
      expect(call[2]).toEqual(testData);
    });

    test('should not log data object when not provided', () => {
      logger.info('Test', 'Message');

      const call = (console.info as jest.Mock).mock.calls[0];
      expect(call).toHaveLength(2); // prefix and message only
    });
  });

  describe('Log Level Filtering', () => {
    test('should respect log level configuration', async () => {
      await logger.updateConfig({ level: LogLevel.WARN });

      logger.debug('Test', 'Debug message');
      logger.info('Test', 'Info message');
      logger.warn('Test', 'Warn message');
      logger.error('Test', 'Error message');

      expect(console.debug).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });

    test('should log all levels when set to DEBUG', async () => {
      await logger.updateConfig({ level: LogLevel.DEBUG });

      logger.debug('Test', 'Debug');
      logger.info('Test', 'Info');
      logger.warn('Test', 'Warn');
      logger.error('Test', 'Error');

      expect(console.debug).toHaveBeenCalled();
      expect(console.info).toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });

    test('should only log errors when set to ERROR level', async () => {
      await logger.updateConfig({ level: LogLevel.ERROR });

      logger.debug('Test', 'Debug');
      logger.info('Test', 'Info');
      logger.warn('Test', 'Warn');
      logger.error('Test', 'Error');

      expect(console.debug).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Configuration', () => {
    test('should update configuration', async () => {
      const newConfig: Partial<LoggerConfig> = {
        enabled: false,
        level: LogLevel.ERROR,
        consoleOutput: false,
      };

      await logger.updateConfig(newConfig);

      const config = logger.getConfig();
      expect(config.enabled).toBe(false);
      expect(config.level).toBe(LogLevel.ERROR);
      expect(config.consoleOutput).toBe(false);
    });

    test('should not log when disabled', async () => {
      await logger.updateConfig({ enabled: false });

      logger.info('Test', 'This should not be logged');

      expect(console.info).not.toHaveBeenCalled();
    });

    test('should not output to console when consoleOutput is false', async () => {
      await logger.updateConfig({ consoleOutput: false });

      logger.info('Test', 'Message');

      expect(console.info).not.toHaveBeenCalled();
    });

    test('should get current configuration', () => {
      const config = logger.getConfig();

      expect(config).toHaveProperty('enabled');
      expect(config).toHaveProperty('level');
      expect(config).toHaveProperty('maxEntries');
      expect(config).toHaveProperty('persistToStorage');
      expect(config).toHaveProperty('consoleOutput');
    });

    test('should not mutate config when getting it', () => {
      const config1 = logger.getConfig();
      config1.enabled = false;

      const config2 = logger.getConfig();
      expect(config2.enabled).toBe(true); // Original value
    });
  });

  describe('Log Storage and Retrieval', () => {
    test('should retrieve logs', async () => {
      logger.info('Test', 'Message 1');
      logger.warn('Test', 'Message 2');

      const logs = await logger.getLogs();

      expect(Array.isArray(logs)).toBe(true);
      expect(logs.length).toBeGreaterThan(0);
    });

    test('should filter logs by level', async () => {
      logger.debug('Test', 'Debug message');
      logger.info('Test', 'Info message');
      logger.warn('Test', 'Warning message');
      logger.error('Test', 'Error message');

      const errorLogs = await logger.getLogsByLevel(LogLevel.ERROR);

      expect(errorLogs.every(log => log.level === LogLevel.ERROR)).toBe(true);
    });

    test('should filter logs by context', async () => {
      logger.info('Context1', 'Message 1');
      logger.info('Context2', 'Message 2');
      logger.info('Context1', 'Message 3');

      const context1Logs = await logger.getLogsByContext('Context1');

      expect(context1Logs).toHaveLength(2);
      expect(context1Logs.every(log => log.context === 'Context1')).toBe(true);
    });

    test('should include warning and error logs when filtering by WARN level', async () => {
      logger.debug('Test', 'Debug');
      logger.info('Test', 'Info');
      logger.warn('Test', 'Warn');
      logger.error('Test', 'Error');

      const warnLogs = await logger.getLogsByLevel(LogLevel.WARN);

      expect(warnLogs.length).toBeGreaterThanOrEqual(2); // WARN and ERROR
      expect(warnLogs.every(log => log.level >= LogLevel.WARN)).toBe(true);
    });
  });

  describe('Clear Logs', () => {
    test('should clear all logs', async () => {
      logger.info('Test', 'Message 1');
      logger.info('Test', 'Message 2');

      await logger.clearLogs();

      const logs = await logger.getLogs();
      expect(logs).toHaveLength(0);
    });

    test('should call chrome storage remove on clear', async () => {
      await logger.clearLogs();

      expect(mockChromeStorage.remove).toHaveBeenCalled();
    });
  });

  describe('Export Logs', () => {
    test('should export logs as JSON string', async () => {
      logger.info('Test', 'Message');

      const exported = await logger.exportLogs();

      expect(typeof exported).toBe('string');
      expect(() => JSON.parse(exported)).not.toThrow();
    });

    test('should export valid log entries', async () => {
      logger.info('TestContext', 'Test message', { data: 'value' });

      const exported = await logger.exportLogs();
      const parsed: LogEntry[] = JSON.parse(exported);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBeGreaterThan(0);
      expect(parsed[0]).toHaveProperty('timestamp');
      expect(parsed[0]).toHaveProperty('level');
      expect(parsed[0]).toHaveProperty('levelName');
      expect(parsed[0]).toHaveProperty('context');
      expect(parsed[0]).toHaveProperty('message');
    });
  });

  describe('Download Logs', () => {
    test('should create downloadable blob', async () => {
      logger.info('Test', 'Message for download');

      // Mock DOM elements
      const mockAnchor = {
        href: '',
        download: '',
        click: jest.fn(),
      };
      jest.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);

      const mockURL = {
        createObjectURL: jest.fn().mockReturnValue('blob:mock-url'),
        revokeObjectURL: jest.fn(),
      };
      global.URL = mockURL as any;

      await logger.downloadLogs();

      expect(mockAnchor.click).toHaveBeenCalled();
      expect(mockAnchor.download).toMatch(/extension-logs-.*\.json/);
      expect(mockURL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });
  });

  describe('Statistics', () => {
    test('should return log statistics', async () => {
      logger.debug('Test', 'Debug');
      logger.info('Test', 'Info');
      logger.warn('Test', 'Warn');
      logger.error('Test', 'Error');

      const stats = await logger.getStats();

      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('byLevel');
      expect(stats.total).toBeGreaterThan(0);
      expect(stats.byLevel).toHaveProperty('DEBUG');
      expect(stats.byLevel).toHaveProperty('INFO');
      expect(stats.byLevel).toHaveProperty('WARN');
      expect(stats.byLevel).toHaveProperty('ERROR');
    });

    test('should include oldest and newest log timestamps', async () => {
      logger.info('Test', 'First message');

      jest.advanceTimersByTime(1000);

      logger.info('Test', 'Second message');

      const stats = await logger.getStats();

      expect(stats.oldestLog).toBeDefined();
      expect(stats.newestLog).toBeDefined();
      expect(stats.oldestLog).not.toBe(stats.newestLog);
    });

    test('should handle empty logs', async () => {
      await logger.clearLogs();

      const stats = await logger.getStats();

      expect(stats.total).toBe(0);
      expect(stats.oldestLog).toBeUndefined();
      expect(stats.newestLog).toBeUndefined();
    });
  });

  describe('Auto-flush to Storage', () => {
    test('should flush logs to storage periodically', async () => {
      logger.info('Test', 'Message');

      // Fast-forward past flush interval (5000ms)
      jest.advanceTimersByTime(5000);

      // Run all pending timers
      jest.runAllTimers();

      // Wait for promises
      await Promise.resolve();

      expect(mockChromeStorage.set).toHaveBeenCalled();
    });

    test('should not flush when persistToStorage is false', async () => {
      await logger.updateConfig({ persistToStorage: false });
      mockChromeStorage.set.mockClear();

      logger.info('Test', 'Message');

      jest.advanceTimersByTime(5000);
      jest.runAllTimers();
      await Promise.resolve();

      expect(mockChromeStorage.set).not.toHaveBeenCalled();
    });
  });

  describe('Max Entries Limit', () => {
    test('should trim logs when exceeding max entries', async () => {
      await logger.updateConfig({ maxEntries: 10 });

      // Add more logs than max
      for (let i = 0; i < 15; i++) {
        logger.info('Test', `Message ${i}`);
      }

      // Trigger flush
      jest.advanceTimersByTime(5000);
      jest.runAllTimers();
      await Promise.resolve();

      const logs = await logger.getLogs();
      expect(logs.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Cleanup', () => {
    test('should flush logs on cleanup', async () => {
      logger.info('Test', 'Message before cleanup');

      await logger.cleanup();

      expect(mockChromeStorage.set).toHaveBeenCalled();
    });

    test('should clear flush timer on cleanup', async () => {
      await logger.cleanup();

      // After cleanup, timer should not trigger flush
      mockChromeStorage.set.mockClear();
      jest.advanceTimersByTime(5000);

      expect(mockChromeStorage.set).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle storage errors gracefully on save', async () => {
      mockChromeStorage.set.mockRejectedValue(new Error('Storage error'));

      expect(() => logger.info('Test', 'Message')).not.toThrow();

      // Trigger flush
      jest.advanceTimersByTime(5000);
      jest.runAllTimers();
      await Promise.resolve();
    });

    test('should handle storage errors gracefully on load', async () => {
      mockChromeStorage.get.mockRejectedValue(new Error('Storage error'));

      await expect(logger.getLogs()).resolves.toBeDefined();
    });

    test('should handle storage errors gracefully on clear', async () => {
      mockChromeStorage.remove.mockRejectedValue(new Error('Storage error'));

      await expect(logger.clearLogs()).resolves.not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    test('should handle very long messages', () => {
      const longMessage = 'A'.repeat(10000);
      expect(() => logger.info('Test', longMessage)).not.toThrow();
    });

    test('should handle special characters in messages', () => {
      const specialMessage = 'Message with 🚀 emojis and special chars: <>&"\'';
      expect(() => logger.info('Test', specialMessage)).not.toThrow();
    });

    test('should handle circular references in data', () => {
      const circularData: any = { foo: 'bar' };
      circularData.self = circularData;

      expect(() => logger.info('Test', 'Message', circularData)).not.toThrow();
    });

    test('should handle undefined and null data', () => {
      expect(() => logger.info('Test', 'Message', undefined)).not.toThrow();
      expect(() => logger.info('Test', 'Message', null)).not.toThrow();
    });

    test('should handle empty context and message', () => {
      expect(() => logger.info('', '')).not.toThrow();
    });

    test('should handle rapid consecutive logging', () => {
      for (let i = 0; i < 1000; i++) {
        logger.debug('Test', `Message ${i}`);
      }

      expect(console.debug).toHaveBeenCalledTimes(1000);
    });
  });

  describe('Log Entry Structure', () => {
    test('should create log entries with correct structure', async () => {
      logger.info('TestContext', 'Test message', { data: 'value' });

      const logs = await logger.getLogs();
      const entry = logs[logs.length - 1];

      expect(entry).toHaveProperty('timestamp');
      expect(entry).toHaveProperty('level');
      expect(entry).toHaveProperty('levelName');
      expect(entry).toHaveProperty('context');
      expect(entry).toHaveProperty('message');
      expect(entry.timestamp).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/); // ISO format
      expect(entry.level).toBe(LogLevel.INFO);
      expect(entry.levelName).toBe('INFO');
      expect(entry.context).toBe('TestContext');
      expect(entry.message).toBe('Test message');
    });
  });
});
