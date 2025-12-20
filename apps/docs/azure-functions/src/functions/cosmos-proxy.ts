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

/**
 * Get Document
 */
async function getDocumentHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const auth = await requireAuthAsync(request);
  if (!auth.authenticated) {
    return auth.error!;
  }

  try {
    const body = (await request.json()) as {
      collection: string;
      documentId: string;
    };

    const { collection, documentId } = body;

    if (!collection || !documentId) {
      return {
        status: 400,
        jsonBody: { error: "Collection and documentId required" },
      };
    }

    // Security: Restrict certain collections or add user-based filtering
    const doc = await getDocument(collection, documentId);

    return { status: 200, jsonBody: doc };
  } catch (error) {
    context.error("Error getting document:", error);
    return { status: 500, jsonBody: { error: "Failed to get document" } };
  }
}

/**
 * Set Document
 */
async function setDocumentHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const auth = await requireAuthAsync(request);
  if (!auth.authenticated) {
    return auth.error!;
  }

  try {
    const body = (await request.json()) as {
      collection: string;
      documentId: string;
      data: Record<string, unknown>;
      merge?: boolean;
    };

    const { collection, documentId, data, merge } = body;

    if (!collection || !documentId || !data) {
      return {
        status: 400,
        jsonBody: { error: "Collection, documentId, and data required" },
      };
    }

    // Add metadata
    const doc = {
      id: documentId,
      ...data,
      _updatedAt: new Date().toISOString(),
      _updatedBy: auth.userId,
    };

    if (merge) {
      const existing = await getDocument<Record<string, unknown>>(
        collection,
        documentId,
      );
      if (existing) {
        Object.assign(doc, existing, doc);
      }
    }

    await upsertDocument(collection, doc);

    return { status: 200, jsonBody: { success: true } };
  } catch (error) {
    context.error("Error setting document:", error);
    return { status: 500, jsonBody: { error: "Failed to set document" } };
  }
}

/**
 * Update Document
 */
async function updateDocumentHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const auth = await requireAuthAsync(request);
  if (!auth.authenticated) {
    return auth.error!;
  }

  try {
    const body = (await request.json()) as {
      collection: string;
      documentId: string;
      updates: Record<string, unknown>;
    };

    const { collection, documentId, updates } = body;

    if (!collection || !documentId || !updates) {
      return {
        status: 400,
        jsonBody: { error: "Collection, documentId, and updates required" },
      };
    }

    const existing = await getDocument<Record<string, unknown>>(
      collection,
      documentId,
    );
    if (!existing) {
      return { status: 404, jsonBody: { error: "Document not found" } };
    }

    const doc = {
      ...existing,
      ...updates,
      id: documentId,
      _updatedAt: new Date().toISOString(),
      _updatedBy: auth.userId,
    };

    await upsertDocument(collection, doc);

    return { status: 200, jsonBody: { success: true } };
  } catch (error) {
    context.error("Error updating document:", error);
    return { status: 500, jsonBody: { error: "Failed to update document" } };
  }
}

/**
 * Query Documents
 */
async function queryDocumentsHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const auth = await requireAuthAsync(request);
  if (!auth.authenticated) {
    return auth.error!;
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
      return {
        status: 400,
        jsonBody: { error: "Collection required" },
      };
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

    return {
      status: 200,
      jsonBody: { items, cursor: null, hasMore: false },
    };
  } catch (error) {
    context.error("Error querying documents:", error);
    return { status: 500, jsonBody: { error: "Failed to query documents" } };
  }
}

// Register endpoints
app.http("cosmos-getDocument", {
  methods: ["POST"],
  route: "cosmos/getDocument",
  authLevel: "anonymous",
  handler: getDocumentHandler,
});

app.http("cosmos-setDocument", {
  methods: ["POST"],
  route: "cosmos/setDocument",
  authLevel: "anonymous",
  handler: setDocumentHandler,
});

app.http("cosmos-updateDocument", {
  methods: ["POST"],
  route: "cosmos/updateDocument",
  authLevel: "anonymous",
  handler: updateDocumentHandler,
});

app.http("cosmos-queryDocuments", {
  methods: ["POST"],
  route: "cosmos/queryDocuments",
  authLevel: "anonymous",
  handler: queryDocumentsHandler,
});
