/**
 * SWOT Analysis AI Function
 *
 * Generates SWOT analysis for any topic using AI Foundry.
 * Now includes RAG to ground analysis in Phoenix Rooivalk documentation.
 */

import * as functions from "firebase-functions";

import { chatCompletion } from "../ai-provider";
import { searchDocuments, SearchResult } from "../rag/search";

import { checkRateLimit, logUsage } from "./rate-limit";
import { PROMPTS, PHOENIX_CONTEXT } from "./prompts";

interface SWOTRequest {
  topic: string;
  context?: string;
}

/**
 * Build context string from search results
 */
function buildDocumentContext(results: SearchResult[]): string {
  if (results.length === 0) {
    return "";
  }

  return results
    .map(
      (r, i) =>
        `[Source ${i + 1}: ${r.title} - ${r.section}]\n${r.content.substring(0, 500)}`,
    )
    .join("\n\n---\n\n");
}

/**
 * Generate SWOT analysis for a topic
 * Uses RAG to include Phoenix Rooivalk context for accurate analysis
 */
export const generateSWOT = functions.https.onCall(
  async (data: SWOTRequest, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be authenticated to use AI features",
      );
    }

    const canProceed = await checkRateLimit(context.auth.uid, "swot");
    if (!canProceed) {
      throw new functions.https.HttpsError(
        "resource-exhausted",
        "Rate limit exceeded. Try again later.",
      );
    }

    // Safe destructuring with fallback to prevent null/undefined errors
    const { topic, context: additionalContext } = (data ?? {}) as {
      topic?: unknown;
      context?: string;
    };

    // Validate topic is a non-empty string
    if (typeof topic !== "string" || topic.trim().length === 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Topic must be a non-empty string for SWOT analysis",
      );
    }

    // RAG: Search for relevant Phoenix Rooivalk documentation
    const searchQuery = `Phoenix Rooivalk ${topic} strengths weaknesses opportunities threats market capabilities`;

    let documentContext = "";
    let sourcesUsed: Array<{ title: string; section: string }> = [];

    try {
      const ragResults = await searchDocuments(searchQuery, {
        topK: 6,
        minScore: 0.55,
      });

      if (ragResults.length > 0) {
        documentContext = buildDocumentContext(ragResults);
        sourcesUsed = ragResults.map((r) => ({
          title: r.title,
          section: r.section,
        }));
      }
    } catch (error) {
      // Log but don't fail - continue without RAG context
      functions.logger.warn("RAG search failed for SWOT analysis:", error);
    }

    // Build enhanced system prompt with RAG context
    const systemPrompt = documentContext
      ? `${PROMPTS.swot.system}

IMPORTANT: Use the following Phoenix Rooivalk documentation to provide an accurate SWOT analysis grounded in real company data:

${PHOENIX_CONTEXT}

PHOENIX ROOIVALK DOCUMENTATION:
${documentContext}

Base your Strengths and Weaknesses on the documented capabilities. Reference specific features and specifications from the documentation.`
      : PROMPTS.swot.system;

    const { content, metrics } = await chatCompletion(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: PROMPTS.swot.user(topic, additionalContext) },
      ],
      { model: "chat", maxTokens: 2500, temperature: 0.5 },
    );

    // Log usage in fire-and-forget manner to prevent logging failures from
    // failing the callable
    try {
      await logUsage(context.auth.uid, "swot", {
        topic,
        provider: metrics.provider,
        model: metrics.model,
        tokens: metrics.totalTokens,
        ragSourcesUsed: sourcesUsed.length,
      });
    } catch (logError) {
      functions.logger.warn("Failed to log SWOT usage:", logError);
    }

    return {
      swot: content,
      sources: sourcesUsed,
      ragEnabled: documentContext.length > 0,
    };
  },
);
