/**
 * Logger Module
 *
 * Provides structured logging with support for:
 * - Azure Application Insights (production)
 * - Console JSON logging (development/fallback)
 * - Correlation ID propagation
 * - Context enrichment
 * - Operation tracking
 */

import { HttpRequest } from "@azure/functions";
import { Logger, LogContext, LogLevel } from "./types";
import { ConsoleLogger } from "./console";
import { AppInsightsLogger } from "./appinsights";
import { generateCorrelationId } from "./utils";

// Module-level state
let appInsightsClient: unknown = null;
let initialized = false;

/**
 * Initialize logging
 *
 * Call this once at application startup.
 * If Application Insights connection string is configured, it will be used.
 * Otherwise, falls back to console logging.
 */
export async function initializeLogging(): Promise<void> {
  if (initialized) return;

  const connectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;

  if (connectionString) {
    try {
      // Dynamic import to avoid hard dependency
      const appInsights = await import("applicationinsights");

      appInsights
        .setup(connectionString)
        .setAutoCollectRequests(true)
        .setAutoCollectPerformance(true, true)
        .setAutoCollectExceptions(true)
        .setAutoCollectDependencies(true)
        .setAutoDependencyCorrelation(true)
        .setSendLiveMetrics(false) // Disable for cost savings
        .start();

      appInsightsClient = appInsights.defaultClient;

      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: "info",
          message: "Application Insights initialized",
        }),
      );
    } catch (error) {
      console.warn(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: "warn",
          message: "Failed to initialize Application Insights, using console logger",
          error: error instanceof Error ? error.message : String(error),
        }),
      );
    }
  } else {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "info",
        message: "Application Insights not configured, using console logger",
      }),
    );
  }

  initialized = true;
}

/**
 * Create a logger instance
 *
 * @param context - Initial context to include in all log entries
 * @returns Logger instance
 */
export function createLogger(context: LogContext = {}): Logger {
  if (appInsightsClient) {
    return new AppInsightsLogger(appInsightsClient as Parameters<typeof AppInsightsLogger>[0], context);
  }
  return new ConsoleLogger(context);
}

/**
 * Create a logger for an HTTP request
 *
 * Automatically extracts correlation ID from headers or generates one.
 *
 * @param request - HTTP request
 * @param feature - Feature/module name for grouping logs
 * @returns Logger instance with request context
 */
export function createRequestLogger(request: HttpRequest, feature: string): Logger {
  const correlationId =
    request.headers.get("x-correlation-id") ||
    request.headers.get("x-request-id") ||
    generateCorrelationId();

  // Extract user ID from auth header if present (already validated elsewhere)
  let userId: string | undefined;
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const token = authHeader.substring(7);
      const [, payload] = token.split(".");
      if (payload) {
        const decoded = JSON.parse(Buffer.from(payload, "base64url").toString());
        userId = decoded.sub || decoded.oid;
      }
    } catch {
      // Ignore token parsing errors for logging purposes
    }
  }

  return createLogger({
    feature,
    correlationId,
    userId,
    method: request.method,
    url: request.url,
  });
}

/**
 * Create a child logger for a specific operation
 *
 * @param parent - Parent logger
 * @param operation - Operation name
 * @param additionalContext - Additional context
 * @returns Child logger
 */
export function createOperationLogger(
  parent: Logger,
  operation: string,
  additionalContext: LogContext = {},
): Logger {
  return parent.child({ operation, ...additionalContext });
}

// Re-export types and utilities
export { Logger, LogContext, LogLevel } from "./types";
export { generateCorrelationId, sanitizeLogData, truncateForLog } from "./utils";
