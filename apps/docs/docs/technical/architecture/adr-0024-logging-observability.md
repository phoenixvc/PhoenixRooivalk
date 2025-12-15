---
id: adr-0024-logging-observability
title: "ADR 0024: Logging and Observability Strategy"
sidebar_label: "ADR 0024: Logging Strategy"
difficulty: intermediate
estimated_reading_time: 8
points: 30
tags:
  - technical
  - architecture
  - logging
  - observability
  - monitoring
  - azure
prerequisites:
  - adr-0012-runtime-functions
---

# ADR 0024: Logging and Observability Strategy

**Date**: 2025-11-30 **Status**: Proposed

---

## Executive Summary

1. **Problem**: Current Azure Functions use `console.log/warn/error` which lacks
   structured logging, correlation IDs, and centralized monitoring.
2. **Decision**: Implement Azure Application Insights with structured logging
   via a custom logger wrapper.
3. **Trade-off**: Slight increase in complexity and Azure costs, but gain
   comprehensive observability.

---

## Context

Our Azure Functions currently rely on basic `console` statements for logging:

```typescript
console.warn("RAG search failed:", error);
console.error("Token validation failed:", error);
```

This approach has several limitations:

1. **No structured logging** - Messages are plain text, making parsing and
   analysis difficult
2. **No correlation IDs** - Cannot trace requests across function invocations
3. **No centralized monitoring** - Logs are scattered across function instances
4. **No alerting** - Cannot set up automated alerts on error patterns
5. **Limited debugging** - Cannot query or aggregate log data

Key stakeholders:

- **DevOps**: Need centralized monitoring and alerting
- **Developers**: Need debugging capabilities and error tracing
- **Security**: Need audit trails and incident investigation support

Related decisions:

- [ADR 0012: Runtime Functions](./adr-0012-runtime-functions.md) - Azure
  Functions as runtime
- [ADR 0023: AI Observability](./adr-0023-ai-observability.md) - AI-specific
  monitoring

---

## Options Considered

### Option 1: Azure Application Insights [✅ Selected]

| Aspect          | Details                                                                                                                         |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Description** | Microsoft's APM solution, native to Azure Functions with auto-instrumentation                                                   |
| **Pros**        | Native Azure integration, distributed tracing, rich querying with KQL, alerting, dashboards, cost-effective for Azure workloads |
| **Cons**        | Azure lock-in, learning curve for KQL, data retention costs                                                                     |

### Option 2: OpenTelemetry + Grafana/Loki [❌ Rejected]

| Aspect          | Details                                                                                      |
| --------------- | -------------------------------------------------------------------------------------------- |
| **Description** | Vendor-neutral observability with OpenTelemetry SDK exporting to Grafana stack               |
| **Pros**        | Vendor-neutral, portable, rich ecosystem, open source                                        |
| **Cons**        | Higher operational overhead, need to host Grafana/Loki, more complex setup, additional costs |

### Option 3: Winston/Pino + External Service [❌ Rejected]

| Aspect          | Details                                                                                 |
| --------------- | --------------------------------------------------------------------------------------- |
| **Description** | Popular Node.js logging libraries with external log aggregation (Datadog, Splunk, etc.) |
| **Pros**        | Flexible, feature-rich libraries, works anywhere                                        |
| **Cons**        | External service costs, integration complexity, not native to Azure                     |

### Option 4: Enhanced Console Logging [❌ Rejected]

| Aspect          | Details                                                         |
| --------------- | --------------------------------------------------------------- |
| **Description** | Wrap console methods with structured JSON output                |
| **Pros**        | Simple, no dependencies, works immediately                      |
| **Cons**        | No centralized aggregation, no alerting, no distributed tracing |

---

## Decision

**We will use Azure Application Insights with a custom structured logger wrapper
that provides:**

1. Structured logging with consistent fields
2. Automatic correlation ID propagation
3. Log levels (debug, info, warn, error)
4. Context enrichment (userId, feature, operation)
5. Performance tracking for operations
6. Exception tracking with stack traces

---

## Rationale

### Why Application Insights Over Alternatives?

| Factor                   | App Insights  | OpenTelemetry+Grafana  | Winston+External | Enhanced Console |
| ------------------------ | ------------- | ---------------------- | ---------------- | ---------------- |
| **Azure Integration**    | Native        | Requires setup         | Manual           | None             |
| **Setup Complexity**     | Low           | High                   | Medium           | Very Low         |
| **Operational Overhead** | Low (managed) | High (self-hosted)     | Medium           | None             |
| **Distributed Tracing**  | Built-in      | Built-in               | Manual           | None             |
| **Cost**                 | Pay-per-use   | Infrastructure + labor | External service | Free             |
| **Alerting**             | Built-in      | Requires config        | External         | None             |

Given that we're already committed to Azure (ADR-0012), Application Insights
provides the best balance of features, integration, and operational simplicity.

---

## Implementation

### 1. Logger Interface

```typescript
// src/lib/logger.ts

export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

export interface LogContext {
  correlationId?: string;
  userId?: string;
  feature?: string;
  operation?: string;
  [key: string]: unknown;
}

export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, error?: Error, context?: LogContext): void;
  trackOperation<T>(name: string, operation: () => Promise<T>): Promise<T>;
  setCorrelationId(id: string): void;
  child(context: LogContext): Logger;
}
```

### 2. Application Insights Implementation

```typescript
// src/lib/logger/appinsights.ts

import * as appInsights from "applicationinsights";
import { Logger, LogContext, LogLevel } from "./types";

export class AppInsightsLogger implements Logger {
  private client: appInsights.TelemetryClient;
  private baseContext: LogContext;
  private correlationId: string;

  constructor(context: LogContext = {}) {
    this.client = appInsights.defaultClient;
    this.baseContext = context;
    this.correlationId = context.correlationId || generateCorrelationId();
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    context?: LogContext,
  ): void {
    const enrichedContext = {
      ...this.baseContext,
      ...context,
      correlationId: this.correlationId,
      timestamp: new Date().toISOString(),
      level,
    };

    this.client.trackTrace({
      message,
      severity: this.mapSeverity(level),
      properties: enrichedContext,
    });
  }

  debug(message: string, context?: LogContext): void {
    this.formatMessage(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext): void {
    this.formatMessage(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.formatMessage(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    if (error) {
      this.client.trackException({
        exception: error,
        properties: {
          message,
          ...this.baseContext,
          ...context,
          correlationId: this.correlationId,
        },
      });
    }
    this.formatMessage(LogLevel.ERROR, message, context);
  }

  async trackOperation<T>(
    name: string,
    operation: () => Promise<T>,
  ): Promise<T> {
    const startTime = Date.now();
    try {
      const result = await operation();
      this.client.trackDependency({
        name,
        duration: Date.now() - startTime,
        success: true,
        dependencyTypeName: "InProc",
        properties: { correlationId: this.correlationId },
      });
      return result;
    } catch (error) {
      this.client.trackDependency({
        name,
        duration: Date.now() - startTime,
        success: false,
        dependencyTypeName: "InProc",
        properties: { correlationId: this.correlationId },
      });
      throw error;
    }
  }

  setCorrelationId(id: string): void {
    this.correlationId = id;
  }

  child(context: LogContext): Logger {
    return new AppInsightsLogger({
      ...this.baseContext,
      ...context,
      correlationId: this.correlationId,
    });
  }

  private mapSeverity(level: LogLevel): appInsights.Contracts.SeverityLevel {
    switch (level) {
      case LogLevel.DEBUG:
        return appInsights.Contracts.SeverityLevel.Verbose;
      case LogLevel.INFO:
        return appInsights.Contracts.SeverityLevel.Information;
      case LogLevel.WARN:
        return appInsights.Contracts.SeverityLevel.Warning;
      case LogLevel.ERROR:
        return appInsights.Contracts.SeverityLevel.Error;
    }
  }
}
```

### 3. Fallback Console Logger (for local development)

```typescript
// src/lib/logger/console.ts

export class ConsoleLogger implements Logger {
  private baseContext: LogContext;
  private correlationId: string;

  constructor(context: LogContext = {}) {
    this.baseContext = context;
    this.correlationId = context.correlationId || generateCorrelationId();
  }

  private format(
    level: LogLevel,
    message: string,
    context?: LogContext,
  ): string {
    const enriched = {
      timestamp: new Date().toISOString(),
      level,
      correlationId: this.correlationId,
      message,
      ...this.baseContext,
      ...context,
    };
    return JSON.stringify(enriched);
  }

  debug(message: string, context?: LogContext): void {
    console.debug(this.format(LogLevel.DEBUG, message, context));
  }

  info(message: string, context?: LogContext): void {
    console.info(this.format(LogLevel.INFO, message, context));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.format(LogLevel.WARN, message, context));
  }

  error(message: string, error?: Error, context?: LogContext): void {
    const errorContext = error
      ? { errorMessage: error.message, stack: error.stack }
      : {};
    console.error(
      this.format(LogLevel.ERROR, message, { ...context, ...errorContext }),
    );
  }

  async trackOperation<T>(
    name: string,
    operation: () => Promise<T>,
  ): Promise<T> {
    const start = Date.now();
    try {
      const result = await operation();
      this.info(`Operation ${name} completed`, {
        durationMs: Date.now() - start,
      });
      return result;
    } catch (error) {
      this.error(`Operation ${name} failed`, error as Error, {
        durationMs: Date.now() - start,
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
```

### 4. Logger Factory

```typescript
// src/lib/logger/index.ts

import * as appInsights from "applicationinsights";
import { Logger, LogContext } from "./types";
import { AppInsightsLogger } from "./appinsights";
import { ConsoleLogger } from "./console";

let initialized = false;

export function initializeLogging(): void {
  if (initialized) return;

  const connectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;

  if (connectionString) {
    appInsights
      .setup(connectionString)
      .setAutoCollectRequests(true)
      .setAutoCollectPerformance(true)
      .setAutoCollectExceptions(true)
      .setAutoCollectDependencies(true)
      .setAutoDependencyCorrelation(true)
      .start();

    console.log("Application Insights initialized");
  } else {
    console.log("Application Insights not configured, using console logger");
  }

  initialized = true;
}

export function createLogger(context: LogContext = {}): Logger {
  if (
    process.env.APPLICATIONINSIGHTS_CONNECTION_STRING &&
    appInsights.defaultClient
  ) {
    return new AppInsightsLogger(context);
  }
  return new ConsoleLogger(context);
}

export function createRequestLogger(
  request: HttpRequest,
  feature: string,
): Logger {
  const correlationId =
    request.headers.get("x-correlation-id") || generateCorrelationId();
  return createLogger({ feature, correlationId });
}

function generateCorrelationId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export { Logger, LogContext, LogLevel } from "./types";
```

### 5. Usage in Functions

```typescript
// Before (current)
console.warn("RAG search failed:", error);

// After (with structured logging)
import { createRequestLogger } from "../lib/logger";

const logger = createRequestLogger(request, "ai-service");

logger.warn("RAG search failed", {
  operation: "searchDocuments",
  query: searchQuery.substring(0, 100),
});

// For errors with stack traces
logger.error("Token validation failed", error, {
  operation: "validateToken",
});

// For performance tracking
const result = await logger.trackOperation("generateEmbeddings", async () => {
  return generateEmbeddings(text);
});
```

### 6. Azure Configuration

```json
// local.settings.json (development)
{
  "Values": {
    "APPLICATIONINSIGHTS_CONNECTION_STRING": "InstrumentationKey=..."
  }
}
```

```bash
# Azure Function App configuration
az functionapp config appsettings set \
  --name phoenix-rooivalk-functions \
  --resource-group rg-phoenix-rooivalk \
  --settings APPLICATIONINSIGHTS_CONNECTION_STRING="InstrumentationKey=..."
```

---

## Consequences

### Positive

- **Centralized logging**: All logs in one place, queryable with KQL
- **Distributed tracing**: Track requests across function invocations
- **Automated alerting**: Set up alerts on error rates, latency, etc.
- **Performance insights**: Track operation durations and dependencies
- **Debugging support**: Full stack traces and context for errors
- **Cost visibility**: Application Insights provides cost per feature

### Negative

- **Azure lock-in**: Moving to another cloud requires migration
- **Learning curve**: KQL queries require training
- **Data costs**: Log ingestion and retention have costs
- **Slight overhead**: Logging adds small latency (typically <1ms)

### Neutral

- **Migration effort**: Need to replace ~50 console statements
- **Package addition**: New dependency on `applicationinsights` package

---

## Risks and Mitigations

| Risk                                 | Likelihood | Impact | Mitigation                                              |
| ------------------------------------ | ---------- | ------ | ------------------------------------------------------- |
| Cost overruns from excessive logging | Medium     | Medium | Set up cost alerts, use sampling for high-volume traces |
| Performance impact                   | Low        | Low    | Use async logging, batch operations                     |
| Data exposure in logs                | Medium     | High   | Never log PII or secrets, use log scrubbing             |
| Lock-in to Azure                     | Medium     | Medium | Abstract behind Logger interface for future portability |

---

## Migration Plan

### Phase 1: Setup (Week 1)

1. Add `applicationinsights` package
2. Create logger module with interface
3. Initialize in function startup

### Phase 2: Core Services (Week 2)

1. Replace console statements in services
2. Add correlation ID propagation
3. Track key operations

### Phase 3: All Functions (Week 3)

1. Replace remaining console statements
2. Add request logging middleware
3. Set up dashboards and alerts

### Phase 4: Optimization (Week 4)

1. Configure sampling for high-volume traces
2. Set up cost monitoring
3. Create runbooks for common queries

---

## Related ADRs

- [ADR 0012: Runtime Functions](./adr-0012-runtime-functions.md)
- [ADR 0023: AI Observability](./adr-0023-ai-observability.md)
- [ADR 0028: DB-Driven Configuration](./adr-0028-db-driven-configuration.md)

---

## References

- [Azure Application Insights Documentation](https://docs.microsoft.com/en-us/azure/azure-monitor/app/app-insights-overview)
- [Application Insights for Node.js](https://docs.microsoft.com/en-us/azure/azure-monitor/app/nodejs)
- [OpenTelemetry JavaScript](https://opentelemetry.io/docs/instrumentation/js/)
- [KQL Quick Reference](https://docs.microsoft.com/en-us/azure/data-explorer/kql-quick-reference)

---

_© 2025 Phoenix Rooivalk. Confidential._
