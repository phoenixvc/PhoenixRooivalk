/**
 * SWOT Analysis AI Function
 *
 * Generates SWOT analysis for any topic using AI Foundry.
 */

import * as functions from "firebase-functions";
import { chatCompletion } from "../ai-provider";
import { checkRateLimit, logUsage } from "./rate-limit";
import { PROMPTS } from "./prompts";

interface SWOTRequest {
  topic: string;
  context?: string;
}

/**
 * Generate SWOT analysis for a topic
 */
export const generateSWOT = functions.https.onCall(
  async (data: SWOTRequest, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be authenticated to use AI features"
      );
    }

    const canProceed = await checkRateLimit(context.auth.uid, "swot");
    if (!canProceed) {
      throw new functions.https.HttpsError(
        "resource-exhausted",
        "Rate limit exceeded. Try again later."
      );
    }

    const { topic, context: additionalContext } = data;

    if (!topic) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Topic is required for SWOT analysis"
      );
    }

    const { content, metrics } = await chatCompletion(
      [
        { role: "system", content: PROMPTS.swot.system },
        { role: "user", content: PROMPTS.swot.user(topic, additionalContext) },
      ],
      { model: "chat", maxTokens: 2500, temperature: 0.5 }
    );

    await logUsage(context.auth.uid, "swot_analysis", {
      topic,
      provider: metrics.provider,
      model: metrics.model,
      tokens: metrics.totalTokens,
    });

    return { swot: content };
  }
);
