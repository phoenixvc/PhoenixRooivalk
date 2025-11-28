---
id: adr-0018-langchain-integration
title: "ADR 0018: LangChain Integration Strategy"
sidebar_label: "ADR 0018: LangChain Integration"
difficulty: advanced
estimated_reading_time: 10
points: 40
tags:
  - technical
  - architecture
  - ai
  - langchain
  - llm
  - orchestration
prerequisites:
  - adr-0015-prompt-management
  - adr-0016-rag-architecture
---

# ADR 0018: LangChain Integration Strategy

**Date**: 2025-11-27 **Status**: Proposed (Selective Integration for Complex
Workflows)

---

## Executive Summary

1. **Problem**: Current custom AI implementation works well for simple use
   cases, but complex multi-step workflows and agent-based features would
   require significant custom development
2. **Decision**: Selective LangChain integration for complex orchestration while
   maintaining custom implementations for simple, performance-critical paths
3. **Trade-off**: Framework overhead vs. development velocity for advanced AI
   features

---

## Context

Phoenix Rooivalk currently has a custom AI implementation:

```
Current Architecture
├── Custom prompt templates (/prompts/)
├── Custom RAG with Azure AI Search
├── Direct Azure OpenAI API calls
└── Manual context management
```

**This works well for**:

- Simple single-turn completions
- Straightforward RAG queries
- Predictable prompt patterns

**Challenges emerging**:

- Multi-step analysis workflows require manual orchestration
- Agent-based features (research, multi-source synthesis) need complex state
  management
- Tool integration (web search, API calls) requires custom plumbing
- Conversation memory management is manual

**LangChain offers**:

- Battle-tested abstractions for LLM orchestration
- Built-in RAG chains and retrievers
- Agent framework with tool integration
- Memory management for conversations
- Structured output parsing

---

## Decision

**Selective LangChain integration**:

| Use Case            | Approach                              |
| ------------------- | ------------------------------------- |
| Simple completions  | Keep custom (lower latency)           |
| Single-turn RAG     | Keep custom (optimized for our stack) |
| Multi-step analysis | Use LangChain chains                  |
| Agent workflows     | Use LangChain agents                  |
| Tool integration    | Use LangChain tools                   |
| Conversation memory | Use LangChain memory                  |

---

## LangChain Architecture

### Integration Points

```
┌─────────────────────────────────────────────────────────────────┐
│                 Phoenix Rooivalk AI Layer                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │            Simple Path (Custom)                          │    │
│  │  ┌──────────┐   ┌──────────┐   ┌──────────────────┐    │    │
│  │  │ Prompts  │──▶│   RAG    │──▶│  Azure OpenAI    │    │    │
│  │  │ System   │   │  Search  │   │  Direct Call     │    │    │
│  │  └──────────┘   └──────────┘   └──────────────────┘    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │            Complex Path (LangChain)                      │    │
│  │  ┌──────────┐   ┌──────────┐   ┌──────────────────┐    │    │
│  │  │ LangChain│──▶│ LangChain│──▶│    LangChain     │    │    │
│  │  │ Prompts  │   │ Retriever│   │  Chains/Agents   │    │    │
│  │  └──────────┘   └──────────┘   └──────────────────┘    │    │
│  │       │              │                   │              │    │
│  │       ▼              ▼                   ▼              │    │
│  │  ┌──────────────────────────────────────────────────┐  │    │
│  │  │              Azure OpenAI (via LangChain)         │  │    │
│  │  └──────────────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Package Structure

```
functions/src/
├── ai/                      # Current custom implementations
│   ├── competitor.ts        # Keep custom (simple)
│   ├── swot.ts             # Keep custom (simple)
│   └── recommendations.ts   # Keep custom (simple)
├── langchain/               # NEW: LangChain implementations
│   ├── index.ts            # Exports and configuration
│   ├── llm.ts              # Azure OpenAI LLM wrapper
│   ├── retrievers/         # Custom retrievers
│   │   ├── azure-search.ts # Azure AI Search retriever
│   │   └── firestore.ts    # Firestore fallback retriever
│   ├── chains/             # Reusable chains
│   │   ├── rag-chain.ts    # RAG question-answering
│   │   ├── analysis-chain.ts # Multi-step analysis
│   │   └── research-chain.ts # Web research + synthesis
│   ├── agents/             # Agent implementations
│   │   ├── research-agent.ts # Deep research agent
│   │   └── analyst-agent.ts  # Competitive analysis agent
│   ├── tools/              # Agent tools
│   │   ├── doc-search.ts   # Documentation search
│   │   ├── web-search.ts   # Web search (Bing/Google)
│   │   └── calculator.ts   # Math operations
│   └── memory/             # Conversation memory
│       └── firestore-memory.ts # Persistent memory
└── prompts/                 # Existing prompt system (compatible)
```

---

## Implementation Examples

### 1. Azure OpenAI LLM Setup

```typescript
// langchain/llm.ts
import { AzureChatOpenAI } from "@langchain/openai";
import * as functions from "firebase-functions";

const config = functions.config();

export const azureLLM = new AzureChatOpenAI({
  azureOpenAIApiKey: config.azure.openai_key,
  azureOpenAIApiInstanceName: "phoenix-ai",
  azureOpenAIApiDeploymentName: "gpt-4o",
  azureOpenAIApiVersion: "2024-08-01-preview",
  temperature: 0.7,
  maxTokens: 4000,
});

export const azureLLMFast = new AzureChatOpenAI({
  azureOpenAIApiKey: config.azure.openai_key,
  azureOpenAIApiInstanceName: "phoenix-ai",
  azureOpenAIApiDeploymentName: "gpt-4o-mini",
  azureOpenAIApiVersion: "2024-08-01-preview",
  temperature: 0.5,
  maxTokens: 2000,
});
```

### 2. Azure AI Search Retriever

```typescript
// langchain/retrievers/azure-search.ts
import { AzureAISearchVectorStore } from "@langchain/community/vectorstores/azure_aisearch";
import { AzureOpenAIEmbeddings } from "@langchain/openai";
import * as functions from "firebase-functions";

const config = functions.config();

const embeddings = new AzureOpenAIEmbeddings({
  azureOpenAIApiKey: config.azure.openai_key,
  azureOpenAIApiInstanceName: "phoenix-ai",
  azureOpenAIApiDeploymentName: "text-embedding-3-small",
  azureOpenAIApiVersion: "2024-08-01-preview",
});

export const vectorStore = new AzureAISearchVectorStore(embeddings, {
  endpoint: config.azure.search_endpoint,
  key: config.azure.search_key,
  indexName: "phoenix-docs",
});

export const docRetriever = vectorStore.asRetriever({
  k: 5,
  searchType: "similarity",
});
```

### 3. RAG Chain

```typescript
// langchain/chains/rag-chain.ts
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { azureLLM } from "../llm";
import { docRetriever } from "../retrievers/azure-search";
import { PHOENIX_CORE_CONTEXT } from "../../prompts/context";

const ragPrompt = ChatPromptTemplate.fromTemplate(`
You are Phoenix Rooivalk's documentation assistant.

${PHOENIX_CORE_CONTEXT}

Use the following documentation context to answer the question.
If you don't know the answer, say so - don't make things up.
Cite sources using [Source: document name] notation.

Context:
{context}

Question: {input}

Answer:`);

const documentChain = await createStuffDocumentsChain({
  llm: azureLLM,
  prompt: ragPrompt,
});

export const ragChain = await createRetrievalChain({
  retriever: docRetriever,
  combineDocsChain: documentChain,
});

// Usage
export async function askWithLangChain(question: string) {
  const result = await ragChain.invoke({ input: question });
  return {
    answer: result.answer,
    sources: result.context.map((doc) => doc.metadata.title),
  };
}
```

### 4. Multi-Step Analysis Chain

```typescript
// langchain/chains/analysis-chain.ts
import { RunnableSequence } from "@langchain/core/runnables";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { azureLLM, azureLLMFast } from "../llm";
import { docRetriever } from "../retrievers/azure-search";

// Step 1: Gather context
const gatherPrompt = ChatPromptTemplate.fromTemplate(`
Identify key topics to research for analyzing: {topic}
List 3-5 specific search queries.
`);

// Step 2: Synthesize findings
const synthesizePrompt = ChatPromptTemplate.fromTemplate(`
Based on these research findings:
{findings}

Provide a comprehensive analysis of: {topic}
Include strengths, weaknesses, opportunities, and recommendations.
`);

export const analysisChain = RunnableSequence.from([
  // Step 1: Generate search queries
  {
    queries: gatherPrompt.pipe(azureLLMFast).pipe(new StringOutputParser()),
    topic: (input: { topic: string }) => input.topic,
  },
  // Step 2: Retrieve documents for each query
  async (input) => {
    const queries = input.queries.split("\n").filter(Boolean);
    const allDocs = [];
    for (const query of queries) {
      const docs = await docRetriever.invoke(query);
      allDocs.push(...docs);
    }
    return {
      findings: allDocs.map((d) => d.pageContent).join("\n\n---\n\n"),
      topic: input.topic,
    };
  },
  // Step 3: Synthesize analysis
  synthesizePrompt.pipe(azureLLM).pipe(new StringOutputParser()),
]);

// Usage
export async function deepAnalysis(topic: string) {
  return await analysisChain.invoke({ topic });
}
```

### 5. Research Agent with Tools

```typescript
// langchain/agents/research-agent.ts
import { AgentExecutor, createOpenAIToolsAgent } from "langchain/agents";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { azureLLM } from "../llm";
import { docRetriever } from "../retrievers/azure-search";

// Tool: Search Phoenix documentation
const docSearchTool = new DynamicStructuredTool({
  name: "search_phoenix_docs",
  description:
    "Search Phoenix Rooivalk documentation for technical information",
  schema: z.object({
    query: z.string().describe("The search query"),
  }),
  func: async ({ query }) => {
    const docs = await docRetriever.invoke(query);
    return docs
      .map((d) => `[${d.metadata.title}]: ${d.pageContent}`)
      .join("\n\n");
  },
});

// Tool: Web search (for competitor info)
const webSearchTool = new DynamicStructuredTool({
  name: "web_search",
  description:
    "Search the web for current information about competitors or market trends",
  schema: z.object({
    query: z.string().describe("The search query"),
  }),
  func: async ({ query }) => {
    // Integrate with Bing Search API or similar
    const response = await fetch(
      `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}`,
      { headers: { "Ocp-Apim-Subscription-Key": process.env.BING_API_KEY! } },
    );
    const data = await response.json();
    return data.webPages.value
      .slice(0, 5)
      .map((r: any) => `[${r.name}]: ${r.snippet}`)
      .join("\n\n");
  },
});

const agentPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a competitive intelligence researcher for Phoenix Rooivalk.
Your goal is to gather comprehensive information about defense industry competitors.
Use the available tools to search documentation and the web.
Always cite your sources.`,
  ],
  ["human", "{input}"],
  new MessagesPlaceholder("agent_scratchpad"),
]);

const tools = [docSearchTool, webSearchTool];

const agent = await createOpenAIToolsAgent({
  llm: azureLLM,
  tools,
  prompt: agentPrompt,
});

export const researchAgent = new AgentExecutor({
  agent,
  tools,
  verbose: true,
  maxIterations: 5,
});

// Usage
export async function researchCompetitor(competitor: string) {
  const result = await researchAgent.invoke({
    input: `Research ${competitor} and compare their counter-drone capabilities to Phoenix Rooivalk`,
  });
  return result.output;
}
```

### 6. Conversation Memory

```typescript
// langchain/memory/firestore-memory.ts
import { BufferMemory } from "langchain/memory";
import { FirestoreChatMessageHistory } from "@langchain/community/stores/message/firestore";
import { db } from "../../config/firebase";

export function createConversationMemory(sessionId: string) {
  return new BufferMemory({
    chatHistory: new FirestoreChatMessageHistory({
      collectionName: "chat_sessions",
      sessionId,
      client: db,
    }),
    returnMessages: true,
    memoryKey: "chat_history",
  });
}

// Usage in a conversational chain
import { ConversationChain } from "langchain/chains";

export async function getConversationalChain(sessionId: string) {
  const memory = createConversationMemory(sessionId);

  return new ConversationChain({
    llm: azureLLM,
    memory,
    verbose: true,
  });
}
```

---

## Options Considered

### Option 1: Full LangChain Migration

| Aspect      | Details                                   |
| ----------- | ----------------------------------------- |
| **Scope**   | Replace all custom AI code with LangChain |
| **Effort**  | High (rewrite everything)                 |
| **Benefit** | Full feature access                       |

**Pros**:

- Consistent patterns throughout
- Access to all LangChain features
- Community support and updates

**Cons**:

- Unnecessary for simple use cases
- Performance overhead for simple calls
- Large bundle size increase
- Learning curve for team

---

### Option 2: Selective Integration ✅ Selected

| Aspect      | Details                              |
| ----------- | ------------------------------------ |
| **Scope**   | LangChain for complex workflows only |
| **Effort**  | Medium (additive)                    |
| **Benefit** | Best of both worlds                  |

**Pros**:

- Keep optimized simple paths
- Add power features where needed
- Gradual adoption
- Lower risk

**Cons**:

- Two patterns to maintain
- Need clear decision criteria
- Some code duplication

---

### Option 3: No LangChain (Custom Everything)

| Aspect      | Details                        |
| ----------- | ------------------------------ |
| **Scope**   | Build all orchestration custom |
| **Effort**  | Very high                      |
| **Benefit** | Full control                   |

**Pros**:

- No dependencies
- Optimized for our needs
- No framework learning curve

**Cons**:

- Reinventing the wheel
- Slow development for complex features
- Missing battle-tested patterns
- Maintenance burden

---

### Option 4: Cognitive Mesh (Future)

| Aspect       | Details                              |
| ------------ | ------------------------------------ |
| **Scope**    | Enterprise AI orchestration platform |
| **Effort**   | Medium (migration required)          |
| **Benefit**  | Enterprise-grade capabilities        |
| **Platform** | C#/.NET 9.0+                         |

**Repository**: https://github.com/justaghost/cognitive-mesh

**Pros**:

- 5-layer hexagonal architecture for complex orchestration
- Built-in multi-agent coordination
- Enterprise compliance (NIST AI RMF, GDPR, EU AI Act)
- Zero-trust security with RBAC
- Comprehensive audit logging
- Metacognitive reasoning layer

**Cons**:

- Different tech stack (C#/.NET vs TypeScript)
- Currently in development, not yet deployed
- Migration effort from Firebase Functions
- Higher operational complexity

**When to Consider**:

- When enterprise compliance becomes mandatory
- When multi-agent orchestration becomes complex
- When ethical AI governance is required
- When scaling beyond current Firebase limits
- When integrating with .NET backend systems

**Current Status**: In development. Consider when compliance requirements
increase or orchestration complexity exceeds LangChain capabilities.

---

## Rationale

### Decision Matrix

| Criteria              | Weight | Full Migration | Selective | Custom Only | Cognitive Mesh |
| --------------------- | ------ | -------------- | --------- | ----------- | -------------- |
| **Development speed** | 30%    | 8              | 9         | 4           | 6              |
| **Performance**       | 25%    | 6              | 9         | 10          | 8              |
| **Maintainability**   | 20%    | 7              | 8         | 5           | 8              |
| **Feature richness**  | 15%    | 10             | 8         | 4           | 10             |
| **Risk**              | 10%    | 5              | 8         | 7           | 5              |
| **Compliance**        | N/A    | ⚠️ Manual      | ⚠️ Manual | ❌ None     | ✅ Built-in    |
| **Weighted Score**    |        | 7.15           | **8.55**  | 5.75        | 7.45           |

**Decision**: Selective integration provides the best balance of capability and
pragmatism for current needs. Cognitive Mesh becomes the preferred option when
compliance requirements increase.

---

## When to Use LangChain vs Custom

### Use Custom Implementation When:

- Single LLM call with simple prompt
- Performance is critical (< 500ms)
- RAG with simple retrieval pattern
- No multi-step orchestration needed
- Predictable, templated outputs

**Examples**: `analyzeCompetitors`, `generateSWOT`, `askDocumentation`

### Use LangChain When:

- Multi-step reasoning required
- Agent behavior with tool selection
- Complex document processing chains
- Conversation memory needed
- Dynamic workflow based on LLM decisions
- Structured output parsing with retries

**Examples**: Deep research, multi-source synthesis, conversational analysis

---

## Migration Path

### Phase 1: Setup (Week 1)

1. Install LangChain packages
2. Configure Azure OpenAI LLM wrapper
3. Create Azure AI Search retriever
4. Set up basic RAG chain

### Phase 2: Chains (Week 2)

1. Implement analysis chain for deep dives
2. Add research chain with multi-query
3. Create structured output chains

### Phase 3: Agents (Week 3-4)

1. Build research agent with tools
2. Add web search tool integration
3. Implement competitive intelligence agent

### Phase 4: Memory (Week 5)

1. Add Firestore chat history
2. Implement conversational chains
3. Add session management

---

## Dependencies

### NPM Packages

```json
{
  "dependencies": {
    "langchain": "^0.3.0",
    "@langchain/openai": "^0.3.0",
    "@langchain/community": "^0.3.0",
    "@langchain/core": "^0.3.0",
    "zod": "^3.22.0"
  }
}
```

### Estimated Bundle Impact

| Package              | Size (gzipped) |
| -------------------- | -------------- |
| langchain            | ~150KB         |
| @langchain/openai    | ~30KB          |
| @langchain/community | ~100KB         |
| @langchain/core      | ~50KB          |
| **Total**            | ~330KB         |

Note: Tree-shaking reduces actual impact based on imports used.

---

## Performance Considerations

### Latency Comparison

| Operation         | Custom | LangChain | Delta          |
| ----------------- | ------ | --------- | -------------- |
| Simple completion | 800ms  | 850ms     | +50ms          |
| RAG query         | 1.2s   | 1.3s      | +100ms         |
| Multi-step chain  | N/A    | 3-5s      | New capability |
| Agent (3 tools)   | N/A    | 5-10s     | New capability |

### Optimization Strategies

1. **Lazy loading**: Import LangChain only when needed
2. **Caching**: Cache chain instances
3. **Streaming**: Use streaming for long operations
4. **Parallel tools**: Run independent tool calls in parallel

---

## Consequences

### Positive

- **Faster feature development**: Complex AI features become feasible
- **Battle-tested patterns**: Reduced bugs in orchestration logic
- **Agent capabilities**: Enable tool-using AI assistants
- **Memory management**: Persistent conversations out of the box
- **Community updates**: Benefit from LangChain improvements

### Negative

- **Additional dependency**: Another framework to track
- **Bundle size**: ~330KB added (gzipped)
- **Learning curve**: Team needs to learn LangChain patterns
- **Two paradigms**: Custom + LangChain requires decision-making
- **Version churn**: LangChain evolves rapidly

### Risks

| Risk                       | Mitigation                              |
| -------------------------- | --------------------------------------- |
| LangChain breaking changes | Pin versions, test upgrades             |
| Performance regression     | Keep simple paths custom                |
| Complexity creep           | Clear guidelines on when to use         |
| Vendor lock-in             | Use abstractions, keep custom fallbacks |

---

## Future Enhancements

### Short-term

1. **LangSmith integration**: Observability and debugging
2. **Streaming responses**: Real-time output for long chains
3. **Caching layer**: Cache intermediate results

### Long-term

1. **LangGraph**: Stateful multi-agent workflows
2. **Custom tools**: Domain-specific tools for defense analysis
3. **Fine-tuned models**: Custom models with LangChain integration

---

## Implementation Recommendation

### Decision: **Defer / Minimal** ⚠️

| Factor                 | Assessment                             |
| ---------------------- | -------------------------------------- |
| **Current Status**     | Proposed (not implemented)             |
| **CM Equivalent**      | Agency Layer uses custom orchestration |
| **Bundle Impact**      | ~330KB gzipped                         |
| **Resource Trade-off** | Dev time better spent on CM            |

**Rationale**: LangChain integration adds significant bundle size and complexity
for features that would be better implemented in Cognitive Mesh. The simple AI
features (competitor analysis, SWOT, recommendations) work fine with direct
Azure OpenAI calls.

**Action**:

- **Skip** full LangChain integration
- Keep simple direct API calls for existing features
- **Invest development time in CM Agency Layer instead** (~40% complete)

**If minimal integration needed**: Only implement a thin RAG chain wrapper, not
the full agent/workflow stack.

See
[ADR 0000 Appendix: CM Feature Recommendations](./adr-0000-appendix-cogmesh-feature-recommendations.md)
for full analysis.

---

## Related ADRs

- [ADR 0000: ADR Management](./adr-0000-adr-management.md) - Platform decision
  framework
- [ADR 0015: Prompt Management](./adr-0015-prompt-management.md)
- [ADR 0016: RAG Architecture](./adr-0016-rag-architecture.md)
- [ADR 0017: Context Management](./adr-0017-context-management.md)
- [ADR 0012: Runtime Functions Architecture](./adr-0012-runtime-functions.md)
- [Cognitive Mesh](https://github.com/justaghost/cognitive-mesh) - Future
  enterprise platform

---

_© 2025 Phoenix Rooivalk. Confidential._
