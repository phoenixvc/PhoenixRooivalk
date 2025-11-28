---
id: adr-0000-appendix-cogmesh-feature-recommendations
title: "ADR 0000 Appendix: Cognitive Mesh Feature Recommendations"
sidebar_label: "ADR 0000 CM Recommendations"
difficulty: intermediate
estimated_reading_time: 10
points: 35
tags:
  - technical
  - architecture
  - governance
  - cognitive-mesh
  - recommendations
prerequisites:
  - adr-0000-adr-management
  - adr-0000-appendix-platform-decision-matrix
---

# ADR 0000 Appendix: Cognitive Mesh Feature Recommendations

**Supporting Analysis for
[ADR 0000: ADR Management & Organization](./adr-0000-adr-management.md)**

This appendix provides a feature-by-feature analysis of ADRs 0015-0023,
comparing Phoenix Rooivalk docs site implementation (LangChain/Firebase) with
Cognitive Mesh equivalents, and recommending where each feature should be
developed.

**Date**: 2025-11-27  
**Context**: Shared developer pool between Phoenix Rooivalk docs and Cognitive
Mesh

---

## Executive Summary

| ADR  | Feature               | Implement Here | Implement in CM     | Option 3: Hybrid/Minimal | Recommendation                               |
| ---- | --------------------- | -------------- | ------------------- | ------------------------ | -------------------------------------------- |
| 0015 | Prompt Management     | ✅ (Done)      | Future              | Keep minimal local       | **Keep here** - Basic needs met              |
| 0016 | RAG Architecture      | ✅ (Done)      | Future              | Keep minimal local       | **Keep here** - Azure AI Search works        |
| 0017 | Context Management    | ✅ (Done)      | Future              | Keep minimal local       | **Keep here** - Adequate for docs site       |
| 0018 | LangChain Integration | ✅ (Proposed)  | —                   | Minimal local chains     | **Defer/Minimal** - Focus on CM instead      |
| 0019 | AI Agents             | ⚠️ (Proposed)  | ✅ (In Progress)    | Stub for CM integration  | **Implement in CM** - Agency Layer exists    |
| 0020 | Agent Tools           | ⚠️ (Proposed)  | ✅ (Agency Layer)   | Stub for CM integration  | **Implement in CM** - Better governance      |
| 0021 | Conversation Memory   | ⚠️ (Proposed)  | ✅ (Foundation)     | Session-only memory      | **Implement in CM** - Privacy/GDPR built-in  |
| 0022 | AI Workflows          | ⚠️ (Proposed)  | ✅ (Business Layer) | Single-step only         | **Implement in CM** - Workflow Orchestrators |
| 0023 | AI Observability      | ✅ (Proposed)  | ✅ (All Layers)     | Basic logging only       | **Split** - Basic here, compliance in CM     |

### Trade-offs Summary

| ADR  | Schedule Impact  | Maintenance Burden     | Privacy/Compliance          |
| ---- | ---------------- | ---------------------- | --------------------------- |
| 0015 | None (done)      | Low - stable templates | Low - no PII in prompts     |
| 0016 | None (done)      | Low - Azure managed    | Low - doc content only      |
| 0017 | None (done)      | Low - simple windowing | Low - ephemeral context     |
| 0018 | -2 weeks if done | Medium - chain updates | Low - no external data      |
| 0019 | -4 weeks if done | High - agent lifecycle | Medium - action audit trail |
| 0020 | -3 weeks if done | High - tool APIs       | High - external access      |
| 0021 | -2 weeks if done | High - storage/GDPR    | High - GDPR compliance      |
| 0022 | -4 weeks if done | High - state mgmt      | Medium - workflow logging   |
| 0023 | -1 week if done  | Medium - dashboards    | Medium - trace data         |

**Summary**: Keep already-implemented features (0015-0017) here. For proposed
complex features (0019-0022), prioritize CM development over docs site
implementation.

---

## Detailed Analysis

### ADR 0015: Prompt Management

| Aspect         | Docs Site (Current)                 | Cognitive Mesh                      |
| -------------- | ----------------------------------- | ----------------------------------- |
| **Status**     | ✅ Implemented                      | ~40% (ReasoningLayer)               |
| **Approach**   | TypeScript templates in `/prompts/` | C# Prompt Engines in ReasoningLayer |
| **Versioning** | Metadata version field              | Built-in with governance            |
| **Compliance** | Manual                              | NIST AI RMF tracking                |

**CM Equivalent**: `ReasoningLayer/LLMReasoning/` - Contains prompt management
with cognitive engine integration.

**Recommendation**: **Keep here** ✅

- Current implementation meets docs site needs
- CM prompt system is for enterprise-grade governance
- Migration not worth the effort for a documentation site
- Focus CM development on higher-value features

---

### ADR 0016: RAG Architecture

| Aspect        | Docs Site (Current)    | Cognitive Mesh               |
| ------------- | ---------------------- | ---------------------------- |
| **Status**    | ✅ Implemented         | ~30% (FoundationLayer)       |
| **Vector DB** | Azure AI Search        | Pluggable adapters           |
| **Retrieval** | Hybrid (vector + BM25) | Multi-source with governance |
| **RBAC**      | External (Firebase)    | Built-in per-document        |

**CM Equivalent**: `FoundationLayer/` with vector store adapters and retrieval
pipelines.

**Recommendation**: **Keep here** ✅

- Azure AI Search works well for docs
- CM RAG is designed for multi-tenant with RBAC
- Docs site doesn't need document-level permissions
- Current latency (~300ms) is acceptable

---

### ADR 0017: Context Management

| Aspect           | Docs Site (Current)     | Cognitive Mesh                |
| ---------------- | ----------------------- | ----------------------------- |
| **Status**       | ✅ Implemented          | ~35% (ReasoningLayer)         |
| **Approach**     | Layered context modules | Knowledge graph relationships |
| **Token Budget** | Manual calculation      | Optimized via orchestration   |
| **Governance**   | None                    | Audit trails                  |

**CM Equivalent**: Context management integrated with cognitive engines and
knowledge layer.

**Recommendation**: **Keep here** ✅

- Current layered approach is sufficient
- Knowledge graph is overkill for docs site
- No compliance requirement for context audit
- CM should focus on more complex use cases

---

### ADR 0018: LangChain Integration

| Aspect         | Docs Site (Proposed) | Cognitive Mesh           |
| -------------- | -------------------- | ------------------------ |
| **Status**     | ⚠️ Proposed          | N/A (different paradigm) |
| **Approach**   | Selective LangChain  | Custom orchestration     |
| **Complexity** | Medium               | Higher, but built-in     |
| **Stack**      | TypeScript           | C#                       |

**CM Equivalent**: No direct equivalent - CM uses custom orchestration in Agency
and Business layers.

**Recommendation**: **Defer/Minimal** ⚠️

- LangChain adds ~330KB bundle size
- Simple features (competitor, SWOT) work without it
- Complex features (agents, workflows) are better suited for CM
- If needed, implement only RAG chain wrapper, not full integration
- **Developer time better spent on CM maturation**

**Alternative**: Invest that development time in CM's Agency Layer (~40%
complete) instead.

---

### ADR 0019: AI Agents

| Aspect          | Docs Site (Proposed)   | Cognitive Mesh               |
| --------------- | ---------------------- | ---------------------------- |
| **Status**      | ⚠️ Proposed            | 🟡 In Progress (~40%)        |
| **Approach**    | LangChain ReAct agents | Agency Layer with governance |
| **Multi-agent** | Manual orchestration   | Built-in coordination        |
| **Audit**       | LangSmith (external)   | Comprehensive built-in       |
| **Ethical**     | None                   | Ethical Reasoning Layer      |

**CM Equivalent**: `AgencyLayer/` with:

- Agent registry and lifecycle management
- Multi-agent orchestration
- Tool governance
- Decision audit trails

**Recommendation**: **Implement in CM** 🔶

- CM's Agency Layer is already 40% complete
- Built-in ethical reasoning and audit trails
- Multi-agent coordination is a core CM feature
- Implementing here duplicates effort
- **Priority**: Focus on completing CM Agency Layer PRD

**Trade-off**: Docs site won't have advanced agent features until CM is
production-ready. For docs site, simple RAG Q&A is sufficient.

---

### ADR 0020: Agent Tools

| Aspect            | Docs Site (Proposed)   | Cognitive Mesh            |
| ----------------- | ---------------------- | ------------------------- |
| **Status**        | ⚠️ Proposed            | ~35% (Agency Layer)       |
| **Approach**      | LangChain DynamicTools | Tool registry with RBAC   |
| **Validation**    | Zod schemas            | Built-in governance       |
| **Rate Limiting** | Custom wrapper         | Built-in quota management |
| **Audit**         | Manual logging         | Comprehensive trails      |

**CM Equivalent**: Tool system in `AgencyLayer/` with:

- RBAC per tool
- Usage quotas and governance
- Compliance tracking

**Recommendation**: **Implement in CM** 🔶

- Tool governance is critical for enterprise
- CM has tool-level RBAC designed in
- Docs site can use simple tools without framework
- **Priority**: Complete CM Agency Layer tools system

**For docs site**: Keep existing simple tools (doc search, calculator) without
LangChain wrapper. Sufficient for current needs.

---

### ADR 0021: Conversation Memory

| Aspect        | Docs Site (Proposed) | Cognitive Mesh            |
| ------------- | -------------------- | ------------------------- |
| **Status**    | ⚠️ Proposed          | ~25% (MetacognitiveLayer) |
| **Storage**   | Firestore            | Multi-tier memory system  |
| **Privacy**   | Manual GDPR handling | Built-in compliance       |
| **Retention** | Custom policies      | Governed retention        |
| **Audit**     | None                 | Memory access trails      |

**CM Equivalent**: `MetacognitiveLayer/` with:

- Working memory (short-term)
- Episodic memory (session-based)
- Semantic memory (knowledge graphs)
- GDPR-compliant data handling

**Recommendation**: **Implement in CM** 🔶

- Conversation memory has privacy implications
- GDPR compliance is complex to implement correctly
- CM has privacy controls designed in
- Docs site can work without persistent conversations

**For docs site**: Single-turn interactions are acceptable. If needed, implement
minimal session context without full memory system.

---

### ADR 0022: AI Workflows

| Aspect       | Docs Site (Proposed)       | Cognitive Mesh              |
| ------------ | -------------------------- | --------------------------- |
| **Status**   | ⚠️ Proposed                | ~30% (BusinessApplications) |
| **Approach** | LangChain RunnableSequence | Workflow Orchestrators      |
| **State**    | Firestore                  | Built-in with governance    |
| **Resume**   | Custom implementation      | Built-in checkpoints        |
| **Approval** | None                       | Human-in-the-loop           |

**CM Equivalent**: `BusinessApplications/` with:

- Workflow Orchestrators with compliance
- Step-level audit trails
- Checkpoint and rollback
- Human-in-the-loop integration

**Recommendation**: **Implement in CM** 🔶

- Multi-step workflows need governance
- CM has workflow versioning designed in
- Compliance tracking per step is enterprise-grade
- Docs site doesn't need complex workflows

**For docs site**: Keep simple single-step analyses (competitor, SWOT, market).
No need for workflow engine.

---

### ADR 0023: AI Observability

| Aspect          | Docs Site (Proposed) | Cognitive Mesh           |
| --------------- | -------------------- | ------------------------ |
| **Status**      | ⚠️ Proposed          | Built into all layers    |
| **LLM Tracing** | LangSmith            | Custom cognitive tracing |
| **Metrics**     | Firebase custom      | Layer-specific metrics   |
| **Compliance**  | Manual               | NIST AI RMF reporting    |
| **Ethical**     | None                 | Transparency logs        |

**CM Equivalent**: Observability is integrated into each layer:

- Foundation: Security event logging
- Reasoning: Cognitive operation tracing
- Metacognitive: Self-reflection metrics
- Agency: Decision audit trails
- Business: Workflow compliance

**Recommendation**: **Split** ⚠️

- **Here**: Basic metrics (latency, errors, token usage) via Firebase
- **CM**: Compliance audits, ethical transparency, NIST AI RMF reporting

**For docs site**: Implement lightweight custom metrics in Firestore. Skip
LangSmith ($$ cost) unless debugging complex issues.

---

## Implementation Priority Matrix

Based on resource constraints (shared developer), here's the recommended
approach:

### Do Now (Docs Site)

| Feature                        | Effort | Value  | Notes                         |
| ------------------------------ | ------ | ------ | ----------------------------- |
| Keep existing prompts (0015)   | Done   | High   | No changes needed             |
| Keep existing RAG (0016)       | Done   | High   | Azure AI Search works         |
| Keep context management (0017) | Done   | Medium | Sufficient for docs           |
| Basic metrics (0023 partial)   | 1 week | Medium | Lightweight Firestore logging |

### Defer (Focus on CM Instead)

| Feature                | Docs Site Effort | CM Effort     | Recommendation             |
| ---------------------- | ---------------- | ------------- | -------------------------- |
| LangChain (0018)       | 4-5 weeks        | N/A           | Skip, use simple patterns  |
| Agents (0019)          | 3-4 weeks        | Already 40%   | Finish CM Agency Layer     |
| Tools framework (0020) | 2-3 weeks        | ~35% complete | Complete CM tools          |
| Memory (0021)          | 3-4 weeks        | ~25% complete | Complete CM Metacognitive  |
| Workflows (0022)       | 4-5 weeks        | ~30% complete | Complete CM Business Layer |

### Total Development Time Comparison

| Path                        | Docs Site    | CM Acceleration | Net Benefit             |
| --------------------------- | ------------ | --------------- | ----------------------- |
| Implement 0018-0022 in Docs | ~16-21 weeks | -16-21 weeks    | Duplicate effort        |
| Skip, focus on CM           | 0 weeks      | +16-21 weeks    | Faster CM to production |

---

## Resource Allocation Recommendation

Given that developer resources are shared:

### Phase 1: Now (Next 4 weeks)

1. **Complete CM P0 PRDs** (NIST, Adaptive Balance)
2. Add basic metrics to docs site (1 week)
3. No new complex AI features in docs site

### Phase 2: Month 2-3

1. **Complete CM P1 PRDs** (Agentic AI, Cognitive Sandwich)
2. Evaluate CM readiness for pilot

### Phase 3: Month 4+

1. CM reaches production readiness
2. Migrate docs site complex features to CM
3. Docs site becomes CM integration example

---

## Decision Summary

| ADR      | Decision    | Rationale                    |
| -------- | ----------- | ---------------------------- |
| **0015** | Keep        | Already works, basic needs   |
| **0016** | Keep        | Azure AI Search sufficient   |
| **0017** | Keep        | Adequate for docs            |
| **0018** | Defer/Skip  | Bundle bloat, focus on CM    |
| **0019** | CM Priority | Agency Layer 40% done        |
| **0020** | CM Priority | Tool governance in CM        |
| **0021** | CM Priority | Privacy/GDPR in CM           |
| **0022** | CM Priority | Workflows in CM              |
| **0023** | Split       | Basic here, compliance in CM |

**Key Insight**: Every week spent building complex AI features in the docs site
is a week NOT spent maturing Cognitive Mesh. Given CM's ~40% completion,
prioritizing CM development provides better long-term value.

---

## Related Documents

- [ADR 0000: ADR Management](./adr-0000-adr-management.md)
- [ADR 0000 Appendix: Platform Decision Matrix](./adr-0000-appendix-platform-decision-matrix.md)
- [Cognitive Mesh PRD Status](https://github.com/justaghost/cognitive-mesh/blob/main/docs/prds/PRD-PRIORITY-STATUS.md)

---

_© 2025 Phoenix Rooivalk. Confidential._
