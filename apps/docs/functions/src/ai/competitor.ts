/**
 * Competitor Analysis AI Function
 *
 * Analyzes competitors in the defense/drone market using AI Foundry.
 * Uses the new prompt template system with RAG integration.
 *
 * Migration: Updated to use COMPETITOR_PROMPT template (Phase 2.1)
 */

import * as functions from "firebase-functions";

import { chatCompletion } from "../ai-provider";
import { searchDocuments, SearchResult } from "../rag/search";
import {
  COMPETITOR_PROMPT,
  buildSystemPrompt,
  buildUserPrompt,
  getModelConfig,
} from "../prompts";

import { checkRateLimit, logUsage } from "./rate-limit";

interface CompetitorAnalysisRequest {
  competitors: string[];
  focusAreas?: string[];
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
 * Analyze competitors in the defense drone market
 * Uses RAG to include Phoenix Rooivalk capabilities in the analysis
 */
export const analyzeCompetitors = functions.https.onCall(
  async (data: CompetitorAnalysisRequest, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be authenticated to use AI features",
      );
    }

    const canProceed = await checkRateLimit(context.auth.uid, "competitor");
    if (!canProceed) {
      throw new functions.https.HttpsError(
        "resource-exhausted",
        "Rate limit exceeded. Try again later.",
      );
    }

    // Safe destructuring with fallback to prevent null/undefined errors
    const { competitors, focusAreas } = (data ??
      {}) as CompetitorAnalysisRequest;

    // Validate payload
    if (!Array.isArray(competitors) || competitors.length === 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "At least one competitor name required",
      );
    }

    // Validate focusAreas if provided
    if (focusAreas !== undefined && !Array.isArray(focusAreas)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "focusAreas must be an array of strings",
      );
    }

    // Normalize focusAreas: filter to valid strings only
    const normalizedFocusAreas = Array.isArray(focusAreas)
      ? focusAreas.filter(
          (a): a is string => typeof a === "string" && a.trim().length > 0,
        )
      : [];

    // RAG: Search for relevant Phoenix Rooivalk documentation
    const searchQuery = `Phoenix Rooivalk technical capabilities specifications ${normalizedFocusAreas.length > 0 ? normalizedFocusAreas.join(" ") : "counter-UAS defense drone interceptor"}`;

    let documentContext = "";
    let sourcesUsed: Array<{ title: string; section: string }> = [];

    try {
      const ragResults = await searchDocuments(searchQuery, {
        topK: 5,
        minScore: 0.6,
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
      functions.logger.warn(
        "RAG search failed for competitor analysis:",
        error,
      );
    }

    // Build prompts using the new template system
    const systemPrompt = buildSystemPrompt(COMPETITOR_PROMPT, {
      ragContext: documentContext,
      ragSources: sourcesUsed,
    });

    const userPrompt = buildUserPrompt(COMPETITOR_PROMPT, {
      competitors,
      focusAreas:
        normalizedFocusAreas.length > 0
          ? normalizedFocusAreas.join(", ")
          : undefined,
    });

    // Get model configuration from template
    const modelConfig = getModelConfig(COMPETITOR_PROMPT);

    const { content, metrics } = await chatCompletion(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { model: modelConfig.model, maxTokens: modelConfig.maxTokens },
    );

    // Log usage in isolated try/catch so telemetry failures don't affect response
    try {
      await logUsage(context.auth.uid, "competitor_analysis", {
        competitors,
        promptId: COMPETITOR_PROMPT.metadata.id,
        promptVersion: COMPETITOR_PROMPT.metadata.version,
        provider: metrics.provider,
        model: metrics.model,
        tokens: metrics.totalTokens,
        ragSourcesUsed: sourcesUsed.length,
      });
    } catch (logError) {
      functions.logger.warn(
        "Failed to log usage for competitor analysis:",
        logError,
      );
    }

    return {
      analysis: content,
      sources: sourcesUsed,
      ragEnabled: documentContext.length > 0,
      promptVersion: COMPETITOR_PROMPT.metadata.version,
    };
  },
);
