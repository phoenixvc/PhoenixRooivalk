---
id: adr-0023-ai-observability
title: "ADR 0023: AI Observability"
sidebar_label: "ADR 0023: Observability"
difficulty: intermediate
estimated_reading_time: 9
points: 35
tags:
  - technical
  - architecture
  - ai
  - observability
  - monitoring
prerequisites:
  - adr-0018-langchain-integration
  - adr-0019-ai-agents
---

# ADR 0023: AI Observability

**Date**: 2025-11-27
**Status**: Proposed (LangSmith + Custom Metrics Dashboard)

---

## Executive Summary

1. **Problem**: AI systems are black boxes; need visibility into performance, costs, quality, and errors
2. **Decision**: Implement LangSmith for LLM tracing combined with custom Firebase metrics dashboard
3. **Trade-off**: Observability overhead vs. ability to debug, optimize, and ensure quality

---

## Context

AI features need monitoring for:

| Aspect | Why It Matters |
|--------|----------------|
| **Performance** | Response times affect UX |
| **Cost** | Token usage impacts budget |
| **Quality** | Relevance and accuracy matter |
| **Errors** | Need to detect and fix issues |
| **Usage** | Understand feature adoption |

**Current state**: Limited visibility into AI operations

**Challenges**:
- LLM calls are stateless and hard to trace
- Agent reasoning is multi-step and complex
- RAG quality is hard to measure
- Cost attribution across features is unclear

---

## Decision

**Multi-layer observability stack**:
1. **LangSmith**: LLM tracing, agent debugging, prompt versioning
2. **Firebase/Cloud Monitoring**: Custom metrics, alerts, dashboards
3. **Firestore**: Usage analytics, quality feedback storage

---

## Observability Architecture

### Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI Observability Stack                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   AI Function Execution                                          │
│       │                                                          │
│       ├──────────────────────────────────────────────────────┐  │
│       │                                                      │  │
│       ▼                                                      ▼  │
│   ┌────────────────────────┐    ┌────────────────────────────┐ │
│   │       LangSmith        │    │     Custom Telemetry       │ │
│   │  - LLM call traces     │    │  - Latency metrics         │ │
│   │  - Agent steps         │    │  - Token counts            │ │
│   │  - Prompt versions     │    │  - Error rates             │ │
│   │  - Token usage         │    │  - Feature usage           │ │
│   └────────────────────────┘    └────────────────────────────┘ │
│            │                              │                      │
│            ▼                              ▼                      │
│   ┌────────────────────────┐    ┌────────────────────────────┐ │
│   │   LangSmith Dashboard  │    │   Firebase Dashboard       │ │
│   │  - Trace explorer      │    │  - Custom metrics          │ │
│   │  - Run comparison      │    │  - Alerts                  │ │
│   │  - Prompt playground   │    │  - Cost tracking           │ │
│   └────────────────────────┘    └────────────────────────────┘ │
│                                                                  │
│   ┌───────────────────────────────────────────────────────────┐ │
│   │                    Firestore Analytics                     │ │
│   │  - User feedback (thumbs up/down)                         │ │
│   │  - RAG relevance scores                                   │ │
│   │  - Feature adoption                                       │ │
│   │  - Quality metrics over time                              │ │
│   └───────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## LangSmith Integration

### Setup

```typescript
// langchain/observability/langsmith.ts
import { Client } from "langsmith";
import { LangChainTracer } from "langchain/callbacks";
import * as functions from "firebase-functions";

const config = functions.config();

// Initialize LangSmith client
export const langsmithClient = new Client({
  apiUrl: "https://api.smith.langchain.com",
  apiKey: config.langsmith?.api_key,
});

// Create tracer for LangChain operations
export function createTracer(metadata?: Record<string, any>) {
  return new LangChainTracer({
    projectName: config.langsmith?.project || "phoenix-rooivalk-ai",
    client: langsmithClient,
    exampleId: metadata?.exampleId,
    tags: metadata?.tags,
  });
}

// Wrapper for traced execution
export async function withTracing<T>(
  name: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const tracer = createTracer(metadata);

  try {
    const result = await fn();
    return result;
  } catch (error) {
    throw error;
  }
}
```

### Traced Chain Execution

```typescript
// langchain/observability/traced-chains.ts
import { RunnableConfig } from "@langchain/core/runnables";
import { createTracer } from "./langsmith";
import { logger } from "firebase-functions";

export function getTracedConfig(
  userId: string,
  feature: string,
  metadata?: Record<string, any>
): RunnableConfig {
  const runId = `${feature}-${userId}-${Date.now()}`;

  return {
    callbacks: [
      createTracer({
        tags: [feature, `user:${userId}`],
        ...metadata,
      }),
    ],
    runName: runId,
    metadata: {
      userId,
      feature,
      timestamp: new Date().toISOString(),
      ...metadata,
    },
  };
}

// Usage example
export async function tracedRAGQuery(
  userId: string,
  question: string
) {
  const config = getTracedConfig(userId, "rag-query", {
    queryLength: question.length,
  });

  const result = await ragChain.invoke(
    { input: question },
    config
  );

  return result;
}
```

### Agent Tracing

// langchain/observability/traced-agents.ts
import { AgentExecutor } from "langchain/agents";
import { getTracedConfig } from "./traced-chains";
import { logger } from "firebase-functions";

export async function tracedAgentExecution(
  agent: AgentExecutor,
  userId: string,
  input: string,
  agentType: string
) {
  const config = getTracedConfig(userId, `agent-${agentType}`, {
    inputLength: input.length,
    agentType,
  });

  const startTime = Date.now();

  try {
    const result = await agent.invoke({ input }, config);

    // Log summary
    logger.info("Agent execution completed", {
      userId,
      agentType,
      durationMs: Date.now() - startTime,
      steps: result.intermediateSteps?.length || 0,
      success: true,
    });

    return result;
  } catch (error) {
    logger.error("Agent execution failed", {
      userId,
      agentType,
      durationMs: Date.now() - startTime,
      error: (error as Error).message,
    });

    throw error;
  }
}

---

## Custom Metrics

### Metrics Collection

```typescript
// langchain/observability/metrics.ts
import { db } from "../../config/firebase";
import { Timestamp, FieldValue } from "firebase-admin/firestore";

export interface AIMetric {
  feature: string;
  userId: string;
  timestamp: Timestamp;
  latencyMs: number;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

export class MetricsCollector {
  private readonly collection = db.collection("ai_metrics");
  private readonly aggregatesCollection = db.collection("ai_metrics_aggregates");

  async record(metric: Omit<AIMetric, "timestamp">): Promise<void> {
    // Record individual metric
    await this.collection.add({
      ...metric,
      timestamp: Timestamp.now(),
    });

    // Update aggregates (for dashboard)
    const today = new Date().toISOString().split("T")[0];
    const aggregateId = `${metric.feature}-${today}`;

    await this.aggregatesCollection.doc(aggregateId).set(
      {
        feature: metric.feature,
        date: today,
        totalCalls: FieldValue.increment(1),
        successCount: FieldValue.increment(metric.success ? 1 : 0),
        errorCount: FieldValue.increment(metric.success ? 0 : 1),
        totalLatencyMs: FieldValue.increment(metric.latencyMs),
        totalTokens: FieldValue.increment(metric.tokensUsed.total),
        updatedAt: Timestamp.now(),
      },
      { merge: true }
    );
  }

  async getFeatureMetrics(
    feature: string,
    days: number = 7
  ): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const snapshot = await this.aggregatesCollection
      .where("feature", "==", feature)
      .where("date", ">=", startDate.toISOString().split("T")[0])
      .orderBy("date", "desc")
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        date: data.date,
        calls: data.totalCalls,
        successRate: data.successCount / data.totalCalls,
        avgLatencyMs: data.totalLatencyMs / data.totalCalls,
        avgTokens: data.totalTokens / data.totalCalls,
      };
    });
  }
}

export const metricsCollector = new MetricsCollector();
```

### Instrumented AI Function

```typescript
// langchain/observability/instrumented.ts
import { metricsCollector } from "./metrics";
import { createTracer } from "./langsmith";
import { logger } from "firebase-functions";

export interface InstrumentationOptions {
  feature: string;
  userId: string;
  enableLangSmith?: boolean;
  metadata?: Record<string, any>;
}

export function instrumentAICall<TInput, TOutput>(
  fn: (input: TInput) => Promise<TOutput>,
  options: InstrumentationOptions
): (input: TInput) => Promise<TOutput> {
  const { feature, userId, enableLangSmith = true, metadata = {} } = options;

  return async (input: TInput): Promise<TOutput> => {
    const startTime = Date.now();
    let tokensUsed = { prompt: 0, completion: 0, total: 0 };
    let success = true;
    let error: string | undefined;

    try {
      const result = await fn(input);

      // Extract token usage if available
      if ((result as any).usage) {
        tokensUsed = {
          prompt: (result as any).usage.prompt_tokens || 0,
          completion: (result as any).usage.completion_tokens || 0,
          total: (result as any).usage.total_tokens || 0,
        };
      }

      return result;
    } catch (err) {
      success = false;
      error = (err as Error).message;
      throw err;
    } finally {
      const latencyMs = Date.now() - startTime;

      // Record metrics
      await metricsCollector.record({
        feature,
        userId,
        latencyMs,
        tokensUsed,
        success,
        error,
        metadata,
      });

      // Log
      logger.info("AI call completed", {
        feature,
        userId,
        latencyMs,
        tokensUsed: tokensUsed.total,
        success,
      });
    }
  };
}
```

---

## Quality Feedback

### Feedback Collection

```typescript
// langchain/observability/feedback.ts
import { db } from "../../config/firebase";
import { Timestamp } from "firebase-admin/firestore";
import { langsmithClient } from "./langsmith";

export interface UserFeedback {
  responseId: string;        // ID of the AI response
  userId: string;
  feature: string;
  rating: "positive" | "negative";
  comment?: string;
  timestamp: Timestamp;
  metadata?: {
    query?: string;
    responsePreview?: string;
    sources?: string[];
  };
}

export class FeedbackCollector {
  private readonly collection = db.collection("ai_feedback");

  async recordFeedback(feedback: Omit<UserFeedback, "timestamp">): Promise<void> {
    // Store in Firestore
    await this.collection.add({
      ...feedback,
      timestamp: Timestamp.now(),
    });

    // Send to LangSmith (if run ID available)
    if (feedback.responseId && langsmithClient) {
      try {
        await langsmithClient.createFeedback(feedback.responseId, "user-rating", {
          score: feedback.rating === "positive" ? 1 : 0,
          comment: feedback.comment,
        });
      } catch (error) {
        // Non-critical, just log
        console.warn("Failed to send feedback to LangSmith", error);
      }
    }
  }

  async getFeedbackStats(
    feature: string,
    days: number = 30
  ): Promise<{
    total: number;
    positive: number;
    negative: number;
    positiveRate: number;
  }> {
    const startDate = Timestamp.fromDate(
      new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    );

    const snapshot = await this.collection
      .where("feature", "==", feature)
      .where("timestamp", ">=", startDate)
      .get();

    const feedbacks = snapshot.docs.map((doc) => doc.data() as UserFeedback);
    const positive = feedbacks.filter((f) => f.rating === "positive").length;
    const negative = feedbacks.filter((f) => f.rating === "negative").length;

    return {
      total: feedbacks.length,
      positive,
      negative,
      positiveRate: feedbacks.length > 0 ? positive / feedbacks.length : 0,
    };
  }
}

export const feedbackCollector = new FeedbackCollector();
```

### Feedback Endpoint

```typescript
// functions/src/ai/feedback.ts
import * as functions from "firebase-functions";
import { feedbackCollector } from "../langchain/observability/feedback";

export const submitFeedback = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Must be logged in");
  }

  const { responseId, feature, rating, comment } = data;

  if (!responseId || !feature || !rating) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "responseId, feature, and rating required"
    );
  }

  if (!["positive", "negative"].includes(rating)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "rating must be 'positive' or 'negative'"
    );
  }

  await feedbackCollector.recordFeedback({
    responseId,
    userId: context.auth.uid,
    feature,
    rating,
    comment,
  });

  return { success: true };
});
```

---

## Dashboards

### Metrics Dashboard Data

```typescript
// functions/src/ai/dashboard.ts
import * as functions from "firebase-functions";
import { metricsCollector } from "../langchain/observability/metrics";
import { feedbackCollector } from "../langchain/observability/feedback";
import { db } from "../config/firebase";

export const getDashboardData = functions.https.onCall(async (data, context) => {
  // Admin only
  if (!context.auth?.token?.admin) {
    throw new functions.https.HttpsError("permission-denied", "Admin access required");
  }

  const { days = 7 } = data;

  // Get metrics for all features
  const features = [
    "rag-query",
    "competitor-analysis",
    "swot-analysis",
    "market-insights",
    "recommendations",
    "agent-research",
    "agent-competitive",
  ];

  const metricsPromises = features.map((feature) =>
    metricsCollector.getFeatureMetrics(feature, days)
  );

  const feedbackPromises = features.map((feature) =>
    feedbackCollector.getFeedbackStats(feature, days)
  );

  const [metricsResults, feedbackResults] = await Promise.all([
    Promise.all(metricsPromises),
    Promise.all(feedbackPromises),
  ]);

  // Calculate totals
  const totals = {
    totalCalls: 0,
    totalTokens: 0,
    avgLatencyMs: 0,
    errorRate: 0,
    positiveRate: 0,
  };

  const featureData = features.map((feature, i) => {
    const metrics = metricsResults[i];
    const feedback = feedbackResults[i];

    const calls = metrics.reduce((sum, m) => sum + m.calls, 0);
    const tokens = metrics.reduce((sum, m) => sum + m.avgTokens * m.calls, 0);
    const latency = metrics.length > 0
      ? metrics.reduce((sum, m) => sum + m.avgLatencyMs, 0) / metrics.length
      : 0;
    const successRate = metrics.length > 0
      ? metrics.reduce((sum, m) => sum + m.successRate, 0) / metrics.length
      : 1;

    totals.totalCalls += calls;
    totals.totalTokens += tokens;

    return {
      feature,
      calls,
      tokens,
      avgLatencyMs: latency,
      successRate,
      positiveRate: feedback.positiveRate,
      dailyMetrics: metrics,
    };
  });

  totals.avgLatencyMs = featureData.reduce((sum, f) => sum + f.avgLatencyMs, 0) / features.length;
  totals.errorRate = 1 - featureData.reduce((sum, f) => sum + f.successRate, 0) / features.length;
  totals.positiveRate = featureData.reduce((sum, f) => sum + f.positiveRate, 0) / features.length;

  // Estimate costs (approximate)
  const estimatedCost = (totals.totalTokens / 1000000) * 2.5; // ~$2.50/M tokens average

  return {
    period: `${days} days`,
    totals: {
      ...totals,
      estimatedCost: `$${estimatedCost.toFixed(2)}`,
    },
    features: featureData,
    generatedAt: new Date().toISOString(),
  };
});
```

### Key Metrics to Display

| Category | Metric | Alert Threshold |
|----------|--------|-----------------|
| **Performance** | P50 latency | > 2s |
| **Performance** | P95 latency | > 5s |
| **Performance** | P99 latency | > 10s |
| **Reliability** | Error rate | > 5% |
| **Reliability** | Timeout rate | > 2% |
| **Cost** | Daily token usage | > 1M |
| **Cost** | Daily estimated cost | > $50 |
| **Quality** | Positive feedback rate | < 80% |
| **Quality** | RAG relevance score | < 0.7 avg |
| **Usage** | Daily active users | Tracking |
| **Usage** | Queries per user | Tracking |

---

## Alerting

### Cloud Monitoring Alerts

```typescript
// functions/src/monitoring/alerts.ts
import * as functions from "firebase-functions";
import { db } from "../config/firebase";

// Check metrics and send alerts
export const checkMetricsAlerts = functions.pubsub
  .schedule("every 15 minutes")
  .onRun(async () => {
    const now = new Date();
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

    // Query recent metrics
    const snapshot = await db
      .collection("ai_metrics")
      .where("timestamp", ">=", fifteenMinutesAgo)
      .get();

    const metrics = snapshot.docs.map((doc) => doc.data());

    // Calculate error rate
    const errorRate = metrics.filter((m) => !m.success).length / metrics.length;
    if (errorRate > 0.05) {
      await sendAlert("High error rate", `Error rate: ${(errorRate * 100).toFixed(1)}%`);
    }

    // Calculate average latency
    const avgLatency = metrics.reduce((sum, m) => sum + m.latencyMs, 0) / metrics.length;
    if (avgLatency > 5000) {
      await sendAlert("High latency", `Avg latency: ${avgLatency.toFixed(0)}ms`);
    }

    // Check token usage
    const totalTokens = metrics.reduce((sum, m) => sum + m.tokensUsed.total, 0);
    const projectedDaily = totalTokens * (24 * 4); // Project to daily
    if (projectedDaily > 1000000) {
      await sendAlert("High token usage", `Projected daily: ${projectedDaily.toLocaleString()} tokens`);
    }
  });

async function sendAlert(title: string, message: string) {
  // Could integrate with PagerDuty, Slack, email, etc.
  functions.logger.warn(`ALERT: ${title}`, { message });

  // Store alert
  await db.collection("alerts").add({
    title,
    message,
    timestamp: new Date(),
    acknowledged: false,
  });
}
```

---

## Options Considered

### Option 1: LangSmith + Custom ✅ Selected

| Aspect | Details |
|--------|---------|
| **LLM Tracing** | LangSmith |
| **Custom Metrics** | Firebase/Firestore |
| **Dashboards** | Custom + LangSmith |

**Pros**:
- Best-in-class LLM tracing
- Custom metrics for our needs
- Integrated with Firebase stack

**Cons**:
- Two systems to manage
- LangSmith cost
- Learning curve

---

### Option 2: LangSmith Only

| Aspect | Details |
|--------|---------|
| **All Observability** | LangSmith |

**Pros**:
- Single platform
- Rich LLM features
- Prompt playground

**Cons**:
- Limited custom metrics
- Vendor lock-in
- Cost at scale

---

### Option 3: Custom Only

| Aspect | Details |
|--------|---------|
| **All Observability** | Custom Firebase implementation |

**Pros**:
- Full control
- No additional cost
- Stack consistency

**Cons**:
- No LLM-specific tracing
- Significant dev effort
- Missing advanced features

---

### Option 4: Cognitive Mesh (Future)

| Aspect | Details |
|--------|---------|
| **Observability** | Built-in comprehensive telemetry |
| **Tracing** | Full cognitive operation tracing |
| **Compliance** | Audit logs with governance |
| **Platform** | C#/.NET 9.0+ |

**Repository**: https://github.com/justaghost/cognitive-mesh

**Pros**:
- Built-in observability across all 5 layers
- Comprehensive audit logging with compliance tracking
- Cognitive operation tracing (not just LLM calls)
- Metacognitive metrics (self-reflection effectiveness)
- Agent decision audit trails
- NIST AI RMF compliance reporting
- Ethical reasoning transparency logs
- Zero-trust security event logging

**Cons**:
- Different tech stack (C#/.NET vs TypeScript)
- Currently in development, not yet deployed
- Migration effort from LangSmith + Firebase
- Higher operational complexity

**When to Consider**:
- When AI compliance audits are required
- When ethical AI transparency is mandated
- When metacognitive metrics are valuable
- When zero-trust security logging is needed
- When NIST AI RMF reporting is required

**Current Status**: In development. Observability is built into each layer. Evaluate when compliance audit requirements increase.

---

## Consequences

### Positive

- **Visibility**: See what AI is doing
- **Debugging**: Trace issues through agent steps
- **Optimization**: Identify slow/expensive operations
- **Quality**: Track and improve response quality
- **Cost control**: Monitor and budget token usage

### Negative

- **Overhead**: Tracing adds latency (~50ms)
- **Cost**: LangSmith subscription
- **Complexity**: More infrastructure to manage
- **Data volume**: Metrics storage grows

### Risks

| Risk | Mitigation |
|------|------------|
| LangSmith outage | Custom fallback logging |
| Cost overrun | Usage alerts, sampling |
| Data privacy | Anonymize traces |
| Alert fatigue | Tune thresholds |

---

## Related ADRs

- [ADR 0000: ADR Management](./adr-0000-adr-management.md) - Platform decision framework
- [ADR 0018: LangChain Integration](./adr-0018-langchain-integration.md)
- [ADR 0019: AI Agents Architecture](./adr-0019-ai-agents.md)
- [ADR 0022: AI Workflows](./adr-0022-ai-workflows.md)
- [Cognitive Mesh](https://github.com/justaghost/cognitive-mesh) - Future enterprise platform

---

_© 2025 Phoenix Rooivalk. Confidential._
