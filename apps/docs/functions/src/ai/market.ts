/**
 * Market Insights AI Function
 *
 * Generates market analysis and insights using AI Foundry.
 */

import * as functions from "firebase-functions";
import { chatCompletion } from "../ai-provider";
import { checkRateLimit, logUsage } from "./rate-limit";
import { PROMPTS } from "./prompts";

interface MarketInsightRequest {
  topic: string;
  industry?: string;
}

/**
 * Get market insights on a topic
 */
export const getMarketInsights = functions.https.onCall(
  async (data: MarketInsightRequest, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be authenticated to use AI features"
      );
    }

    const canProceed = await checkRateLimit(context.auth.uid, "market");
    if (!canProceed) {
      throw new functions.https.HttpsError(
        "resource-exhausted",
        "Rate limit exceeded. Try again later."
      );
    }

    const { topic, industry } = data;

    if (!topic) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Topic is required for market insights"
      );
    }

    const { content, metrics } = await chatCompletion(
      [
        { role: "system", content: PROMPTS.market.system },
        { role: "user", content: PROMPTS.market.user(topic, industry) },
      ],
      { model: "chatAdvanced", maxTokens: 3000 }
    );

    await logUsage(context.auth.uid, "market_insights", {
      topic,
      provider: metrics.provider,
      model: metrics.model,
      tokens: metrics.totalTokens,
    });

    return { insights: content };
  }
);
