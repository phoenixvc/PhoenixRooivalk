/**
 * Console Logger Implementation
 *
 * Provides structured JSON logging to console.
 * Used as fallback when Application Insights is not configured.
 */

import { Logger, LogContext, LogLevel, LogEntry } from "./types";
import { generateCorrelationId } from "./utils";

export class ConsoleLogger implements Logger {
  private baseContext: LogContext;
  private correlationId: string;

  constructor(context: LogContext = {}) {
    this.baseContext = context;
    this.correlationId = context.correlationId || generateCorrelationId();
  }

  private createEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error | unknown,
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      correlationId: this.correlationId,
      ...this.baseContext,
      ...context,
    };

    if (error) {
      if (error instanceof Error) {
        entry.error = {
          message: error.message,
          name: error.name,
          stack: error.stack,
        };
      } else {
        entry.error = {
          message: String(error),
          name: "UnknownError",
        };
      }
    }

    return entry;
  }

  private log(level: LogLevel, entry: LogEntry): void {
    const jsonOutput = JSON.stringify(entry);

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(jsonOutput);
        break;
      case LogLevel.INFO:
        console.info(jsonOutput);
        break;
      case LogLevel.WARN:
        console.warn(jsonOutput);
        break;
      case LogLevel.ERROR:
        console.error(jsonOutput);
        break;
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log(
      LogLevel.DEBUG,
      this.createEntry(LogLevel.DEBUG, message, context),
    );
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, this.createEntry(LogLevel.INFO, message, context));
  }

  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, this.createEntry(LogLevel.WARN, message, context));
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    this.log(
      LogLevel.ERROR,
      this.createEntry(LogLevel.ERROR, message, context, error),
    );
  }

  async trackOperation<T>(
    name: string,
    operation: () => Promise<T>,
  ): Promise<T> {
    const startTime = Date.now();

    try {
      const result = await operation();
      const durationMs = Date.now() - startTime;

      this.info(`Operation completed: ${name}`, {
        operation: name,
        durationMs,
        success: true,
      });

      return result;
    } catch (error) {
      const durationMs = Date.now() - startTime;

      this.error(`Operation failed: ${name}`, error, {
        operation: name,
        durationMs,
        success: false,
      });

      throw error;
    }
  }

  setCorrelationId(id: string): void {
    this.correlationId = id;
  }

  child(context: LogContext): Logger {
    return new ConsoleLogger({
      ...this.baseContext,
      ...context,
      correlationId: this.correlationId,
    });
  }
}
