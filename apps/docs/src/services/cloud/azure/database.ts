/**
 * Azure Database Service Implementation
 *
 * Implements IDatabaseService using Azure Cosmos DB.
 *
 * Note: This requires the @azure/cosmos package to be installed.
 * npm install @azure/cosmos
 *
 * For browser use, consider using the Cosmos DB REST API directly
 * or Azure Functions as a proxy to avoid exposing connection strings.
 */

import {
  IDatabaseService,
  ITransaction,
  IBatchWriter,
} from "../interfaces/database";
import {
  QueryOptions,
  PaginatedResult,
  UnsubscribeFn,
  FieldOperations,
  QueryCondition,
} from "../interfaces/types";
import { getAuthService } from "../index";

/**
 * Azure Cosmos DB Configuration
 */
export interface AzureCosmosConfig {
  endpoint: string;
  key: string;
  databaseId: string;
  // For browser security, use Azure Functions as proxy
  functionsBaseUrl?: string;
}

/**
 * Azure field operations (simulated - Cosmos uses different patterns)
 */
const azureFieldOperations: FieldOperations = {
  increment: (value: number) => ({ $inc: value }),
  arrayUnion: (...elements: unknown[]) => ({ $push: { $each: elements } }),
  arrayRemove: (...elements: unknown[]) => ({ $pull: { $in: elements } }),
  serverTimestamp: () => new Date().toISOString(),
  delete: () => null,
};

/**
 * Convert QueryCondition to Cosmos SQL WHERE clause
 */
function buildWhereClause(conditions: QueryCondition[]): string {
  if (conditions.length === 0) return "";

  const clauses = conditions.map((cond, index) => {
    const paramName = `@param${index}`;
    const fieldPath = `c.${cond.field.replace(/\./g, '["').replace(/\./g, '"]')}`;

    switch (cond.operator) {
      case "==":
        return `${fieldPath} = ${paramName}`;
      case "!=":
        return `${fieldPath} != ${paramName}`;
      case "<":
        return `${fieldPath} < ${paramName}`;
      case "<=":
        return `${fieldPath} <= ${paramName}`;
      case ">":
        return `${fieldPath} > ${paramName}`;
      case ">=":
        return `${fieldPath} >= ${paramName}`;
      case "array-contains":
        return `ARRAY_CONTAINS(${fieldPath}, ${paramName})`;
      case "in":
        return `${fieldPath} IN (${paramName})`;
      default:
        return `${fieldPath} = ${paramName}`;
    }
  });

  return `WHERE ${clauses.join(" AND ")}`;
}

/**
 * Build query parameters for Cosmos SQL
 */
function buildParameters(
  conditions: QueryCondition[],
): { name: string; value: unknown }[] {
  return conditions.map((cond, index) => ({
    name: `@param${index}`,
    value: cond.value,
  }));
}

/**
 * Azure Cosmos Transaction - Cosmos uses stored procedures for transactions
 * This is a simplified implementation
 */
class AzureTransaction implements ITransaction {
  private operations: Array<{
    type: "get" | "set" | "update" | "delete";
    collection: string;
    documentId: string;
    data?: any;
    merge?: boolean;
  }> = [];

  constructor(private service: AzureDatabaseService) {}

  async get<T>(collectionName: string, documentId: string): Promise<T | null> {
    // In a real implementation, this would be part of a stored procedure
    return this.service.getDocument<T>(collectionName, documentId);
  }

  set<T extends Record<string, unknown>>(
    collectionName: string,
    documentId: string,
    data: T,
    merge = false,
  ): void {
    this.operations.push({
      type: "set",
      collection: collectionName,
      documentId,
      data,
      merge,
    });
  }

  update(
    collectionName: string,
    documentId: string,
    updates: Record<string, unknown>,
  ): void {
    this.operations.push({
      type: "update",
      collection: collectionName,
      documentId,
      data: updates,
    });
  }

  delete(collectionName: string, documentId: string): void {
    this.operations.push({
      type: "delete",
      collection: collectionName,
      documentId,
    });
  }

  getOperations() {
    return this.operations;
  }
}

/**
 * Azure Batch Writer
 */
class AzureBatchWriter implements IBatchWriter {
  private operations: Array<{
    type: "set" | "update" | "delete";
    collection: string;
    documentId: string;
    data?: any;
    merge?: boolean;
  }> = [];

  constructor(private service: AzureDatabaseService) {}

  set<T extends Record<string, unknown>>(
    collectionName: string,
    documentId: string,
    data: T,
    merge = false,
  ): IBatchWriter {
    this.operations.push({
      type: "set",
      collection: collectionName,
      documentId,
      data,
      merge,
    });
    return this;
  }

  update(
    collectionName: string,
    documentId: string,
    updates: Record<string, unknown>,
  ): IBatchWriter {
    this.operations.push({
      type: "update",
      collection: collectionName,
      documentId,
      data: updates,
    });
    return this;
  }

  delete(collectionName: string, documentId: string): IBatchWriter {
    this.operations.push({
      type: "delete",
      collection: collectionName,
      documentId,
    });
    return this;
  }

  async commit(): Promise<void> {
    // Execute operations in sequence
    // In production, use bulk operations API or stored procedures
    for (const op of this.operations) {
      switch (op.type) {
        case "set":
          await this.service.setDocument(
            op.collection,
            op.documentId,
            op.data,
            op.merge,
          );
          break;
        case "update":
          await this.service.updateDocument(
            op.collection,
            op.documentId,
            op.data,
          );
          break;
        case "delete":
          await this.service.deleteDocument(op.collection, op.documentId);
          break;
      }
    }
  }
}

/**
 * Azure Cosmos DB Service
 *
 * Note: For browser security, this implementation uses Azure Functions as a proxy.
 * Direct Cosmos DB access from browser would expose connection strings.
 */
export class AzureDatabaseService implements IDatabaseService {
  private config: AzureCosmosConfig | null = null;
  private cosmosClient: any = null; // CosmosClient
  private database: any = null;
  private initialized = false;

  constructor(config?: AzureCosmosConfig) {
    this.config = config || null;
  }

  /**
   * Initialize Cosmos DB client
   * For browser use, this sets up the Functions proxy instead
   */
  async initialize(): Promise<boolean> {
    if (this.initialized) return true;
    if (!this.config) return false;

    try {
      // For browser, we use Azure Functions as proxy
      if (typeof window !== "undefined" && this.config.functionsBaseUrl) {
        this.initialized = true;
        return true;
      }

      // For server-side, use Cosmos SDK directly
      const cosmos = await import("@azure/cosmos");
      this.cosmosClient = new cosmos.CosmosClient({
        endpoint: this.config.endpoint,
        key: this.config.key,
      });
      this.database = this.cosmosClient.database(this.config.databaseId);
      this.initialized = true;
      return true;
    } catch (error) {
      console.error("Azure Cosmos DB initialization failed:", error);
      return false;
    }
  }

  isConfigured(): boolean {
    return this.config !== null;
  }

  getFieldOperations(): FieldOperations {
    return azureFieldOperations;
  }

  // ============================================================================
  // Document Operations (using Functions proxy for browser)
  // ============================================================================

  async getDocument<T>(
    collectionName: string,
    documentId: string,
  ): Promise<T | null> {
    if (!this.initialized) await this.initialize();

    if (typeof window !== "undefined" && this.config?.functionsBaseUrl) {
      // Use Functions proxy
      return this.callFunctionsProxy<T>("getDocument", {
        collection: collectionName,
        documentId,
      });
    }

    // Direct Cosmos access (server-side)
    try {
      const container = this.database.container(collectionName);
      const { resource } = await container.item(documentId, documentId).read();
      if (!resource) return null;
      return { id: resource.id, ...resource } as T;
    } catch (error: any) {
      if (error.code === 404) return null;
      console.error("Error getting document:", error);
      return null;
    }
  }

  async setDocument<T extends Record<string, unknown>>(
    collectionName: string,
    documentId: string,
    data: T,
    merge = false,
  ): Promise<boolean> {
    if (!this.initialized) await this.initialize();

    if (typeof window !== "undefined" && this.config?.functionsBaseUrl) {
      return this.callFunctionsProxy<boolean>("setDocument", {
        collection: collectionName,
        documentId,
        data,
        merge,
      });
    }

    try {
      const container = this.database.container(collectionName);
      const doc = {
        id: documentId,
        ...data,
        _updatedAt: new Date().toISOString(),
      };

      if (merge) {
        // Get existing and merge
        const existing = await this.getDocument<T>(collectionName, documentId);
        if (existing) {
          await container
            .item(documentId, documentId)
            .replace({ ...existing, ...doc });
        } else {
          await container.items.create(doc);
        }
      } else {
        await container.items.upsert(doc);
      }
      return true;
    } catch (error) {
      console.error("Error setting document:", error);
      return false;
    }
  }

  async updateDocument(
    collectionName: string,
    documentId: string,
    updates: Record<string, unknown>,
  ): Promise<boolean> {
    if (!this.initialized) await this.initialize();

    if (typeof window !== "undefined" && this.config?.functionsBaseUrl) {
      return this.callFunctionsProxy<boolean>("updateDocument", {
        collection: collectionName,
        documentId,
        updates,
      });
    }

    try {
      const container = this.database.container(collectionName);
      const existing = await this.getDocument(collectionName, documentId);
      if (!existing) return false;

      await container.item(documentId, documentId).replace({
        ...existing,
        ...updates,
        _updatedAt: new Date().toISOString(),
      });
      return true;
    } catch (error) {
      console.error("Error updating document:", error);
      return false;
    }
  }

  async deleteDocument(
    collectionName: string,
    documentId: string,
  ): Promise<boolean> {
    if (!this.initialized) await this.initialize();

    if (typeof window !== "undefined" && this.config?.functionsBaseUrl) {
      return this.callFunctionsProxy<boolean>("deleteDocument", {
        collection: collectionName,
        documentId,
      });
    }

    try {
      const container = this.database.container(collectionName);
      await container.item(documentId, documentId).delete();
      return true;
    } catch (error) {
      console.error("Error deleting document:", error);
      return false;
    }
  }

  async addDocument<T extends Record<string, unknown>>(
    collectionName: string,
    data: T,
  ): Promise<string | null> {
    if (!this.initialized) await this.initialize();

    const documentId = this.generateId();

    if (typeof window !== "undefined" && this.config?.functionsBaseUrl) {
      const success = await this.callFunctionsProxy<boolean>("addDocument", {
        collection: collectionName,
        documentId,
        data,
      });
      return success ? documentId : null;
    }

    try {
      const container = this.database.container(collectionName);
      await container.items.create({
        id: documentId,
        ...data,
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      });
      return documentId;
    } catch (error) {
      console.error("Error adding document:", error);
      return null;
    }
  }

  // ============================================================================
  // Query Operations
  // ============================================================================

  async queryDocuments<T>(
    collectionName: string,
    options: QueryOptions = {},
  ): Promise<PaginatedResult<T>> {
    if (!this.initialized) await this.initialize();

    if (typeof window !== "undefined" && this.config?.functionsBaseUrl) {
      return this.callFunctionsProxy<PaginatedResult<T>>("queryDocuments", {
        collection: collectionName,
        options,
      });
    }

    try {
      const container = this.database.container(collectionName);

      // Build SQL query
      let query = "SELECT * FROM c";
      const parameters: { name: string; value: unknown }[] = [];

      if (options.conditions && options.conditions.length > 0) {
        query += " " + buildWhereClause(options.conditions);
        parameters.push(...buildParameters(options.conditions));
      }

      if (options.orderBy && options.orderBy.length > 0) {
        const orderClauses = options.orderBy.map(
          (o) => `c.${o.field} ${o.direction.toUpperCase()}`,
        );
        query += ` ORDER BY ${orderClauses.join(", ")}`;
      }

      const querySpec = { query, parameters };
      const queryOptions: any = {};

      if (options.limit) {
        queryOptions.maxItemCount = options.limit;
      }
      if (options.cursor) {
        queryOptions.continuationToken = options.cursor as string;
      }

      const { resources, continuationToken } = await container.items
        .query(querySpec, queryOptions)
        .fetchNext();

      const items = resources.map((r: any) => ({ id: r.id, ...r }) as T);

      return {
        items,
        cursor: continuationToken || null,
        hasMore: Boolean(continuationToken),
      };
    } catch (error) {
      console.error("Error querying documents:", error);
      return { items: [], cursor: null, hasMore: false };
    }
  }

  async getAllDocuments<T>(collectionName: string, limit = 1000): Promise<T[]> {
    const result = await this.queryDocuments<T>(collectionName, { limit });
    return result.items;
  }

  async countDocuments(
    collectionName: string,
    options: QueryOptions = {},
  ): Promise<number> {
    if (!this.initialized) await this.initialize();

    if (typeof window !== "undefined" && this.config?.functionsBaseUrl) {
      return this.callFunctionsProxy<number>("countDocuments", {
        collection: collectionName,
        options,
      });
    }

    try {
      const container = this.database.container(collectionName);

      let query = "SELECT VALUE COUNT(1) FROM c";
      const parameters: { name: string; value: unknown }[] = [];

      if (options.conditions && options.conditions.length > 0) {
        query += " " + buildWhereClause(options.conditions);
        parameters.push(...buildParameters(options.conditions));
      }

      const { resources } = await container.items
        .query({ query, parameters })
        .fetchAll();

      return resources[0] || 0;
    } catch (error) {
      console.error("Error counting documents:", error);
      return 0;
    }
  }

  // ============================================================================
  // Real-time Subscriptions
  // Note: Cosmos DB doesn't have built-in real-time subscriptions like Firestore.
  // Use Change Feed or SignalR for real-time updates.
  // ============================================================================

  subscribeToDocument<T>(
    collectionName: string,
    documentId: string,
    onUpdate: (data: T | null) => void,
    onError?: (error: Error) => void,
  ): UnsubscribeFn {
    // Polling-based implementation
    // In production, use Azure SignalR or Change Feed
    let active = true;
    let timeoutId: NodeJS.Timeout;

    const poll = async () => {
      if (!active) return;

      try {
        const doc = await this.getDocument<T>(collectionName, documentId);
        onUpdate(doc);
      } catch (error) {
        onError?.(error as Error);
      }

      if (active) {
        timeoutId = setTimeout(poll, 5000); // Poll every 5 seconds
      }
    };

    poll();

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }

  subscribeToQuery<T>(
    collectionName: string,
    options: QueryOptions,
    onUpdate: (items: T[]) => void,
    onError?: (error: Error) => void,
  ): UnsubscribeFn {
    // Polling-based implementation
    let active = true;
    let timeoutId: NodeJS.Timeout;

    const poll = async () => {
      if (!active) return;

      try {
        const result = await this.queryDocuments<T>(collectionName, options);
        onUpdate(result.items);
      } catch (error) {
        onError?.(error as Error);
      }

      if (active) {
        timeoutId = setTimeout(poll, 5000);
      }
    };

    poll();

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }

  // ============================================================================
  // Transactions & Batches
  // ============================================================================

  async runTransaction<T>(
    updateFn: (transaction: ITransaction) => Promise<T>,
  ): Promise<T> {
    // Cosmos DB transactions use stored procedures
    // This is a simplified implementation
    const transaction = new AzureTransaction(this);
    return updateFn(transaction);
  }

  createBatch(): IBatchWriter {
    return new AzureBatchWriter(this);
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  private async callFunctionsProxy<T>(
    operation: string,
    params: Record<string, unknown>,
  ): Promise<T> {
    if (!this.config?.functionsBaseUrl) {
      throw new Error("Functions base URL not configured");
    }

    // Remove trailing slash to prevent double-slash in URL
    const baseUrl = this.config.functionsBaseUrl.replace(/\/+$/, "");

    // Get auth token for the request
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    try {
      const auth = getAuthService();
      const token = await auth.getIdToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    } catch {
      // Auth service may not be available, continue without token
    }

    const response = await fetch(
      `${baseUrl}/api/cosmos/${operation}`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(params),
        credentials: "include",
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Functions proxy error: ${response.statusText} - ${errorText}`,
      );
    }

    // Check if response has content before parsing
    const text = await response.text();
    if (!text || text.trim() === "") {
      // Return empty object for successful operations with no response body
      return {} as T;
    }

    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error("Failed to parse JSON response:", text);
      throw new Error(`Invalid JSON response: ${text}`);
    }
  }
}
