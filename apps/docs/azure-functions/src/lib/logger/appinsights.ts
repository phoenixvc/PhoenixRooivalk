/**
 * Application Insights Logger Implementation
 *
 * Provides structured logging with Azure Application Insights.
 * Includes distributed tracing, performance tracking, and exception logging.
 */

import { Logger, LogContext, LogLevel } from "./types";
import { generateCorrelationId } from "./utils";

// Application Insights types (we'll use dynamic import to avoid hard dependency)
interface TelemetryClient {
  trackTrace(telemetry: {
    message: string;
    severity: number;
    properties?: Record<string, unknown>;
  }): void;
  trackException(telemetry: {
    exception: Error;
    properties?: Record<string, unknown>;
  }): void;
  trackDependency(telemetry: {
    name: string;
    duration: number;
    success: boolean;
    dependencyTypeName: string;
    data?: string;
    properties?: Record<string, unknown>;
  }): void;
  trackMetric(telemetry: {
    name: string;
    value: number;
    properties?: Record<string, unknown>;
  }): void;
}

// Severity levels matching Application Insights
const SeverityLevel = {
  Verbose: 0,
  Information: 1,
  Warning: 2,
  Error: 3,
  Critical: 4,
};

export class AppInsightsLogger implements Logger {
  private client: TelemetryClient;
  private baseContext: LogContext;
  private correlationId: string;

  constructor(client: TelemetryClient, context: LogContext = {}) {
    this.client = client;
    this.baseContext = context;
    this.correlationId = context.correlationId || generateCorrelationId();
  }

  private mapSeverity(level: LogLevel): number {
    switch (level) {
      case LogLevel.DEBUG:
        return SeverityLevel.Verbose;
      case LogLevel.INFO:
        return SeverityLevel.Information;
      case LogLevel.WARN:
        return SeverityLevel.Warning;
      case LogLevel.ERROR:
        return SeverityLevel.Error;
      default:
        return SeverityLevel.Information;
    }
  }

  private getProperties(context?: LogContext): Record<string, unknown> {
    return {
      ...this.baseContext,
      ...context,
      correlationId: this.correlationId,
      timestamp: new Date().toISOString(),
    };
  }

  debug(message: string, context?: LogContext): void {
    this.client.trackTrace({
      message,
      severity: this.mapSeverity(LogLevel.DEBUG),
      properties: this.getProperties(context),
    });
  }

  info(message: string, context?: LogContext): void {
    this.client.trackTrace({
      message,
      severity: this.mapSeverity(LogLevel.INFO),
      properties: this.getProperties(context),
    });
  }

  warn(message: string, context?: LogContext): void {
    this.client.trackTrace({
      message,
      severity: this.mapSeverity(LogLevel.WARN),
      properties: this.getProperties(context),
    });
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const properties = this.getProperties(context);

    // Track as trace
    this.client.trackTrace({
      message,
      severity: this.mapSeverity(LogLevel.ERROR),
      properties: {
        ...properties,
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });

    // Also track as exception if we have an Error object
    if (error instanceof Error) {
      this.client.trackException({
        exception: error,
        properties: {
          ...properties,
          contextMessage: message,
        },
      });
    }
  }

  async trackOperation<T>(name: string, operation: () => Promise<T>): Promise<T> {
    const startTime = Date.now();

    try {
      const result = await operation();
      const duration = Date.now() - startTime;

      this.client.trackDependency({
        name,
        duration,
        success: true,
        dependencyTypeName: "InProc",
        properties: {
          correlationId: this.correlationId,
          ...this.baseContext,
        },
      });

      // Also track as metric for aggregation
      this.client.trackMetric({
        name: `operation.${name}.duration`,
        value: duration,
        properties: {
          correlationId: this.correlationId,
          success: "true",
        },
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      this.client.trackDependency({
        name,
        duration,
        success: false,
        dependencyTypeName: "InProc",
        data: error instanceof Error ? error.message : String(error),
        properties: {
          correlationId: this.correlationId,
          ...this.baseContext,
        },
      });

      this.client.trackMetric({
        name: `operation.${name}.duration`,
        value: duration,
        properties: {
          correlationId: this.correlationId,
          success: "false",
        },
      });

      throw error;
    }
  }

  setCorrelationId(id: string): void {
    this.correlationId = id;
  }

  child(context: LogContext): Logger {
    return new AppInsightsLogger(this.client, {
      ...this.baseContext,
      ...context,
      correlationId: this.correlationId,
    });
  }
}
