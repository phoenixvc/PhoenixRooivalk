/**
 * Authentication Helpers
 *
 * Validates Azure AD B2C tokens for authenticated functions.
 * Uses jose library for proper JWT validation.
 */

import { HttpRequest } from "@azure/functions";
import * as jose from "jose";
import { createLogger, Logger } from "./logger";

// Module-level logger
const logger: Logger = createLogger({ feature: "auth" });

export interface TokenClaims {
  sub: string;
  email?: string;
  name?: string;
  roles?: string[];
  iss: string;
  aud: string;
  exp: number;
  iat: number;
}

/**
 * Admin email domains
 */
const ADMIN_DOMAINS = ["phoenixrooivalk.com", "justaghost.dev"];

/**
 * JWKS cache for Azure AD B2C
 */
let jwksCache: jose.JWTVerifyGetKey | null = null;

/**
 * Get JWKS for token validation
 */
async function getJWKS(): Promise<jose.JWTVerifyGetKey> {
  if (jwksCache) return jwksCache;

  const tenant = process.env.AZURE_AD_B2C_TENANT;
  const policy = process.env.AZURE_AD_B2C_POLICY || "B2C_1_signupsignin";

  if (!tenant) {
    throw new Error("AZURE_AD_B2C_TENANT not configured");
  }

  const jwksUrl = `https://${tenant}.b2clogin.com/${tenant}.onmicrosoft.com/${policy}/discovery/v2.0/keys`;
  jwksCache = jose.createRemoteJWKSet(new URL(jwksUrl));

  return jwksCache;
}

/**
 * Validate JWT token properly
 */
async function validateToken(token: string): Promise<TokenClaims | null> {
  try {
    const audience = process.env.AZURE_AD_B2C_CLIENT_ID;
    const tenant = process.env.AZURE_AD_B2C_TENANT;

    // In development/testing, allow skipping validation
    if (process.env.SKIP_TOKEN_VALIDATION === "true") {
      const [, payload] = token.split(".");
      return JSON.parse(Buffer.from(payload, "base64url").toString());
    }

    if (!audience || !tenant) {
      logger.warn("Azure AD B2C not configured, using unvalidated decode", { operation: "validateToken" });
      const [, payload] = token.split(".");
      return JSON.parse(Buffer.from(payload, "base64url").toString());
    }

    const jwks = await getJWKS();
    const { payload } = await jose.jwtVerify(token, jwks, {
      audience,
      issuer: `https://${tenant}.b2clogin.com/${tenant}.onmicrosoft.com/v2.0/`,
    });

    return payload as unknown as TokenClaims;
  } catch (error) {
    logger.error("Token validation failed", error, { operation: "validateToken" });
    return null;
  }
}

/**
 * Extract user ID from request (from validated token)
 */
export async function getUserIdFromRequest(request: HttpRequest): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);
  const claims = await validateToken(token);

  return claims?.sub || null;
}

/**
 * Get token claims from request (validated)
 */
export async function getTokenClaims(request: HttpRequest): Promise<TokenClaims | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);
  return validateToken(token);
}

/**
 * Check if user is admin based on email domain
 */
export async function isAdmin(request: HttpRequest): Promise<boolean> {
  const claims = await getTokenClaims(request);
  if (!claims?.email) return false;

  const domain = claims.email.split("@")[1]?.toLowerCase();
  return ADMIN_DOMAINS.includes(domain);
}

/**
 * Require authentication - returns error response if not authenticated
 * Note: This is sync for compatibility, use requireAuthAsync for proper validation
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

  // For sync usage, decode without validation
  // Use requireAuthAsync for proper validation
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
 * Require authentication with proper validation (async)
 */
export async function requireAuthAsync(request: HttpRequest): Promise<{
  authenticated: boolean;
  userId: string | null;
  claims: TokenClaims | null;
  error?: { status: number; body: object };
}> {
  const claims = await getTokenClaims(request);

  if (!claims) {
    return {
      authenticated: false,
      userId: null,
      claims: null,
      error: {
        status: 401,
        body: { error: "Authentication required", code: "unauthenticated" },
      },
    };
  }

  return { authenticated: true, userId: claims.sub, claims };
}

/**
 * Require admin access
 */
export async function requireAdmin(request: HttpRequest): Promise<{
  authorized: boolean;
  userId: string | null;
  error?: { status: number; body: object };
}> {
  const authResult = await requireAuthAsync(request);
  if (!authResult.authenticated) {
    return { authorized: false, userId: null, error: authResult.error };
  }

  const adminCheck = await isAdmin(request);
  if (!adminCheck) {
    return {
      authorized: false,
      userId: authResult.userId,
      error: {
        status: 403,
        body: { error: "Admin access required", code: "permission-denied" },
      },
    };
  }

  return { authorized: true, userId: authResult.userId };
}

/**
 * Validate authorization header directly
 * For use with API keys or tokens passed as header string
 */
export async function validateAuthHeader(
  authHeader: string | null,
): Promise<{ valid: boolean; userId?: string; isAdmin?: boolean }> {
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

    const userId = claims.sub;
    const email = claims.email || "";
    const domain = email.split("@")[1]?.toLowerCase();
    const isAdminUser = ADMIN_DOMAINS.includes(domain);

    return { valid: true, userId, isAdmin: isAdminUser };
  }

  return { valid: false };
}
