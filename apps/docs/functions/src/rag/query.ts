/**
 * RAG Query for Phoenix Rooivalk Documentation
 *
 * Provides RAG-powered Q&A functionality:
 * - Searches relevant documentation chunks
 * - Generates answers with context
 * - Provides source citations
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { searchDocuments, SearchResult } from "./search";

const db = admin.firestore();

/**
 * RAG Response interface
 */
export interface RAGResponse {
  answer: string;
  sources: Array<{
    docId: string;
    title: string;
    section: string;
    relevance: number;
  }>;
  confidence: "high" | "medium" | "low";
  tokensUsed: number;
}

/**
 * Call OpenAI Chat API
 */
async function callOpenAIChat(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  options: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  } = {}
): Promise<{ content: string; tokensUsed: number }> {
  const apiKey = functions.config().openai?.key;

  if (!apiKey) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "OpenAI API key not configured"
    );
  }

  const model = options.model || "gpt-4o-mini";
  const maxTokens = options.maxTokens || 1500;
  const temperature = options.temperature ?? 0.3;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "OpenAI Chat API error");
    }

    const data = await response.json();
    return {
      content: data.choices[0]?.message?.content || "Unable to generate response.",
      tokensUsed: data.usage?.total_tokens || 0,
    };
  } catch (error) {
    functions.logger.error("OpenAI Chat error:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to generate response"
    );
  }
}

/**
 * Check rate limit for user
 */
async function checkRateLimit(
  userId: string,
  feature: string
): Promise<boolean> {
  const ref = db.collection("ai_rate_limits").doc(`${userId}_${feature}`);
  const doc = await ref.get();

  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour
  const maxRequests = 50; // 50 RAG queries per hour

  if (doc.exists) {
    const data = doc.data();
    const windowStart = data?.windowStart || 0;
    const count = data?.count || 0;

    if (now - windowStart < windowMs) {
      if (count >= maxRequests) return false;
      await ref.update({ count: count + 1 });
    } else {
      await ref.set({ windowStart: now, count: 1 });
    }
  } else {
    await ref.set({ windowStart: now, count: 1 });
  }

  return true;
}

/**
 * Query documentation with RAG
 */
export async function queryWithRAG(
  question: string,
  options?: {
    topK?: number;
    category?: string;
    conversationHistory?: Array<{
      role: "user" | "assistant";
      content: string;
    }>;
    responseFormat?: "detailed" | "concise";
  }
): Promise<RAGResponse> {
  const {
    topK = 5,
    category,
    conversationHistory = [],
    responseFormat = "detailed",
  } = options || {};

  // Search for relevant chunks
  const relevantChunks: SearchResult[] = await searchDocuments(question, {
    topK,
    category,
    minScore: 0.65,
  });

  // Determine confidence based on top scores
  const avgScore =
    relevantChunks.length > 0
      ? relevantChunks.reduce((sum, c) => sum + c.score, 0) /
        relevantChunks.length
      : 0;

  const confidence: "high" | "medium" | "low" =
    avgScore > 0.85 ? "high" : avgScore > 0.75 ? "medium" : "low";

  // Build context from chunks
  const context = relevantChunks
    .map(
      (chunk, i) =>
        `[Source ${i + 1}: ${chunk.title} - ${chunk.section}]\n${chunk.content}`
    )
    .join("\n\n---\n\n");

  // Build system prompt
  const systemPrompt = `You are Phoenix Rooivalk's documentation assistant, an expert on autonomous counter-drone defense systems.

IMPORTANT RULES:
1. Answer ONLY using information from the provided documentation context
2. If the context doesn't contain relevant information, say "I don't have specific documentation on that topic"
3. Always cite your sources using [Source X] notation
4. Be accurate and technical, but explain complex concepts clearly
5. If asked about competitors or sensitive topics, refer to the appropriate documentation sections

Context about Phoenix Rooivalk:
- Autonomous reusable kinetic interceptor for counter-UAS defense
- Uses blockchain-verified chain of custody
- AI-powered targeting with human-in-the-loop options
- Designed for military and critical infrastructure protection

Response format: ${
    responseFormat === "detailed"
      ? "Provide comprehensive answers with technical details and multiple source citations."
      : "Provide concise, focused answers. Be brief but accurate."
  }`;

  // Build messages
  const messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }> = [{ role: "system", content: systemPrompt }];

  // Add conversation history (last 4 messages)
  for (const msg of conversationHistory.slice(-4)) {
    messages.push({ role: msg.role, content: msg.content });
  }

  // Add context and question
  messages.push({
    role: "user",
    content: `Documentation Context:
${context}

---

Question: ${question}

Please answer based on the documentation above. Cite sources using [Source X] notation.`,
  });

  // Generate response
  const { content: answer, tokensUsed } = await callOpenAIChat(messages, {
    temperature: 0.3,
    maxTokens: 1500,
  });

  return {
    answer,
    sources: relevantChunks.map((chunk) => ({
      docId: chunk.docId,
      title: chunk.title,
      section: chunk.section,
      relevance: Math.round(chunk.score * 100) / 100,
    })),
    confidence,
    tokensUsed,
  };
}

/**
 * Exposed Cloud Function for asking documentation questions
 */
export const askDocumentation = functions.https.onCall(
  async (data, context) => {
    // Require authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be authenticated to query documentation"
      );
    }

    // Rate limiting
    const canProceed = await checkRateLimit(context.auth.uid, "rag_query");
    if (!canProceed) {
      throw new functions.https.HttpsError(
        "resource-exhausted",
        "Rate limit exceeded. Please try again later."
      );
    }

    const { question, category, format, history } = data;

    if (!question || typeof question !== "string") {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Question is required"
      );
    }

    try {
      const response = await queryWithRAG(question, {
        category,
        responseFormat: format || "detailed",
        conversationHistory: history || [],
      });

      // Log usage
      await db.collection("ai_usage").add({
        userId: context.auth.uid,
        feature: "rag_query",
        question: question.substring(0, 200),
        sourcesUsed: response.sources.length,
        confidence: response.confidence,
        tokensUsed: response.tokensUsed,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      return response;
    } catch (error) {
      functions.logger.error("RAG query error:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to process question"
      );
    }
  }
);

/**
 * Get suggested questions based on current page
 */
export const getSuggestedQuestions = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Authentication required"
      );
    }

    const { docId, category } = data;

    // Get document metadata if provided
    let docInfo = null;
    if (docId) {
      const metaQuery = await db
        .collection("doc_metadata")
        .where("docId", "==", docId)
        .limit(1)
        .get();

      if (!metaQuery.empty) {
        docInfo = metaQuery.docs[0].data();
      }
    }

    // Generate contextual suggested questions
    const suggestions: string[] = [];

    // Generic suggestions
    suggestions.push("What is Phoenix Rooivalk?");
    suggestions.push("How does the RKV targeting system work?");
    suggestions.push("What are the main technical specifications?");

    // Category-specific suggestions
    if (category === "technical" || docInfo?.category === "technical") {
      suggestions.push("How does the blockchain verification work?");
      suggestions.push("What sensors are used for threat detection?");
    } else if (category === "business" || docInfo?.category === "business") {
      suggestions.push("What is the market opportunity?");
      suggestions.push("What are the key competitive advantages?");
    } else if (
      category === "operations" ||
      docInfo?.category === "operations"
    ) {
      suggestions.push("What are the deployment requirements?");
      suggestions.push("How is maintenance performed?");
    }

    return {
      suggestions: suggestions.slice(0, 5),
      docInfo: docInfo
        ? { title: docInfo.title, category: docInfo.category }
        : null,
    };
  }
);
