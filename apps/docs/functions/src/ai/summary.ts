/**
 * Content Summary AI Function
 *
 * Summarizes content using AI Foundry fast model.
 */

import * as functions from "firebase-functions";
import { chatCompletion } from "../ai-provider";
import { checkRateLimit, logUsage } from "./rate-limit";
import { PROMPTS } from "./prompts";

interface ContentSummaryRequest {
  content: string;
  maxLength?: number;
}

/**
 * Summarize content
 */
export const summarizeContent = functions.https.onCall(
  async (data: ContentSummaryRequest, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be authenticated to use AI features",
      );
    }

    const canProceed = await checkRateLimit(context.auth.uid, "summary");
    if (!canProceed) {
      throw new functions.https.HttpsError(
        "resource-exhausted",
        "Rate limit exceeded. Try again later.",
      );
    }

    // Safe destructuring with fallback to prevent null/undefined errors
    const { content, maxLength = 500 } = (data ?? {}) as ContentSummaryRequest;

    // Validate content is a non-empty string
    if (typeof content !== "string" || content.length < 200) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Content is too short to summarize",
      );
    }

    const truncatedContent =
      content.length > 15000 ? content.substring(0, 15000) + "..." : content;

    const { content: summary, metrics } = await chatCompletion(
      [
        { role: "system", content: PROMPTS.summary.system },
        {
          role: "user",
          content: PROMPTS.summary.user(truncatedContent, maxLength),
        },
      ],
      { model: "chatFast", maxTokens: 1000, temperature: 0.3 },
    );

    // Log usage after successful completion
    await logUsage(context.auth.uid, "summary", {
      provider: metrics.provider,
      model: metrics.model,
      tokens: metrics.totalTokens,
      contentLength: content.length,
      maxLength,
    });

    return { summary };
  },
);
