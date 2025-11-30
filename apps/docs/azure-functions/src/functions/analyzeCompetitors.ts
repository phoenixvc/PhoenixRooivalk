/**
 * Analyze Competitors Function
 *
 * AI-powered competitor analysis for defense/drone market.
 * Migrated from Firebase to Azure Functions.
 */

import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { requireAuthAsync } from "../lib/auth";
import { generateCompletion, checkRateLimit } from "../lib/openai";

interface CompetitorAnalysisRequest {
  competitors: string[];
  focusAreas?: string[];
}

async function handler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const auth = await requireAuthAsync(request);
  if (!auth.authenticated) {
    return { status: auth.error!.status, jsonBody: auth.error!.body };
  }

  if (!checkRateLimit(`competitor:${auth.userId}`, 5, 60000)) {
    return {
      status: 429,
      jsonBody: { error: "Rate limit exceeded", code: "resource-exhausted" },
    };
  }

  try {
    const body = (await request.json()) as CompetitorAnalysisRequest;
    const { competitors, focusAreas } = body;

    if (!Array.isArray(competitors) || competitors.length === 0) {
      return {
        status: 400,
        jsonBody: {
          error: "At least one competitor name required",
          code: "invalid-argument",
        },
      };
    }

    const normalizedFocusAreas = Array.isArray(focusAreas)
      ? focusAreas.filter(
          (a): a is string => typeof a === "string" && a.trim().length > 0,
        )
      : [];

    const systemPrompt = `You are a defense industry analyst specializing in counter-UAS systems.
Analyze the specified competitors against Phoenix Rooivalk.

Phoenix Rooivalk key advantages:
- SAE Level 4 autonomous operation (edge AI, no network dependency)
- 120-195ms response time (10-40x faster than competitors)
- Multi-sensor fusion: RF, radar, optical, acoustic, infrared
- Blockchain evidence anchoring for audit trails
- Swarm coordination with Mesh Consensus Protocol

Provide comprehensive analysis in this format:

## Competitor Overview
Brief description of each competitor

## Technical Comparison
Feature-by-feature comparison table

## Market Positioning
How each competitor positions vs Phoenix Rooivalk

## Competitive Advantages
Where Phoenix Rooivalk excels

## Areas for Improvement
Where competitors have advantages

## Strategic Recommendations
Actionable insights for positioning against these competitors`;

    const userPrompt =
      normalizedFocusAreas.length > 0
        ? `Analyze these competitors: ${competitors.join(", ")}\n\nFocus on: ${normalizedFocusAreas.join(", ")}`
        : `Analyze these competitors: ${competitors.join(", ")}`;

    const analysis = await generateCompletion(systemPrompt, userPrompt, {
      temperature: 0.7,
      maxTokens: 3000,
    });

    return {
      status: 200,
      jsonBody: {
        analysis,
        competitors,
        focusAreas: normalizedFocusAreas,
      },
    };
  } catch (error) {
    context.error("Error analyzing competitors:", error);
    return {
      status: 500,
      jsonBody: { error: "Failed to analyze competitors", code: "internal" },
    };
  }
}

app.http("analyzeCompetitors", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler,
});
