---
id: adr-0019-ai-agents
title: "ADR 0019: AI Agents Architecture"
sidebar_label: "ADR 0019: AI Agents"
difficulty: advanced
estimated_reading_time: 10
points: 40
tags:
  - technical
  - architecture
  - ai
  - agents
  - langchain
prerequisites:
  - adr-0018-langchain-integration
  - adr-0020-agent-tools
---

# ADR 0019: AI Agents Architecture

**Date**: 2025-11-27 **Status**: Proposed (LangChain Agents with Tool Selection)

---

## Executive Summary

1. **Problem**: Complex research and analysis tasks require dynamic
   decision-making about what information to gather and how to process it
2. **Decision**: Implement LangChain-based agents with tool selection
   capabilities for research and competitive intelligence
3. **Trade-off**: Increased latency and unpredictability vs. powerful autonomous
   task completion

---

## Context

Current AI features follow a fixed pipeline:

```
User Query → RAG Search → LLM Generation → Response
```

**Limitations**:

- Cannot decide to search multiple sources
- Cannot perform follow-up queries based on initial findings
- Cannot combine information from different tools
- Cannot adapt strategy based on intermediate results

**Agent capabilities needed**:

- Dynamic tool selection based on task requirements
- Multi-step reasoning with intermediate results
- Self-correction when initial approach fails
- Synthesis across multiple information sources

---

## Decision

**LangChain ReAct agents** with:

1. **Research Agent**: Deep-dive research on specific topics
2. **Competitive Intelligence Agent**: Competitor analysis with market context
3. **Analyst Agent**: Strategic recommendations based on data synthesis

---

## Agent Architecture

### Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      Agent Execution Flow                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   User Task                                                      │
│       │                                                          │
│       ▼                                                          │
│   ┌───────────────────────────────────────────────────────────┐ │
│   │                    Agent Router                            │ │
│   │  - Classify task type                                     │ │
│   │  - Select appropriate agent                               │ │
│   └───────────────────────────────────────────────────────────┘ │
│       │                                                          │
│       ├──────────────┬──────────────┬──────────────┐            │
│       ▼              ▼              ▼              ▼            │
│   ┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐         │
│   │Research│    │Compet. │    │Analyst │    │General │         │
│   │ Agent  │    │ Intel  │    │ Agent  │    │  RAG   │         │
│   └────────┘    └────────┘    └────────┘    └────────┘         │
│       │              │              │              │            │
│       └──────────────┴──────────────┴──────────────┘            │
│                              │                                   │
│                              ▼                                   │
│   ┌───────────────────────────────────────────────────────────┐ │
│   │                    Tool Executor                           │ │
│   │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐         │ │
│   │  │Doc Search│ │Web Search│ │Calculator│ │  API   │         │ │
│   │  └─────────┘ └─────────┘ └─────────┘ └─────────┘         │ │
│   └───────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                              ▼                                   │
│   ┌───────────────────────────────────────────────────────────┐ │
│   │                  Response Synthesizer                      │ │
│   │  - Combine tool results                                   │ │
│   │  - Format final response                                  │ │
│   │  - Include citations                                      │ │
│   └───────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Agent Types

#### 1. Research Agent

**Purpose**: Deep research on specific topics with multi-source synthesis.

**Capabilities**:

- Search Phoenix documentation
- Search the web for external information
- Synthesize findings into comprehensive reports
- Follow up on interesting findings

**Use Cases**:

- "Research the current state of counter-drone technology"
- "Find information about regulatory requirements for drone defense systems"
- "Investigate market trends in autonomous defense systems"

```typescript
// langchain/agents/research-agent.ts
import { AgentExecutor, createOpenAIToolsAgent } from "langchain/agents";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { azureLLM } from "../llm";
import { docSearchTool, webSearchTool, noteTool } from "../tools";

const RESEARCH_AGENT_PROMPT = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a research analyst for Phoenix Rooivalk, a counter-drone defense company.

Your role is to conduct thorough research on topics related to:
- Counter-drone and counter-UAS technology
- Defense industry trends and competitors
- Regulatory and compliance requirements
- Market opportunities and threats

Research Guidelines:
1. Always start by searching Phoenix documentation for internal context
2. Use web search for external information (competitors, market data, news)
3. Take notes on key findings using the note tool
4. Synthesize information from multiple sources
5. Cite all sources in your final response
6. Flag any conflicting information you find

Be thorough but focused. Aim for actionable insights.`,
  ],
  ["human", "{input}"],
  new MessagesPlaceholder("agent_scratchpad"),
]);

const tools = [docSearchTool, webSearchTool, noteTool];

export async function createResearchAgent() {
  const agent = await createOpenAIToolsAgent({
    llm: azureLLM,
    tools,
    prompt: RESEARCH_AGENT_PROMPT,
  });

  return new AgentExecutor({
    agent,
    tools,
    verbose: true,
    maxIterations: 8,
    returnIntermediateSteps: true,
    handleParsingErrors: true,
  });
}
```

#### 2. Competitive Intelligence Agent

**Purpose**: Analyze competitors with context from Phoenix capabilities.

**Capabilities**:

- Research competitor products and capabilities
- Compare against Phoenix Rooivalk offerings
- Identify strengths, weaknesses, opportunities, threats
- Track market movements and announcements

**Use Cases**:

- "Analyze Anduril's counter-drone offerings vs Phoenix"
- "What are DroneShield's recent product announcements?"
- "Compare pricing strategies across counter-UAS market"

```typescript
// langchain/agents/competitive-intel-agent.ts
const COMPETITIVE_INTEL_PROMPT = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a competitive intelligence analyst for Phoenix Rooivalk.

Your role is to analyze competitors and market dynamics in the counter-drone defense industry.

Phoenix Rooivalk Context:
- South African company developing autonomous counter-drone systems
- Key differentiators: AI-first, cost-effective, Africa-focused
- Products: Phoenix interceptor drone with autonomous tracking and neutralization

Analysis Framework:
1. First, retrieve Phoenix capabilities from documentation
2. Research the competitor(s) using web search
3. Compare capabilities across key dimensions:
   - Technology & performance
   - Pricing & business model
   - Market presence & customers
   - Strengths & weaknesses
4. Identify opportunities and threats for Phoenix
5. Provide actionable recommendations

Always ground your analysis in facts. Cite sources for all claims.`,
  ],
  ["human", "{input}"],
  new MessagesPlaceholder("agent_scratchpad"),
]);

const tools = [docSearchTool, webSearchTool, competitorDbTool, calculatorTool];

export async function createCompetitiveIntelAgent() {
  const agent = await createOpenAIToolsAgent({
    llm: azureLLM,
    tools,
    prompt: COMPETITIVE_INTEL_PROMPT,
  });

  return new AgentExecutor({
    agent,
    tools,
    verbose: true,
    maxIterations: 10,
    returnIntermediateSteps: true,
  });
}
```

#### 3. Analyst Agent

**Purpose**: Strategic analysis and recommendations based on data.

**Capabilities**:

- Process quantitative data (market size, growth rates)
- Perform calculations and projections
- Generate strategic recommendations
- Create executive summaries

**Use Cases**:

- "Estimate the total addressable market for counter-UAS in Africa"
- "What's our projected market share if we capture 10% of announced contracts?"
- "Analyze the ROI of entering the European market"

```typescript
// langchain/agents/analyst-agent.ts
const ANALYST_PROMPT = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a strategic analyst for Phoenix Rooivalk.

Your role is to provide data-driven analysis and recommendations for business decisions.

Analysis Capabilities:
- Market sizing and TAM/SAM/SOM calculations
- Financial projections and ROI analysis
- Risk assessment and scenario planning
- Strategic recommendations

Guidelines:
1. Always state your assumptions clearly
2. Show your calculations using the calculator tool
3. Provide ranges rather than single point estimates
4. Consider multiple scenarios (optimistic, base, pessimistic)
5. Back recommendations with data

Output Format:
- Executive Summary (2-3 sentences)
- Key Findings (bullet points)
- Analysis Details (with calculations)
- Recommendations (prioritized)
- Risks and Mitigations`,
  ],
  ["human", "{input}"],
  new MessagesPlaceholder("agent_scratchpad"),
]);

const tools = [docSearchTool, webSearchTool, calculatorTool, dataQueryTool];

export async function createAnalystAgent() {
  const agent = await createOpenAIToolsAgent({
    llm: azureLLM,
    tools,
    prompt: ANALYST_PROMPT,
  });

  return new AgentExecutor({
    agent,
    tools,
    verbose: true,
    maxIterations: 12,
    returnIntermediateSteps: true,
  });
}
```

---

## Agent Router

```typescript
// langchain/agents/router.ts
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { azureLLMFast } from "../llm";

const ROUTER_PROMPT = ChatPromptTemplate.fromTemplate(`
Classify the following task into one of these categories:

- RESEARCH: General research on topics, technologies, or trends
- COMPETITIVE: Analysis of specific competitors or competitive landscape
- ANALYST: Quantitative analysis, calculations, market sizing, ROI
- SIMPLE: Simple questions that can be answered with a single search

Task: {task}

Category:`);

type AgentType = "research" | "competitive" | "analyst" | "simple";

export async function routeToAgent(task: string): Promise<AgentType> {
  const chain = ROUTER_PROMPT.pipe(azureLLMFast).pipe(new StringOutputParser());
  const result = await chain.invoke({ task });

  const category = result.trim().toUpperCase();

  switch (category) {
    case "RESEARCH":
      return "research";
    case "COMPETITIVE":
      return "competitive";
    case "ANALYST":
      return "analyst";
    default:
      return "simple";
  }
}

// Main entry point
export async function executeAgentTask(task: string) {
  const agentType = await routeToAgent(task);

  switch (agentType) {
    case "research":
      const researchAgent = await createResearchAgent();
      return researchAgent.invoke({ input: task });
    case "competitive":
      const competitiveAgent = await createCompetitiveIntelAgent();
      return competitiveAgent.invoke({ input: task });
    case "analyst":
      const analystAgent = await createAnalystAgent();
      return analystAgent.invoke({ input: task });
    default:
      // Fall back to simple RAG
      return ragChain.invoke({ input: task });
  }
}
```

---

## Agent Configuration

### Execution Limits

| Agent             | Max Iterations | Timeout | Max Tools/Step |
| ----------------- | -------------- | ------- | -------------- |
| Research          | 8              | 60s     | 2              |
| Competitive Intel | 10             | 90s     | 2              |
| Analyst           | 12             | 120s    | 3              |

### Error Handling

```typescript
// langchain/agents/error-handling.ts
export const agentConfig = {
  handleParsingErrors: (error: Error) => {
    logger.warn("Agent parsing error", { error: error.message });
    return "I encountered an issue processing that step. Let me try a different approach.";
  },

  earlyStoppingMethod: "generate" as const,

  callbacks: [
    {
      handleAgentEnd: (output: AgentFinish) => {
        logger.info("Agent completed", {
          output: output.returnValues,
          log: output.log,
        });
      },
      handleAgentError: (error: Error) => {
        logger.error("Agent error", { error });
      },
      handleToolError: (error: Error) => {
        logger.warn("Tool error", { error: error.message });
      },
    },
  ],
};
```

---

## Cloud Function Endpoints

```typescript
// functions/src/ai/agents.ts
import * as functions from "firebase-functions";
import { executeAgentTask, routeToAgent } from "../langchain/agents/router";

export const agentQuery = functions
  .runWith({
    timeoutSeconds: 180,
    memory: "1GB",
  })
  .https.onCall(async (data, context) => {
    // Auth check
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be logged in",
      );
    }

    const { task, agentType: requestedAgent } = data;

    if (!task || typeof task !== "string") {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Task is required",
      );
    }

    try {
      // Route to appropriate agent (or use requested)
      const agentType = requestedAgent || (await routeToAgent(task));

      logger.info("Executing agent task", {
        userId: context.auth.uid,
        task: task.substring(0, 100),
        agentType,
      });

      const startTime = Date.now();
      const result = await executeAgentTask(task);
      const duration = Date.now() - startTime;

      logger.info("Agent task completed", {
        userId: context.auth.uid,
        agentType,
        durationMs: duration,
        steps: result.intermediateSteps?.length || 0,
      });

      return {
        answer: result.output,
        agentType,
        steps: result.intermediateSteps?.map((step) => ({
          tool: step.action.tool,
          input: step.action.toolInput,
          output: step.observation?.substring(0, 500),
        })),
        sources: extractSources(result),
        durationMs: duration,
      };
    } catch (error) {
      logger.error("Agent task failed", { error, task });
      throw new functions.https.HttpsError("internal", "Agent task failed");
    }
  });
```

---

## Options Considered

### Option 1: LangChain ReAct Agents ✅ Selected

| Aspect           | Details                 |
| ---------------- | ----------------------- |
| **Framework**    | LangChain AgentExecutor |
| **Reasoning**    | ReAct (Reason + Act)    |
| **Tool calling** | OpenAI function calling |

**Pros**:

- Well-tested agent framework
- Built-in tool calling
- Intermediate step tracking
- Error recovery

**Cons**:

- Framework dependency
- Can be unpredictable
- Potential for loops

---

### Option 2: Custom Agent Loop

| Aspect           | Details                |
| ---------------- | ---------------------- |
| **Framework**    | Custom implementation  |
| **Reasoning**    | Manual prompt chaining |
| **Tool calling** | Custom dispatcher      |

**Pros**:

- Full control
- No dependencies
- Predictable behavior

**Cons**:

- Significant development effort
- Need to handle edge cases
- Reinventing the wheel

---

### Option 3: OpenAI Assistants API

| Aspect           | Details                 |
| ---------------- | ----------------------- |
| **Framework**    | OpenAI managed          |
| **Reasoning**    | OpenAI internal         |
| **Tool calling** | Native function calling |

**Pros**:

- Managed infrastructure
- Built-in file handling
- Code interpreter

**Cons**:

- Not available in Azure OpenAI (yet)
- Less control over behavior
- Different API surface

---

### Option 4: Cognitive Mesh (Future)

| Aspect           | Details                        |
| ---------------- | ------------------------------ |
| **Framework**    | In-house enterprise platform   |
| **Reasoning**    | 5-layer cognitive architecture |
| **Tool calling** | Agency Layer with governance   |
| **Platform**     | C#/.NET 9.0+                   |

**Repository**: https://github.com/justaghost/cognitive-mesh

**Pros**:

- Agency Layer designed for multi-agent orchestration
- Metacognitive Layer for self-reflection and learning
- Built-in ethical reasoning and governance
- Enterprise compliance (NIST AI RMF, GDPR, EU AI Act)
- Zero-trust security with RBAC per agent
- Comprehensive audit logging of agent actions
- Cognitive Engines for specialized reasoning

**Cons**:

- Different tech stack (C#/.NET vs TypeScript)
- Currently in development, not yet deployed
- Migration effort from LangChain agents
- Higher operational complexity

**When to Consider**:

- When enterprise compliance becomes mandatory
- When ethical AI governance is required for agents
- When multi-agent coordination becomes complex
- When audit trails for agent decisions are mandated
- When agents need self-reflection capabilities

**Current Status**: In development. Agency and Metacognitive layers are core
features. Evaluate when compliance requirements increase.

---

## Rationale

| Factor                  | LangChain    | Custom    | Assistants | Cognitive Mesh |
| ----------------------- | ------------ | --------- | ---------- | -------------- |
| **Development speed**   | ✅ Fast      | ❌ Slow   | ✅ Fast    | ⚠️ Medium      |
| **Control**             | ⚠️ Medium    | ✅ Full   | ❌ Limited | ✅ Full        |
| **Azure compatibility** | ✅ Yes       | ✅ Yes    | ❌ No      | ✅ Yes         |
| **Observability**       | ✅ LangSmith | ⚠️ Manual | ⚠️ Limited | ✅ Built-in    |
| **Community**           | ✅ Large     | ❌ None   | ⚠️ Growing | ❌ Internal    |
| **Compliance**          | ⚠️ Manual    | ❌ None   | ⚠️ Limited | ✅ Built-in    |
| **Ethical governance**  | ❌ None      | ❌ None   | ❌ None    | ✅ Native      |

**Decision**: LangChain provides the best balance of capability and development
speed while maintaining Azure compatibility. Cognitive Mesh becomes the
preferred option when enterprise compliance or ethical AI governance is
required.

---

## Performance Characteristics

### Latency

| Agent             | Typical Latency | Worst Case |
| ----------------- | --------------- | ---------- |
| Research          | 10-30s          | 60s        |
| Competitive Intel | 15-45s          | 90s        |
| Analyst           | 20-60s          | 120s       |
| Router            | 500ms           | 2s         |

### Cost Estimation

| Agent             | Avg Tokens/Task | Est. Cost/Task |
| ----------------- | --------------- | -------------- |
| Research          | 8,000           | $0.08          |
| Competitive Intel | 12,000          | $0.12          |
| Analyst           | 15,000          | $0.15          |

---

## Consequences

### Positive

- **Autonomous task completion**: Agents can solve complex problems
- **Dynamic tool selection**: Right tool for each sub-task
- **Multi-source synthesis**: Combine internal and external data
- **Explainable**: Intermediate steps show reasoning

### Negative

- **Unpredictability**: Agent behavior can vary
- **Latency**: Multi-step execution is slow
- **Cost**: More LLM calls per task
- **Complexity**: Harder to debug than fixed pipelines

### Risks

| Risk                | Mitigation                 |
| ------------------- | -------------------------- |
| Infinite loops      | Max iterations limit       |
| Hallucination       | Tool-grounded responses    |
| Cost overrun        | Token budgets, rate limits |
| Poor tool selection | Better prompts, routing    |

---

## Implementation Recommendation

### Decision: **Implement in Cognitive Mesh** 🔶

| Factor                 | Assessment                                     |
| ---------------------- | ---------------------------------------------- |
| **Current Status**     | Proposed (not implemented)                     |
| **CM Equivalent**      | Agency Layer (~40% complete)                   |
| **CM Advantage**       | Built-in ethical reasoning, audit trails, RBAC |
| **Resource Trade-off** | CM has agent infrastructure in progress        |

**Rationale**: Cognitive Mesh's Agency Layer is already 40% complete with
multi-agent orchestration, tool governance, and ethical reasoning built in.
Implementing LangChain agents here duplicates effort and lacks the compliance
features that CM provides.

**Action**:

- **Do NOT implement** agent architecture in docs site
- **Prioritize completing CM Agency Layer PRD**
- Docs site can function with simple RAG Q&A (no agents)
- Migrate to CM agents when platform is production-ready

**For docs site**: Simple single-turn interactions are acceptable until CM is
ready.

See
[ADR 0000 Appendix: CM Feature Recommendations](./adr-0000-appendix-cogmesh-feature-recommendations.md)
for full analysis.

---

## Related ADRs

- [ADR 0000: ADR Management](./adr-0000-adr-management.md) - Platform decision
  framework
- [ADR 0018: LangChain Integration](./adr-0018-langchain-integration.md)
- [ADR 0020: Agent Tools Framework](./adr-0020-agent-tools.md)
- [ADR 0022: AI Workflows](./adr-0022-ai-workflows.md)
- [ADR 0023: AI Observability](./adr-0023-ai-observability.md)
- [Cognitive Mesh](https://github.com/justaghost/cognitive-mesh) - Future
  enterprise platform

---

_© 2025 Phoenix Rooivalk. Confidential._
