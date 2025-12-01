/**
 * Get Reading Recommendations Function
 *
 * AI-powered personalized reading recommendations.
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

interface RecommendationRequest {
  readHistory: string[];
  interests?: string[];
  role?: string;
}

async function handler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const auth = await requireAuthAsync(request);
  if (!auth.authenticated) {
    return { status: auth.error!.status, jsonBody: auth.error!.body };
  }

  if (!(await checkRateLimitAsync(`recommend:${auth.userId}`, RateLimits.ai))) {
    return {
      status: 429,
      jsonBody: { error: "Rate limit exceeded", code: "resource-exhausted" },
    };
  }

  try {
    const body = (await request.json()) as RecommendationRequest;
    const { readHistory = [], interests = [], role = "general" } = body;

    const systemPrompt = `You are a documentation guide for Phoenix Rooivalk, an autonomous counter-UAS defense platform.

Available documentation categories:
- Executive: Summaries, pitch deck, investor materials
- Technical: Architecture, API docs, blockchain integration
- Business: Market analysis, ROI, competitive analysis
- Operations: Deployment guides, training, maintenance
- Legal: Compliance framework, ITAR requirements
- Research: Sensor technologies, AI/ML approaches

Based on the user's reading history and interests, recommend 3-5 documents they should read next.

Format your response as JSON:
{
  "recommendations": [
    {
      "title": "Document Title",
      "path": "/docs/category/document-name",
      "reason": "Why this is recommended",
      "priority": "high|medium|low"
    }
  ]
}`;

    const userPrompt = `User role: ${role}
Already read: ${readHistory.length > 0 ? readHistory.join(", ") : "Nothing yet"}
Interests: ${interests.length > 0 ? interests.join(", ") : "General overview"}

Recommend the next documents to read.`;

    const response = await generateCompletion(systemPrompt, userPrompt, {
      temperature: 0.5,
      maxTokens: 1000,
    });

    // Parse JSON response
    let recommendations;
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        recommendations = JSON.parse(jsonMatch[0]);
      } else {
        recommendations = { recommendations: [], raw: response };
      }
    } catch (parseError) {
      context.warn("Failed to parse recommendations JSON:", parseError);
      recommendations = { recommendations: [], raw: response };
    }

    return {
      status: 200,
      jsonBody: recommendations,
    };
  } catch (error) {
    context.error("Error getting recommendations:", error);
    return {
      status: 500,
      jsonBody: { error: "Failed to get recommendations", code: "internal" },
    };
  }
}

app.http("getReadingRecommendations", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler,
});
