/**
 * HTTP Response Helpers
 *
 * DRY utilities for consistent error and success responses.
 */

import { HttpResponseInit, HttpRequest } from "@azure/functions";
import { createLogger, Logger } from "../logger";

// Module-level logger
const logger: Logger = createLogger({ feature: "responses" });

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
 * CORS headers for responses
 */
export function getCorsHeaders(request?: HttpRequest): Record<string, string> {
  const origin = request?.headers.get("origin") || "*";
  
  // List of allowed origins (from bicep configuration)
  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://phoenixrooivalk.com",
    "https://docs.phoenixrooivalk.com",
    "https://www.phoenixrooivalk.com",
  ];
  
  // Check if origin matches allowed origins or azurestaticapps.net domain
  const isAllowedOrigin = 
    allowedOrigins.includes(origin) || 
    origin.endsWith(".azurestaticapps.net");
  
  const allowedOrigin = isAllowedOrigin ? origin : allowedOrigins[0];
  
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
  };
}

/**
 * Error response with standard structure
 */
export function errorResponse(
  status: number,
  message: string,
  code: ErrorCode,
  request?: HttpRequest,
): HttpResponseInit {
  return {
    status,
    headers: getCorsHeaders(request),
    jsonBody: { error: message, code },
  };
}

/**
 * Success response with data
 */
export function successResponse<T>(
  data: T, 
  status = 200,
  request?: HttpRequest,
): HttpResponseInit {
  return {
    status,
    headers: getCorsHeaders(request),
    jsonBody: data,
  };
}

/**
 * Common error responses
 */
export const Errors = {
  /** 401 - User not authenticated */
  unauthenticated: (message = "Must be signed in", request?: HttpRequest) =>
    errorResponse(401, message, "unauthenticated", request),

  /** 403 - User lacks permission */
  forbidden: (message = "Admin access required", request?: HttpRequest) =>
    errorResponse(403, message, "permission-denied", request),

  /** 400 - Invalid input */
  badRequest: (message: string, request?: HttpRequest) =>
    errorResponse(400, message, "invalid-argument", request),

  /** 404 - Resource not found */
  notFound: (message: string, request?: HttpRequest) => 
    errorResponse(404, message, "not-found", request),

  /** 429 - Rate limit exceeded */
  rateLimited: (message = "Too many requests. Please try again later.", request?: HttpRequest) =>
    errorResponse(429, message, "resource-exhausted", request),

  /** 500 - Internal server error */
  internal: (message = "An error occurred", request?: HttpRequest) =>
    errorResponse(500, message, "internal", request),
};

/**
 * Wrap async handler with error handling
 */
export function withErrorHandling<T>(
  operation: string,
  fn: () => Promise<T>,
  request?: HttpRequest,
): Promise<HttpResponseInit> {
  return fn()
    .then((result) => successResponse(result, 200, request))
    .catch((error) => {
      logger.error(`Error in ${operation}`, error, { operation });
      return Errors.internal(`Failed to ${operation.toLowerCase()}`, request);
    });
}

/**
 * Handle OPTIONS preflight requests
 */
export function handleOptionsRequest(request: HttpRequest): HttpResponseInit {
  return {
    status: 204,
    headers: getCorsHeaders(request),
  };
}
