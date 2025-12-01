/**
 * Azure Cosmos DB Client
 *
 * Provides database operations for Azure Functions.
 */

import {
  CosmosClient,
  Database,
  Container,
  SqlParameter,
  ItemDefinition,
  PatchOperation,
} from "@azure/cosmos";

let client: CosmosClient | null = null;
let database: Database | null = null;

/**
 * Get Cosmos DB client (singleton)
 */
export function getCosmosClient(): CosmosClient {
  if (!client) {
    const connectionString = process.env.COSMOS_DB_CONNECTION_STRING;
    if (!connectionString) {
      throw new Error("COSMOS_DB_CONNECTION_STRING not configured");
    }
    client = new CosmosClient(connectionString);
  }
  return client;
}

/**
 * Get database instance
 */
export function getDatabase(): Database {
  if (!database) {
    const dbName = process.env.COSMOS_DB_DATABASE || "phoenix-docs";
    database = getCosmosClient().database(dbName);
  }
  return database;
}

/**
 * Get a container by name
 */
export function getContainer(containerName: string): Container {
  return getDatabase().container(containerName);
}

/**
 * Helper to get document by ID
 */
export async function getDocument<T extends ItemDefinition>(
  containerName: string,
  id: string,
  partitionKey?: string,
): Promise<T | null> {
  try {
    const container = getContainer(containerName);
    const { resource } = await container.item(id, partitionKey || id).read<T>();
    return resource || null;
  } catch (error: unknown) {
    if ((error as { code?: number })?.code === 404) return null;
    throw error;
  }
}

/**
 * Helper to upsert document
 */
export async function upsertDocument<T extends { id: string }>(
  containerName: string,
  document: T,
): Promise<T> {
  const container = getContainer(containerName);
  const { resource } = await container.items.upsert<T>(document);
  return resource!;
}

/**
 * Helper to delete document
 */
export async function deleteDocument(
  containerName: string,
  id: string,
  partitionKey?: string,
): Promise<void> {
  const container = getContainer(containerName);
  await container.item(id, partitionKey || id).delete();
}

/**
 * Helper to query documents
 */
export async function queryDocuments<T>(
  containerName: string,
  query: string,
  parameters?: SqlParameter[],
): Promise<T[]> {
  const container = getContainer(containerName);
  const { resources } = await container.items
    .query<T>({ query, parameters })
    .fetchAll();
  return resources;
}

/**
 * Re-export PatchOperation type from Azure Cosmos SDK for consumers
 */
export type { PatchOperation };

/**
 * Helper to patch document with atomic operations
 */
export async function patchDocument<T extends ItemDefinition>(
  containerName: string,
  id: string,
  operations: PatchOperation[],
  partitionKey?: string,
): Promise<T> {
  const container = getContainer(containerName);
  const { resource } = await container.item(id, partitionKey || id).patch<T>(operations);
  if (!resource) {
    throw new Error(`Failed to patch document with id: ${id}`);
  }
  return resource;
}
