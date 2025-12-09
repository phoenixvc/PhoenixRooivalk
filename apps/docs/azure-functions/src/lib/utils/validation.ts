/**
 * Request Validation Utilities
 *
 * Uses Zod for type-safe request validation.
 */

import { z } from "zod";
import { HttpRequest } from "@azure/functions";

/**
 * Common validation schemas
 */
export const schemas = {
  // Pagination
  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    cursor: z.string().optional(),
  }),

  // News article input
  newsArticle: z.object({
    title: z.string().min(1).max(500),
    content: z.string().min(10).max(50000),
    source: z.string().min(1).max(200),
    sourceUrl: z.string().url().optional(),
    category: z.string().min(1).max(50).optional(),
    summary: z.string().max(1000).optional(),
    imageUrl: z.string().url().optional(),
    author: z.string().max(200).optional(),
    tags: z.array(z.string()).max(20).optional(),
  }),

  // User preferences
  userPreferences: z.object({
    roles: z.array(z.string()).max(10).optional(),
    interests: z.array(z.string()).max(20).optional(),
    focusAreas: z.array(z.string()).max(10).optional(),
    experienceLevel: z
      .enum(["beginner", "intermediate", "advanced"])
      .optional(),
    preferredCategories: z.array(z.string()).max(20).default([]),
    emailDigest: z.enum(["daily", "weekly", "none"]).optional(),
    pushEnabled: z.boolean().default(false),
  }),

  // Subscription
  subscription: z.object({
    email: z.string().email().optional(),
    categories: z.array(z.string()).max(20).optional(),
    pushEnabled: z.boolean().optional(),
    emailEnabled: z.boolean().optional(),
    pushToken: z.string().optional(),
  }),

  // AI analysis requests
  competitorAnalysis: z.object({
    competitors: z.array(z.string().min(1).max(100)).min(1).max(10),
    focusAreas: z.array(z.string()).max(10).optional(),
  }),

  swotAnalysis: z.object({
    context: z.string().max(2000).optional(),
    focusArea: z.string().max(200).optional(),
  }),

  marketInsights: z.object({
    region: z.string().max(100).optional(),
    segment: z.string().max(100).optional(),
    timeframe: z.string().max(50).optional(),
  }),

  documentQuestion: z.object({
    question: z.string().min(3).max(1000),
    category: z.string().max(50).optional(),
    topK: z.coerce.number().int().min(1).max(20).optional(),
  }),

  contentSummary: z.object({
    content: z.string().min(10).max(50000),
    length: z.enum(["short", "medium", "long"]).optional(),
    audience: z.string().max(100).optional(),
    format: z.enum(["paragraph", "bullets", "outline"]).optional(),
  }),

  // Support ticket
  supportTicket: z.object({
    name: z.string().min(1).max(100).optional(),
    email: z.string().email(),
    subject: z.string().min(1).max(200),
    message: z.string().min(10).max(5000),
    category: z.string().max(50).optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
  }),

  // Configuration
  configItem: z.object({
    type: z.enum(["category", "role", "interest", "prompt", "topic", "domain"]),
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    isActive: z.boolean().optional(),
    order: z.number().int().min(0).optional(),
  }),

  // Search query
  searchQuery: z.object({
    query: z.string().min(1).max(500),
    categories: z.array(z.string()).max(10).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),

  // Document indexing
  documentIndex: z.object({
    id: z.string().min(1).max(100),
    title: z.string().min(1).max(500),
    content: z.string().min(10).max(100000),
    category: z.string().max(50).optional(),
    url: z.string().url().optional(),
  }),

  // Reading recommendations
  readingRecommendations: z.object({
    role: z.string().min(1).max(100),
    interests: z.array(z.string()).min(1).max(10),
    experienceLevel: z.enum(["beginner", "intermediate", "advanced"]),
    readHistory: z.array(z.string()).max(100).optional(),
  }),

  // Document improvements
  documentImprovements: z.object({
    documentPath: z.string().min(1).max(500),
    focusArea: z.string().max(200).optional(),
  }),

  // Person research
  personResearch: z.object({
    name: z.string().min(1).max(100),
    company: z.string().max(100).optional(),
    role: z.string().max(100).optional(),
    context: z.string().max(500).optional(),
  }),
};

// Export individual schemas for backward compatibility
export const NewsArticleSchema = schemas.newsArticle;
export const SupportTicketSchema = schemas.supportTicket;
export const UserPreferencesSchema = schemas.userPreferences;
export const PaginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(10),
  offset: z.coerce.number().int().min(0).default(0),
});

/**
 * Validation result
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    issues: Array<{
      path: string;
      message: string;
    }>;
  };
}

/**
 * Parse and validate request body
 */
export async function validateBody<T>(
  request: HttpRequest,
  schema: z.ZodSchema<T>,
): Promise<ValidationResult<T>> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return {
        success: false,
        error: {
          message: "Validation failed",
          issues: result.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
      };
    }

    return { success: true, data: result.data };
  } catch (error) {
    return {
      success: false,
      error: {
        message: "Invalid JSON body",
        issues: [{ path: "body", message: "Request body must be valid JSON" }],
      },
    };
  }
}

/**
 * Parse and validate query parameters
 */
export function validateQuery<T>(
  request: HttpRequest,
  schema: z.ZodSchema<T>,
): ValidationResult<T> {
  try {
    const query: Record<string, string> = {};
    request.query.forEach((value, key) => {
      query[key] = value;
    });

    const result = schema.safeParse(query);

    if (!result.success) {
      return {
        success: false,
        error: {
          message: "Invalid query parameters",
          issues: result.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
      };
    }

    return { success: true, data: result.data };
  } catch (error) {
    return {
      success: false,
      error: {
        message: "Failed to parse query parameters",
        issues: [{ path: "query", message: "Invalid query format" }],
      },
    };
  }
}

/**
 * Parse and validate route parameters
 */
export function validateParams<T>(
  request: HttpRequest,
  schema: z.ZodSchema<T>,
): ValidationResult<T> {
  try {
    // request.params is a Record<string, string> in Azure Functions
    const params = request.params;
    const result = schema.safeParse(params);

    if (!result.success) {
      return {
        success: false,
        error: {
          message: "Invalid route parameters",
          issues: result.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
      };
    }

    return { success: true, data: result.data };
  } catch (error) {
    return {
      success: false,
      error: {
        message: "Failed to parse route parameters",
        issues: [{ path: "params", message: "Invalid parameter format" }],
      },
    };
  }
}

/**
 * Create validation error response
 */
export function validationErrorResponse(
  error: ValidationResult<unknown>["error"],
) {
  return {
    status: 400,
    jsonBody: {
      error: error?.message || "Validation failed",
      code: "validation-error",
      details: error?.issues || [],
    },
  };
}
