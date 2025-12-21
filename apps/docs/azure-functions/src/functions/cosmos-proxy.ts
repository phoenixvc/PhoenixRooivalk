/**
 * Cosmos DB Proxy Functions
 *
 * Proxy endpoints for client-side database operations.
 * Provides secure access to Cosmos DB without exposing connection strings.
 */

import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { SqlParameter, JSONValue } from "@azure/cosmos";
import { requireAuthAsync } from "../lib/auth";
import {
  getDocument,
  upsertDocument,
  deleteDocument,
  queryDocuments,
} from "../lib/cosmos";
import { handleOptionsRequest, getCorsHeaders } from "../lib/utils";
import { createRequestLogger } from "../lib/logger";

/**
 * Helper to add CORS headers to response
 */
function addCorsHeaders(
  response: HttpResponseInit,
  request: HttpRequest,
): HttpResponseInit {
  return {
    ...response,
    headers: {
      ...response.headers,
      ...getCorsHeaders(request),
    },
  };
}

/**
 * Get Document
 */
async function getDocumentHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const logger = createRequestLogger(request, "cosmos-proxy");
  
  // Handle OPTIONS preflight
  if (request.method === "OPTIONS") {
    return addCorsHeaders(handleOptionsRequest(request), request);
  }

  const auth = await requireAuthAsync(request);
  if (!auth.authenticated) {
    logger.warn("Authentication failed for getDocument", {
      operation: "getDocument",
    });
    return addCorsHeaders(auth.error!, request);
  }

  try {
    // Validate environment configuration
    if (!process.env.COSMOS_DB_CONNECTION_STRING) {
      logger.error("COSMOS_DB_CONNECTION_STRING not configured", {
        operation: "getDocument",
      });
      return addCorsHeaders(
        {
          status: 500,
          jsonBody: { 
            error: "Database not configured",
            code: "DB_CONFIG_ERROR"
          },
        },
        request,
      );
    }

    const body = (await request.json()) as {
      collection: string;
      documentId: string;
    };

    const { collection, documentId } = body;

    logger.info("getDocument request", {
      operation: "getDocument",
      collection,
      documentId,
      userId: auth.userId ?? undefined,
    });

    if (!collection || !documentId) {
      logger.warn("Missing required parameters", {
        operation: "getDocument",
        hasCollection: !!collection,
        hasDocumentId: !!documentId,
      });
      return addCorsHeaders(
        {
          status: 400,
          jsonBody: { 
            error: "Collection and documentId required",
            code: "INVALID_REQUEST"
          },
        },
        request,
      );
    }

    // Security: Restrict certain collections or add user-based filtering
    const doc = await getDocument(collection, documentId);

    logger.info("Document retrieved successfully", {
      operation: "getDocument",
      collection,
      documentId,
      found: !!doc,
    });

    return addCorsHeaders({ status: 200, jsonBody: doc }, request);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logger.error("Error getting document", error as Error, {
      operation: "getDocument",
      errorMessage,
    });
    
    context.error("Error getting document:", {
      error: errorMessage,
      stack: errorStack,
    });
    
    return addCorsHeaders(
      {
        status: 500,
        jsonBody: { 
          error: "Failed to get document",
          code: "DB_OPERATION_FAILED",
          details: process.env.NODE_ENV === "development" ? errorMessage : undefined
        },
      },
      request,
    );
  }
}

/**
 * Set Document
 */
async function setDocumentHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const logger = createRequestLogger(request, "cosmos-proxy");
  
  // Handle OPTIONS preflight
  if (request.method === "OPTIONS") {
    return addCorsHeaders(handleOptionsRequest(request), request);
  }

  const auth = await requireAuthAsync(request);
  if (!auth.authenticated) {
    logger.warn("Authentication failed for setDocument", {
      operation: "setDocument",
    });
    return addCorsHeaders(auth.error!, request);
  }

  try {
    // Validate environment configuration
    if (!process.env.COSMOS_DB_CONNECTION_STRING) {
      logger.error("COSMOS_DB_CONNECTION_STRING not configured", {
        operation: "setDocument",
      });
      return addCorsHeaders(
        {
          status: 500,
          jsonBody: { 
            error: "Database not configured",
            code: "DB_CONFIG_ERROR"
          },
        },
        request,
      );
    }

    const body = (await request.json()) as {
      collection: string;
      documentId: string;
      data: Record<string, unknown>;
      merge?: boolean;
    };

    const { collection, documentId, data, merge } = body;

    logger.info("setDocument request", {
      operation: "setDocument",
      collection,
      documentId,
      merge,
      userId: auth.userId ?? undefined,
    });

    if (!collection || !documentId || !data) {
      logger.warn("Missing required parameters", {
        operation: "setDocument",
        hasCollection: !!collection,
        hasDocumentId: !!documentId,
        hasData: !!data,
      });
      return addCorsHeaders(
        {
          status: 400,
          jsonBody: { 
            error: "Collection, documentId, and data required",
            code: "INVALID_REQUEST"
          },
        },
        request,
      );
    }

    // Add metadata
    const doc = {
      id: documentId,
      ...data,
      _updatedAt: new Date().toISOString(),
      _updatedBy: auth.userId,
    };

    if (merge) {
      try {
        const existing = await getDocument<Record<string, unknown>>(
          collection,
          documentId,
        );
        if (existing) {
          // Merge: start with existing, overlay with new data, preserve metadata
          Object.assign(doc, existing, data, {
            id: documentId,
            _updatedAt: doc._updatedAt,
            _updatedBy: doc._updatedBy,
          });
          logger.debug("Merged with existing document", {
            operation: "setDocument",
            documentId,
          });
        }
      } catch (mergeError) {
        logger.warn("Failed to fetch existing document for merge", {
          operation: "setDocument",
          documentId,
          error: mergeError instanceof Error ? mergeError.message : String(mergeError),
        });
        // Continue with upsert even if merge fails
      }
    }

    await upsertDocument(collection, doc);

    logger.info("Document upserted successfully", {
      operation: "setDocument",
      collection,
      documentId,
    });

    return addCorsHeaders(
      { status: 200, jsonBody: { success: true } },
      request,
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logger.error("Error setting document", error as Error, {
      operation: "setDocument",
      errorMessage,
    });
    
    context.error("Error setting document:", {
      error: errorMessage,
      stack: errorStack,
    });
    
    return addCorsHeaders(
      {
        status: 500,
        jsonBody: { 
          error: "Failed to set document",
          code: "DB_OPERATION_FAILED",
          details: process.env.NODE_ENV === "development" ? errorMessage : undefined
        },
      },
      request,
    );
  }
}

/**
 * Update Document
 */
async function updateDocumentHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  // Handle OPTIONS preflight
  if (request.method === "OPTIONS") {
    return addCorsHeaders(handleOptionsRequest(request), request);
  }

  const auth = await requireAuthAsync(request);
  if (!auth.authenticated) {
    return addCorsHeaders(auth.error!, request);
  }

  try {
    const body = (await request.json()) as {
      collection: string;
      documentId: string;
      updates: Record<string, unknown>;
    };

    const { collection, documentId, updates } = body;

    if (!collection || !documentId || !updates) {
      return addCorsHeaders(
        {
          status: 400,
          jsonBody: { error: "Collection, documentId, and updates required" },
        },
        request,
      );
    }

    const existing = await getDocument<Record<string, unknown>>(
      collection,
      documentId,
    );
    if (!existing) {
      return addCorsHeaders(
        {
          status: 404,
          jsonBody: { error: "Document not found" },
        },
        request,
      );
    }

    const doc = {
      ...existing,
      ...updates,
      id: documentId,
      _updatedAt: new Date().toISOString(),
      _updatedBy: auth.userId,
    };

    await upsertDocument(collection, doc);

    return addCorsHeaders(
      { status: 200, jsonBody: { success: true } },
      request,
    );
  } catch (error) {
    context.error("Error updating document:", error);
    return addCorsHeaders(
      {
        status: 500,
        jsonBody: { error: "Failed to update document" },
      },
      request,
    );
  }
}

/**
 * Query Documents
 */
async function queryDocumentsHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  // Handle OPTIONS preflight
  if (request.method === "OPTIONS") {
    return addCorsHeaders(handleOptionsRequest(request), request);
  }

  const auth = await requireAuthAsync(request);
  if (!auth.authenticated) {
    return addCorsHeaders(auth.error!, request);
  }

  try {
    const body = (await request.json()) as {
      collection: string;
      options?: {
        conditions?: Array<{
          field: string;
          operator: string;
          value: JSONValue;
        }>;
        orderBy?: Array<{ field: string; direction: "asc" | "desc" }>;
        limit?: number;
      };
    };

    const { collection, options } = body;

    if (!collection) {
      return addCorsHeaders(
        {
          status: 400,
          jsonBody: { error: "Collection required" },
        },
        request,
      );
    }

    // Build SQL query
    let query = "SELECT * FROM c";
    const params: SqlParameter[] = [];

    if (options?.conditions?.length) {
      const whereClauses = options.conditions.map((cond, i) => {
        params.push({ name: `@p${i}`, value: cond.value });
        return `c.${cond.field} ${cond.operator} @p${i}`;
      });
      query += ` WHERE ${whereClauses.join(" AND ")}`;
    }

    if (options?.orderBy?.length) {
      const orderClauses = options.orderBy.map(
        (o) => `c.${o.field} ${o.direction.toUpperCase()}`,
      );
      query += ` ORDER BY ${orderClauses.join(", ")}`;
    }

    if (options?.limit) {
      query = query.replace("SELECT *", `SELECT TOP ${options.limit} *`);
    }

    const items = await queryDocuments(collection, query, params);

    return addCorsHeaders(
      {
        status: 200,
        jsonBody: { items, cursor: null, hasMore: false },
      },
      request,
    );
  } catch (error) {
    context.error("Error querying documents:", error);
    return addCorsHeaders(
      {
        status: 500,
        jsonBody: { error: "Failed to query documents" },
      },
      request,
    );
  }
}

// Register endpoints
app.http("cosmos-getDocument", {
  methods: ["POST", "OPTIONS"],
  route: "cosmos/getDocument",
  authLevel: "anonymous",
  handler: getDocumentHandler,
});

app.http("cosmos-setDocument", {
  methods: ["POST", "OPTIONS"],
  route: "cosmos/setDocument",
  authLevel: "anonymous",
  handler: setDocumentHandler,
});

app.http("cosmos-updateDocument", {
  methods: ["POST", "OPTIONS"],
  route: "cosmos/updateDocument",
  authLevel: "anonymous",
  handler: updateDocumentHandler,
});

app.http("cosmos-queryDocuments", {
  methods: ["POST", "OPTIONS"],
  route: "cosmos/queryDocuments",
  authLevel: "anonymous",
  handler: queryDocumentsHandler,
});
