/**
 * Azure Search Index Operations
 *
 * Upload, delete, and manage Azure Search index.
 */

import * as functions from "firebase-functions";
import { logMetrics } from "../monitoring";
import {
  AZURE_SEARCH_INDEX_SCHEMA,
  getAzureSearchConfig,
  buildAzureUrl,
  buildAzureHeaders,
} from "./config";

/**
 * Upload documents to Azure Search index
 */
export async function uploadToAzureIndex(
  documents: Array<{
    id: string;
    docId: string;
    chunkId: string;
    title: string;
    section: string;
    content: string;
    category: string;
    chunkIndex: number;
    totalChunks: number;
    contentHash: string;
    embedding: number[];
  }>,
): Promise<{
  success: boolean;
  indexed: number;
  failed: number;
  errors: string[];
}> {
  const config = getAzureSearchConfig();

  if (!config) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Azure Search not configured",
    );
  }

  const startTime = Date.now();

  // Add indexedAt timestamp to all documents
  const docsWithTimestamp = documents.map((doc) => ({
    ...doc,
    indexedAt: new Date().toISOString(),
    "@search.action": "mergeOrUpload",
  }));

  try {
    const url = buildAzureUrl(config, "docs/index");
    const response = await fetch(url, {
      method: "POST",
      headers: buildAzureHeaders(config),
      body: JSON.stringify({ value: docsWithTimestamp }),
    });

    if (!response.ok) {
      let errorMessage = "Azure index upload failed";
      try {
        const error = await response.json();
        errorMessage = error.error?.message || errorMessage;
        functions.logger.error("Azure index upload error:", error);
      } catch {
        functions.logger.error("Azure index upload error (non-JSON response):", {
          status: response.status,
          statusText: response.statusText
        });
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const latencyMs = Date.now() - startTime;

    // Process results
    const results = data.value || [];
    const indexed = results.filter(
      (r: { status: boolean }) => r.status === true,
    ).length;
    const failed = results.filter(
      (r: { status: boolean }) => r.status === false,
    ).length;
    const errors = results
      .filter((r: { status: boolean; errorMessage?: string }) => !r.status)
      .map(
        (r: { key: string; errorMessage?: string }) =>
          `${r.key}: ${r.errorMessage || "Unknown error"}`,
      );

    // Log metrics
    await logMetrics("azure_index_upload", {
      indexed,
      failed,
      latencyMs,
      batchSize: documents.length,
    });

    return {
      success: failed === 0,
      indexed,
      failed,
      errors,
    };
  } catch (error) {
    functions.logger.error("Azure index upload failed:", error);
    throw new functions.https.HttpsError("internal", "Index upload failed");
  }
}

/**
 * Delete documents from Azure Search index
 */
export async function deleteFromAzureIndex(documentIds: string[]): Promise<{
  success: boolean;
  deleted: number;
}> {
  const config = getAzureSearchConfig();

  if (!config) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Azure Search not configured",
    );
  }

  const deleteActions = documentIds.map((id) => ({
    "@search.action": "delete",
    id,
  }));

  try {
    const url = buildAzureUrl(config, "docs/index");
    const response = await fetch(url, {
      method: "POST",
      headers: buildAzureHeaders(config),
      body: JSON.stringify({ value: deleteActions }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Azure delete failed");
    }

    return {
      success: true,
      deleted: documentIds.length,
    };
  } catch (error) {
    functions.logger.error("Azure delete failed:", error);
    throw new functions.https.HttpsError("internal", "Delete failed");
  }
}

/**
 * Create or update Azure Search index with our schema
 */
export async function ensureAzureIndex(): Promise<{
  success: boolean;
  message: string;
}> {
  const config = getAzureSearchConfig();

  if (!config) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Azure Search not configured",
    );
  }

  try {
    // Check if index exists
    const checkUrl = `${config.endpoint}/indexes/${config.indexName}?api-version=${config.apiVersion}`;
    const checkResponse = await fetch(checkUrl, {
      method: "GET",
      headers: buildAzureHeaders(config),
    });

    if (checkResponse.ok) {
      // Index exists, update it
      const updateUrl = `${config.endpoint}/indexes/${config.indexName}?api-version=${config.apiVersion}`;
      const updateResponse = await fetch(updateUrl, {
        method: "PUT",
        headers: buildAzureHeaders(config),
        body: JSON.stringify(AZURE_SEARCH_INDEX_SCHEMA),
      });

      if (!updateResponse.ok) {
        const error = await updateResponse.json();
        throw new Error(error.error?.message || "Failed to update index");
      }

      return {
        success: true,
        message: "Index updated successfully",
      };
    } else if (checkResponse.status === 404) {
      // Index doesn't exist, create it
      const createUrl = `${config.endpoint}/indexes?api-version=${config.apiVersion}`;
      const createResponse = await fetch(createUrl, {
        method: "POST",
        headers: buildAzureHeaders(config),
        body: JSON.stringify(AZURE_SEARCH_INDEX_SCHEMA),
      });

      if (!createResponse.ok) {
        const error = await createResponse.json();
        throw new Error(error.error?.message || "Failed to create index");
      }

      return {
        success: true,
        message: "Index created successfully",
      };
    } else {
      // Handle other non-OK statuses (403, 500, etc.)
      let errorDetails = `HTTP ${checkResponse.status}`;
      try {
        const errorBody = await checkResponse.json();
        errorDetails = errorBody.error?.message || errorDetails;
      } catch {
        try {
          errorDetails = await checkResponse.text();
        } catch {
          // Keep the status code as the error details
        }
      }
      throw new Error(
        `Failed to check index status: ${errorDetails}`,
      );
    }
  } catch (error) {
    functions.logger.error("Azure index setup failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new functions.https.HttpsError(
      "internal",
      `Index setup failed: ${message}`,
    );
  }
}

/**
 * Get Azure Search index statistics
 */
export async function getAzureIndexStats(): Promise<{
  documentCount: number;
  storageSize: number;
  isAvailable: boolean;
}> {
  const config = getAzureSearchConfig();

  if (!config) {
    return {
      documentCount: 0,
      storageSize: 0,
      isAvailable: false,
    };
  }

  try {
    const url = `${config.endpoint}/indexes/${config.indexName}/stats?api-version=${config.apiVersion}`;
    const response = await fetch(url, {
      method: "GET",
      headers: buildAzureHeaders(config),
    });

    if (!response.ok) {
      return {
        documentCount: 0,
        storageSize: 0,
        isAvailable: false,
      };
    }

    const data = await response.json();

    return {
      documentCount: data.documentCount || 0,
      storageSize: data.storageSize || 0,
      isAvailable: true,
    };
  } catch {
    return {
      documentCount: 0,
      storageSize: 0,
      isAvailable: false,
    };
  }
}
