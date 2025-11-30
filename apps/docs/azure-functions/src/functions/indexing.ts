/**
 * Indexing HTTP Endpoints
 *
 * Document indexing and embedding management endpoints.
 */

import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { validateAuthHeader } from "../lib/auth";
import { Errors, successResponse } from "../lib/utils";
import { indexingService } from "../services";

/**
 * Index documents handler (admin only)
 */
async function indexDocumentsHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const authResult = await validateAuthHeader(
    request.headers.get("authorization"),
  );

  if (!authResult.valid || !authResult.isAdmin) {
    return Errors.forbidden();
  }

  try {
    const { documents, chunkSize, overlap } = (await request.json()) as {
      documents: Array<{
        id: string;
        title: string;
        content: string;
        category?: string;
        url?: string;
      }>;
      chunkSize?: number;
      overlap?: number;
    };

    if (!documents || !Array.isArray(documents)) {
      return Errors.badRequest("documents array is required");
    }

    context.log(`Indexing ${documents.length} documents...`);

    const result = await indexingService.indexDocuments(documents);

    return successResponse({
      message: `Indexed ${result.totalChunks} chunks from ${documents.length} documents`,
      results: result.results,
    });
  } catch (error) {
    context.error("Indexing error:", error);
    return Errors.internal("Indexing failed");
  }
}

/**
 * Delete document embeddings handler (admin only)
 */
async function deleteDocumentIndexHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const authResult = await validateAuthHeader(
    request.headers.get("authorization"),
  );

  if (!authResult.valid || !authResult.isAdmin) {
    return Errors.forbidden();
  }

  try {
    const { docId } = (await request.json()) as { docId: string };

    if (!docId) {
      return Errors.badRequest("docId is required");
    }

    const deleted = await indexingService.deleteDocumentEmbeddings(docId);

    return successResponse({
      message: `Deleted ${deleted} chunks for document ${docId}`,
    });
  } catch (error) {
    context.error("Delete error:", error);
    return Errors.internal("Delete failed");
  }
}

/**
 * Get indexing stats handler
 */
async function getIndexStatsHandler(
  _request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    const stats = await indexingService.getStats();
    return successResponse(stats);
  } catch (error) {
    context.error("Stats error:", error);
    return Errors.internal("Failed to get stats");
  }
}

// Register endpoints
app.http("indexDocumentsV2", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "index/documents",
  handler: indexDocumentsHandler,
});

app.http("deleteDocumentIndexV2", {
  methods: ["DELETE"],
  authLevel: "anonymous",
  route: "index/documents",
  handler: deleteDocumentIndexHandler,
});

app.http("indexStatsV2", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "index/stats",
  handler: getIndexStatsHandler,
});
