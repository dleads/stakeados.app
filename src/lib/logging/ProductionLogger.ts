/**
 * Production logging system with structured logging and log levels
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4,
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  requestId?: string;
  userId?: string;
  sessionId?: string;
}

interface LoggerConfig {
  level: LogLevel;
  format: 'json' | 'text';
  enableConsole: boolean;
  enableFile: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
  maxLogSize: number;
  rotateDaily: boolean;
}

class ProductionLogger {
  private config: LoggerConfig;
  private logBuffer: LogEntry[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: this.parseLogLevel(process.env.LOG_LEVEL) || LogLevel.INFO,
      format: (process.env.LOG_FORMAT as 'json' | 'text') || 'json',
      enableConsole: process.env.NODE_ENV !== 'production',
      enableFile: process.env.NODE_ENV === 'production',
      enableRemote: !!process.env.LOG_REMOTE_ENDPOINT,
      remoteEndpoint: process.env.LOG_REMOTE_ENDPOINT,
      maxLogSize: 1000,
      rotateDaily: true,
      ...config,
    };

    this.startFlushInterval();
  }

  private parseLogLevel(level?: string): LogLevel | undefined {
    if (!level) return undefined;

    const levelMap: Record<string, LogLevel> = {
      error: LogLevel.ERROR,
      warn: LogLevel.WARN,
      info: LogLevel.INFO,
      debug: LogLevel.DEBUG,
      trace: LogLevel.TRACE,
    };

    return levelMap[level.toLowerCase()];
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.config.level;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    // Add request context if available
    if (typeof window === 'undefined' && global.requestContext) {
      entry.requestId = global.requestContext.requestId;
      entry.userId = global.requestContext.userId;
      entry.sessionId = global.requestContext.sessionId;
    }

    return entry;
  }

  private formatLogEntry(entry: LogEntry): string {
    if (this.config.format === 'json') {
      return JSON.stringify(entry);
    }

    const levelName = LogLevel[entry.level];
    const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
    const errorStr = entry.error ? ` ERROR: ${entry.error.message}` : '';

    return `[${entry.timestamp}] ${levelName}: ${entry.message}${contextStr}${errorStr}`;
  }

  private async writeLog(entry: LogEntry) {
    const formattedLog = this.formatLogEntry(entry);

    // Console output
    if (this.config.enableConsole) {
      const consoleMethod =
        entry.level <= LogLevel.ERROR
          ? 'error'
          : entry.level <= LogLevel.WARN
            ? 'warn'
            : 'log';
      console[consoleMethod](formattedLog);
    }

    // Buffer for batch processing
    this.logBuffer.push(entry);

    // Flush if buffer is full
    if (this.logBuffer.length >= this.config.maxLogSize) {
      await this.flush();
    }
  }

  private startFlushInterval() {
    // Flush logs every 30 seconds
    this.flushInterval = setInterval(() => {
      this.flush();
    }, 30000);
  }

  private async flush() {
    if (this.logBuffer.length === 0) return;

    const logsToFlush = [...this.logBuffer];
    this.logBuffer = [];

    // Send to remote endpoint
    if (this.config.enableRemote && this.config.remoteEndpoint) {
      try {
        await fetch(this.config.remoteEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.LOG_API_KEY || ''}`,
          },
          body: JSON.stringify({
            logs: logsToFlush,
            source: 'stakeados-admin',
            environment: process.env.NODE_ENV,
          }),
        });
      } catch (error) {
        console.error('Failed to send logs to remote endpoint:', error);
      }
    }

    // Write to file (in production)
    if (this.config.enableFile && typeof window === 'undefined') {
      try {
        const fs = require('fs').promises;
        const path = require('path');

        const logDir = path.join(process.cwd(), 'logs');
        const logFile = path.join(
          logDir,
          `app-${new Date().toISOString().split('T')[0]}.log`
        );

        // Ensure log directory exists
        await fs.mkdir(logDir, { recursive: true });

        // Append logs to file
        const logContent =
          logsToFlush.map(log => this.formatLogEntry(log)).join('\n') + '\n';
        await fs.appendFile(logFile, logContent);
      } catch (error) {
        console.error('Failed to write logs to file:', error);
      }
    }
  }

  // Public logging methods
  error(message: string, context?: Record<string, any>, error?: Error) {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    this.writeLog(this.createLogEntry(LogLevel.ERROR, message, context, error));
  }

  warn(message: string, context?: Record<string, any>) {
    if (!this.shouldLog(LogLevel.WARN)) return;
    this.writeLog(this.createLogEntry(LogLevel.WARN, message, context));
  }

  info(message: string, context?: Record<string, any>) {
    if (!this.shouldLog(LogLevel.INFO)) return;
    this.writeLog(this.createLogEntry(LogLevel.INFO, message, context));
  }

  debug(message: string, context?: Record<string, any>) {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    this.writeLog(this.createLogEntry(LogLevel.DEBUG, message, context));
  }

  trace(message: string, context?: Record<string, any>) {
    if (!this.shouldLog(LogLevel.TRACE)) return;
    this.writeLog(this.createLogEntry(LogLevel.TRACE, message, context));
  }

  // Request logging helpers
  logRequest(
    method: string,
    url: string,
    statusCode: number,
    responseTime: number,
    context?: Record<string, any>
  ) {
    this.info('HTTP Request', {
      method,
      url,
      statusCode,
      responseTime,
      ...context,
    });
  }

  logError(error: Error, context?: Record<string, any>) {
    this.error('Application Error', context, error);
  }

  logPerformance(
    operation: string,
    duration: number,
    context?: Record<string, any>
  ) {
    this.info('Performance Metric', {
      operation,
      duration,
      ...context,
    });
  }

  // Cleanup
  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flush(); // Final flush
  }
}

// Global logger instance
export const logger = new ProductionLogger();

// Request context middleware helper
export function withRequestContext<T extends any[], R>(
  fn: (...args: T) => R,
  context: { requestId?: string; userId?: string; sessionId?: string }
) {
  return (...args: T): R => {
    const oldContext = global.requestContext;
    global.requestContext = context;

    try {
      return fn(...args);
    } finally {
      global.requestContext = oldContext;
    }
  };
}

export default ProductionLogger;
