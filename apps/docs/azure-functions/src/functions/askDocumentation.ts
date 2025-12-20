/**
 * Ask Documentation Function
 *
 * RAG-powered Q&A over documentation.
 * Replaces Firebase askDocumentation function.
 */

import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { SqlParameter } from "@azure/cosmos";
import { requireAuthAsync } from "../lib/auth";
import { queryDocuments } from "../lib/cosmos";
import { generateCompletion, generateEmbeddings } from "../lib/openai";
import { checkRateLimitAsync, RateLimits } from "../lib/utils";

interface RAGSource {
  docId: string;
  title: string;
  section: string;
  relevance: number;
}

interface RAGResponse {
  answer: string;
  sources: RAGSource[];
  confidence: "high" | "medium" | "low";
  tokensUsed?: number;
}

interface DocChunk {
  id: string;
  docId: string;
  title: string;
  section: string;
  content: string;
  embedding: number[];
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Find relevant document chunks using vector similarity
 */
async function findRelevantChunks(
  questionEmbedding: number[],
  category?: string,
  topK: number = 5,
): Promise<DocChunk[]> {
  // Query all embeddings (in production, use vector search index)
  let query = "SELECT * FROM c";
  const params: SqlParameter[] = [];

  if (category) {
    query += " WHERE c.category = @category";
    params.push({ name: "@category", value: category });
  }

  const chunks = await queryDocuments<DocChunk>(
    "doc_embeddings",
    query,
    params,
  );

  // Calculate similarity and sort
  const scored = chunks.map((chunk) => ({
    ...chunk,
    similarity: cosineSimilarity(questionEmbedding, chunk.embedding),
  }));

  scored.sort((a, b) => b.similarity - a.similarity);

  return scored.slice(0, topK);
}

/**
 * Generate answer using retrieved context
 */
async function generateAnswer(
  question: string,
  relevantChunks: DocChunk[],
  history?: Array<{ role: "user" | "assistant"; content: string }>,
): Promise<RAGResponse> {
  // Build context from chunks
  const context = relevantChunks
    .map(
      (chunk, i) =>
        `[Source ${i + 1}: ${chunk.title} - ${chunk.section}]\n${chunk.content}`,
    )
    .join("\n\n");

  const systemPrompt = `You are a helpful assistant for Phoenix Rooivalk documentation.
Answer questions based on the provided context. If you're not sure or the context doesn't
contain the answer, say so. Always cite your sources using [Source N] format.

Context:
${context}`;

  // Build messages with history
  const messages: string[] = [];
  if (history) {
    for (const msg of history.slice(-4)) {
      // Last 4 messages for context
      messages.push(`${msg.role}: ${msg.content}`);
    }
  }
  messages.push(`User: ${question}`);

  const answer = await generateCompletion(systemPrompt, messages.join("\n"));

  // Determine confidence based on similarity scores
  const avgSimilarity =
    relevantChunks.reduce((sum, c: any) => sum + c.similarity, 0) /
    relevantChunks.length;
  const confidence: "high" | "medium" | "low" =
    avgSimilarity > 0.8 ? "high" : avgSimilarity > 0.6 ? "medium" : "low";

  // Build sources
  const sources: RAGSource[] = relevantChunks.map((chunk: any) => ({
    docId: chunk.docId,
    title: chunk.title,
    section: chunk.section,
    relevance: Math.round(chunk.similarity * 100) / 100,
  }));

  return { answer, sources, confidence };
}

async function handler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  // Check authentication
  const auth = await requireAuthAsync(request);
  if (!auth.authenticated) {
    return auth.error!;
  }

  // Rate limiting
  if (!(await checkRateLimitAsync(`ask:${auth.userId}`, RateLimits.ai))) {
    return {
      status: 429,
      jsonBody: { error: "Rate limit exceeded", code: "resource-exhausted" },
    };
  }

  try {
    const body = (await request.json()) as {
      question: string;
      category?: string;
      format?: "detailed" | "concise";
      history?: Array<{ role: "user" | "assistant"; content: string }>;
    };

    const { question, category, history } = body;

    if (!question || typeof question !== "string") {
      return {
        status: 400,
        jsonBody: { error: "Question is required", code: "invalid-argument" },
      };
    }

    context.log(`Processing question: "${question.substring(0, 50)}..."`);

    // Generate embedding for the question
    const questionEmbedding = await generateEmbeddings(question);

    // Find relevant chunks
    const relevantChunks = await findRelevantChunks(
      questionEmbedding,
      category,
    );

    if (relevantChunks.length === 0) {
      return {
        status: 200,
        jsonBody: {
          answer:
            "I couldn't find relevant documentation to answer your question. Please try rephrasing or ask about a different topic.",
          sources: [],
          confidence: "low",
        },
      };
    }

    // Generate answer
    const response = await generateAnswer(question, relevantChunks, history);

    return { status: 200, jsonBody: response };
  } catch (error) {
    context.error("Error processing question:", error);
    return {
      status: 500,
      jsonBody: { error: "Failed to process question", code: "internal" },
    };
  }
}

app.http("askDocumentation", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler,
});
