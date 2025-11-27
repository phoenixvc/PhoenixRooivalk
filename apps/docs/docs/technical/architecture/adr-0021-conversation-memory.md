---
id: adr-0021-conversation-memory
title: "ADR 0021: Conversation Memory"
sidebar_label: "ADR 0021: Memory"
difficulty: intermediate
estimated_reading_time: 8
points: 30
tags:
  - technical
  - architecture
  - ai
  - memory
  - conversation
prerequisites:
  - adr-0018-langchain-integration
  - adr-0019-ai-agents
---

# ADR 0021: Conversation Memory

**Date**: 2025-11-27
**Status**: Proposed (Firestore-backed LangChain Memory)

---

## Executive Summary

1. **Problem**: AI interactions are stateless; each request lacks context from previous exchanges
2. **Decision**: Implement Firestore-backed conversation memory with LangChain BufferMemory
3. **Trade-off**: Storage costs and complexity vs. coherent multi-turn conversations

---

## Context

Current AI features are stateless:
```
User: "What are Phoenix's key features?"
AI: [Response about features]

User: "How do they compare to Anduril?"
AI: [Has no context that "they" refers to Phoenix features]
```

**Problems**:
- No conversation continuity
- Users must repeat context
- Cannot build on previous analysis
- No personalization based on history

**Requirements**:
- Persist conversation history across requests
- Support multi-turn reasoning
- Enable context-aware responses
- Allow conversation summarization for long sessions
- Respect user privacy and data retention policies

---

## Decision

**Firestore-backed conversation memory** with:
1. LangChain `BufferMemory` for recent messages
2. `ConversationSummaryMemory` for long conversations
3. User-scoped session management
4. Configurable retention policies

---

## Memory Architecture

### Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Conversation Memory System                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   User Request                                                   │
│       │                                                          │
│       ▼                                                          │
│   ┌───────────────────────────────────────────────────────────┐ │
│   │                 Session Manager                            │ │
│   │  - Create/resume sessions                                 │ │
│   │  - Enforce retention policies                             │ │
│   └───────────────────────────────────────────────────────────┘ │
│       │                                                          │
│       ▼                                                          │
│   ┌───────────────────────────────────────────────────────────┐ │
│   │                 Memory Manager                             │ │
│   │  ┌─────────────────┐    ┌─────────────────────────────┐  │ │
│   │  │  Buffer Memory  │    │  Summary Memory             │  │ │
│   │  │  (Recent msgs)  │    │  (Compressed history)       │  │ │
│   │  │  [Msg 1]        │    │  "User researched Phoenix   │  │ │
│   │  │  [Msg 2]        │    │   vs Anduril, interested    │  │ │
│   │  │  [Msg 3]        │    │   in African market..."     │  │ │
│   │  └─────────────────┘    └─────────────────────────────┘  │ │
│   └───────────────────────────────────────────────────────────┘ │
│       │                                                          │
│       ▼                                                          │
│   ┌───────────────────────────────────────────────────────────┐ │
│   │                    Firestore                               │ │
│   │  chat_sessions/{sessionId}                                │ │
│   │    └── messages/{messageId}                               │ │
│   └───────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Data Model

```typescript
// Firestore: chat_sessions/{sessionId}
interface ChatSession {
  id: string;
  userId: string;
  title: string;                    // Auto-generated or user-defined
  createdAt: Timestamp;
  updatedAt: Timestamp;
  messageCount: number;
  summary?: string;                 // Compressed conversation summary
  summaryUpdatedAt?: Timestamp;
  metadata: {
    agentType?: string;             // Which agent was used
    topic?: string;                 // Main topic of conversation
    tags?: string[];                // Auto-extracted tags
  };
  status: "active" | "archived" | "deleted";
  expiresAt?: Timestamp;            // For auto-cleanup
}

// Firestore: chat_sessions/{sessionId}/messages/{messageId}
interface ChatMessage {
  id: string;
  role: "human" | "ai" | "system";
  content: string;
  timestamp: Timestamp;
  metadata?: {
    model?: string;                 // Which model generated this
    tokens?: number;                // Token count
    sources?: string[];             // RAG sources used
    toolsUsed?: string[];           // Agent tools invoked
    durationMs?: number;            // Response generation time
  };
}
```

---

## Implementation

### Session Manager

```typescript
// langchain/memory/session-manager.ts
import { db } from "../../config/firebase";
import { Timestamp } from "firebase-admin/firestore";

export interface SessionOptions {
  userId: string;
  title?: string;
  expiresInDays?: number;
  metadata?: Record<string, any>;
}

export class SessionManager {
  private readonly collection = db.collection("chat_sessions");

  async createSession(options: SessionOptions): Promise<string> {
    const { userId, title, expiresInDays = 30, metadata = {} } = options;

    const session: Omit<ChatSession, "id"> = {
      userId,
      title: title || `Session ${new Date().toLocaleDateString()}`,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      messageCount: 0,
      metadata,
      status: "active",
      expiresAt: Timestamp.fromDate(
        new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      ),
    };

    const docRef = await this.collection.add(session);
    return docRef.id;
  }

  async getSession(sessionId: string): Promise<ChatSession | null> {
    const doc = await this.collection.doc(sessionId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as ChatSession;
  }

  async getUserSessions(
    userId: string,
    options: { limit?: number; status?: string } = {}
  ): Promise<ChatSession[]> {
    const { limit = 20, status = "active" } = options;

    const snapshot = await this.collection
      .where("userId", "==", userId)
      .where("status", "==", status)
      .orderBy("updatedAt", "desc")
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ChatSession));
  }

  async updateSession(
    sessionId: string,
    updates: Partial<ChatSession>
  ): Promise<void> {
    await this.collection.doc(sessionId).update({
      ...updates,
      updatedAt: Timestamp.now(),
    });
  }

  async archiveSession(sessionId: string): Promise<void> {
    await this.updateSession(sessionId, { status: "archived" });
  }

  async deleteSession(sessionId: string): Promise<void> {
    // Soft delete - mark as deleted
    await this.updateSession(sessionId, { status: "deleted" });

    // Optional: Also delete messages
    const messagesRef = this.collection.doc(sessionId).collection("messages");
    const messages = await messagesRef.get();
    const batch = db.batch();
    messages.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }

  async cleanupExpiredSessions(): Promise<number> {
    const now = Timestamp.now();
    const snapshot = await this.collection
      .where("expiresAt", "<", now)
      .where("status", "==", "active")
      .limit(100)
      .get();

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { status: "deleted" });
    });
    await batch.commit();

    return snapshot.size;
  }
}

export const sessionManager = new SessionManager();
```

### Firestore Chat History

```typescript
// langchain/memory/firestore-history.ts
import { BaseListChatMessageHistory } from "@langchain/core/chat_history";
import { BaseMessage, HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import { db } from "../../config/firebase";
import { Timestamp } from "firebase-admin/firestore";

export class FirestoreChatMessageHistory extends BaseListChatMessageHistory {
  lc_namespace = ["langchain", "stores", "message", "firestore"];

  private sessionId: string;
  private messagesRef: FirebaseFirestore.CollectionReference;

  constructor(sessionId: string) {
    super();
    this.sessionId = sessionId;
    this.messagesRef = db
      .collection("chat_sessions")
      .doc(sessionId)
      .collection("messages");
  }

  async getMessages(): Promise<BaseMessage[]> {
    const snapshot = await this.messagesRef
      .orderBy("timestamp", "asc")
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data() as ChatMessage;
      switch (data.role) {
        case "human":
          return new HumanMessage(data.content);
        case "ai":
          return new AIMessage(data.content);
        case "system":
          return new SystemMessage(data.content);
        default:
          return new HumanMessage(data.content);
      }
    });
  }

  async addMessage(message: BaseMessage): Promise<void> {
    const role = message._getType() === "human" ? "human" :
                 message._getType() === "ai" ? "ai" : "system";

    const chatMessage: Omit<ChatMessage, "id"> = {
      role,
      content: message.content as string,
      timestamp: Timestamp.now(),
      metadata: message.additional_kwargs as any,
    };

    await this.messagesRef.add(chatMessage);

    // Update session message count
    await db.collection("chat_sessions").doc(this.sessionId).update({
      messageCount: FieldValue.increment(1),
      updatedAt: Timestamp.now(),
    });
  }

  async addMessages(messages: BaseMessage[]): Promise<void> {
    const batch = db.batch();

    for (const message of messages) {
      const role = message._getType() === "human" ? "human" :
                   message._getType() === "ai" ? "ai" : "system";

      const chatMessage: Omit<ChatMessage, "id"> = {
        role,
        content: message.content as string,
        timestamp: Timestamp.now(),
      };

      batch.set(this.messagesRef.doc(), chatMessage);
    }

    await batch.commit();

    await db.collection("chat_sessions").doc(this.sessionId).update({
      messageCount: FieldValue.increment(messages.length),
      updatedAt: Timestamp.now(),
    });
  }

  async clear(): Promise<void> {
    const snapshot = await this.messagesRef.get();
    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    await db.collection("chat_sessions").doc(this.sessionId).update({
      messageCount: 0,
      updatedAt: Timestamp.now(),
    });
  }
}
```

### Memory Factory

```typescript
// langchain/memory/index.ts
import { BufferMemory, ConversationSummaryBufferMemory } from "langchain/memory";
import { FirestoreChatMessageHistory } from "./firestore-history";
import { azureLLMFast } from "../llm";

export interface MemoryOptions {
  sessionId: string;
  memoryType?: "buffer" | "summary";
  maxMessages?: number;      // For buffer memory
  maxTokens?: number;        // For summary memory
}

export function createMemory(options: MemoryOptions) {
  const {
    sessionId,
    memoryType = "buffer",
    maxMessages = 20,
    maxTokens = 2000
  } = options;

  const chatHistory = new FirestoreChatMessageHistory(sessionId);

  if (memoryType === "summary") {
    return new ConversationSummaryBufferMemory({
      chatHistory,
      llm: azureLLMFast,
      maxTokenLimit: maxTokens,
      returnMessages: true,
      memoryKey: "chat_history",
    });
  }

  return new BufferMemory({
    chatHistory,
    returnMessages: true,
    memoryKey: "chat_history",
    inputKey: "input",
    outputKey: "output",
  });
}

// Windowed buffer for recent context only
export function createWindowedMemory(sessionId: string, windowSize: number = 10) {
  const chatHistory = new FirestoreChatMessageHistory(sessionId);

  return new BufferMemory({
    chatHistory,
    returnMessages: true,
    memoryKey: "chat_history",
    // Note: LangChain doesn't have built-in windowing,
    // so we handle this in the retrieval
  });
}

export { sessionManager } from "./session-manager";
export { FirestoreChatMessageHistory } from "./firestore-history";
```

### Conversational Chain

```typescript
// langchain/chains/conversational-rag.ts
import { ConversationalRetrievalQAChain } from "langchain/chains";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { azureLLM } from "../llm";
import { docRetriever } from "../retrievers/azure-search";
import { createMemory, sessionManager } from "../memory";
import { PHOENIX_CORE_CONTEXT } from "../../prompts/context";

const CONVERSATIONAL_PROMPT = ChatPromptTemplate.fromMessages([
  ["system", `You are Phoenix Rooivalk's AI assistant, helping users understand
our counter-drone defense systems and related topics.

${PHOENIX_CORE_CONTEXT}

Use the conversation history to maintain context. Reference previous discussion
when relevant. If the user refers to something from earlier in the conversation,
use that context to provide accurate responses.

When answering questions:
1. Consider the full conversation context
2. Use retrieved documentation when relevant
3. Be consistent with previous responses
4. Acknowledge when you're building on earlier discussion`],
  new MessagesPlaceholder("chat_history"),
  ["human", "{question}"],
]);

export async function createConversationalChain(sessionId: string) {
  const memory = createMemory({
    sessionId,
    memoryType: "summary",
    maxTokens: 2000,
  });

  return ConversationalRetrievalQAChain.fromLLM(azureLLM, docRetriever, {
    memory,
    questionGeneratorChainOptions: {
      llm: azureLLM,
    },
    qaChainOptions: {
      type: "stuff",
      prompt: CONVERSATIONAL_PROMPT,
    },
    returnSourceDocuments: true,
  });
}

// Cloud Function endpoint
export async function chat(
  userId: string,
  sessionId: string | undefined,
  message: string
) {
  // Create or resume session
  let activeSessionId = sessionId;
  if (!activeSessionId) {
    activeSessionId = await sessionManager.createSession({
      userId,
      metadata: { type: "chat" },
    });
  } else {
    // Verify session belongs to user
    const session = await sessionManager.getSession(activeSessionId);
    if (!session || session.userId !== userId) {
      throw new Error("Session not found or access denied");
    }
  }

  // Create chain with memory
  const chain = await createConversationalChain(activeSessionId);

  // Execute
  const result = await chain.invoke({
    question: message,
  });

  return {
    sessionId: activeSessionId,
    answer: result.text,
    sources: result.sourceDocuments?.map((d) => d.metadata.title),
  };
}
```

---

## Session Lifecycle

### Session States

```
┌──────────┐    create    ┌──────────┐    archive    ┌──────────┐
│  (none)  │ ───────────▶ │  active  │ ────────────▶ │ archived │
└──────────┘              └──────────┘               └──────────┘
                               │                          │
                               │ delete                   │ delete
                               ▼                          ▼
                          ┌──────────┐              ┌──────────┐
                          │ deleted  │              │ deleted  │
                          └──────────┘              └──────────┘
                               │
                               │ cleanup (30 days)
                               ▼
                          ┌──────────┐
                          │ (purged) │
                          └──────────┘
```

### Retention Policies

| Session Status | Retention | Auto-Cleanup |
|----------------|-----------|--------------|
| active | 30 days from last activity | Yes |
| archived | 90 days | Yes |
| deleted | 30 days (for recovery) | Yes |

### Cleanup Function

```typescript
// functions/src/scheduled/cleanup-sessions.ts
import * as functions from "firebase-functions";
import { sessionManager } from "../langchain/memory";

export const cleanupExpiredSessions = functions.pubsub
  .schedule("every 24 hours")
  .onRun(async () => {
    const cleaned = await sessionManager.cleanupExpiredSessions();
    functions.logger.info(`Cleaned up ${cleaned} expired sessions`);
  });
```

---

## Options Considered

### Option 1: Firestore Memory ✅ Selected

| Aspect | Details |
|--------|---------|
| **Storage** | Firestore collections |
| **Persistence** | Permanent (with retention policies) |
| **Scalability** | Firebase auto-scaling |

**Pros**:
- Native to Firebase stack
- Real-time sync possible
- Familiar data model
- Fine-grained access control

**Cons**:
- Read/write costs at scale
- Query limitations
- No built-in vector search for memory

---

### Option 2: Redis Memory

| Aspect | Details |
|--------|---------|
| **Storage** | Redis (Memorystore) |
| **Persistence** | Session-scoped or persistent |
| **Scalability** | High throughput |

**Pros**:
- Very fast access
- Built-in TTL
- Good for short-lived sessions

**Cons**:
- Additional infrastructure
- Not persistent by default
- Extra cost

---

### Option 3: In-Memory Only

| Aspect | Details |
|--------|---------|
| **Storage** | Function instance memory |
| **Persistence** | Request-scoped only |
| **Scalability** | Limited by instance |

**Pros**:
- Zero latency
- No storage costs
- Simple implementation

**Cons**:
- Lost between requests
- No multi-turn conversations
- No persistence

---

### Option 4: Cognitive Mesh (Future)

| Aspect | Details |
|--------|---------|
| **Storage** | Cognitive Memory Layer |
| **Persistence** | Multi-tier with governance |
| **Scalability** | Enterprise-grade |
| **Platform** | C#/.NET 9.0+ |

**Repository**: https://github.com/justaghost/cognitive-mesh

**Pros**:
- Built-in memory governance and retention policies
- User-scoped memory with RBAC
- Audit trails for memory access
- Multi-tier memory (working, episodic, semantic)
- Memory summarization with compliance tracking
- GDPR-compliant data handling built-in
- Privacy controls and right-to-be-forgotten support

**Cons**:
- Different tech stack (C#/.NET vs TypeScript)
- Currently in development, not yet deployed
- Migration effort from Firestore memory
- Higher operational complexity

**When to Consider**:
- When GDPR compliance for memory is mandated
- When audit trails for conversation access are required
- When multi-tier memory architecture is needed
- When user privacy controls are critical

**Current Status**: In development. Evaluate when privacy and compliance requirements increase.

---

## Rationale

| Factor | Firestore | Redis | In-Memory | Cognitive Mesh |
|--------|-----------|-------|-----------|----------------|
| **Persistence** | ✅ Native | ⚠️ Config needed | ❌ None | ✅ Multi-tier |
| **Stack fit** | ✅ Firebase native | ⚠️ New service | ✅ No deps | ⚠️ C#/.NET |
| **Multi-turn** | ✅ Yes | ✅ Yes | ❌ No | ✅ Yes |
| **Cost** | ⚠️ Per read/write | ⚠️ Instance cost | ✅ Free | ⚠️ Infrastructure |
| **Complexity** | ⚠️ Medium | ⚠️ Medium | ✅ Low | ⚠️ High |
| **Privacy/GDPR** | ⚠️ Manual | ⚠️ Manual | ❌ None | ✅ Built-in |
| **Audit trails** | ⚠️ Manual | ❌ None | ❌ None | ✅ Built-in |

**Decision**: Firestore provides the best balance of persistence, Firebase integration, and feature richness for conversation memory. Cognitive Mesh becomes the preferred option when privacy compliance requirements increase.

---

## Privacy & Security

### Data Handling

| Aspect | Implementation |
|--------|----------------|
| **User isolation** | Sessions scoped by userId |
| **Access control** | Firestore security rules |
| **Encryption** | At-rest (Firestore default) |
| **Deletion** | User-initiated + auto-cleanup |
| **Export** | GDPR data export endpoint |

### Security Rules

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /chat_sessions/{sessionId} {
      allow read, write: if request.auth != null
        && resource.data.userId == request.auth.uid;

      match /messages/{messageId} {
        allow read, write: if request.auth != null
          && get(/databases/$(database)/documents/chat_sessions/$(sessionId)).data.userId == request.auth.uid;
      }
    }
  }
}
```

---

## Consequences

### Positive

- **Conversation continuity**: Multi-turn context preserved
- **Personalization**: Can reference past interactions
- **Better UX**: No need to repeat context
- **Audit trail**: Full conversation history available

### Negative

- **Storage costs**: Firestore reads/writes add up
- **Complexity**: Session management overhead
- **Privacy concerns**: Storing user conversations
- **Latency**: Memory fetch adds ~50-100ms

### Risks

| Risk | Mitigation |
|------|------------|
| Memory bloat | Summarization + windowing |
| Cost overrun | Retention policies + cleanup |
| Privacy breach | Encryption + access controls |
| Stale context | Summary refresh triggers |

---

## Implementation Recommendation

### Decision: **Implement in Cognitive Mesh** 🔶

| Factor | Assessment |
|--------|------------|
| **Current Status** | Proposed (not implemented) |
| **CM Equivalent** | MetacognitiveLayer (~25% complete) |
| **CM Advantage** | GDPR built-in, multi-tier memory, privacy controls |
| **Resource Trade-off** | Privacy/GDPR is complex, CM has it designed |

**Rationale**: Conversation memory has significant privacy implications (GDPR right-to-erasure, data retention, etc.). Cognitive Mesh's Metacognitive Layer has multi-tier memory (working, episodic, semantic) with built-in privacy controls and compliance tracking.

**Action**: 
- **Do NOT implement** conversation memory in docs site
- **Prioritize CM Metacognitive Layer development**
- Docs site works fine with single-turn interactions
- Users don't need conversation history for documentation Q&A

**For docs site**: Single-turn Q&A is acceptable. No conversation continuity needed.

See [ADR 0000 Appendix: CM Feature Recommendations](./adr-0000-appendix-cogmesh-feature-recommendations.md) for full analysis.

---

## Related ADRs

- [ADR 0000: ADR Management](./adr-0000-adr-management.md) - Platform decision framework
- [ADR 0018: LangChain Integration](./adr-0018-langchain-integration.md)
- [ADR 0019: AI Agents Architecture](./adr-0019-ai-agents.md)
- [ADR 0013: Identity & Auth Strategy](./adr-0013-identity-auth.md)
- [Cognitive Mesh](https://github.com/justaghost/cognitive-mesh) - Future enterprise platform

---

_© 2025 Phoenix Rooivalk. Confidential._
