/**
 * Suggest Document Improvements Function
 *
 * AI-powered documentation improvement suggestions.
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

interface ImprovementRequest {
  documentPath: string;
  documentContent: string;
  focusArea?: "clarity" | "completeness" | "technical" | "all";
}

async function handler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const auth = await requireAuthAsync(request);
  if (!auth.authenticated) {
    return { status: auth.error!.status, jsonBody: auth.error!.body };
  }

  if (!checkRateLimit(`improve:${auth.userId}`, 5, 60000)) {
    return {
      status: 429,
      jsonBody: { error: "Rate limit exceeded", code: "resource-exhausted" },
    };
  }

  try {
    const body = (await request.json()) as ImprovementRequest;
    const { documentPath, documentContent, focusArea = "all" } = body;

    if (!documentContent || documentContent.length < 100) {
      return {
        status: 400,
        jsonBody: {
          error: "Document content too short",
          code: "invalid-argument",
        },
      };
    }

    const focusInstructions = {
      clarity: "Focus on improving readability and reducing ambiguity.",
      completeness: "Focus on identifying missing information and gaps.",
      technical: "Focus on technical accuracy and depth.",
      all: "Review for clarity, completeness, and technical accuracy.",
    };

    const systemPrompt = `You are a technical documentation editor for Phoenix Rooivalk.
Review the document and suggest specific improvements.
${focusInstructions[focusArea]}

Format your response as JSON:
{
  "suggestions": [
    {
      "type": "clarity|completeness|technical|grammar",
      "location": "Section or paragraph reference",
      "current": "Current text or description",
      "suggested": "Suggested improvement",
      "reason": "Why this improves the document"
    }
  ],
  "overallScore": 1-10,
  "summary": "Brief overall assessment"
}`;

    const response = await generateCompletion(systemPrompt, documentContent, {
      temperature: 0.4,
      maxTokens: 2000,
    });

    let suggestions;
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      } else {
        suggestions = { suggestions: [], raw: response };
      }
    } catch (parseError) {
      context.warn("Failed to parse suggestions JSON:", parseError);
      suggestions = { suggestions: [], raw: response };
    }

    return {
      status: 200,
      jsonBody: {
        ...suggestions,
        documentPath,
        focusArea,
      },
    };
  } catch (error) {
    context.error("Error suggesting improvements:", error);
    return {
      status: 500,
      jsonBody: { error: "Failed to suggest improvements", code: "internal" },
    };
  }
}

app.http("suggestImprovements", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler,
});
