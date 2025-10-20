import { env } from '@/lib/env';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  userId?: string;
  requestId?: string;
  error?: Error;
}

class Logger {
  private logLevel: LogLevel;

  constructor() {
    // Set log level based on environment
    switch (env.NODE_ENV) {
      case 'production':
        this.logLevel = LogLevel.INFO;
        break;
      case 'test':
        this.logLevel = LogLevel.ERROR;
        break;
      default:
        this.logLevel = LogLevel.DEBUG;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  private formatLogEntry(entry: LogEntry): string {
    const logData = {
      ...entry,
      service: 'crm-restaurant',
      version: env.APP_VERSION,
      environment: env.NODE_ENV,
    };

    // In production, format as JSON for structured logging
    if (env.NODE_ENV === 'production') {
      return JSON.stringify(logData);
    }

    // In development, format for readability
    const timestamp = new Date(entry.timestamp).toISOString();
    const levelName = LogLevel[entry.level];
    const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
    const errorStr = entry.error ? ` ${entry.error.stack || entry.error.message}` : '';
    
    return `[${timestamp}] ${levelName}: ${entry.message}${contextStr}${errorStr}`;
  }

  private writeLog(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) {
      return;
    }

    const formattedLog = this.formatLogEntry(entry);

    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(formattedLog);
        break;
      case LogLevel.WARN:
        console.warn(formattedLog);
        break;
      case LogLevel.INFO:
        console.info(formattedLog);
        break;
      case LogLevel.DEBUG:
        console.debug(formattedLog);
        break;
    }
  }

  error(message: string, context?: Record<string, any>, error?: Error): void {
    this.writeLog({
      level: LogLevel.ERROR,
      message,
      timestamp: new Date().toISOString(),
      context,
      error,
    });
  }

  warn(message: string, context?: Record<string, any>): void {
    this.writeLog({
      level: LogLevel.WARN,
      message,
      timestamp: new Date().toISOString(),
      context,
    });
  }

  info(message: string, context?: Record<string, any>): void {
    this.writeLog({
      level: LogLevel.INFO,
      message,
      timestamp: new Date().toISOString(),
      context,
    });
  }

  debug(message: string, context?: Record<string, any>): void {
    this.writeLog({
      level: LogLevel.DEBUG,
      message,
      timestamp: new Date().toISOString(),
      context,
    });
  }

  // Add user context to logs
  withUser(userId: string): Logger {
    const userLogger = new Logger();
    const originalWriteLog = userLogger.writeLog.bind(userLogger);
    
    userLogger.writeLog = (entry: LogEntry) => {
      originalWriteLog({ ...entry, userId });
    };
    
    return userLogger;
  }

  // Add request context to logs
  withRequest(requestId: string): Logger {
    const requestLogger = new Logger();
    const originalWriteLog = requestLogger.writeLog.bind(requestLogger);
    
    requestLogger.writeLog = (entry: LogEntry) => {
      originalWriteLog({ ...entry, requestId });
    };
    
    return requestLogger;
  }
}

// Create and export the default logger instance
export const logger = new Logger();

// Export convenience functions
export const logError = (message: string, context?: Record<string, any>, error?: Error) => 
  logger.error(message, context, error);

export const logWarn = (message: string, context?: Record<string, any>) => 
  logger.warn(message, context);

export const logInfo = (message: string, context?: Record<string, any>) => 
  logger.info(message, context);

export const logDebug = (message: string, context?: Record<string, any>) => 
  logger.debug(message, context);