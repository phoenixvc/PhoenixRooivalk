---
id: adr-0020-agent-tools
title: "ADR 0020: Agent Tools Framework"
sidebar_label: "ADR 0020: Agent Tools"
difficulty: advanced
estimated_reading_time: 9
points: 35
tags:
  - technical
  - architecture
  - ai
  - tools
  - langchain
prerequisites:
  - adr-0018-langchain-integration
  - adr-0019-ai-agents
---

# ADR 0020: Agent Tools Framework

**Date**: 2025-11-27
**Status**: Proposed (LangChain Dynamic Tools with Zod Schemas)

---

## Executive Summary

1. **Problem**: AI agents need to interact with external systems (search, APIs, calculations) in a structured, type-safe manner
2. **Decision**: Implement LangChain DynamicStructuredTools with Zod schemas for type validation
3. **Trade-off**: Tool complexity vs. agent capability; each tool adds potential failure modes

---

## Context

Agents require tools to:
- Search Phoenix documentation (internal knowledge)
- Search the web (external knowledge)
- Perform calculations (market sizing, ROI)
- Query databases (competitor data, metrics)
- Take notes (for synthesis)

**Requirements**:
- Type-safe inputs with validation
- Consistent error handling
- Timeout and retry logic
- Usage tracking and logging
- Rate limiting for external APIs

---

## Decision

**LangChain DynamicStructuredTool** with:
1. Zod schemas for input validation
2. Centralized tool registry
3. Consistent error handling wrapper
4. Usage metrics collection

---

## Tool Architecture

### Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      Tool Framework                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌───────────────────────────────────────────────────────────┐ │
│   │                    Tool Registry                           │ │
│   │  - Register tools by name                                 │ │
│   │  - Provide tool descriptions to agents                    │ │
│   │  - Track tool usage                                       │ │
│   └───────────────────────────────────────────────────────────┘ │
│                              │                                   │
│       ┌──────────────────────┼──────────────────────┐           │
│       ▼                      ▼                      ▼           │
│   ┌────────┐            ┌────────┐            ┌────────┐        │
│   │  Core  │            │External│            │  Data  │        │
│   │ Tools  │            │  APIs  │            │ Tools  │        │
│   └────────┘            └────────┘            └────────┘        │
│   │ Doc Search │        │ Web Search │        │ Calculator │    │
│   │ Note Taking │       │ News API   │        │ Data Query │    │
│   └────────────┘        └────────────┘        └────────────┘    │
│                                                                  │
│   ┌───────────────────────────────────────────────────────────┐ │
│   │                    Tool Wrapper                            │ │
│   │  - Input validation (Zod)                                 │ │
│   │  - Error handling                                         │ │
│   │  - Timeout management                                     │ │
│   │  - Usage logging                                          │ │
│   └───────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
functions/src/langchain/tools/
├── index.ts              # Tool registry and exports
├── wrapper.ts            # Tool wrapper with error handling
├── core/
│   ├── doc-search.ts     # Phoenix documentation search
│   ├── note-taking.ts    # Intermediate note storage
│   └── summary.ts        # Text summarization
├── external/
│   ├── web-search.ts     # Bing/Google web search
│   ├── news-search.ts    # News API search
│   └── company-info.ts   # Company data API
└── data/
    ├── calculator.ts     # Mathematical calculations
    ├── data-query.ts     # Firestore data queries
    └── competitor-db.ts  # Competitor database
```

---

## Core Tools

### 1. Document Search Tool

Search Phoenix Rooivalk internal documentation.

```typescript
// langchain/tools/core/doc-search.ts
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { searchDocuments } from "../../rag/search";
import { wrapTool } from "../wrapper";

const docSearchSchema = z.object({
  query: z.string().describe("The search query for Phoenix documentation"),
  maxResults: z.number().min(1).max(10).default(5).describe("Maximum results to return"),
  category: z.enum(["technical", "business", "all"]).default("all").describe("Document category filter"),
});

export const docSearchTool = wrapTool(
  new DynamicStructuredTool({
    name: "search_phoenix_docs",
    description: `Search Phoenix Rooivalk internal documentation for technical specifications,
product information, company details, and internal knowledge. Use this FIRST before web search
for any Phoenix-related questions.`,
    schema: docSearchSchema,
    func: async ({ query, maxResults, category }) => {
      const results = await searchDocuments(query, {
        topK: maxResults,
        category: category === "all" ? undefined : category,
      });

      if (results.length === 0) {
        return "No relevant documents found in Phoenix documentation.";
      }

      return results
        .map((r, i) => `[Doc ${i + 1}: ${r.title}]\n${r.content}\nRelevance: ${(r.score * 100).toFixed(0)}%`)
        .join("\n\n---\n\n");
    },
  }),
  { timeout: 10000, retries: 2 }
);
```

### 2. Note Taking Tool

Store intermediate findings for synthesis.

```typescript
// langchain/tools/core/note-taking.ts
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { wrapTool } from "../wrapper";

// In-memory note storage (per agent execution)
const noteStore = new Map<string, string[]>();

const noteTakingSchema = z.object({
  note: z.string().describe("The note content to save"),
  category: z.string().default("general").describe("Category for organizing notes"),
});

export const noteTakingTool = wrapTool(
  new DynamicStructuredTool({
    name: "take_note",
    description: `Save important findings or insights for later synthesis.
Use this to keep track of key information discovered during research.`,
    schema: noteTakingSchema,
    func: async ({ note, category }) => {
      const key = category;
      if (!noteStore.has(key)) {
        noteStore.set(key, []);
      }
      noteStore.get(key)!.push(note);

      return `Note saved under "${category}". Total notes in category: ${noteStore.get(key)!.length}`;
    },
  }),
  { timeout: 1000 }
);

// Retrieve notes (called at end of agent execution)
export function getNotes(category?: string): Record<string, string[]> {
  if (category) {
    return { [category]: noteStore.get(category) || [] };
  }
  return Object.fromEntries(noteStore.entries());
}

export function clearNotes(): void {
  noteStore.clear();
}
```

---

## External API Tools

### 3. Web Search Tool

Search the web using Bing Search API.

```typescript
// langchain/tools/external/web-search.ts
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import * as functions from "firebase-functions";
import { wrapTool } from "../wrapper";

const config = functions.config();

const webSearchSchema = z.object({
  query: z.string().describe("The web search query"),
  maxResults: z.number().min(1).max(10).default(5).describe("Maximum results"),
  freshness: z.enum(["day", "week", "month", "all"]).default("all").describe("Time filter for results"),
  market: z.string().default("en-US").describe("Market/region for results"),
});

export const webSearchTool = wrapTool(
  new DynamicStructuredTool({
    name: "web_search",
    description: `Search the web for current information about competitors, market trends,
news, and external data. Use for information NOT in Phoenix documentation.`,
    schema: webSearchSchema,
    func: async ({ query, maxResults, freshness, market }) => {
      const freshnessParam = freshness === "all" ? "" : `&freshness=${freshness}`;

      const response = await fetch(
        `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}&count=${maxResults}${freshnessParam}&mkt=${market}`,
        {
          headers: {
            "Ocp-Apim-Subscription-Key": config.bing.api_key,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Bing API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.webPages?.value?.length) {
        return "No web results found for this query.";
      }

      return data.webPages.value
        .map((r: any, i: number) => `[Result ${i + 1}]\nTitle: ${r.name}\nURL: ${r.url}\nSnippet: ${r.snippet}`)
        .join("\n\n---\n\n");
    },
  }),
  { timeout: 15000, retries: 2, rateLimit: { maxPerMinute: 30 } }
);
```

### 4. News Search Tool

Search recent news articles.

```typescript
// langchain/tools/external/news-search.ts
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import * as functions from "firebase-functions";
import { wrapTool } from "../wrapper";

const config = functions.config();

const newsSearchSchema = z.object({
  query: z.string().describe("News search query"),
  maxResults: z.number().min(1).max(10).default(5),
  category: z.enum(["business", "technology", "world", "all"]).default("all"),
});

export const newsSearchTool = wrapTool(
  new DynamicStructuredTool({
    name: "news_search",
    description: `Search recent news articles about companies, industries, or events.
Good for competitor announcements, market news, and industry developments.`,
    schema: newsSearchSchema,
    func: async ({ query, maxResults, category }) => {
      const categoryParam = category === "all" ? "" : `&category=${category}`;

      const response = await fetch(
        `https://api.bing.microsoft.com/v7.0/news/search?q=${encodeURIComponent(query)}&count=${maxResults}${categoryParam}`,
        {
          headers: {
            "Ocp-Apim-Subscription-Key": config.bing.api_key,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Bing News API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.value?.length) {
        return "No news articles found for this query.";
      }

      return data.value
        .map((article: any, i: number) =>
          `[News ${i + 1}]\nHeadline: ${article.name}\nSource: ${article.provider?.[0]?.name || "Unknown"}\nDate: ${article.datePublished}\nSummary: ${article.description}`)
        .join("\n\n---\n\n");
    },
  }),
  { timeout: 15000, retries: 2, rateLimit: { maxPerMinute: 30 } }
);
```

---

## Data Tools

### 5. Calculator Tool

Perform mathematical calculations.

```typescript
// langchain/tools/data/calculator.ts
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { wrapTool } from "../wrapper";

const calculatorSchema = z.object({
  expression: z.string().describe("Mathematical expression to evaluate (e.g., '1000000 * 0.15')"),
  description: z.string().optional().describe("Description of what this calculation represents"),
});

export const calculatorTool = wrapTool(
  new DynamicStructuredTool({
    name: "calculator",
    description: `Perform mathematical calculations. Use for market sizing, ROI calculations,
growth projections, and other quantitative analysis. Supports basic arithmetic, percentages, and common functions.`,
    schema: calculatorSchema,
    func: async ({ expression, description }) => {
      // Sanitize expression - only allow safe math operations
      const sanitized = expression.replace(/[^0-9+\-*/().%\s]/g, "");

      if (sanitized !== expression.replace(/\s/g, "").replace(/\s/g, "")) {
        throw new Error("Invalid characters in expression. Only numbers and basic operators allowed.");
      }

      try {
        // Safe evaluation using Function constructor
        const result = new Function(`return ${sanitized}`)();

        if (typeof result !== "number" || !isFinite(result)) {
          throw new Error("Invalid result");
        }

        const formatted = result.toLocaleString("en-US", {
          maximumFractionDigits: 2,
        });

        return description
          ? `${description}: ${formatted}`
          : `Result: ${formatted}`;
      } catch (error) {
        throw new Error(`Calculation failed: ${error}`);
      }
    },
  }),
  { timeout: 1000 }
);
```

### 6. Competitor Database Tool

Query competitor information from database.

```typescript
// langchain/tools/data/competitor-db.ts
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { db } from "../../config/firebase";
import { wrapTool } from "../wrapper";

const competitorDbSchema = z.object({
  competitor: z.string().describe("Competitor name to look up"),
  fields: z.array(z.enum([
    "overview",
    "products",
    "funding",
    "customers",
    "technology",
    "all"
  ])).default(["all"]).describe("Specific fields to retrieve"),
});

export const competitorDbTool = wrapTool(
  new DynamicStructuredTool({
    name: "competitor_database",
    description: `Query the Phoenix competitor database for structured information about
known competitors. Contains verified data about products, funding, customers, and technology.`,
    schema: competitorDbSchema,
    func: async ({ competitor, fields }) => {
      const normalizedName = competitor.toLowerCase().replace(/\s+/g, "-");

      const doc = await db.collection("competitors").doc(normalizedName).get();

      if (!doc.exists) {
        return `No database entry found for "${competitor}". Try using web_search instead.`;
      }

      const data = doc.data()!;
      const wantAll = fields.includes("all");

      const sections: string[] = [];

      if (wantAll || fields.includes("overview")) {
        sections.push(`## Overview\n${data.overview || "No overview available"}`);
      }
      if (wantAll || fields.includes("products")) {
        sections.push(`## Products\n${data.products?.join("\n- ") || "No product data"}`);
      }
      if (wantAll || fields.includes("funding")) {
        sections.push(`## Funding\n${data.funding || "No funding data"}`);
      }
      if (wantAll || fields.includes("customers")) {
        sections.push(`## Key Customers\n${data.customers?.join("\n- ") || "No customer data"}`);
      }
      if (wantAll || fields.includes("technology")) {
        sections.push(`## Technology\n${data.technology || "No technology data"}`);
      }

      return `# ${data.name || competitor}\n\n${sections.join("\n\n")}\n\nLast updated: ${data.updatedAt?.toDate?.()?.toISOString() || "Unknown"}`;
    },
  }),
  { timeout: 5000 }
);
```

---

## Tool Wrapper

```typescript
// langchain/tools/wrapper.ts
import { DynamicStructuredTool } from "@langchain/core/tools";
import { logger } from "firebase-functions";

interface WrapperOptions {
  timeout?: number;
  retries?: number;
  rateLimit?: {
    maxPerMinute: number;
  };
}

const rateLimitCounters = new Map<string, { count: number; resetAt: number }>();

export function wrapTool(
  tool: DynamicStructuredTool,
  options: WrapperOptions = {}
): DynamicStructuredTool {
  const { timeout = 30000, retries = 1, rateLimit } = options;
  const originalFunc = tool.func;

  tool.func = async (input: any) => {
    const startTime = Date.now();
    const toolName = tool.name;

    // Rate limiting
    if (rateLimit) {
      const now = Date.now();
      const counter = rateLimitCounters.get(toolName) || { count: 0, resetAt: now + 60000 };

      if (now > counter.resetAt) {
        counter.count = 0;
        counter.resetAt = now + 60000;
      }

      if (counter.count >= rateLimit.maxPerMinute) {
        throw new Error(`Rate limit exceeded for ${toolName}. Try again in ${Math.ceil((counter.resetAt - now) / 1000)}s`);
      }

      counter.count++;
      rateLimitCounters.set(toolName, counter);
    }

    // Execute with timeout and retries
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const result = await Promise.race([
          originalFunc(input),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Tool timeout after ${timeout}ms`)), timeout)
          ),
        ]);

        logger.info("Tool execution successful", {
          tool: toolName,
          durationMs: Date.now() - startTime,
          attempt,
        });

        return result;
      } catch (error) {
        lastError = error as Error;

        logger.warn("Tool execution failed", {
          tool: toolName,
          attempt,
          error: lastError.message,
        });

        if (attempt < retries) {
          // Exponential backoff
          await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
        }
      }
    }

    logger.error("Tool execution failed after retries", {
      tool: toolName,
      error: lastError?.message,
    });

    return `Tool error: ${lastError?.message || "Unknown error"}. The agent should try a different approach.`;
  };

  return tool;
}
```

---

## Tool Registry

```typescript
// langchain/tools/index.ts
import { DynamicStructuredTool } from "@langchain/core/tools";
import { docSearchTool } from "./core/doc-search";
import { noteTakingTool, getNotes, clearNotes } from "./core/note-taking";
import { webSearchTool } from "./external/web-search";
import { newsSearchTool } from "./external/news-search";
import { calculatorTool } from "./data/calculator";
import { competitorDbTool } from "./data/competitor-db";

// Tool registry
export const TOOL_REGISTRY: Record<string, DynamicStructuredTool> = {
  search_phoenix_docs: docSearchTool,
  take_note: noteTakingTool,
  web_search: webSearchTool,
  news_search: newsSearchTool,
  calculator: calculatorTool,
  competitor_database: competitorDbTool,
};

// Get tools by names
export function getTools(names: string[]): DynamicStructuredTool[] {
  return names.map((name) => {
    const tool = TOOL_REGISTRY[name];
    if (!tool) {
      throw new Error(`Unknown tool: ${name}`);
    }
    return tool;
  });
}

// Get all tools
export function getAllTools(): DynamicStructuredTool[] {
  return Object.values(TOOL_REGISTRY);
}

// Tool sets for different agents
export const RESEARCH_TOOLS = getTools([
  "search_phoenix_docs",
  "web_search",
  "take_note",
]);

export const COMPETITIVE_INTEL_TOOLS = getTools([
  "search_phoenix_docs",
  "web_search",
  "news_search",
  "competitor_database",
  "calculator",
]);

export const ANALYST_TOOLS = getTools([
  "search_phoenix_docs",
  "web_search",
  "calculator",
  "competitor_database",
]);

// Re-export utilities
export { getNotes, clearNotes };
export {
  docSearchTool,
  noteTakingTool,
  webSearchTool,
  newsSearchTool,
  calculatorTool,
  competitorDbTool,
};
```

---

## Tool Usage Guidelines

### For Agents

| Tool | When to Use | When NOT to Use |
|------|-------------|-----------------|
| `search_phoenix_docs` | Phoenix product info, specs, internal data | External competitors, market data |
| `web_search` | Competitors, market trends, current events | Phoenix-specific information |
| `news_search` | Recent announcements, industry news | Historical data, technical specs |
| `calculator` | Market sizing, ROI, projections | Complex formulas, statistics |
| `competitor_database` | Known competitors (structured data) | New/unknown competitors |
| `take_note` | Key findings during research | Final output |

### Best Practices

1. **Start with internal tools**: Always check Phoenix docs first
2. **Be specific**: Use targeted queries rather than broad searches
3. **Validate external data**: Cross-reference web results
4. **Track sources**: Note where information came from
5. **Handle failures gracefully**: If one tool fails, try alternatives

---

## Option: Cognitive Mesh Tools (Future)

### Alternative Framework

| Aspect | Details |
|--------|---------|
| **Framework** | Cognitive Mesh Agency Layer |
| **Validation** | Built-in governance and RBAC |
| **Platform** | C#/.NET 9.0+ |

**Repository**: https://github.com/justaghost/cognitive-mesh

**Pros**:
- Enterprise-grade tool governance
- RBAC per tool with audit logging
- Built-in rate limiting and quota management
- Tool usage compliance tracking
- Ethical guardrails for tool invocation
- Multi-tenant tool isolation

**Cons**:
- Different tech stack (C#/.NET vs TypeScript)
- Currently in development
- Migration effort from LangChain tools

**When to Consider**:
- When tool governance becomes critical
- When audit trails for tool usage are required
- When multi-tenant tool isolation is needed
- When compliance mandates tool-level RBAC

**Current Status**: In development. Evaluate when tool governance requirements increase.

---

## Consequences

### Positive

- **Type safety**: Zod schemas validate all inputs
- **Reliability**: Retry logic and timeouts prevent hangs
- **Observability**: All tool usage is logged
- **Extensibility**: Easy to add new tools to registry

### Negative

- **Complexity**: Each tool is a potential failure point
- **Latency**: External API calls add time
- **Cost**: Some APIs have per-call costs
- **Maintenance**: External APIs may change

### Risks

| Risk | Mitigation |
|------|------------|
| API rate limits | Built-in rate limiting |
| API changes | Version pinning, monitoring |
| Tool misuse | Clear descriptions, routing |
| Data staleness | Timestamp tracking, refresh |

---

## Implementation Recommendation

### Decision: **Implement in Cognitive Mesh** 🔶

| Factor | Assessment |
|--------|------------|
| **Current Status** | Proposed (not implemented) |
| **CM Equivalent** | Agency Layer tools (~35% complete) |
| **CM Advantage** | RBAC per tool, usage governance, compliance |
| **Resource Trade-off** | Tool governance is complex, CM has it designed |

**Rationale**: Cognitive Mesh's Agency Layer includes tool-level RBAC, usage quotas, and compliance tracking. Implementing a full tools framework here requires significant effort for governance features that CM already has in its architecture.

**Action**: 
- **Do NOT implement** full tools framework in docs site
- **Complete CM Agency Layer tools system**
- Keep existing simple tools (doc search via Azure AI Search)
- No need for LangChain DynamicTools wrapper

**For docs site**: Simple doc search tool is sufficient. No web search or calculator tools needed.

See [ADR 0000 Appendix: CM Feature Recommendations](./adr-0000-appendix-cogmesh-feature-recommendations.md) for full analysis.

---

## Related ADRs

- [ADR 0000: ADR Management](./adr-0000-adr-management.md) - Platform decision framework
- [ADR 0018: LangChain Integration](./adr-0018-langchain-integration.md)
- [ADR 0019: AI Agents Architecture](./adr-0019-ai-agents.md)
- [ADR 0016: RAG Architecture](./adr-0016-rag-architecture.md)
- [Cognitive Mesh](https://github.com/justaghost/cognitive-mesh) - Future enterprise platform

---

_© 2025 Phoenix Rooivalk. Confidential._
