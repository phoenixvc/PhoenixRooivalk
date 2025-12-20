/**
 * Get Market Insights Function
 *
 * AI-powered market analysis for defense/drone industry.
 * Migrated from Firebase to Azure Functions.
 */

import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { requireAuthAsync } from "../lib/auth";
import { generateCompletion } from "../lib/openai";
import { checkRateLimitAsync, RateLimits } from "../lib/utils";

interface MarketInsightRequest {
  topic: string;
  industry?: string;
}

async function handler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const auth = await requireAuthAsync(request);
  if (!auth.authenticated) {
    return auth.error!;
  }

  if (!(await checkRateLimitAsync(`market:${auth.userId}`, RateLimits.ai))) {
    return {
      status: 429,
      jsonBody: { error: "Rate limit exceeded", code: "resource-exhausted" },
    };
  }

  try {
    const body = (await request.json()) as MarketInsightRequest;
    const { topic, industry = "counter-UAS defense" } = body;

    if (!topic || typeof topic !== "string") {
      return {
        status: 400,
        jsonBody: { error: "Topic is required", code: "invalid-argument" },
      };
    }

    const systemPrompt = `You are a defense industry market analyst with expertise in:
- Counter-UAS (C-UAS) systems market
- Defense technology trends
- Government procurement and contracts
- Emerging drone threats and countermeasures

Phoenix Rooivalk market context:
- Target market: $2.45-3.0B (2025) growing to $9-15B (2030)
- Growth rate: 23-27% CAGR
- Key segments: Military, Critical Infrastructure, Commercial
- Competitive advantages: Autonomous operation, speed, AI-powered targeting

Provide market insights in this format:

## Market Overview
Current state and key metrics

## Growth Drivers
What's driving market expansion

## Key Trends
Emerging patterns and technologies

## Competitive Landscape
Major players and dynamics

## Opportunities for Phoenix Rooivalk
Where the platform can capture market share

## Risks and Challenges
Market headwinds to consider

## Strategic Recommendations
Actionable market entry/expansion strategies`;

    const userPrompt = `Provide market insights on: ${topic}\nIndustry context: ${industry}`;

    const insights = await generateCompletion(systemPrompt, userPrompt, {
      temperature: 0.7,
      maxTokens: 2500,
    });

    return {
      status: 200,
      jsonBody: { insights, topic, industry },
    };
  } catch (error) {
    context.error("Error getting market insights:", error);
    return {
      status: 500,
      jsonBody: { error: "Failed to get market insights", code: "internal" },
    };
  }
}

app.http("getMarketInsights", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler,
});
