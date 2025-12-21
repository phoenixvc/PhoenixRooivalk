/**
 * News Ingestion HTTP Endpoints
 *
 * Endpoints for news fetching from external APIs.
 */

import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { validateAuthHeader } from "../lib/auth";
import { Errors, successResponse } from "../lib/utils";
import { newsIngestionService } from "../services";

/**
 * Run news ingestion handler (admin only)
 */
async function runIngestionHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const authResult = await validateAuthHeader(
    request.headers.get("authorization"),
  );

  if (!authResult.valid || !authResult.isAdmin) {
    return Errors.forbidden("Admin access required", request);
  }

  try {
    const { queries, maxArticles, provider } = (await request.json()) as {
      queries?: string[];
      maxArticles?: number;
      provider?: "newsapi" | "bing";
    };

    context.log("Starting news ingestion...");

    const result = await newsIngestionService.runIngestion({
      queries,
      maxArticles,
      provider,
    });

    context.log(
      `Ingestion complete: ${result.articlesProcessed} articles processed`,
    );

    return successResponse(result, 200, request);
  } catch (error) {
    context.error("Ingestion error:", error);
    return Errors.internal("Failed to run ingestion", request);
  }
}

/**
 * Fetch breaking news handler (admin only)
 */
async function fetchBreakingNewsHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const authResult = await validateAuthHeader(
    request.headers.get("authorization"),
  );

  if (!authResult.valid || !authResult.isAdmin) {
    return Errors.forbidden("Admin access required", request);
  }

  try {
    context.log("Fetching breaking news...");

    const result = await newsIngestionService.fetchBreakingNews();

    return successResponse(result, 200, request);
  } catch (error) {
    context.error("Breaking news fetch error:", error);
    return Errors.internal("Failed to fetch breaking news", request);
  }
}

/**
 * Get ingestion config handler
 */
async function getIngestionConfigHandler(
  request: HttpRequest,
  _context: InvocationContext,
): Promise<HttpResponseInit> {
  const authResult = await validateAuthHeader(
    request.headers.get("authorization"),
  );

  if (!authResult.valid || !authResult.isAdmin) {
    return Errors.forbidden("Admin access required", request);
  }

  return successResponse(
    {
      searchQueries: newsIngestionService.getSearchQueries(),
      rssFeeds: newsIngestionService.getRSSFeeds(),
    },
    200,
    request,
  );
}

// Register endpoints
app.http("runNewsIngestion", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "news/ingestion/run",
  handler: runIngestionHandler,
});

app.http("fetchBreakingNews", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "news/ingestion/breaking",
  handler: fetchBreakingNewsHandler,
});

app.http("getIngestionConfig", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "news/ingestion/config",
  handler: getIngestionConfigHandler,
});
