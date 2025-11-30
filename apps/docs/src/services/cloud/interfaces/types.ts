/**
 * Common types used across all cloud service implementations
 */

/**
 * Represents an authenticated user
 */
export interface CloudUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  providerData: Array<{
    providerId: string;
    uid: string;
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
  }>;
}

/**
 * OAuth provider types
 */
export type OAuthProvider = "google" | "github" | "microsoft";

/**
 * Cloud service configuration
 */
export interface CloudServiceConfig {
  provider: "firebase" | "azure";
  // Firebase-specific config
  firebase?: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId?: string;
  };
  // Azure-specific config
  azure?: {
    tenantId: string;
    clientId: string;
    cosmosEndpoint: string;
    cosmosKey: string;
    appInsightsConnectionString?: string;
    notificationHubConnectionString?: string;
    notificationHubName?: string;
    functionsBaseUrl: string;
  };
}

/**
 * Query operators for database queries
 */
export type QueryOperator =
  | "=="
  | "!="
  | "<"
  | "<="
  | ">"
  | ">="
  | "array-contains"
  | "array-contains-any"
  | "in"
  | "not-in";

/**
 * Query condition for database queries
 */
export interface QueryCondition {
  field: string;
  operator: QueryOperator;
  value: unknown;
}

/**
 * Order by clause for database queries
 */
export interface OrderByClause {
  field: string;
  direction: "asc" | "desc";
}

/**
 * Query options for database queries
 */
export interface QueryOptions {
  conditions?: QueryCondition[];
  orderBy?: OrderByClause[];
  limit?: number;
  offset?: number;
  cursor?: unknown;
}

/**
 * Result of a paginated query
 */
export interface PaginatedResult<T> {
  items: T[];
  cursor: unknown | null;
  hasMore: boolean;
  total?: number;
}

/**
 * Subscription callback type
 */
export type UnsubscribeFn = () => void;

/**
 * Analytics event types
 */
export interface AnalyticsEvent {
  name: string;
  params?: Record<string, unknown>;
  timestamp?: Date;
  userId?: string;
  sessionId?: string;
}

/**
 * Push notification payload
 */
export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, string>;
  clickAction?: string;
}

/**
 * Cloud function call options
 */
export interface FunctionCallOptions {
  timeout?: number;
  region?: string;
}

/**
 * Server timestamp placeholder
 */
export const SERVER_TIMESTAMP = Symbol("SERVER_TIMESTAMP");
export type ServerTimestamp = typeof SERVER_TIMESTAMP;

/**
 * Field value operations
 */
export interface FieldOperations {
  increment(value: number): unknown;
  arrayUnion(...elements: unknown[]): unknown;
  arrayRemove(...elements: unknown[]): unknown;
  serverTimestamp(): unknown;
  delete(): unknown;
}
