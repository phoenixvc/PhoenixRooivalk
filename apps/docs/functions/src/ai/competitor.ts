/**
 * Competitor Analysis AI Function
 *
 * Analyzes competitors in the defense/drone market using AI Foundry.
 */

import * as functions from "firebase-functions";
import { chatCompletion } from "../ai-provider";
import { checkRateLimit, logUsage } from "./rate-limit";
import { PROMPTS } from "./prompts";

interface CompetitorAnalysisRequest {
  competitors: string[];
  focusAreas?: string[];
}

/**
 * Analyze competitors in the defense drone market
 */
export const analyzeCompetitors = functions.https.onCall(
  async (data: CompetitorAnalysisRequest, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be authenticated to use AI features"
      );
    }

    const canProceed = await checkRateLimit(context.auth.uid, "competitor");
    if (!canProceed) {
      throw new functions.https.HttpsError(
        "resource-exhausted",
        "Rate limit exceeded. Try again later."
      );
    }

    const { competitors, focusAreas } = data;

    if (!competitors || competitors.length === 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "At least one competitor name required"
      );
    }

    const { content, metrics } = await chatCompletion(
      [
        { role: "system", content: PROMPTS.competitor.system },
        { role: "user", content: PROMPTS.competitor.user(competitors, focusAreas) },
      ],
      { model: "chatAdvanced", maxTokens: 3000 }
    );

    await logUsage(context.auth.uid, "competitor_analysis", {
      competitors,
      provider: metrics.provider,
      model: metrics.model,
      tokens: metrics.totalTokens,
    });

    return { analysis: content };
  }
);
