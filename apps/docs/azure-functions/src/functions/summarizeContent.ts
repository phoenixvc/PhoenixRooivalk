/**
 * Summarize Content Function
 *
 * AI-powered content summarization.
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

interface SummarizeRequest {
  content: string;
  maxLength?: number;
  style?: "brief" | "detailed" | "bullet";
}

async function handler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const auth = await requireAuthAsync(request);
  if (!auth.authenticated) {
    return { status: auth.error!.status, jsonBody: auth.error!.body };
  }

  if (!checkRateLimit(`summarize:${auth.userId}`, 20, 60000)) {
    return {
      status: 429,
      jsonBody: { error: "Rate limit exceeded", code: "resource-exhausted" },
    };
  }

  try {
    const body = (await request.json()) as SummarizeRequest;
    const { content, maxLength = 300, style = "brief" } = body;

    if (!content || typeof content !== "string") {
      return {
        status: 400,
        jsonBody: { error: "Content is required", code: "invalid-argument" },
      };
    }

    if (content.length < 100) {
      return {
        status: 400,
        jsonBody: { error: "Content too short to summarize", code: "invalid-argument" },
      };
    }

    const styleInstructions = {
      brief: "Provide a concise summary in 2-3 sentences.",
      detailed: "Provide a comprehensive summary covering all key points.",
      bullet: "Provide a summary as bullet points highlighting the main ideas.",
    };

    const systemPrompt = `You are a technical writer specializing in defense technology documentation.
Summarize the provided content clearly and accurately.
${styleInstructions[style]}
Maximum length: approximately ${maxLength} words.`;

    const summary = await generateCompletion(systemPrompt, content, {
      temperature: 0.3,
      maxTokens: Math.min(maxLength * 2, 1000),
    });

    return {
      status: 200,
      jsonBody: { summary, style, originalLength: content.length },
    };
  } catch (error) {
    context.error("Error summarizing content:", error);
    return {
      status: 500,
      jsonBody: { error: "Failed to summarize content", code: "internal" },
    };
  }
}

app.http("summarizeContent", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler,
});
