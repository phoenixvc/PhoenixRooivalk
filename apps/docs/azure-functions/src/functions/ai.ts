/**
 * AI HTTP Endpoints
 *
 * Unified AI-powered analysis endpoints using the AIService.
 * Note: Most AI functions are in their own files (analyzeCompetitors.ts, etc.)
 * This file contains functions that don't have separate implementations.
 */

import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { requireAuthAsync } from "../lib/auth";
import { Errors, successResponse, applyRateLimit, RateLimits } from "../lib/utils";
import { aiService } from "../services";

/**
 * Research person handler
 * This function is unique to ai.ts (no separate file exists)
 */
async function researchPersonHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const auth = await requireAuthAsync(request);
  if (!auth.authenticated) {
    return Errors.unauthenticated();
  }

  const rateLimit = applyRateLimit(
    request,
    "ai-research",
    RateLimits.ai,
    auth.userId!,
  );
  if (!rateLimit.allowed) return rateLimit.response!;

  try {
    const {
      name,
      company,
      role,
      context: ctx,
    } = (await request.json()) as {
      name: string;
      company?: string;
      role?: string;
      context?: string;
    };

    if (!name) {
      return Errors.badRequest("name is required");
    }

    const research = await aiService.researchPerson(name, {
      company,
      role,
      context: ctx,
    });

    return successResponse({ research });
  } catch (error) {
    context.error("Error researching person:", error);
    return Errors.internal("Failed to research person");
  }
}

// Register endpoints
app.http("researchPerson", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "ai/research",
  handler: researchPersonHandler,
});
