/**
 * Logger Types
 *
 * Defines the interface for structured logging.
 */

export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

/**
 * Log context for enriching log entries
 */
export interface LogContext {
  correlationId?: string;
  userId?: string;
  feature?: string;
  operation?: string;
  [key: string]: unknown;
}

/**
 * Logger interface
 */
export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, error?: Error | unknown, context?: LogContext): void;
  trackOperation<T>(name: string, operation: () => Promise<T>): Promise<T>;
  setCorrelationId(id: string): void;
  child(context: LogContext): Logger;
}

/**
 * Structured log entry
 */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  correlationId: string;
  feature?: string;
  operation?: string;
  userId?: string;
  durationMs?: number;
  error?: {
    message: string;
    name: string;
    stack?: string;
  };
  [key: string]: unknown;
}
