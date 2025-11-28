/**
 * Market Insights AI Function
 *
 * Generates market analysis and insights using AI Foundry.
 * Now includes RAG to ground analysis in Phoenix Rooivalk documentation.
 */

import * as functions from "firebase-functions";
import { chatCompletion } from "../ai-provider";
import { searchDocuments, SearchResult } from "../rag/search";
import { checkRateLimit, logUsage } from "./rate-limit";
import { PROMPTS, PHOENIX_CONTEXT } from "./prompts";

interface MarketInsightRequest {
  topic: string;
  industry?: string;
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
 * Get market insights on a topic
 * Uses RAG to include Phoenix Rooivalk market positioning
 */
export const getMarketInsights = functions.https.onCall(
  async (data: MarketInsightRequest, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be authenticated to use AI features",
      );
    }

    const canProceed = await checkRateLimit(context.auth.uid, "market");
    if (!canProceed) {
      throw new functions.https.HttpsError(
        "resource-exhausted",
        "Rate limit exceeded. Try again later.",
      );
    }

    const { topic, industry } = data;

    if (!topic) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Topic is required for market insights",
      );
    }

    // RAG: Search for relevant Phoenix Rooivalk market documentation
    const searchQuery = `Phoenix Rooivalk ${topic} ${industry || "counter-UAS defense"} market business competitive positioning`;

    let documentContext = "";
    let sourcesUsed: Array<{ title: string; section: string }> = [];

    try {
      const ragResults = await searchDocuments(searchQuery, {
        topK: 5,
        category: "business",
        minScore: 0.55,
      });

      // If business category yields few results, broaden search
      if (ragResults.length < 3) {
        const broaderResults = await searchDocuments(searchQuery, {
          topK: 5,
          minScore: 0.55,
        });
        ragResults.push(
          ...broaderResults.filter(
            (r) => !ragResults.some((existing) => existing.docId === r.docId),
          ),
        );
      }

      if (ragResults.length > 0) {
        documentContext = buildDocumentContext(ragResults.slice(0, 6));
        sourcesUsed = ragResults.slice(0, 6).map((r) => ({
          title: r.title,
          section: r.section,
        }));
      }
    } catch (error) {
      // Log but don't fail - continue without RAG context
      functions.logger.warn("RAG search failed for market insights:", error);
    }

    // Build enhanced system prompt with RAG context
    const systemPrompt = documentContext
      ? `${PROMPTS.market.system}

IMPORTANT: Use the following Phoenix Rooivalk documentation to provide market insights grounded in the company's actual positioning and capabilities:

${PHOENIX_CONTEXT}

PHOENIX ROOIVALK DOCUMENTATION:
${documentContext}

Reference Phoenix Rooivalk's documented market position and competitive advantages when discussing market opportunities and trends.`
      : PROMPTS.market.system;

    const { content, metrics } = await chatCompletion(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: PROMPTS.market.user(topic, industry) },
      ],
      { model: "chatAdvanced", maxTokens: 3000 },
    );

    await logUsage(context.auth.uid, "market_insights", {
      topic,
      provider: metrics.provider,
      model: metrics.model,
      tokens: metrics.totalTokens,
      ragSourcesUsed: sourcesUsed.length,
    });

    return {
      insights: content,
      sources: sourcesUsed,
      ragEnabled: documentContext.length > 0,
    };
  },
);
