---
id: adr-0022-ai-workflows
title: "ADR 0022: AI Workflows"
sidebar_label: "ADR 0022: AI Workflows"
difficulty: advanced
estimated_reading_time: 10
points: 40
tags:
  - technical
  - architecture
  - ai
  - workflows
  - orchestration
prerequisites:
  - adr-0018-langchain-integration
  - adr-0019-ai-agents
---

# ADR 0022: AI Workflows

**Date**: 2025-11-27 **Status**: Proposed — Rejected (Defer to Cognitive Mesh)

---

## Executive Summary

1. **Problem**: Complex analysis tasks require multi-step orchestration with
   intermediate results, branching logic, and error recovery
2. **Decision**: After evaluation, LangChain RunnableSequence with Firestore
   state was **not chosen**. Cognitive Mesh's Business Applications Layer
   provides superior workflow orchestration with governance and compliance.
3. **Trade-off**: Workflow engine complexity exceeds docs site needs; Cognitive
   Mesh already has this designed

**Rejected Option**: LangChain/Firestore workflow approach was evaluated but
rejected in favor of Cognitive Mesh. See Implementation Recommendation section
for rationale.

---

## Context

Some analysis tasks require multiple coordinated steps:

**Example: Comprehensive Market Analysis**

1. Identify market segments
2. Research each segment (parallel)
3. Analyze competitive landscape
4. Calculate market sizing
5. Generate recommendations

**Challenges**:

- Steps have dependencies
- Some steps can run in parallel
- Long-running tasks may timeout
- Need to resume from failures
- Results need aggregation

---

## Decision

**LangChain RunnableSequence workflows** with:

1. Declarative step definitions
2. Parallel execution where possible
3. Firestore-based state persistence
4. Resume capability for failed workflows

---

## Workflow Architecture

### Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Workflow Execution Engine                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Workflow Definition                                            │
│       │                                                          │
│       ▼                                                          │
│   ┌───────────────────────────────────────────────────────────┐ │
│   │                 Workflow Executor                          │ │
│   │  - Parse workflow definition                              │ │
│   │  - Manage step execution                                  │ │
│   │  - Handle state persistence                               │ │
│   └───────────────────────────────────────────────────────────┘ │
│       │                                                          │
│       ▼                                                          │
│   ┌───────────────────────────────────────────────────────────┐ │
│   │                    Step Execution                          │ │
│   │                                                            │ │
│   │   ┌─────────┐     ┌─────────┐     ┌─────────┐            │ │
│   │   │ Step 1  │────▶│ Step 2  │────▶│ Step 3  │            │ │
│   │   │ (Init)  │     │ (Branch)│     │(Parallel)│            │ │
│   │   └─────────┘     └────┬────┘     └────┬────┘            │ │
│   │                        │               │                  │ │
│   │                   ┌────┴────┐     ┌────┴────┐            │ │
│   │                   ▼         ▼     ▼         ▼            │ │
│   │               ┌─────┐   ┌─────┐ ┌─────┐ ┌─────┐         │ │
│   │               │ 2a  │   │ 2b  │ │ 3a  │ │ 3b  │         │ │
│   │               └─────┘   └─────┘ └─────┘ └─────┘         │ │
│   │                   │         │     │         │            │ │
│   │                   └────┬────┘     └────┬────┘            │ │
│   │                        ▼               ▼                  │ │
│   │                   ┌─────────┐     ┌─────────┐            │ │
│   │                   │  Merge  │────▶│ Step 4  │            │ │
│   │                   └─────────┘     │ (Final) │            │ │
│   │                                   └─────────┘            │ │
│   └───────────────────────────────────────────────────────────┘ │
│       │                                                          │
│       ▼                                                          │
│   ┌───────────────────────────────────────────────────────────┐ │
│   │                    State Store (Firestore)                 │ │
│   │  workflow_runs/{runId}                                    │ │
│   │    ├── status: "running" | "completed" | "failed"        │ │
│   │    ├── currentStep: "step_2a"                            │ │
│   │    ├── stepResults: { step_1: {...}, step_2a: {...} }   │ │
│   │    └── error?: { step: "step_2b", message: "..." }      │ │
│   └───────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Workflow Types

### 1. Market Analysis Workflow

**Purpose**: Comprehensive market analysis with segment research.

```typescript
// langchain/workflows/market-analysis.ts
import { RunnableSequence, RunnableParallel } from "@langchain/core/runnables";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import {
  StringOutputParser,
  JsonOutputParser,
} from "@langchain/core/output_parsers";
import { azureLLM, azureLLMFast } from "../llm";
import { docRetriever } from "../retrievers/azure-search";

// Step 1: Identify market segments
const identifySegmentsPrompt = ChatPromptTemplate.fromTemplate(`
Analyze the counter-drone defense market and identify key segments.

Focus area: {focusArea}
Region: {region}

Return a JSON array of market segments with:
- name: Segment name
- description: Brief description
- estimatedSize: Rough market size estimate
- growthRate: Expected growth rate

Return valid JSON only.
`);

// Step 2: Research each segment (parallel)
const researchSegmentPrompt = ChatPromptTemplate.fromTemplate(`
Research the following market segment in detail:

Segment: {segmentName}
Description: {segmentDescription}

Provide:
1. Key players and market share
2. Technology trends
3. Regulatory environment
4. Entry barriers
5. Opportunities for Phoenix Rooivalk
`);

// Step 3: Competitive analysis
const competitiveAnalysisPrompt = ChatPromptTemplate.fromTemplate(`
Based on the market segment research:

{segmentResearch}

Analyze the competitive landscape:
1. Who are the top 5 competitors?
2. What are their strengths and weaknesses?
3. Where does Phoenix Rooivalk fit?
4. What's our competitive advantage?
`);

// Step 4: Market sizing
const marketSizingPrompt = ChatPromptTemplate.fromTemplate(`
Based on the research:

{competitiveAnalysis}

Calculate market sizing:
1. Total Addressable Market (TAM)
2. Serviceable Addressable Market (SAM) for Phoenix Rooivalk
3. Serviceable Obtainable Market (SOM) - realistic 3-year target
4. Key assumptions

Be specific with numbers and cite sources.
`);

// Step 5: Recommendations
const recommendationsPrompt = ChatPromptTemplate.fromTemplate(`
Based on all analysis:

Market Segments: {segments}
Competitive Analysis: {competitiveAnalysis}
Market Sizing: {marketSizing}

Provide strategic recommendations:
1. Priority market segments to target
2. Go-to-market strategy
3. Key partnerships to pursue
4. Investment priorities
5. Risk mitigation strategies

Format as an executive summary.
`);

export const marketAnalysisWorkflow = RunnableSequence.from([
  // Step 1: Identify segments
  {
    segments: identifySegmentsPrompt
      .pipe(azureLLM)
      .pipe(new JsonOutputParser()),
    focusArea: (input: { focusArea: string; region: string }) =>
      input.focusArea,
    region: (input: { focusArea: string; region: string }) => input.region,
  },

  // Step 2: Research segments in parallel
  async (input) => {
    const segmentChain = researchSegmentPrompt
      .pipe(azureLLM)
      .pipe(new StringOutputParser());

    const research = await Promise.all(
      input.segments.map((segment: any) =>
        segmentChain.invoke({
          segmentName: segment.name,
          segmentDescription: segment.description,
        }),
      ),
    );

    return {
      ...input,
      segmentResearch: research.join("\n\n---\n\n"),
    };
  },

  // Step 3: Competitive analysis
  {
    segments: (input: any) => JSON.stringify(input.segments),
    segmentResearch: (input: any) => input.segmentResearch,
    competitiveAnalysis: RunnableSequence.from([
      (input: any) => ({ segmentResearch: input.segmentResearch }),
      competitiveAnalysisPrompt,
      azureLLM,
      new StringOutputParser(),
    ]),
  },

  // Step 4: Market sizing
  {
    segments: (input: any) => input.segments,
    competitiveAnalysis: (input: any) => input.competitiveAnalysis,
    marketSizing: RunnableSequence.from([
      (input: any) => ({ competitiveAnalysis: input.competitiveAnalysis }),
      marketSizingPrompt,
      azureLLM,
      new StringOutputParser(),
    ]),
  },

  // Step 5: Generate recommendations
  recommendationsPrompt.pipe(azureLLM).pipe(new StringOutputParser()),
]);

// Usage
export async function runMarketAnalysis(focusArea: string, region: string) {
  return marketAnalysisWorkflow.invoke({ focusArea, region });
}
```

### 2. Competitive Landscape Workflow

**Purpose**: Deep competitive analysis with multi-source research.

```typescript
// langchain/workflows/competitive-landscape.ts
import { RunnableSequence, RunnableParallel } from "@langchain/core/runnables";
import { webSearchTool, docSearchTool, newsSearchTool } from "../tools";

export const competitiveLandscapeWorkflow = RunnableSequence.from([
  // Step 1: Get Phoenix baseline
  {
    phoenixCapabilities: async (input: { competitors: string[] }) => {
      const result = await docSearchTool.invoke({
        query: "Phoenix Rooivalk capabilities specifications features",
        maxResults: 10,
      });
      return result;
    },
    competitors: (input: { competitors: string[] }) => input.competitors,
  },

  // Step 2: Research each competitor (parallel)
  async (input) => {
    const competitorResearch = await Promise.all(
      input.competitors.map(async (competitor: string) => {
        const [webResults, newsResults] = await Promise.all([
          webSearchTool.invoke({
            query: `${competitor} counter-drone anti-drone products capabilities`,
            maxResults: 5,
          }),
          newsSearchTool.invoke({
            query: `${competitor} drone defense announcement`,
            maxResults: 3,
          }),
        ]);

        return {
          competitor,
          webResearch: webResults,
          recentNews: newsResults,
        };
      }),
    );

    return {
      ...input,
      competitorResearch,
    };
  },

  // Step 3: Generate comparison matrix
  async (input) => {
    const comparisonPrompt = ChatPromptTemplate.fromTemplate(`
Phoenix Capabilities:
{phoenixCapabilities}

Competitor Research:
{competitorResearch}

Create a detailed comparison matrix covering:
1. Technology capabilities (detection, tracking, neutralization)
2. Product specifications
3. Pricing (if available)
4. Geographic presence
5. Key customers
6. Recent developments

Format as a structured comparison.
`);

    const chain = comparisonPrompt
      .pipe(azureLLM)
      .pipe(new StringOutputParser());

    const comparison = await chain.invoke({
      phoenixCapabilities: input.phoenixCapabilities,
      competitorResearch: JSON.stringify(input.competitorResearch, null, 2),
    });

    return { ...input, comparison };
  },

  // Step 4: SWOT analysis
  async (input) => {
    const swotPrompt = ChatPromptTemplate.fromTemplate(`
Based on the competitive comparison:

{comparison}

Generate a SWOT analysis for Phoenix Rooivalk:

STRENGTHS: Internal advantages over competitors
WEAKNESSES: Areas where competitors are stronger
OPPORTUNITIES: Market gaps Phoenix can exploit
THREATS: Competitive threats to address

Be specific and actionable.
`);

    const chain = swotPrompt.pipe(azureLLM).pipe(new StringOutputParser());

    const swot = await chain.invoke({ comparison: input.comparison });

    return { ...input, swot };
  },

  // Step 5: Strategic recommendations
  async (input) => {
    const strategyPrompt = ChatPromptTemplate.fromTemplate(`
Competitive Comparison:
{comparison}

SWOT Analysis:
{swot}

Provide strategic recommendations:
1. How to leverage our strengths
2. How to address our weaknesses
3. Priority opportunities to pursue
4. Threats to mitigate

Include specific, actionable next steps.
`);

    const chain = strategyPrompt.pipe(azureLLM).pipe(new StringOutputParser());

    return chain.invoke({
      comparison: input.comparison,
      swot: input.swot,
    });
  },
]);
```

---

## State Management

### Workflow State

```typescript
// langchain/workflows/state.ts
import { db } from "../../config/firebase";
import { Timestamp } from "firebase-admin/firestore";

export interface WorkflowState {
  id: string;
  workflowType: string;
  userId: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  currentStep: string;
  totalSteps: number;
  input: Record<string, any>;
  stepResults: Record<string, any>;
  output?: any;
  error?: {
    step: string;
    message: string;
    stack?: string;
  };
  startedAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
  durationMs?: number;
}

export class WorkflowStateManager {
  private readonly collection = db.collection("workflow_runs");

  async create(
    workflowType: string,
    userId: string,
    input: Record<string, any>,
    totalSteps: number,
  ): Promise<string> {
    const state: Omit<WorkflowState, "id"> = {
      workflowType,
      userId,
      status: "pending",
      currentStep: "init",
      totalSteps,
      input,
      stepResults: {},
      startedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await this.collection.add(state);
    return docRef.id;
  }

  async get(runId: string): Promise<WorkflowState | null> {
    const doc = await this.collection.doc(runId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as WorkflowState;
  }

  async updateStep(runId: string, step: string, result: any): Promise<void> {
    await this.collection.doc(runId).update({
      currentStep: step,
      [`stepResults.${step}`]: result,
      status: "running",
      updatedAt: Timestamp.now(),
    });
  }

  async complete(runId: string, output: any): Promise<void> {
    const now = Timestamp.now();
    const doc = await this.collection.doc(runId).get();
    const startedAt = doc.data()?.startedAt?.toMillis() || now.toMillis();

    await this.collection.doc(runId).update({
      status: "completed",
      output,
      completedAt: now,
      updatedAt: now,
      durationMs: now.toMillis() - startedAt,
    });
  }

  async fail(runId: string, step: string, error: Error): Promise<void> {
    await this.collection.doc(runId).update({
      status: "failed",
      error: {
        step,
        message: error.message,
        stack: error.stack,
      },
      updatedAt: Timestamp.now(),
    });
  }

  async cancel(runId: string): Promise<void> {
    await this.collection.doc(runId).update({
      status: "cancelled",
      updatedAt: Timestamp.now(),
    });
  }

  async getUserWorkflows(
    userId: string,
    options: { limit?: number; status?: string } = {},
  ): Promise<WorkflowState[]> {
    const { limit = 20, status } = options;

    let query = this.collection
      .where("userId", "==", userId)
      .orderBy("startedAt", "desc")
      .limit(limit);

    if (status) {
      query = query.where("status", "==", status);
    }

    const snapshot = await query.get();
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as WorkflowState,
    );
  }
}

export const workflowStateManager = new WorkflowStateManager();
```

### Resumable Workflow Executor

```typescript
// langchain/workflows/executor.ts
import { workflowStateManager, WorkflowState } from "./state";
import { logger } from "firebase-functions";

export interface WorkflowStep {
  name: string;
  execute: (input: any, previousResults: Record<string, any>) => Promise<any>;
  dependsOn?: string[];
}

export class WorkflowExecutor {
  constructor(
    private workflowType: string,
    private steps: WorkflowStep[],
  ) {}

  async start(userId: string, input: Record<string, any>): Promise<string> {
    const runId = await workflowStateManager.create(
      this.workflowType,
      userId,
      input,
      this.steps.length,
    );

    // Start execution asynchronously
    this.execute(runId, input).catch((error) => {
      logger.error("Workflow execution failed", { runId, error });
    });

    return runId;
  }

  async resume(runId: string): Promise<void> {
    const state = await workflowStateManager.get(runId);
    if (!state) throw new Error("Workflow not found");
    if (state.status !== "failed")
      throw new Error("Can only resume failed workflows");

    await this.execute(runId, state.input, state.stepResults);
  }

  private async execute(
    runId: string,
    input: Record<string, any>,
    previousResults: Record<string, any> = {},
  ): Promise<void> {
    const results = { ...previousResults };

    for (const step of this.steps) {
      // Skip already completed steps
      if (results[step.name]) {
        continue;
      }

      // Check dependencies
      if (step.dependsOn) {
        const missingDeps = step.dependsOn.filter((dep) => !results[dep]);
        if (missingDeps.length > 0) {
          throw new Error(
            `Missing dependencies for ${step.name}: ${missingDeps.join(", ")}`,
          );
        }
      }

      try {
        logger.info("Executing workflow step", { runId, step: step.name });

        const stepInput = {
          ...input,
          ...Object.fromEntries(
            (step.dependsOn || []).map((dep) => [dep, results[dep]]),
          ),
        };

        const result = await step.execute(stepInput, results);
        results[step.name] = result;

        await workflowStateManager.updateStep(runId, step.name, result);
      } catch (error) {
        logger.error("Workflow step failed", {
          runId,
          step: step.name,
          error: (error as Error).message,
        });

        await workflowStateManager.fail(runId, step.name, error as Error);
        throw error;
      }
    }

    // Get final step result as output
    const finalStep = this.steps[this.steps.length - 1];
    await workflowStateManager.complete(runId, results[finalStep.name]);
  }
}
```

---

## Cloud Function Endpoints

```typescript
// functions/src/ai/workflows.ts
import * as functions from "firebase-functions";
import {
  marketAnalysisWorkflow,
  competitiveLandscapeWorkflow,
} from "../langchain/workflows";
import {
  WorkflowExecutor,
  workflowStateManager,
} from "../langchain/workflows/executor";

// Start market analysis workflow
export const startMarketAnalysis = functions
  .runWith({ timeoutSeconds: 540, memory: "1GB" })
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be logged in",
      );
    }

    const { focusArea, region } = data;

    if (!focusArea || !region) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "focusArea and region required",
      );
    }

    try {
      const result = await marketAnalysisWorkflow.invoke({ focusArea, region });
      return { success: true, result };
    } catch (error) {
      throw new functions.https.HttpsError(
        "internal",
        (error as Error).message,
      );
    }
  });

// Start competitive landscape workflow
export const startCompetitiveLandscape = functions
  .runWith({ timeoutSeconds: 540, memory: "1GB" })
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be logged in",
      );
    }

    const { competitors } = data;

    if (!competitors || !Array.isArray(competitors)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "competitors array required",
      );
    }

    try {
      const result = await competitiveLandscapeWorkflow.invoke({ competitors });
      return { success: true, result };
    } catch (error) {
      throw new functions.https.HttpsError(
        "internal",
        (error as Error).message,
      );
    }
  });

// Get workflow status
export const getWorkflowStatus = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be logged in",
      );
    }

    const { runId } = data;
    const state = await workflowStateManager.get(runId);

    if (!state) {
      throw new functions.https.HttpsError("not-found", "Workflow not found");
    }

    if (state.userId !== context.auth.uid) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Access denied",
      );
    }

    return state;
  },
);

// List user workflows
export const listWorkflows = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Must be logged in",
    );
  }

  const { limit, status } = data;
  return workflowStateManager.getUserWorkflows(context.auth.uid, {
    limit,
    status,
  });
});
```

---

## Workflow Patterns

### Sequential Steps

```typescript
const sequentialWorkflow = RunnableSequence.from([
  step1,
  step2, // Receives output from step1
  step3, // Receives output from step2
]);
```

### Parallel Steps

```typescript
const parallelWorkflow = RunnableParallel.from({
  branch1: chain1,
  branch2: chain2,
  branch3: chain3,
}).pipe(mergeResults);
```

### Conditional Branching

```typescript
const conditionalWorkflow = RunnableSequence.from([
  classifyInput,
  RunnableLambda.from(async (input) => {
    if (input.classification === "technical") {
      return technicalChain.invoke(input);
    } else {
      return businessChain.invoke(input);
    }
  }),
]);
```

### Error Recovery

```typescript
const resilientWorkflow = RunnableSequence.from([
  step1.withRetry({ maxAttempts: 3 }),
  step2.withFallbacks([fallbackStep2]),
  step3,
]);
```

---

## Option: Cognitive Mesh Workflows (Future)

### Alternative Framework

| Aspect            | Details                                 |
| ----------------- | --------------------------------------- |
| **Framework**     | Cognitive Mesh Business Layer           |
| **Orchestration** | Workflow Orchestrators with governance  |
| **State**         | Built-in workflow state with compliance |
| **Platform**      | C#/.NET 9.0+                            |

**Repository**: https://github.com/justaghost/cognitive-mesh

**Pros**:

- Enterprise-grade workflow orchestration
- Built-in workflow versioning and governance
- Compliance tracking per workflow step
- Audit trails for all workflow transitions
- Checkpoint and rollback capabilities
- Multi-tenant workflow isolation
- Timeout and budget management built-in
- Human-in-the-loop integration for critical decisions

**Cons**:

- Different tech stack (C#/.NET vs TypeScript)
- Currently in development, not yet deployed
- Migration effort from LangChain workflows
- Higher operational complexity

**When to Consider**:

- When workflow governance becomes critical
- When audit trails for workflow steps are mandated
- When human-in-the-loop approval is required
- When compliance tracking per step is needed
- When workflow rollback capabilities are essential

**Current Status**: In development. Business Layer with Workflow Orchestrators
is a core feature. Evaluate when compliance requirements increase.

---

## Consequences

### Positive

- **Complex orchestration**: Multi-step analysis possible
- **Parallel execution**: Efficient use of resources
- **State persistence**: Resume from failures
- **Visibility**: Track workflow progress
- **Reusability**: Compose workflows from steps

### Negative

- **Complexity**: More moving parts
- **Latency**: Multi-step = longer execution
- **Cost**: More LLM calls per workflow
- **Debugging**: Harder to trace issues

### Risks

| Risk             | Mitigation                   |
| ---------------- | ---------------------------- |
| Timeout          | Break into smaller workflows |
| State corruption | Atomic updates, validation   |
| Runaway costs    | Step limits, budgets         |
| Deadlocks        | Dependency validation        |

---

## Implementation Recommendation

### Decision: **Implement in Cognitive Mesh** 🔶

| Factor                 | Assessment                                          |
| ---------------------- | --------------------------------------------------- |
| **Current Status**     | Proposed (not implemented)                          |
| **CM Equivalent**      | BusinessApplications Layer (~30% complete)          |
| **CM Advantage**       | Workflow governance, checkpoints, human-in-the-loop |
| **Resource Trade-off** | Workflow engine is complex, CM has it designed      |

**Rationale**: Cognitive Mesh's Business Applications Layer includes Workflow
Orchestrators with step-level compliance tracking, checkpoint/rollback
capabilities, and human-in-the-loop integration. These are enterprise-grade
features that would require significant effort to implement here.

**Action**:

- **Do NOT implement** workflow engine in docs site
- **Complete CM Business Layer PRD**
- Docs site works with simple single-step analyses
- No need for multi-step market analysis or competitive workflows

**For docs site**: Keep simple single-step features (competitor analysis, SWOT).
No workflow orchestration needed.

See
[ADR 0000 Appendix: CM Feature Recommendations](./adr-0000-appendix-cogmesh-feature-recommendations.md)
for full analysis.

---

## Related ADRs

- [ADR 0000: ADR Management](./adr-0000-adr-management.md) - Platform decision
  framework
- [ADR 0018: LangChain Integration](./adr-0018-langchain-integration.md)
- [ADR 0019: AI Agents Architecture](./adr-0019-ai-agents.md)
- [ADR 0020: Agent Tools Framework](./adr-0020-agent-tools.md)
- [ADR 0023: AI Observability](./adr-0023-ai-observability.md)
- [Cognitive Mesh](https://github.com/justaghost/cognitive-mesh) - Future
  enterprise platform

---

_© 2025 Phoenix Rooivalk. Confidential._
