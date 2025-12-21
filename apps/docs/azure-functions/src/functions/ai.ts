/**
 * AI HTTP Endpoints
 *
 * Unified AI-powered analysis endpoints using the AIService.
 * Replaces individual Firebase AI functions.
 */

import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { requireAuthAsync } from "../lib/auth";
import {
  Errors,
  successResponse,
  applyRateLimit,
  RateLimits,
} from "../lib/utils";
import { aiService } from "../services";

/**
 * Analyze competitors handler
 */
async function analyzeCompetitorsHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const auth = await requireAuthAsync(request);
  if (!auth.authenticated) {
    return auth.error!;
  }

  const rateLimit = applyRateLimit(
    request,
    "ai-competitor",
    RateLimits.ai,
    auth.userId!,
  );
  if (!rateLimit.allowed) return rateLimit.response!;

  try {
    const { competitors, focusAreas } = (await request.json()) as {
      competitors: string[];
      focusAreas?: string[];
    };

    if (!Array.isArray(competitors) || competitors.length === 0) {
      return Errors.badRequest("At least one competitor name required", request);
    }

    const result = await aiService.analyzeCompetitors(competitors, focusAreas);

    return successResponse(result, 200, request);
  } catch (error) {
    context.error("Error analyzing competitors:", error);
    return Errors.internal("Failed to analyze competitors", request);
  }
}

/**
 * Generate SWOT analysis handler
 */
async function generateSWOTHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const auth = await requireAuthAsync(request);
  if (!auth.authenticated) {
    return auth.error!;
  }

  const rateLimit = applyRateLimit(
    request,
    "ai-swot",
    RateLimits.ai,
    auth.userId!,
  );
  if (!rateLimit.allowed) return rateLimit.response!;

  try {
    const { context: ctx, focusArea } = (await request.json()) as {
      context?: string;
      focusArea?: string;
    };

    const result = await aiService.generateSWOT({ context: ctx, focusArea });

    return successResponse(result, 200, request);
  } catch (error) {
    context.error("Error generating SWOT:", error);
    return Errors.internal("Failed to generate SWOT analysis", request);
  }
}

/**
 * Get market insights handler
 */
async function getMarketInsightsHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const auth = await requireAuthAsync(request);
  if (!auth.authenticated) {
    return auth.error!;
  }

  const rateLimit = applyRateLimit(
    request,
    "ai-market",
    RateLimits.ai,
    auth.userId!,
  );
  if (!rateLimit.allowed) return rateLimit.response!;

  try {
    const { region, segment, timeframe } = (await request.json()) as {
      region?: string;
      segment?: string;
      timeframe?: string;
    };

    const result = await aiService.getMarketInsights({
      region,
      segment,
      timeframe,
    });

    return successResponse(result, 200, request);
  } catch (error) {
    context.error("Error getting market insights:", error);
    return Errors.internal("Failed to get market insights", request);
  }
}

/**
 * Summarize content handler
 */
async function summarizeContentHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const auth = await requireAuthAsync(request);
  if (!auth.authenticated) {
    return auth.error!;
  }

  const rateLimit = applyRateLimit(
    request,
    "ai-summary",
    RateLimits.ai,
    auth.userId!,
  );
  if (!rateLimit.allowed) return rateLimit.response!;

  try {
    const { content, length, audience, format } = (await request.json()) as {
      content: string;
      length?: string;
      audience?: string;
      format?: string;
    };

    if (!content) {
      return Errors.badRequest("Content is required", request);
    }

    const summary = await aiService.summarizeContent(content, {
      length,
      audience,
      format,
    });

    return successResponse({ summary }, 200, request);
  } catch (error) {
    context.error("Error summarizing content:", error);
    return Errors.internal("Failed to summarize content", request);
  }
}

/**
 * Get reading recommendations handler
 */
async function getReadingRecommendationsHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const auth = await requireAuthAsync(request);
  if (!auth.authenticated) {
    return auth.error!;
  }

  const rateLimit = applyRateLimit(
    request,
    "ai-recommendations",
    RateLimits.ai,
    auth.userId!,
  );
  if (!rateLimit.allowed) return rateLimit.response!;

  try {
    const { role, interests, experienceLevel, readHistory } =
      (await request.json()) as {
        role: string;
        interests: string[];
        experienceLevel: string;
        readHistory?: string[];
      };

    if (!role || !interests || !experienceLevel) {
      return Errors.badRequest("role, interests, and experienceLevel are required", request);
    }

    const result = await aiService.getReadingRecommendations({
      role,
      interests,
      experienceLevel,
      readHistory,
    });

    return successResponse(result, 200, request);
  } catch (error) {
    context.error("Error getting recommendations:", error);
    return Errors.internal("Failed to get recommendations", request);
  }
}

/**
 * Suggest document improvements handler
 */
async function suggestImprovementsHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const auth = await requireAuthAsync(request);
  if (!auth.authenticated) {
    return auth.error!;
  }

  const rateLimit = applyRateLimit(
    request,
    "ai-improvements",
    RateLimits.ai,
    auth.userId!,
  );
  if (!rateLimit.allowed) return rateLimit.response!;

  try {
    const { title, content, focusArea } = (await request.json()) as {
      title: string;
      content: string;
      focusArea?: string;
    };

    if (!title || !content) {
      return Errors.badRequest("title and content are required", request);
    }

    const suggestions = await aiService.suggestImprovements(
      title,
      content,
      focusArea,
    );

    return successResponse({ suggestions }, 200, request);
  } catch (error) {
    context.error("Error suggesting improvements:", error);
    return Errors.internal("Failed to suggest improvements", request);
  }
}

/**
 * Ask documentation (RAG) handler
 */
async function askDocumentationHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const auth = await requireAuthAsync(request);
  if (!auth.authenticated) {
    return auth.error!;
  }

  const rateLimit = applyRateLimit(
    request,
    "ai-ask",
    RateLimits.ai,
    auth.userId!,
  );
  if (!rateLimit.allowed) return rateLimit.response!;

  try {
    const { question, category, topK } = (await request.json()) as {
      question: string;
      category?: string;
      topK?: number;
    };

    if (!question) {
      return Errors.badRequest("question is required", request);
    }

    const result = await aiService.askDocumentation(question, {
      category,
      topK,
    });

    return successResponse(result, 200, request);
  } catch (error) {
    context.error("Error answering question:", error);
    return Errors.internal("Failed to answer question", request);
  }
}

/**
 * Research person handler
 */
async function researchPersonHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const auth = await requireAuthAsync(request);
  if (!auth.authenticated) {
    return auth.error!;
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
      return Errors.badRequest("name is required", request);
    }

    const research = await aiService.researchPerson(name, {
      company,
      role,
      context: ctx,
    });

    return successResponse({ research }, 200, request);
  } catch (error) {
    context.error("Error researching person:", error);
    return Errors.internal("Failed to research person", request);
  }
}

/**
 * Search documentation handler
 */
async function searchDocsHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const rateLimit = applyRateLimit(request, "search", RateLimits.search);
  if (!rateLimit.allowed) return rateLimit.response!;

  try {
    const { query, category, topK } = (await request.json()) as {
      query: string;
      category?: string;
      topK?: number;
    };

    if (!query) {
      return Errors.badRequest("Query is required", request);
    }

    const results = await aiService.searchDocuments(query, {
      topK: topK || 10,
      category,
    });

    return successResponse({
      results: results.map((r) => ({
        docId: r.docId,
        title: r.title,
        section: r.section,
        content: r.content.substring(0, 200) + "...",
        score: Math.round(r.score * 1000) / 1000,
      })),
    });
  } catch (error) {
    context.error("Error searching:", error);
    return Errors.internal("Search failed", request);
  }
}

// Register endpoints
app.http("analyzeCompetitorsV2", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "ai/competitors",
  handler: analyzeCompetitorsHandler,
});

app.http("generateSWOTV2", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "ai/swot",
  handler: generateSWOTHandler,
});

app.http("getMarketInsightsV2", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "ai/market",
  handler: getMarketInsightsHandler,
});

app.http("summarizeContentV2", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "ai/summarize",
  handler: summarizeContentHandler,
});

app.http("getReadingRecommendationsV2", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "ai/recommendations",
  handler: getReadingRecommendationsHandler,
});

app.http("suggestImprovementsV2", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "ai/improvements",
  handler: suggestImprovementsHandler,
});

app.http("askDocumentationV2", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "ai/ask",
  handler: askDocumentationHandler,
});

app.http("researchPerson", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "ai/research",
  handler: researchPersonHandler,
});

app.http("searchDocsV2", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "ai/search",
  handler: searchDocsHandler,
});
