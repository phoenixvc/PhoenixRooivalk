---
id: adr-0017-context-management
title: "ADR 0017: Context Management Strategy"
sidebar_label: "ADR 0017: Context Management"
difficulty: intermediate
estimated_reading_time: 7
points: 30
tags:
  - technical
  - architecture
  - ai
  - context
  - prompts
prerequisites:
  - adr-0015-prompt-management
  - adr-0016-rag-architecture
---

# ADR 0017: Context Management Strategy

**Date**: 2025-11-27 **Status**: Accepted (Layered Context with Dynamic
Injection)

---

## Executive Summary

1. **Problem**: AI responses need consistent company context, but context
   requirements vary by feature and must fit within token limits
2. **Decision**: Layered context system with static company context, dynamic RAG
   context, and feature-specific context
3. **Trade-off**: More complex context assembly vs. optimal token usage and
   response relevance

---

## Context

Phoenix Rooivalk's AI features require different types of context:

| Feature             | Company Context | RAG Context    | Feature Context |
| ------------------- | --------------- | -------------- | --------------- |
| Competitor Analysis | ✅ Required     | ✅ Recommended | Focus areas     |
| SWOT Analysis       | ✅ Required     | ✅ Recommended | Topic details   |
| Market Insights     | ✅ Required     | ✅ Recommended | Industry focus  |
| Documentation Q&A   | ⚠️ Optional     | ✅ Required    | User question   |
| Recommendations     | ⚠️ Optional     | ✅ Required    | Reading history |

**Challenges**:

- Token limits constrain total context size
- Duplicate context wastes tokens
- Missing context leads to poor responses
- Different features need different context mixes

---

## Decision

**Layered context management system** with:

1. **Static layers**: Pre-defined company context modules
2. **Dynamic layers**: RAG-retrieved document context
3. **Feature layers**: Function-specific context (user input, history)
4. **Smart assembly**: Context builder that optimizes token usage

---

## Architecture

### Context Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Context Assembly                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Layer 1: Static Company Context (Always Available)         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ PHOENIX_CORE_CONTEXT     (~300 tokens)                │  │
│  │ - Company mission and products                        │  │
│  │ - Key differentiators                                 │  │
│  │ - Target markets                                      │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  Layer 2: Domain-Specific Context (Selected by Feature)     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ PHOENIX_TECHNICAL_CONTEXT (~400 tokens)               │  │
│  │ - Technical specifications                            │  │
│  │ - System architecture                                 │  │
│  │ - Integration details                                 │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │ PHOENIX_MARKET_CONTEXT   (~350 tokens)                │  │
│  │ - Market position                                     │  │
│  │ - Competitive landscape                               │  │
│  │ - Regional focus                                      │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  Layer 3: Dynamic RAG Context (Retrieved per Query)         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Retrieved documents (up to ~2000 tokens)              │  │
│  │ - Relevance-ranked                                    │  │
│  │ - Deduplicated                                        │  │
│  │ - Token-budget constrained                            │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  Layer 4: Feature Context (User Input & State)              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ - User query/question                                 │  │
│  │ - Reading history                                     │  │
│  │ - Current document                                    │  │
│  │ - Session state                                       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Context Definitions

```typescript
// Layer 1: Core context (always included)
export const PHOENIX_CORE_CONTEXT = `
Phoenix Rooivalk is a South African company developing autonomous
counter-drone defense systems. The Phoenix interceptor is an AI-guided
drone designed to detect, track, and neutralize hostile UAVs.

Key Differentiators:
- AI-first autonomous operation with minimal human-in-the-loop
- Rapid deployment capability for mobile defense
- Edge computing for real-time tactical decisions
- Cost-effective solution for emerging markets

Target Markets:
- Military and defense installations
- Critical infrastructure protection
- Event security and airspace control
- Border surveillance
`;

// Layer 2a: Technical context (for technical queries)
export const PHOENIX_TECHNICAL_CONTEXT = `
Phoenix Rooivalk Technical Specifications:

Propulsion System:
- Electric quad-rotor configuration
- 30+ minute operational flight time
- All-weather capable

Detection Suite:
- Multi-sensor fusion (radar, RF, optical, acoustic)
- AI-powered threat classification
- 5km+ detection range

Tracking & Engagement:
- Neural network trajectory prediction
- Sub-second target lock
- Kinetic intercept and electronic warfare options

Integration:
- Open API for C4ISR integration
- NATO STANAG compliant data formats
- Mesh networking for swarm coordination
`;

// Layer 2b: Market context (for business queries)
export const PHOENIX_MARKET_CONTEXT = `
Phoenix Rooivalk Market Position:

Competitive Landscape:
- Direct competitors: Anduril (USA), DroneShield (AUS), Dedrone (USA)
- Regional competitors: Various local defense contractors
- USP: Cost-effective, autonomous, Africa-first approach

Market Strategy:
- Primary: African defense and security markets
- Expansion: Middle East, Eastern Europe, South Asia
- Go-to-market: Government contracts, partnerships

Key Advantages:
- 40-60% lower cost than Western alternatives
- Local manufacturing and support
- Designed for resource-constrained environments
- No export restrictions (non-ITAR)
`;
```

---

## Context Selection Logic

### Category-Based Selection

```typescript
import { PromptCategory } from "./types";

/**
 * Get appropriate context modules for a prompt category
 */
export function getContextForCategory(category: PromptCategory): string[] {
  const contexts: string[] = [PHOENIX_CORE_CONTEXT]; // Always include core

  switch (category) {
    case "analysis":
      // Competitive analysis needs both technical and market
      contexts.push(PHOENIX_TECHNICAL_CONTEXT);
      contexts.push(PHOENIX_MARKET_CONTEXT);
      break;

    case "retrieval":
      // Q&A primarily uses RAG, minimal static context
      // Core context is sufficient
      break;

    case "recommendation":
      // Recommendations don't need deep company context
      // Core context is sufficient
      break;

    case "technical":
      // Technical queries need specs
      contexts.push(PHOENIX_TECHNICAL_CONTEXT);
      break;

    case "business":
      // Business queries need market position
      contexts.push(PHOENIX_MARKET_CONTEXT);
      break;
  }

  return contexts;
}
```

### Token Budget Management

```typescript
interface ContextBudget {
  totalBudget: number; // Total tokens available for context
  staticBudget: number; // Reserved for static context
  ragBudget: number; // Available for RAG context
  featureBudget: number; // Available for feature context
}

/**
 * Calculate context budgets based on model limits
 */
export function calculateContextBudget(
  modelMaxTokens: number,
  expectedOutputTokens: number,
): ContextBudget {
  // Reserve tokens for output and prompt overhead
  const totalBudget = modelMaxTokens - expectedOutputTokens - 500;

  return {
    totalBudget,
    staticBudget: Math.min(1000, totalBudget * 0.2), // 20% for static
    ragBudget: Math.min(2000, totalBudget * 0.5), // 50% for RAG
    featureBudget: Math.min(500, totalBudget * 0.3), // 30% for feature
  };
}
```

---

## RAG Context Integration

### Building RAG Context Section

```typescript
/**
 * Build a formatted RAG context section with sources
 */
export function buildRAGContextSection(
  ragContext: string,
  sources: Array<{ title: string; section?: string }>,
): string {
  if (!ragContext) return "";

  const sourceList = sources
    .map((s, i) => `[${i + 1}] ${s.title}${s.section ? ` - ${s.section}` : ""}`)
    .join("\n");

  return `
---
RELEVANT DOCUMENTATION:

${ragContext}

Sources:
${sourceList}
---`;
}
```

### Context Injection Patterns

```typescript
// Pattern 1: Inline RAG context in system prompt
function buildSystemPromptWithRAG(
  basePrompt: string,
  ragContext?: string,
): string {
  if (!ragContext) return basePrompt;

  return `${basePrompt}

DOCUMENTATION CONTEXT:
${ragContext}

Use the above documentation to ground your responses. Cite sources using [Source X] notation.`;
}

// Pattern 2: Template-based injection
function injectContext(
  template: PromptTemplate,
  contexts: Record<string, string>,
): string {
  let result = template.system.base;

  // Replace context markers
  for (const [key, value] of Object.entries(contexts)) {
    result = result.replace(`{{${key}}}`, value);
  }

  return result;
}
```

---

## Options Considered

### Option 1: Layered Context ✅ Selected

| Aspect               | Details                                      |
| -------------------- | -------------------------------------------- |
| **Structure**        | Multiple context layers with selection logic |
| **Flexibility**      | Features select appropriate layers           |
| **Token efficiency** | Budget-aware assembly                        |

**Pros**:

- Optimal token usage per feature
- Reusable context modules
- Clear separation of concerns
- Testable layer selection

**Cons**:

- More complex implementation
- Requires careful budget management
- Layer selection logic needs maintenance

---

### Option 2: Monolithic Context

| Aspect               | Details                     |
| -------------------- | --------------------------- |
| **Structure**        | Single large context string |
| **Flexibility**      | None - all or nothing       |
| **Token efficiency** | Poor - always uses max      |

**Pros**:

- Simple implementation
- Consistent across features

**Cons**:

- Wastes tokens for simple queries
- May exceed limits for complex features
- No customization per feature

---

### Option 3: Dynamic-Only (RAG Only)

| Aspect               | Details                    |
| -------------------- | -------------------------- |
| **Structure**        | Only RAG-retrieved context |
| **Flexibility**      | Depends on retrieval       |
| **Token efficiency** | Variable                   |

**Pros**:

- Always relevant to query
- No redundant static content

**Cons**:

- May miss important company context
- Retrieval failures = no context
- Inconsistent base knowledge

---

### Option 4: Cognitive Mesh (Future)

| Aspect               | Details                                   |
| -------------------- | ----------------------------------------- |
| **Structure**        | Knowledge Layer with contextual reasoning |
| **Flexibility**      | Dynamic context assembly with governance  |
| **Token efficiency** | Optimized via knowledge graphs            |
| **Platform**         | C#/.NET 9.0+ (different tech stack)       |

**Repository**: https://github.com/justaghost/cognitive-mesh

**Pros**:

- Enterprise-grade context governance
- Knowledge graph-based context relationships
- Built-in token budget optimization
- Audit trail for context usage
- Multi-tenant context isolation

**Cons**:

- Different tech stack (C#/.NET vs TypeScript)
- Currently in development, not yet deployed
- Higher operational complexity
- Migration effort from current TypeScript implementation

**When to Consider**:

- When context governance becomes critical
- When multi-tenant isolation is required
- When audit trails for context usage are mandated
- When knowledge graph relationships would improve context quality

**Current Status**: In development. Evaluate when compliance requirements
increase.

---

## Rationale

### Why Layered Context?

| Factor               | Layered            | Monolithic          | Dynamic-Only           | Cognitive Mesh |
| -------------------- | ------------------ | ------------------- | ---------------------- | -------------- |
| **Token efficiency** | ✅ Optimal         | ❌ Wasteful         | ⚠️ Variable            | ✅ Optimized   |
| **Consistency**      | ✅ Base + dynamic  | ✅ Always same      | ❌ Query-dependent     | ✅ Governed    |
| **Flexibility**      | ✅ Per-feature     | ❌ None             | ⚠️ Limited             | ✅ Full        |
| **Reliability**      | ✅ Fallback layers | ✅ Always available | ❌ Retrieval-dependent | ✅ Resilient   |
| **Governance**       | ⚠️ Manual          | ⚠️ Manual           | ❌ None                | ✅ Built-in    |
| **Stack fit**        | ✅ TypeScript      | ✅ TypeScript       | ✅ TypeScript          | ⚠️ C#/.NET     |

**Decision**: Layered context provides the best balance of efficiency,
consistency, and flexibility for our diverse AI features. Cognitive Mesh remains
an option when enterprise governance requirements increase.

---

## Implementation Examples

### Example 1: Competitor Analysis

```typescript
async function buildCompetitorPrompt(
  competitors: string[],
  focusAreas?: string[],
): Promise<PromptParts> {
  // 1. Select static context layers
  const staticContext = getContextForCategory("analysis").join("\n\n");

  // 2. Retrieve RAG context
  const ragResults = await searchDocuments(
    `Phoenix Rooivalk vs ${competitors.join(" ")} ${focusAreas?.join(" ")}`,
    { topK: 5 },
  );
  const ragContext = buildRAGContextSection(ragResults);

  // 3. Assemble system prompt
  const systemPrompt = `${COMPETITOR_PROMPT.system.base}

${staticContext}

${ragContext}`;

  // 4. Build user prompt
  const userPrompt = interpolate(COMPETITOR_PROMPT.user.template, {
    competitors: competitors.join(", "),
    focusAreas: focusAreas?.join(", ") || "all aspects",
  });

  return { systemPrompt, userPrompt };
}
```

### Example 2: Documentation Q&A

```typescript
async function buildQAPrompt(question: string): Promise<PromptParts> {
  // 1. Minimal static context (just core)
  const staticContext = PHOENIX_CORE_CONTEXT;

  // 2. Heavy RAG context (primary source)
  const ragResults = await searchDocuments(question, { topK: 8 });
  const ragContext = buildRAGContextSection(ragResults);

  // 3. Assemble with RAG priority
  const systemPrompt = `${RAG_QUERY_PROMPT.system.base}

Company Background:
${staticContext}

${ragContext}

IMPORTANT: Answer ONLY using the documentation context above.`;

  return { systemPrompt, userPrompt: question };
}
```

---

## Token Estimation

### Utility Functions

```typescript
/**
 * Estimate token count (rough approximation)
 * GPT models: ~4 chars per token for English
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Truncate text to fit token budget
 */
export function truncateToTokenBudget(text: string, maxTokens: number): string {
  const estimated = estimateTokens(text);

  if (estimated <= maxTokens) return text;

  // Truncate with buffer for safety
  const targetChars = maxTokens * 4 * 0.9;
  return text.slice(0, targetChars) + "\n[...truncated]";
}

/**
 * Fit multiple context sections into budget
 */
export function fitContextsToBudget(
  contexts: Array<{ content: string; priority: number }>,
  budget: number,
): string[] {
  // Sort by priority (highest first)
  const sorted = [...contexts].sort((a, b) => b.priority - a.priority);

  const result: string[] = [];
  let remaining = budget;

  for (const ctx of sorted) {
    const tokens = estimateTokens(ctx.content);

    if (tokens <= remaining) {
      result.push(ctx.content);
      remaining -= tokens;
    } else if (remaining > 100) {
      // Truncate to fit remaining budget
      result.push(truncateToTokenBudget(ctx.content, remaining));
      break;
    }
  }

  return result;
}
```

---

## Consequences

### Positive

- **Efficient token usage**: Features only include relevant context
- **Consistent base knowledge**: Core context always available
- **Flexible composition**: Easy to adjust per feature
- **Testable**: Context selection logic is deterministic
- **Maintainable**: Context updates in one place

### Negative

- **Complexity**: More moving parts than simple approach
- **Budget tuning**: May need adjustment as features evolve
- **Testing overhead**: Need to test layer combinations

### Risks

| Risk                              | Mitigation                        |
| --------------------------------- | --------------------------------- |
| Context too large                 | Token budget enforcement          |
| Wrong layers selected             | Unit tests for selection logic    |
| Stale static context              | Regular review of context modules |
| RAG context conflicts with static | Clear priority rules              |

---

## Monitoring

### Metrics to Track

| Metric             | Purpose    | Target |
| ------------------ | ---------- | ------ |
| Avg context tokens | Efficiency | < 2500 |
| Static context %   | Balance    | 20-40% |
| RAG context hits   | Relevance  | > 80%  |
| Truncation rate    | Budget fit | < 5%   |

### Logging

```typescript
logger.info("Context assembled", {
  feature: "competitor-analysis",
  staticLayers: ["core", "technical", "market"],
  staticTokens: 1050,
  ragResults: 5,
  ragTokens: 1200,
  totalTokens: 2250,
  budgetUsed: "75%",
});
```

---

## Future Enhancements

### Planned

1. **Adaptive budgets**: Learn optimal budgets per feature
2. **Context caching**: Cache assembled contexts for repeated queries
3. **User-specific context**: Include user preferences/history

### Considered

1. **Compression**: Summarize long contexts to fit budget
2. **Multi-turn context**: Maintain context across conversation
3. **Context scoring**: Track which context sections improve responses

---

## Implementation Recommendation

### Decision: **Keep Here** ✅

| Factor                 | Assessment                             |
| ---------------------- | -------------------------------------- |
| **Current Status**     | Implemented with layered context       |
| **CM Equivalent**      | ReasoningLayer (~35% complete)         |
| **Migration Value**    | Low - current approach is sufficient   |
| **Resource Trade-off** | Knowledge graphs are overkill for docs |

**Rationale**: The layered context approach with static company context +
dynamic RAG context adequately serves the documentation site. Cognitive Mesh
uses knowledge graph relationships for context, which adds complexity without
proportional benefit for a documentation use case.

**Action**: No changes needed. Continue using current implementation.

See
[ADR 0000 Appendix: CM Feature Recommendations](./adr-0000-appendix-cogmesh-feature-recommendations.md)
for full analysis.

---

## Related ADRs

- [ADR 0000: ADR Management](./adr-0000-adr-management.md) - Platform decision
  framework
- [ADR 0015: Prompt Management](./adr-0015-prompt-management.md)
- [ADR 0016: RAG Architecture](./adr-0016-rag-architecture.md)
- [ADR 0012: Runtime Functions Architecture](./adr-0012-runtime-functions.md)
- [Cognitive Mesh](https://github.com/justaghost/cognitive-mesh) - Future
  enterprise platform

---

_© 2025 Phoenix Rooivalk. Confidential._
