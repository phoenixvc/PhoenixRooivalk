/**
 * Database Service Interface
 *
 * Provides abstraction for NoSQL database operations across different cloud providers.
 * Implementations: Firestore, Azure Cosmos DB
 */

import {
  QueryOptions,
  PaginatedResult,
  UnsubscribeFn,
  FieldOperations,
} from "./types";

/**
 * Document reference for updates
 */
export interface DocumentRef {
  id: string;
  path: string;
}

/**
 * Database service interface
 */
export interface IDatabaseService {
  /**
   * Check if the database service is configured and ready
   */
  isConfigured(): boolean;

  /**
   * Get field operations helper (increment, arrayUnion, etc.)
   */
  getFieldOperations(): FieldOperations;

  // ============================================================================
  // Document Operations
  // ============================================================================

  /**
   * Get a single document by ID
   * @param collection - Collection name
   * @param documentId - Document ID
   */
  getDocument<T>(collection: string, documentId: string): Promise<T | null>;

  /**
   * Set (create or overwrite) a document
   * @param collection - Collection name
   * @param documentId - Document ID
   * @param data - Document data
   * @param merge - If true, merge with existing data instead of overwriting
   */
  setDocument<T extends Record<string, unknown>>(
    collection: string,
    documentId: string,
    data: T,
    merge?: boolean,
  ): Promise<boolean>;

  /**
   * Update specific fields in a document
   * @param collection - Collection name
   * @param documentId - Document ID
   * @param updates - Fields to update
   */
  updateDocument(
    collection: string,
    documentId: string,
    updates: Record<string, unknown>,
  ): Promise<boolean>;

  /**
   * Delete a document
   * @param collection - Collection name
   * @param documentId - Document ID
   */
  deleteDocument(collection: string, documentId: string): Promise<boolean>;

  /**
   * Add a new document with auto-generated ID
   * @param collection - Collection name
   * @param data - Document data
   * @returns The generated document ID
   */
  addDocument<T extends Record<string, unknown>>(
    collection: string,
    data: T,
  ): Promise<string | null>;

  // ============================================================================
  // Query Operations
  // ============================================================================

  /**
   * Query documents in a collection
   * @param collection - Collection name
   * @param options - Query options (conditions, ordering, pagination)
   */
  queryDocuments<T>(
    collection: string,
    options?: QueryOptions,
  ): Promise<PaginatedResult<T>>;

  /**
   * Get all documents in a collection (use with caution)
   * @param collection - Collection name
   * @param limit - Maximum number of documents to return
   */
  getAllDocuments<T>(collection: string, limit?: number): Promise<T[]>;

  /**
   * Count documents matching a query
   * @param collection - Collection name
   * @param options - Query options (only conditions are used)
   */
  countDocuments(collection: string, options?: QueryOptions): Promise<number>;

  // ============================================================================
  // Real-time Subscriptions
  // ============================================================================

  /**
   * Subscribe to a single document
   * @param collection - Collection name
   * @param documentId - Document ID
   * @param onUpdate - Callback when document changes
   * @param onError - Callback on error
   */
  subscribeToDocument<T>(
    collection: string,
    documentId: string,
    onUpdate: (data: T | null) => void,
    onError?: (error: Error) => void,
  ): UnsubscribeFn;

  /**
   * Subscribe to a query
   * @param collection - Collection name
   * @param options - Query options
   * @param onUpdate - Callback when results change
   * @param onError - Callback on error
   */
  subscribeToQuery<T>(
    collection: string,
    options: QueryOptions,
    onUpdate: (items: T[]) => void,
    onError?: (error: Error) => void,
  ): UnsubscribeFn;

  // ============================================================================
  // Transactions & Batches
  // ============================================================================

  /**
   * Run a transaction
   * @param updateFn - Function that performs the transaction operations
   */
  runTransaction<T>(
    updateFn: (transaction: ITransaction) => Promise<T>,
  ): Promise<T>;

  /**
   * Create a batch writer for multiple operations
   */
  createBatch(): IBatchWriter;
}

/**
 * Transaction interface for atomic operations
 */
export interface ITransaction {
  /**
   * Get a document within the transaction
   */
  get<T>(collection: string, documentId: string): Promise<T | null>;

  /**
   * Set a document within the transaction
   */
  set<T extends Record<string, unknown>>(
    collection: string,
    documentId: string,
    data: T,
    merge?: boolean,
  ): void;

  /**
   * Update a document within the transaction
   */
  update(
    collection: string,
    documentId: string,
    updates: Record<string, unknown>,
  ): void;

  /**
   * Delete a document within the transaction
   */
  delete(collection: string, documentId: string): void;
}

/**
 * Batch writer interface for multiple operations
 */
export interface IBatchWriter {
  /**
   * Set a document in the batch
   */
  set<T extends Record<string, unknown>>(
    collection: string,
    documentId: string,
    data: T,
    merge?: boolean,
  ): IBatchWriter;

  /**
   * Update a document in the batch
   */
  update(
    collection: string,
    documentId: string,
    updates: Record<string, unknown>,
  ): IBatchWriter;

  /**
   * Delete a document in the batch
   */
  delete(collection: string, documentId: string): IBatchWriter;

  /**
   * Commit all operations in the batch
   */
  commit(): Promise<void>;
}

// ============================================================================
// User Data Types (shared across implementations)
// ============================================================================

/**
 * User progress data structure
 */
export interface UserProgress {
  [key: string]: unknown; // Index signature
  docs: {
    [docId: string]: {
      completed: boolean;
      completedAt?: string;
      scrollProgress: number;
      timeSpentMs?: number;
      lastReadAt?: string;
    };
  };
  achievements: {
    [achievementId: string]: {
      unlockedAt: string;
    };
  };
  stats: {
    totalPoints: number;
    level: number;
    streak: number;
    lastVisit?: string;
    totalTimeSpentMs?: number;
  };
  updatedAt?: unknown;
}

/**
 * User profile data structure
 */
export interface UserProfileData {
  [key: string]: unknown; // Index signature
  firstName: string;
  lastName: string;
  linkedIn: string;
  discord: string;
  whatsApp?: string;
  profileKey: string | null;
  roles: string[];
  funFacts?: Array<{
    id: string;
    fact: string;
    category: string;
  }>;
  createdAt?: unknown;
  updatedAt?: unknown;
  profileCompletedAt?: string;
  funFactsGeneratedAt?: string;
}

/**
 * Default user progress
 */
export const DEFAULT_USER_PROGRESS: UserProgress = {
  docs: {},
  achievements: {},
  stats: {
    totalPoints: 0,
    level: 1,
    streak: 0,
  },
};

/**
 * Default user profile
 */
export const DEFAULT_USER_PROFILE: UserProfileData = {
  firstName: "",
  lastName: "",
  linkedIn: "",
  discord: "",
  profileKey: null,
  roles: [],
};
