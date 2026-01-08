/**
 * Authentication Helpers
 *
 * Validates Azure Entra ID tokens for authenticated functions.
 * Uses jose library for proper JWT validation.
 */

import { HttpRequest, HttpResponseInit } from "@azure/functions";
import * as jose from "jose";
import { createLogger, Logger } from "./logger";

// Module-level logger
const logger: Logger = createLogger({ feature: "auth" });

export interface TokenClaims {
  sub: string;
  oid?: string;
  email?: string;
  name?: string;
  roles?: string[];
  iss: string;
  aud: string;
  exp: number;
  iat: number;
  nbf?: number;
  tid?: string; // Tenant ID
  preferred_username?: string;
  upn?: string; // User Principal Name
}

/**
 * Admin email domains
 */
const ADMIN_DOMAINS = ["phoenixrooivalk.com", "justaghost.dev"];

/**
 * JWKS cache for Azure Entra ID
 */
let jwksCache: jose.JWTVerifyGetKey | null = null;

/**
 * Get JWKS for Azure Entra ID token validation
 */
async function getEntraJWKS(): Promise<jose.JWTVerifyGetKey> {
  if (jwksCache) return jwksCache;

  // Use common endpoint for multi-tenant support
  // Or use tenant-specific: https://login.microsoftonline.com/{tenantId}/discovery/v2.0/keys
  const tenantId = process.env.AZURE_ENTRA_TENANT_ID || "common";
  const jwksUrl = `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`;

  jwksCache = jose.createRemoteJWKSet(new URL(jwksUrl));
  return jwksCache;
}

/**
 * Validate JWT token from Azure Entra ID
 */
async function validateToken(token: string): Promise<TokenClaims | null> {
  try {
    // In development/testing, allow skipping validation
    if (process.env.SKIP_TOKEN_VALIDATION === "true") {
      const [, payload] = token.split(".");
      return JSON.parse(Buffer.from(payload, "base64url").toString());
    }

    const audience =
      process.env.AZURE_ENTRA_CLIENT_ID || process.env.AZURE_AD_CLIENT_ID;

    // If no audience configured, decode without validation (dev mode)
    if (!audience) {
      logger.warn("No client ID configured, using unvalidated token decode", {
        operation: "validateToken",
      });
      const [, payload] = token.split(".");
      return JSON.parse(
        Buffer.from(payload, "base64url").toString()
      ) as TokenClaims;
    }

    const jwks = await getEntraJWKS();

    // Validate token
    const { payload } = await jose.jwtVerify(token, jwks, {
      audience,
      // For multi-tenant apps, don't validate issuer strictly
      // The signature validation is sufficient for security
    });

    // Validate issuer format
    const issuer = payload.iss as string;
    if (
      !issuer?.startsWith("https://login.microsoftonline.com/") &&
      !issuer?.startsWith("https://sts.windows.net/")
    ) {
      logger.warn("Unexpected issuer format", {
        operation: "validateToken",
        issuer,
      });
    }

    return payload as unknown as TokenClaims;
  } catch (error) {
    logger.error("Token validation failed", error, {
      operation: "validateToken",
    });
    return null;
  }
}

/**
 * Extract email from token claims
 */
function getEmailFromClaims(claims: TokenClaims): string | null {
  if (claims.email) return claims.email;
  if (claims.preferred_username?.includes("@")) return claims.preferred_username;
  if (claims.upn?.includes("@")) return claims.upn;
  return null;
}

/**
 * Extract user ID from request (from validated token)
 */
export async function getUserIdFromRequest(
  request: HttpRequest
): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);
  const claims = await validateToken(token);

  return claims?.sub || claims?.oid || null;
}

/**
 * Get token claims from request (validated)
 */
export async function getTokenClaims(
  request: HttpRequest
): Promise<TokenClaims | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);
  return validateToken(token);
}

/**
 * Decode JWT payload without signature verification (for sync legacy use)
 * WARNING: Only use when you cannot use async validation
 */
function decodeJwtPayload(token: string): TokenClaims | null {
  try {
    const [, payload] = token.split(".");
    return JSON.parse(Buffer.from(payload, "base64url").toString());
  } catch (error) {
    logger.debug("Failed to decode JWT payload", {
      operation: "decodeJwtPayload",
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return null;
  }
}

/**
 * Get token claims from request (synchronous, for legacy compatibility)
 * NOTE: Does not validate signature - prefer getTokenClaims for secure validation
 */
export function getTokenClaimsSync(request: HttpRequest): TokenClaims | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);
  return decodeJwtPayload(token);
}

/**
 * Extract user ID from request (synchronous)
 * NOTE: Does not validate signature - prefer getUserIdFromRequest for secure validation
 */
export function getUserIdFromRequestSync(request: HttpRequest): string | null {
  const claims = getTokenClaimsSync(request);
  return claims?.sub || claims?.oid || null;
}

/**
 * Check if user is admin based on email domain
 */
export async function isAdmin(request: HttpRequest): Promise<boolean> {
  const claims = await getTokenClaims(request);
  if (!claims) return false;

  const email = getEmailFromClaims(claims);
  if (!email) return false;

  const domain = email.split("@")[1]?.toLowerCase();
  return ADMIN_DOMAINS.includes(domain);
}

/**
 * Check if user is admin based on validated claims
 */
function isAdminFromClaims(claims: TokenClaims): boolean {
  const email = getEmailFromClaims(claims);
  if (!email) return false;
  const domain = email.split("@")[1]?.toLowerCase();
  return ADMIN_DOMAINS.includes(domain);
}

/**
 * Require authentication with proper JWT validation
 */
export async function requireAuthAsync(request: HttpRequest): Promise<{
  authenticated: boolean;
  userId: string | null;
  claims?: TokenClaims;
  error?: HttpResponseInit;
}> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      authenticated: false,
      userId: null,
      error: {
        status: 401,
        jsonBody: { error: "Authentication required", code: "unauthenticated" },
      },
    };
  }

  const token = authHeader.substring(7);
  const claims = await validateToken(token);

  if (!claims) {
    return {
      authenticated: false,
      userId: null,
      error: {
        status: 401,
        jsonBody: {
          error: "Invalid or expired token",
          code: "unauthenticated",
        },
      },
    };
  }

  const userId = claims.sub || claims.oid;
  if (!userId) {
    return {
      authenticated: false,
      userId: null,
      error: {
        status: 401,
        jsonBody: {
          error: "Token missing user identifier",
          code: "unauthenticated",
        },
      },
    };
  }

  return { authenticated: true, userId, claims };
}

/**
 * Require authentication - synchronous version (legacy)
 * WARNING: Does not validate JWT signature. Use requireAuthAsync for secure validation.
 */
export function requireAuth(request: HttpRequest): {
  authenticated: boolean;
  userId: string | null;
  error?: { status: number; body: object };
} {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      authenticated: false,
      userId: null,
      error: {
        status: 401,
        body: { error: "Authentication required", code: "unauthenticated" },
      },
    };
  }

  const token = authHeader.substring(7);
  try {
    const [, payload] = token.split(".");
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString());
    const userId = decoded.sub || decoded.oid;

    if (!userId) {
      return {
        authenticated: false,
        userId: null,
        error: {
          status: 401,
          body: { error: "Invalid token", code: "unauthenticated" },
        },
      };
    }

    return { authenticated: true, userId };
  } catch (error) {
    logger.warn("Token parsing failed", { operation: "requireAuth" });
    return {
      authenticated: false,
      userId: null,
      error: {
        status: 401,
        body: { error: "Invalid token", code: "unauthenticated" },
      },
    };
  }
}

/**
 * Require admin access with proper JWT validation
 */
export async function requireAdminAsync(request: HttpRequest): Promise<{
  authorized: boolean;
  userId: string | null;
  error?: HttpResponseInit;
}> {
  const authResult = await requireAuthAsync(request);
  if (!authResult.authenticated) {
    return { authorized: false, userId: null, error: authResult.error };
  }

  if (!authResult.claims || !isAdminFromClaims(authResult.claims)) {
    return {
      authorized: false,
      userId: authResult.userId,
      error: {
        status: 403,
        jsonBody: { error: "Admin access required", code: "permission-denied" },
      },
    };
  }

  return { authorized: true, userId: authResult.userId };
}

/**
 * Validate authorization header with proper JWT validation
 */
export async function validateAuthHeader(authHeader: string | null): Promise<{
  valid: boolean;
  userId?: string;
  isAdmin?: boolean;
  email?: string;
  name?: string;
}> {
  if (!authHeader) {
    return { valid: false };
  }

  // Check for API key (admin key for Functions)
  const adminKey = process.env.FUNCTIONS_ADMIN_KEY;
  if (adminKey && authHeader === `Bearer ${adminKey}`) {
    return { valid: true, userId: "admin", isAdmin: true };
  }

  // Check for Bearer token (JWT)
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const claims = await validateToken(token);

    if (!claims) {
      return { valid: false };
    }

    const userId = claims.sub || claims.oid;
    const email = getEmailFromClaims(claims) || "";
    const name = claims.name || "";
    const domain = email.split("@")[1]?.toLowerCase();
    const isAdminUser = ADMIN_DOMAINS.includes(domain);

    return { valid: true, userId, isAdmin: isAdminUser, email, name };
  }

  return { valid: false };
}
