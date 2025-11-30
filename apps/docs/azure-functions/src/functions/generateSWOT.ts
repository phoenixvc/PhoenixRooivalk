/**
 * Generate SWOT Analysis Function
 *
 * AI-powered SWOT analysis generation.
 * Replaces Firebase generateSWOT function.
 */

import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { requireAuth } from "../lib/auth";
import { generateCompletion, checkRateLimit } from "../lib/openai";

async function handler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const auth = requireAuth(request);
  if (!auth.authenticated) {
    return { status: auth.error!.status, jsonBody: auth.error!.body };
  }

  if (!checkRateLimit(`swot:${auth.userId}`, 10, 60000)) {
    return {
      status: 429,
      jsonBody: { error: "Rate limit exceeded", code: "resource-exhausted" },
    };
  }

  try {
    const body = (await request.json()) as {
      topic: string;
      context?: string;
    };

    const { topic, context: additionalContext } = body;

    if (!topic || typeof topic !== "string") {
      return {
        status: 400,
        jsonBody: { error: "Topic is required", code: "invalid-argument" },
      };
    }

    const systemPrompt = `You are a strategic business analyst specializing in the defense and drone industry.
Generate a comprehensive SWOT analysis in a structured format.

Output format:
## Strengths
- Point 1
- Point 2

## Weaknesses
- Point 1
- Point 2

## Opportunities
- Point 1
- Point 2

## Threats
- Point 1
- Point 2

## Summary
Brief strategic summary and recommendations.`;

    const userPrompt = additionalContext
      ? `Topic: ${topic}\n\nAdditional Context: ${additionalContext}`
      : `Topic: ${topic}`;

    const swot = await generateCompletion(systemPrompt, userPrompt, {
      temperature: 0.7,
      maxTokens: 2048,
    });

    return { status: 200, jsonBody: { swot } };
  } catch (error) {
    context.error("Error generating SWOT:", error);
    return {
      status: 500,
      jsonBody: { error: "Failed to generate SWOT analysis", code: "internal" },
    };
  }
}

app.http("generateSWOT", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler,
});
