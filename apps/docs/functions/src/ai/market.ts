/**
 * Market Insights AI Function
 *
 * Generates market analysis and insights using AI Foundry.
 * Uses the new prompt template system with RAG integration.
 *
 * Migration: Updated to use MARKET_PROMPT template (Phase 2.1)
 */

import * as functions from "firebase-functions";
import { chatCompletion } from "../ai-provider";
import { searchDocuments, SearchResult } from "../rag/search";
import {
  MARKET_PROMPT,
  buildSystemPrompt,
  buildUserPrompt,
  getModelConfig,
} from "../prompts";
import { checkRateLimit, logUsage } from "./rate-limit";

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

    // Build prompts using the new template system
    const systemPrompt = buildSystemPrompt(MARKET_PROMPT, {
      ragContext: documentContext,
      ragSources: sourcesUsed,
    });

    const userPrompt = buildUserPrompt(MARKET_PROMPT, {
      topic,
      industry,
    });

    // Get model configuration from template
    const modelConfig = getModelConfig(MARKET_PROMPT);

    const { content, metrics } = await chatCompletion(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { model: modelConfig.model, maxTokens: modelConfig.maxTokens },
    );

    try {
      await logUsage(context.auth.uid, "market_insights", {
        topic,
        promptId: MARKET_PROMPT.metadata.id,
        promptVersion: MARKET_PROMPT.metadata.version,
        provider: metrics.provider,
        model: metrics.model,
        tokens: metrics.totalTokens,
        ragSourcesUsed: sourcesUsed.length,
      });
    } catch (logError) {
      functions.logger.warn("Failed to log market insights usage:", logError);
    }

    return {
      insights: content,
      sources: sourcesUsed,
      ragEnabled: documentContext.length > 0,
      promptVersion: MARKET_PROMPT.metadata.version,
    };
  },
);
