/**
 * Logger Utility
 * Provides comprehensive logging with persistence and export capabilities
 * Logs are stored in Chrome storage for debugging and troubleshooting
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  levelName: string;
  context: string;
  message: string;
  data?: any;
}

export interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
  maxEntries: number;
  persistToStorage: boolean;
  consoleOutput: boolean;
}

class Logger {
  private static instance: Logger;
  private config: LoggerConfig = {
    enabled: true,
    level: LogLevel.DEBUG,
    maxEntries: 1000, // Maximum number of log entries to keep
    persistToStorage: true,
    consoleOutput: true,
  };

  private readonly STORAGE_KEY = 'extension_logs';
  private readonly CONFIG_KEY = 'logger_config';
  private logBuffer: LogEntry[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private readonly FLUSH_INTERVAL = 5000; // Flush logs every 5 seconds

  private constructor() {
    this.loadConfig();
    this.loadLogs();
    this.startAutoFlush();
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Load logger configuration from storage
   */
  private async loadConfig(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(this.CONFIG_KEY);
      if (result[this.CONFIG_KEY]) {
        this.config = { ...this.config, ...result[this.CONFIG_KEY] };
      }
    } catch (error) {
      console.error('Failed to load logger config:', error);
    }
  }

  /**
   * Save logger configuration to storage
   */
  private async saveConfig(): Promise<void> {
    try {
      await chrome.storage.local.set({ [this.CONFIG_KEY]: this.config });
    } catch (error) {
      console.error('Failed to save logger config:', error);
    }
  }

  /**
   * Load existing logs from storage
   */
  private async loadLogs(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(this.STORAGE_KEY);
      if (result[this.STORAGE_KEY]) {
        this.logBuffer = result[this.STORAGE_KEY];
      }
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  }

  /**
   * Start auto-flush timer
   */
  private startAutoFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.FLUSH_INTERVAL);
  }

  /**
   * Flush log buffer to storage
   */
  private async flush(): Promise<void> {
    if (!this.config.persistToStorage || this.logBuffer.length === 0) {
      return;
    }

    try {
      // Trim logs if exceeding max entries
      if (this.logBuffer.length > this.config.maxEntries) {
        this.logBuffer = this.logBuffer.slice(-this.config.maxEntries);
      }

      await chrome.storage.local.set({ [this.STORAGE_KEY]: this.logBuffer });
    } catch (error) {
      console.error('Failed to flush logs:', error);
    }
  }

  /**
   * Create a log entry
   */
  private createLogEntry(level: LogLevel, context: string, message: string, data?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      levelName: LogLevel[level],
      context,
      message,
      data,
    };
  }

  /**
   * Add a log entry
   */
  private log(level: LogLevel, context: string, message: string, data?: any): void {
    if (!this.config.enabled || level < this.config.level) {
      return;
    }

    const entry = this.createLogEntry(level, context, message, data);
    this.logBuffer.push(entry);

    // Console output
    if (this.config.consoleOutput) {
      const consoleMethod = this.getConsoleMethod(level);
      const prefix = `[${entry.timestamp}] [${entry.levelName}] [${context}]`;

      if (data !== undefined) {
        consoleMethod(prefix, message, data);
      } else {
        consoleMethod(prefix, message);
      }
    }
  }

  /**
   * Get appropriate console method for log level
   */
  private getConsoleMethod(level: LogLevel): (...args: any[]) => void {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug.bind(console);
      case LogLevel.INFO:
        return console.info.bind(console);
      case LogLevel.WARN:
        return console.warn.bind(console);
      case LogLevel.ERROR:
        return console.error.bind(console);
      default:
        return console.log.bind(console);
    }
  }

  /**
   * Debug level logging
   */
  public debug(context: string, message: string, data?: any): void {
    this.log(LogLevel.DEBUG, context, message, data);
  }

  /**
   * Info level logging
   */
  public info(context: string, message: string, data?: any): void {
    this.log(LogLevel.INFO, context, message, data);
  }

  /**
   * Warning level logging
   */
  public warn(context: string, message: string, data?: any): void {
    this.log(LogLevel.WARN, context, message, data);
  }

  /**
   * Error level logging
   */
  public error(context: string, message: string, data?: any): void {
    this.log(LogLevel.ERROR, context, message, data);
  }

  /**
   * Get all logs
   */
  public async getLogs(): Promise<LogEntry[]> {
    await this.flush();
    return [...this.logBuffer];
  }

  /**
   * Get logs filtered by level
   */
  public async getLogsByLevel(level: LogLevel): Promise<LogEntry[]> {
    const logs = await this.getLogs();
    return logs.filter(log => log.level >= level);
  }

  /**
   * Get logs filtered by context
   */
  public async getLogsByContext(context: string): Promise<LogEntry[]> {
    const logs = await this.getLogs();
    return logs.filter(log => log.context === context);
  }

  /**
   * Clear all logs
   */
  public async clearLogs(): Promise<void> {
    this.logBuffer = [];
    try {
      await chrome.storage.local.remove(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  }

  /**
   * Export logs as JSON string
   */
  public async exportLogs(): Promise<string> {
    const logs = await this.getLogs();
    return JSON.stringify(logs, null, 2);
  }

  /**
   * Export logs as downloadable file
   */
  public async downloadLogs(): Promise<void> {
    const logsJson = await this.exportLogs();
    const blob = new Blob([logsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `extension-logs-${timestamp}.json`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
  }

  /**
   * Update logger configuration
   */
  public async updateConfig(newConfig: Partial<LoggerConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    await this.saveConfig();
  }

  /**
   * Get current configuration
   */
  public getConfig(): LoggerConfig {
    return { ...this.config };
  }

  /**
   * Get log statistics
   */
  public async getStats(): Promise<{
    total: number;
    byLevel: Record<string, number>;
    oldestLog?: string;
    newestLog?: string;
  }> {
    const logs = await this.getLogs();

    const byLevel: Record<string, number> = {
      DEBUG: 0,
      INFO: 0,
      WARN: 0,
      ERROR: 0,
    };

    logs.forEach(log => {
      byLevel[log.levelName]++;
    });

    return {
      total: logs.length,
      byLevel,
      oldestLog: logs.length > 0 ? logs[0].timestamp : undefined,
      newestLog: logs.length > 0 ? logs[logs.length - 1].timestamp : undefined,
    };
  }

  /**
   * Cleanup on extension unload
   */
  public async cleanup(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    await this.flush();
  }
}

// Export singleton instance
const logger = Logger.getInstance();

// Cleanup on window unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    logger.cleanup();
  });
}

export default logger;
