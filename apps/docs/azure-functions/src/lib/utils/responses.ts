/**
 * HTTP Response Helpers
 *
 * DRY utilities for consistent error and success responses.
 */

import { HttpResponseInit } from "@azure/functions";

/**
 * Standard error codes used across the API
 */
export type ErrorCode =
  | "unauthenticated"
  | "permission-denied"
  | "invalid-argument"
  | "not-found"
  | "resource-exhausted"
  | "internal";

/**
 * Error response with standard structure
 */
export function errorResponse(
  status: number,
  message: string,
  code: ErrorCode,
): HttpResponseInit {
  return {
    status,
    jsonBody: { error: message, code },
  };
}

/**
 * Success response with data
 */
export function successResponse<T>(data: T, status = 200): HttpResponseInit {
  return {
    status,
    jsonBody: data,
  };
}

/**
 * Common error responses
 */
export const Errors = {
  /** 401 - User not authenticated */
  unauthenticated: (message = "Must be signed in") =>
    errorResponse(401, message, "unauthenticated"),

  /** 403 - User lacks permission */
  forbidden: (message = "Admin access required") =>
    errorResponse(403, message, "permission-denied"),

  /** 400 - Invalid input */
  badRequest: (message: string) =>
    errorResponse(400, message, "invalid-argument"),

  /** 404 - Resource not found */
  notFound: (message: string) => errorResponse(404, message, "not-found"),

  /** 429 - Rate limit exceeded */
  rateLimited: (
    message = "Too many requests. Please try again later.",
  ) => errorResponse(429, message, "resource-exhausted"),

  /** 500 - Internal server error */
  internal: (message = "An error occurred") =>
    errorResponse(500, message, "internal"),
};

/**
 * Wrap async handler with error handling
 */
export function withErrorHandling<T>(
  operation: string,
  fn: () => Promise<T>,
): Promise<HttpResponseInit> {
  return fn()
    .then((result) => successResponse(result))
    .catch((error) => {
      console.error(`Error in ${operation}:`, error);
      return Errors.internal(`Failed to ${operation.toLowerCase()}`);
    });
}
