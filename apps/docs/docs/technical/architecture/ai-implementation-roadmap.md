---
id: ai-implementation-roadmap
title: "AI Architecture Implementation Roadmap"
sidebar_label: "AI Implementation Roadmap"
difficulty: intermediate
estimated_reading_time: 12
points: 50
tags:
  - technical
  - architecture
  - ai
  - roadmap
  - implementation
prerequisites:
  - adr-0015-prompt-management
  - adr-0016-rag-architecture
  - adr-0017-context-management
  - adr-0018-langchain-integration
---

# AI Architecture Implementation Roadmap

**Date**: 2025-11-27 **Version**: 1.0 **Status**: Active

---

## Overview

This document provides a phased implementation plan for Phoenix Rooivalk's AI
architecture, consolidating the decisions from:

- [ADR-0015: Prompt Management](./adr-0015-prompt-management.md)
- [ADR-0016: RAG Architecture](./adr-0016-rag-architecture.md)
- [ADR-0017: Context Management](./adr-0017-context-management.md)
- [ADR-0018: LangChain Integration](./adr-0018-langchain-integration.md)

---

## Implementation Timeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AI Architecture Implementation Phases                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Phase 1: Foundation          Phase 2: Enhancement      Phase 3: Advanced   │
│  ─────────────────────        ──────────────────────    ─────────────────   │
│                                                                              │
│  ┌─────────────────────┐     ┌─────────────────────┐   ┌─────────────────┐ │
│  │ ✅ Prompt System    │     │ Context Optimization│   │ LangChain Agents│ │
│  │ ✅ RAG Integration  │     │ Advanced RAG        │   │ Multi-Agent     │ │
│  │ ✅ Basic Context    │     │ LangChain Chains    │   │ Observability   │ │
│  └─────────────────────┘     └─────────────────────┘   └─────────────────┘ │
│                                                                              │
│  Duration: Completed         Duration: 2-3 weeks       Duration: 3-4 weeks  │
│                                                                              │
│  ════════════════════════════════════════════════════════════════════════   │
│  NOW ──────────────────▶                                                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Foundation ✅ COMPLETED

**Goal**: Establish core AI infrastructure with centralized prompts and RAG
integration.

### 1.1 Prompt Management System ✅

| Task                                   | Status  | ADR Reference |
| -------------------------------------- | ------- | ------------- |
| Create `/prompts/` directory structure | ✅ Done | ADR-0015      |
| Define TypeScript interfaces           | ✅ Done | ADR-0015      |
| Create Phoenix context modules         | ✅ Done | ADR-0017      |
| Build versioned prompt templates       | ✅ Done | ADR-0015      |
| Implement template registry            | ✅ Done | ADR-0015      |
| Add legacy compatibility layer         | ✅ Done | ADR-0015      |

**Deliverables**:

- `functions/src/prompts/types.ts`
- `functions/src/prompts/context.ts`
- `functions/src/prompts/templates/*.ts`
- `functions/src/prompts/index.ts`

### 1.2 RAG Integration ✅

| Task                                             | Status  | ADR Reference |
| ------------------------------------------------ | ------- | ------------- |
| Integrate RAG into `analyzeCompetitors`          | ✅ Done | ADR-0016      |
| Integrate RAG into `generateSWOT`                | ✅ Done | ADR-0016      |
| Integrate RAG into `getMarketInsights`           | ✅ Done | ADR-0016      |
| Integrate RAG into `getReadingRecommendations`   | ✅ Done | ADR-0016      |
| Integrate RAG into `suggestDocumentImprovements` | ✅ Done | ADR-0016      |
| Add graceful fallback when RAG unavailable       | ✅ Done | ADR-0016      |

**Deliverables**:

- Updated AI functions with RAG context injection
- `sources` and `ragEnabled` fields in responses
- Fallback handling for search failures

### 1.3 Documentation ✅

| Task                                  | Status  |
| ------------------------------------- | ------- |
| Write ADR-0015: Prompt Management     | ✅ Done |
| Write ADR-0016: RAG Architecture      | ✅ Done |
| Write ADR-0017: Context Management    | ✅ Done |
| Write ADR-0018: LangChain Integration | ✅ Done |

---

## Phase 2: Enhancement

**Goal**: Optimize context management, improve RAG quality, and introduce
LangChain for complex workflows.

### 2.1 Migrate to New Prompt System

| Task                                                               | Priority | Effort | ADR Reference |
| ------------------------------------------------------------------ | -------- | ------ | ------------- |
| Update `analyzeCompetitors` to use `COMPETITOR_PROMPT`             | High     | S      | ADR-0015      |
| Update `generateSWOT` to use `SWOT_PROMPT`                         | High     | S      | ADR-0015      |
| Update `getMarketInsights` to use `MARKET_PROMPT`                  | High     | S      | ADR-0015      |
| Update `askDocumentation` to use `RAG_QUERY_PROMPT`                | High     | S      | ADR-0015      |
| Update `getReadingRecommendations` to use `RECOMMENDATIONS_PROMPT` | Medium   | S      | ADR-0015      |
| Remove legacy `PROMPTS` compatibility layer                        | Low      | S      | ADR-0015      |

**Implementation Example**:

```typescript
// Before (legacy)
import { PROMPTS } from "../prompts";
const systemPrompt = PROMPTS.competitor.system;

// After (new system)
import { getPromptTemplate, buildSystemPrompt } from "../prompts";
const template = getPromptTemplate("competitor-analysis");
const systemPrompt = buildSystemPrompt(template, ragContext);
```

### 2.2 Context Optimization

| Task                                                           | Priority | Effort | ADR Reference |
| -------------------------------------------------------------- | -------- | ------ | ------------- |
| Implement `getContextForCategory()` function                   | High     | M      | ADR-0017      |
| Add token budget management                                    | High     | M      | ADR-0017      |
| Create context builder with layer selection                    | Medium   | M      | ADR-0017      |
| Add context truncation with `[...truncated]` indicator         | Medium   | S      | ADR-0017      |
| Implement `fitContextsToBudget()` for priority-based selection | Medium   | M      | ADR-0017      |

**Implementation**:

```typescript
// functions/src/prompts/context-builder.ts
import { PromptCategory } from "./types";
import {
  PHOENIX_CORE_CONTEXT,
  PHOENIX_TECHNICAL_CONTEXT,
  PHOENIX_MARKET_CONTEXT,
} from "./context";

export function getContextForCategory(category: PromptCategory): string[] {
  const contexts: string[] = [PHOENIX_CORE_CONTEXT];

  switch (category) {
    case "analysis":
      contexts.push(PHOENIX_TECHNICAL_CONTEXT);
      contexts.push(PHOENIX_MARKET_CONTEXT);
      break;
    case "technical":
      contexts.push(PHOENIX_TECHNICAL_CONTEXT);
      break;
    case "business":
      contexts.push(PHOENIX_MARKET_CONTEXT);
      break;
    // retrieval and recommendation use core only
  }

  return contexts;
}

export function buildContextWithBudget(
  category: PromptCategory,
  ragContext: string | undefined,
  maxTokens: number = 3000,
): { context: string; tokenCount: number } {
  const staticContexts = getContextForCategory(category);
  // ... budget-aware assembly
}
```

### 2.3 Advanced RAG Features

| Task                                       | Priority | Effort | ADR Reference |
| ------------------------------------------ | -------- | ------ | ------------- |
| Implement hybrid search (vector + keyword) | High     | M      | ADR-0016      |
| Add embedding cache for repeated queries   | Medium   | M      | ADR-0016      |
| Implement semantic chunking strategy       | Medium   | L      | ADR-0016      |
| Add relevance score thresholds per feature | Medium   | S      | ADR-0016      |
| Create RAG monitoring dashboard            | Low      | M      | ADR-0016      |

**Hybrid Search Implementation**:

```typescript
// functions/src/rag/hybrid-search.ts
export async function hybridSearch(
  query: string,
  options: HybridSearchOptions = {},
): Promise<SearchResult[]> {
  const {
    vectorWeight = 0.7,
    keywordWeight = 0.3,
    topK = 5,
    minScore = 0.6,
  } = options;

  // Parallel search
  const [vectorResults, keywordResults] = await Promise.all([
    vectorSearch(query, { topK: topK * 2 }),
    keywordSearch(query, { topK: topK * 2 }),
  ]);

  // Combine and re-rank
  return combineResults(vectorResults, keywordResults, {
    vectorWeight,
    keywordWeight,
    topK,
    minScore,
  });
}
```

### 2.4 LangChain Foundation

| Task                                 | Priority | Effort | ADR Reference |
| ------------------------------------ | -------- | ------ | ------------- |
| Install LangChain packages           | High     | S      | ADR-0018      |
| Create Azure OpenAI LLM wrapper      | High     | S      | ADR-0018      |
| Create Azure AI Search retriever     | High     | M      | ADR-0018      |
| Implement basic RAG chain            | High     | M      | ADR-0018      |
| Create analysis chain for deep dives | Medium   | M      | ADR-0018      |

**Package Installation**:

```bash
cd apps/docs/functions
npm install langchain @langchain/openai @langchain/community @langchain/core zod
```

**Directory Structure**:

```
functions/src/langchain/
├── index.ts           # Exports
├── llm.ts             # Azure OpenAI wrapper
├── retrievers/
│   └── azure-search.ts
└── chains/
    ├── rag-chain.ts
    └── analysis-chain.ts
```

### 2.5 Phase 2 Milestones

| Milestone                 | Success Criteria                         |
| ------------------------- | ---------------------------------------- |
| Prompt Migration Complete | All AI functions use new template system |
| Context Optimization Live | Token usage reduced by 20%+              |
| Hybrid Search Active      | Relevance scores improved by 15%+        |
| LangChain RAG Chain       | Functional RAG using LangChain retriever |

---

## Phase 3: Advanced Features

**Goal**: Enable sophisticated AI capabilities with agents, tools, and
observability.

### 3.1 LangChain Agents

| Task                                 | Priority | Effort | ADR Reference |
| ------------------------------------ | -------- | ------ | ------------- |
| Create doc search tool               | High     | S      | ADR-0018      |
| Create web search tool (Bing API)    | High     | M      | ADR-0018      |
| Build research agent                 | High     | L      | ADR-0018      |
| Build competitive intelligence agent | Medium   | L      | ADR-0018      |
| Add tool execution logging           | Medium   | M      | ADR-0018      |

**Research Agent Implementation**:

```typescript
// functions/src/langchain/agents/research-agent.ts
const tools = [
  docSearchTool, // Search Phoenix docs
  webSearchTool, // Search web for competitor info
  calculatorTool, // For market size calculations
];

export const researchAgent = new AgentExecutor({
  agent: await createOpenAIToolsAgent({ llm: azureLLM, tools, prompt }),
  tools,
  maxIterations: 5,
  returnIntermediateSteps: true,
});

// Cloud Function endpoint
export const deepResearch = functions.https.onCall(async (data, context) => {
  requireAuth(context);

  const { topic, depth = "standard" } = data;
  const result = await researchAgent.invoke({
    input: `Research ${topic} for Phoenix Rooivalk competitive analysis`,
  });

  return {
    analysis: result.output,
    steps: result.intermediateSteps,
    toolsUsed: extractToolsUsed(result),
  };
});
```

### 3.2 Conversation Memory

| Task                                | Priority | Effort | ADR Reference |
| ----------------------------------- | -------- | ------ | ------------- |
| Implement Firestore chat history    | High     | M      | ADR-0018      |
| Create session management utilities | High     | M      | ADR-0018      |
| Build conversational RAG chain      | Medium   | M      | ADR-0018      |
| Add conversation summarization      | Low      | M      | ADR-0018      |

**Firestore Memory Schema**:

```typescript
// Firestore collection: chat_sessions
interface ChatSession {
  id: string;
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  messageCount: number;
  summary?: string;
}

// Firestore collection: chat_sessions/{sessionId}/messages
interface ChatMessage {
  role: "human" | "ai";
  content: string;
  timestamp: Timestamp;
  metadata?: {
    sources?: string[];
    toolsUsed?: string[];
  };
}
```

### 3.3 Multi-Step Workflows

| Task                                  | Priority | Effort | ADR Reference |
| ------------------------------------- | -------- | ------ | ------------- |
| Create market analysis workflow       | High     | L      | ADR-0018      |
| Create competitive landscape workflow | High     | L      | ADR-0018      |
| Add workflow state persistence        | Medium   | M      | ADR-0018      |
| Implement workflow resumption         | Low      | M      | ADR-0018      |

**Market Analysis Workflow**:

```typescript
// functions/src/langchain/workflows/market-analysis.ts
import { RunnableSequence } from "@langchain/core/runnables";

export const marketAnalysisWorkflow = RunnableSequence.from([
  // Step 1: Identify key market segments
  {
    segments: segmentIdentificationChain,
    topic: (input) => input.topic,
  },

  // Step 2: Research each segment in parallel
  async (input) => {
    const segmentAnalyses = await Promise.all(
      input.segments.map((segment) =>
        segmentResearchChain.invoke({ segment, topic: input.topic }),
      ),
    );
    return { ...input, segmentAnalyses };
  },

  // Step 3: Synthesize findings
  synthesisChain,

  // Step 4: Generate recommendations
  recommendationChain,
]);
```

### 3.4 Observability & Monitoring

| Task                            | Priority | Effort | ADR Reference |
| ------------------------------- | -------- | ------ | ------------- |
| Integrate LangSmith for tracing | High     | M      | ADR-0018      |
| Add prompt performance metrics  | High     | M      | ADR-0015      |
| Create RAG quality dashboard    | Medium   | L      | ADR-0016      |
| Implement A/B testing framework | Low      | L      | ADR-0015      |

**LangSmith Integration**:

```typescript
// functions/src/langchain/observability.ts
import { Client } from "langsmith";
import { LangChainTracer } from "langchain/callbacks";

const langsmithClient = new Client({
  apiUrl: "https://api.smith.langchain.com",
  apiKey: functions.config().langsmith?.api_key,
});

export const tracer = new LangChainTracer({
  projectName: "phoenix-rooivalk-ai",
  client: langsmithClient,
});

// Use in chains
const result = await ragChain.invoke(
  { input: question },
  { callbacks: [tracer] },
);
```

**Metrics to Track**:

| Metric                             | Source          | Dashboard        |
| ---------------------------------- | --------------- | ---------------- |
| Prompt latency (p50, p95, p99)     | Cloud Functions | Firebase Console |
| RAG relevance scores               | Azure AI Search | Custom Dashboard |
| Token usage per feature            | Azure OpenAI    | Azure Monitor    |
| Agent tool success rates           | LangSmith       | LangSmith UI     |
| User satisfaction (thumbs up/down) | Firestore       | Custom Dashboard |

### 3.5 Phase 3 Milestones

| Milestone           | Success Criteria                           |
| ------------------- | ------------------------------------------ |
| Research Agent Live | Agent successfully uses 2+ tools per query |
| Conversation Memory | Multi-turn conversations persist correctly |
| Market Workflow     | End-to-end workflow completes in < 30s     |
| Full Observability  | All AI calls traced in LangSmith           |

---

## Phase 4: Optimization & Scale (Future)

**Goal**: Production hardening and performance optimization.

### 4.1 Performance Optimization

| Task                                | Priority | Effort |
| ----------------------------------- | -------- | ------ |
| Implement streaming responses       | High     | M      |
| Add semantic result caching         | High     | L      |
| Optimize embedding batch processing | Medium   | M      |
| Reduce cold start latency           | Medium   | M      |

### 4.2 Advanced Features

| Task                             | Priority | Effort |
| -------------------------------- | -------- | ------ |
| Multi-modal RAG (images, PDFs)   | Medium   | L      |
| Query expansion with LLM         | Medium   | M      |
| User feedback loop for relevance | Low      | L      |
| Custom fine-tuned embeddings     | Low      | XL     |

### 4.3 Scale Preparation

| Task                               | Priority | Effort |
| ---------------------------------- | -------- | ------ |
| Load testing at 10x current volume | High     | M      |
| Rate limiting per user             | High     | M      |
| Cost optimization review           | Medium   | M      |
| Disaster recovery for AI services  | Medium   | L      |

---

## Dependencies & Prerequisites

### External Services

| Service         | Purpose          | Setup Required        |
| --------------- | ---------------- | --------------------- |
| Azure AI Search | Vector search    | ✅ Already configured |
| Azure OpenAI    | LLM + embeddings | ✅ Already configured |
| Firestore       | Storage + memory | ✅ Already configured |
| LangSmith       | Observability    | Phase 3               |
| Bing Search API | Web search tool  | Phase 3               |

### NPM Packages

**Phase 2 (LangChain Foundation)**:

```json
{
  "langchain": "^0.3.0",
  "@langchain/openai": "^0.3.0",
  "@langchain/community": "^0.3.0",
  "@langchain/core": "^0.3.0",
  "zod": "^3.22.0"
}
```

**Phase 3 (Agents + Observability)**:

```json
{
  "langsmith": "^0.1.0"
}
```

---

## Risk Mitigation

| Risk                        | Likelihood | Impact | Mitigation                                |
| --------------------------- | ---------- | ------ | ----------------------------------------- |
| LangChain breaking changes  | Medium     | Medium | Pin versions, test upgrades in staging    |
| RAG quality degradation     | Low        | High   | Monitor relevance scores, set alerts      |
| Cost overrun from LLM usage | Medium     | Medium | Implement usage quotas, track per-feature |
| Agent infinite loops        | Low        | Medium | Set maxIterations, add timeout            |
| Memory/context too large    | Medium     | Medium | Enforce token budgets, truncate           |

---

## Success Metrics

### Phase 2 Success Criteria

| Metric                       | Target                   | Measurement             |
| ---------------------------- | ------------------------ | ----------------------- |
| Prompt template adoption     | 100%                     | Code review             |
| Token efficiency improvement | 20% reduction            | Azure OpenAI metrics    |
| RAG relevance score          | > 0.75 avg               | Azure AI Search metrics |
| LangChain RAG parity         | Match custom performance | A/B test                |

### Phase 3 Success Criteria

| Metric                   | Target             | Measurement      |
| ------------------------ | ------------------ | ---------------- |
| Agent task completion    | > 90%              | LangSmith traces |
| Conversation coherence   | > 4/5 user rating  | User feedback    |
| Workflow completion time | < 30s for standard | Performance logs |
| Trace coverage           | 100% of AI calls   | LangSmith        |

---

## Team Assignments (Suggested)

| Phase | Component            | Suggested Owner   |
| ----- | -------------------- | ----------------- |
| 2.1   | Prompt Migration     | Backend Developer |
| 2.2   | Context Optimization | Backend Developer |
| 2.3   | Advanced RAG         | AI/ML Engineer    |
| 2.4   | LangChain Foundation | AI/ML Engineer    |
| 3.1   | Agents               | AI/ML Engineer    |
| 3.2   | Conversation Memory  | Backend Developer |
| 3.3   | Workflows            | AI/ML Engineer    |
| 3.4   | Observability        | DevOps/Platform   |

---

## Review Checkpoints

| Checkpoint         | Timing             | Attendees          | Focus                     |
| ------------------ | ------------------ | ------------------ | ------------------------- |
| Phase 2 Kickoff    | Start of Phase 2   | Tech Lead, AI Team | Scope confirmation        |
| Phase 2 Midpoint   | After 2.2 complete | Tech Lead, AI Team | Progress review           |
| Phase 2 Completion | End of Phase 2     | All stakeholders   | Demo + Phase 3 planning   |
| Phase 3 Kickoff    | Start of Phase 3   | Tech Lead, AI Team | Agent architecture review |
| Phase 3 Completion | End of Phase 3     | All stakeholders   | Production readiness      |

---

## Appendix: Quick Reference

### File Locations

| Component            | Path                               |
| -------------------- | ---------------------------------- |
| Prompt templates     | `functions/src/prompts/templates/` |
| Context modules      | `functions/src/prompts/context.ts` |
| RAG search           | `functions/src/rag/search.ts`      |
| LangChain (Phase 2+) | `functions/src/langchain/`         |
| AI functions         | `functions/src/ai/`                |

### Key Functions

| Function                  | Purpose               | Location                     |
| ------------------------- | --------------------- | ---------------------------- |
| `getPromptTemplate()`     | Get prompt by ID      | `prompts/index.ts`           |
| `searchDocuments()`       | RAG vector search     | `rag/search.ts`              |
| `buildRAGContext()`       | Format RAG results    | `rag/search.ts`              |
| `getContextForCategory()` | Select context layers | `prompts/context-builder.ts` |

### ADR Quick Links

- [ADR-0015: Prompt Management](./adr-0015-prompt-management.md)
- [ADR-0016: RAG Architecture](./adr-0016-rag-architecture.md)
- [ADR-0017: Context Management](./adr-0017-context-management.md)
- [ADR-0018: LangChain Integration](./adr-0018-langchain-integration.md)

---

_© 2025 Phoenix Rooivalk. Confidential._
