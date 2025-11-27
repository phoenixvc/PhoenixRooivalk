---
id: adr-0015-prompt-management
title: "ADR 0015: Prompt Management System"
sidebar_label: "ADR 0015: Prompt Management"
difficulty: intermediate
estimated_reading_time: 8
points: 30
tags:
  - technical
  - architecture
  - ai
  - prompts
  - llm
prerequisites:
  - adr-0012-runtime-functions
---

# ADR 0015: Prompt Management System

**Date**: 2025-11-27
**Status**: Accepted (Centralized Template System with Versioning)

---

## Executive Summary

1. **Problem**: AI prompts scattered across multiple files, difficult to optimize, version, and audit
2. **Decision**: Centralized prompt management system with versioned templates, metadata, and type safety
3. **Trade-off**: Additional structure vs. flexibility; chosen for maintainability at scale

---

## Context

Phoenix Rooivalk's documentation site uses multiple AI-powered features:

```
AI Features
├── Competitor Analysis
├── SWOT Analysis
├── Market Insights
├── Documentation Q&A (RAG)
├── Reading Recommendations
└── Document Improvement Suggestions
```

**Problems with scattered prompts**:
- Prompts embedded directly in function code
- No version tracking for prompt changes
- No standardized format for prompt templates
- Difficult to A/B test or optimize prompts
- No audit trail for prompt modifications
- Inconsistent context injection across features

---

## Decision

**Centralized prompt management system** at `/functions/src/prompts/` with:
- Type-safe template definitions
- Version tracking and metadata
- Reusable context modules
- Registry pattern for prompt discovery
- Legacy compatibility layer

---

## Architecture

### Directory Structure

```
functions/src/prompts/
├── index.ts           # Main exports + legacy compatibility
├── types.ts           # Type definitions
├── context.ts         # Phoenix context definitions
└── templates/
    ├── index.ts       # Template registry
    ├── competitor.ts  # Competitor analysis prompt
    ├── swot.ts        # SWOT analysis prompt
    ├── market.ts      # Market insights prompt
    ├── rag-query.ts   # Documentation Q&A prompt
    └── recommendations.ts  # Reading recommendations prompt
```

### Type System

```typescript
// Prompt metadata for tracking and optimization
interface PromptMetadata {
  id: string;              // Unique identifier
  name: string;            // Human-readable name
  category: PromptCategory; // analysis | retrieval | recommendation
  version: string;         // Semantic version (e.g., "1.2.0")
  description: string;     // What this prompt does
  createdAt: string;       // Creation date
  author: string;          // Author/team
  changelog: string;       // Latest changes
  recommendedModel: AIModel; // chat | chatAdvanced
  maxTokens: number;       // Token limit
  temperature: number;     // Creativity setting
  usesRAG: boolean;        // Whether prompt uses RAG
  tags: string[];          // Searchable tags
}

// Complete prompt template
interface PromptTemplate {
  metadata: PromptMetadata;
  system: SystemPromptTemplate;
  user: UserPromptTemplate;
  outputFormat?: "text" | "json" | "markdown";
  outputSchema?: object;   // JSON schema for structured output
}
```

### Template Example

```typescript
export const COMPETITOR_PROMPT: PromptTemplate = {
  metadata: {
    id: "competitor-analysis",
    name: "Competitor Analysis",
    category: "analysis",
    version: "1.1.0",
    description: "Analyzes competitors with RAG-enhanced Phoenix context",
    createdAt: "2025-11-27",
    author: "Phoenix AI Team",
    changelog: "Added RAG context injection for grounded analysis",
    recommendedModel: "chatAdvanced",
    maxTokens: 4000,
    temperature: 0.7,
    usesRAG: true,
    tags: ["analysis", "competitive-intelligence", "strategy"],
  },

  system: {
    base: `You are a defense industry analyst...`,
    contextMarker: "{{RAG_CONTEXT}}",
    ragTemplate: `
PHOENIX ROOIVALK DOCUMENTATION:
{{RAG_CONTEXT}}

Use this context to ground your competitive analysis.`,
  },

  user: {
    template: `Analyze: {{competitors}}
Focus areas: {{focusAreas}}`,
    requiredVariables: ["competitors"],
    optionalVariables: {
      focusAreas: "Technical capabilities, market position, threats",
    },
  },

  outputFormat: "markdown",
};
```

---

## Options Considered

### Option 1: Centralized Template System ✅ Selected

| Aspect | Details |
|--------|---------|
| **Structure** | Dedicated `/prompts/` directory with types |
| **Versioning** | Semantic versions in metadata |
| **Discovery** | Registry pattern with lookup functions |
| **Type Safety** | Full TypeScript interfaces |

**Pros**:
- Single source of truth for all prompts
- Version tracking and audit trail
- Type-safe template interpolation
- Easy to optimize and A/B test
- Supports RAG context injection

**Cons**:
- More initial setup
- Requires migration from inline prompts
- Additional abstraction layer

---

### Option 2: Configuration File (JSON/YAML)

| Aspect | Details |
|--------|---------|
| **Structure** | Single `prompts.json` or `prompts.yaml` |
| **Versioning** | Git-based |
| **Discovery** | Parse and cache at runtime |

**Pros**:
- Easy to edit without code changes
- Can be loaded dynamically
- Simple to version in Git

**Cons**:
- No type safety
- Limited interpolation options
- Can't include complex logic
- No IDE autocomplete

---

### Option 3: Database-Stored Prompts

| Aspect | Details |
|--------|---------|
| **Structure** | Firestore collection |
| **Versioning** | Document versions |
| **Discovery** | Query by ID/category |

**Pros**:
- Dynamic updates without deploy
- A/B testing infrastructure
- Usage analytics

**Cons**:
- Additional latency (fetch on each call)
- Requires admin UI for editing
- Overkill for current scale
- Version control harder to audit

---

### Option 4: Inline Prompts (Current)

| Aspect | Details |
|--------|---------|
| **Structure** | Prompts in each function file |
| **Versioning** | Git history |
| **Discovery** | Manual search |

**Pros**:
- Simple to start
- No additional abstraction

**Cons**:
- Scattered across codebase
- Hard to audit and optimize
- Duplicate context definitions
- No standardized format

---

## Rationale

### Why Centralized Templates?

| Factor | Templates | Config File | Database | Inline |
|--------|-----------|-------------|----------|--------|
| **Type safety** | ✅ Full | ❌ None | ❌ Runtime | ⚠️ Partial |
| **Version tracking** | ✅ Built-in | ⚠️ Git only | ✅ Built-in | ⚠️ Git only |
| **RAG integration** | ✅ Native | ⚠️ Manual | ⚠️ Manual | ⚠️ Manual |
| **IDE support** | ✅ Full | ❌ Limited | ❌ None | ✅ Partial |
| **Optimization** | ✅ Easy | ⚠️ Medium | ✅ Easy | ❌ Hard |

**Decision**: Centralized templates provide the best balance of type safety, developer experience, and optimization capability.

---

## Context Management

### Phoenix Context Modules

```typescript
// Core company context (always included)
export const PHOENIX_CORE_CONTEXT = `
Phoenix Rooivalk is a South African company developing autonomous
counter-drone defense systems. The Phoenix interceptor is an AI-guided
drone designed to detect, track, and neutralize hostile UAVs.

Key Differentiators:
- AI-first autonomous operation
- Minimal human-in-the-loop
- Rapid deployment capability
- Edge computing for real-time decisions
`;

// Technical context (for technical prompts)
export const PHOENIX_TECHNICAL_CONTEXT = `
Technical Specifications:
- Propulsion: Electric quad-rotor with 30+ min flight time
- Detection: Multi-sensor fusion (radar, RF, optical, acoustic)
- Tracking: Neural network-based trajectory prediction
- Neutralization: Kinetic intercept and electronic warfare
`;

// Market context (for business prompts)
export const PHOENIX_MARKET_CONTEXT = `
Market Position:
- Target: Military, critical infrastructure, event security
- Regions: Africa, Middle East, Europe (expansion)
- Competition: Anduril, DroneShield, Dedrone, Rafael
- USP: Cost-effective, autonomous, Africa-first
`;
```

### Context Injection Pattern

```typescript
function buildSystemPrompt(
  template: PromptTemplate,
  ragContext?: string
): string {
  let systemPrompt = template.system.base;

  // Inject RAG context if available
  if (ragContext && template.system.ragTemplate) {
    systemPrompt += "\n\n" + template.system.ragTemplate
      .replace("{{RAG_CONTEXT}}", ragContext);
  }

  return systemPrompt;
}
```

---

## Usage Patterns

### Basic Usage

```typescript
import { getPromptTemplate, PHOENIX_CORE_CONTEXT } from "./prompts";

const template = getPromptTemplate("competitor-analysis");
if (!template) throw new Error("Template not found");

const systemPrompt = buildSystemPrompt(template, ragContext);
const userPrompt = interpolateTemplate(template.user.template, {
  competitors: ["Anduril", "DroneShield"],
  focusAreas: ["Technology", "Pricing"],
});

const result = await callLLM(systemPrompt, userPrompt, {
  maxTokens: template.metadata.maxTokens,
  temperature: template.metadata.temperature,
});
```

### Discovery

```typescript
import { listPromptIds, getPromptsByCategory } from "./prompts";

// List all available prompts
const allIds = listPromptIds();
// ["competitor-analysis", "swot-analysis", "market-insights", ...]

// Get prompts by category
const analysisPrompts = getPromptsByCategory("analysis");
// { "competitor-analysis": {...}, "swot-analysis": {...}, ... }
```

---

## Migration Path

### Phase 1: Parallel Systems (Current)

```
Old System                    New System
-----------                   ----------
PROMPTS.competitor.system     COMPETITOR_PROMPT.system.base
PROMPTS.competitor.user()     Interpolate COMPETITOR_PROMPT.user.template
```

Both systems work simultaneously via legacy compatibility layer.

### Phase 2: Gradual Migration

1. Update each AI function to use new templates
2. Add RAG context injection using template patterns
3. Deprecate old PROMPTS object usage
4. Track migration via TODO comments

### Phase 3: Remove Legacy

1. Remove `PROMPTS` export from index.ts
2. Delete legacy compatibility code
3. Update all imports to use new pattern

---

## Versioning Strategy

### Semantic Versioning for Prompts

| Change Type | Version Bump | Example |
|-------------|--------------|---------|
| **Major** | X.0.0 | Complete prompt rewrite, output format change |
| **Minor** | x.Y.0 | New optional variables, RAG integration |
| **Patch** | x.y.Z | Typo fixes, minor wording improvements |

### Changelog Tracking

```typescript
metadata: {
  version: "1.2.0",
  changelog: "Added RAG context support; improved output structure",
  // Previous: "1.1.0" - Added focus areas parameter
  // Previous: "1.0.0" - Initial version
}
```

---

## Testing Strategy

### Prompt Validation

```typescript
describe("Prompt Templates", () => {
  it("all templates have required metadata", () => {
    for (const [id, template] of Object.entries(PROMPT_REGISTRY)) {
      expect(template.metadata.id).toBe(id);
      expect(template.metadata.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(template.metadata.description).toBeTruthy();
    }
  });

  it("required variables are documented", () => {
    for (const template of Object.values(PROMPT_REGISTRY)) {
      const matches = template.user.template.match(/\{\{(\w+)\}\}/g);
      const variables = matches?.map((m) => m.slice(2, -2)) || [];

      for (const v of template.user.requiredVariables) {
        expect(variables).toContain(v);
      }
    }
  });
});
```

---

## Consequences

### Positive

- **Single source of truth**: All prompts in one location
- **Version tracking**: Clear audit trail for prompt changes
- **Type safety**: Catch errors at compile time
- **Optimization ready**: Easy to A/B test and improve
- **RAG-native**: Built-in support for context injection
- **Discoverable**: Registry pattern for finding prompts

### Negative

- **Migration effort**: Need to update existing functions
- **Learning curve**: New patterns for team to learn
- **Abstraction overhead**: More files to navigate

### Technical Debt

- Legacy `PROMPTS` object maintained for backwards compatibility
- TODO: Remove legacy system after full migration

---

## Future Enhancements

### Planned

1. **Prompt Analytics**: Track which prompts are used, success rates
2. **A/B Testing**: Infrastructure for comparing prompt versions
3. **Admin UI**: Visual editor for non-developers
4. **Dynamic Loading**: Hot-reload prompts without deploy

### Considered

1. **LangChain Integration**: Use LangChain prompt templates
2. **Prompt Chaining**: Multi-step prompt workflows
3. **Few-Shot Examples**: Include examples in templates

---

## Related ADRs

- [ADR 0012: Runtime Functions Architecture](./adr-0012-runtime-functions.md)
- [ADR 0016: RAG Architecture](./adr-0016-rag-architecture.md)
- [ADR 0017: Context Management](./adr-0017-context-management.md)

---

_© 2025 Phoenix Rooivalk. Confidential._
