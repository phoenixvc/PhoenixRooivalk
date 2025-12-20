/**
 * Authentication Helpers
 *
 * Validates Azure AD tokens for authenticated functions.
 * Supports both Azure AD B2C and regular Azure AD (multi-tenant/common endpoint).
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
  emails?: string[]; // B2C uses 'emails' array
  name?: string;
  roles?: string[];
  iss: string;
  aud: string;
  exp: number;
  iat: number;
  nbf?: number;
  tid?: string; // Tenant ID
  preferred_username?: string;
}

/**
 * Admin email domains
 */
const ADMIN_DOMAINS = ["phoenixrooivalk.com", "justaghost.dev"];

/**
 * JWKS cache - supports both B2C and regular Azure AD
 */
let jwksCacheB2C: jose.JWTVerifyGetKey | null = null;
let jwksCacheAzureAD: jose.JWTVerifyGetKey | null = null;

/**
 * Get JWKS for B2C token validation
 */
async function getB2CJWKS(): Promise<jose.JWTVerifyGetKey> {
  if (jwksCacheB2C) return jwksCacheB2C;

  const tenant = process.env.AZURE_AD_B2C_TENANT;
  const policy = process.env.AZURE_AD_B2C_POLICY || "B2C_1_signupsignin";

  if (!tenant) {
    throw new Error("AZURE_AD_B2C_TENANT not configured");
  }

  const jwksUrl = `https://${tenant}.b2clogin.com/${tenant}.onmicrosoft.com/${policy}/discovery/v2.0/keys`;
  jwksCacheB2C = jose.createRemoteJWKSet(new URL(jwksUrl));

  return jwksCacheB2C;
}

/**
 * Get JWKS for regular Azure AD token validation (common endpoint)
 */
async function getAzureADJWKS(): Promise<jose.JWTVerifyGetKey> {
  if (jwksCacheAzureAD) return jwksCacheAzureAD;

  const jwksUrl = "https://login.microsoftonline.com/common/discovery/v2.0/keys";
  jwksCacheAzureAD = jose.createRemoteJWKSet(new URL(jwksUrl));

  return jwksCacheAzureAD;
}

/**
 * Detect if token is from B2C or regular Azure AD based on issuer
 */
function isB2CToken(payload: jose.JWTPayload): boolean {
  const issuer = payload.iss as string;
  return issuer?.includes("b2clogin.com") || false;
}

/**
 * Validate JWT token - supports both B2C and regular Azure AD
 */
async function validateToken(token: string): Promise<TokenClaims | null> {
  try {
    // In development/testing, allow skipping validation
    if (process.env.SKIP_TOKEN_VALIDATION === "true") {
      const [, payload] = token.split(".");
      return JSON.parse(Buffer.from(payload, "base64url").toString());
    }

    // First, decode the token to check the issuer (without verification)
    const [, payloadB64] = token.split(".");
    const unverifiedPayload = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString()
    ) as jose.JWTPayload;

    const audience =
      process.env.AZURE_AD_B2C_CLIENT_ID ||
      process.env.AZURE_ENTRA_CLIENT_ID ||
      process.env.AZURE_AD_CLIENT_ID;

    // If no audience configured, use unvalidated decode
    if (!audience) {
      logger.warn("No client ID configured, using unvalidated token decode", {
        operation: "validateToken",
      });
      return unverifiedPayload as unknown as TokenClaims;
    }

    // Check if it's a B2C token or regular Azure AD token
    if (isB2CToken(unverifiedPayload)) {
      // B2C token validation
      const tenant = process.env.AZURE_AD_B2C_TENANT;
      if (!tenant) {
        logger.warn("B2C token detected but AZURE_AD_B2C_TENANT not configured", {
          operation: "validateToken",
        });
        return unverifiedPayload as unknown as TokenClaims;
      }

      const jwks = await getB2CJWKS();
      const { payload } = await jose.jwtVerify(token, jwks, {
        audience,
        issuer: `https://${tenant}.b2clogin.com/${tenant}.onmicrosoft.com/v2.0/`,
      });

      return payload as unknown as TokenClaims;
    } else {
      // Regular Azure AD token validation (common/multi-tenant)
      const jwks = await getAzureADJWKS();

      // For multi-tenant apps, we validate the signature but accept any tenant issuer
      const { payload } = await jose.jwtVerify(token, jwks, {
        audience,
        // Don't validate issuer for multi-tenant - just validate signature
      });

      // Optionally validate issuer format
      const issuer = payload.iss as string;
      if (!issuer?.startsWith("https://login.microsoftonline.com/") &&
          !issuer?.startsWith("https://sts.windows.net/")) {
        logger.warn("Unexpected issuer format", {
          operation: "validateToken",
          issuer,
        });
      }

      return payload as unknown as TokenClaims;
    }
  } catch (error) {
    logger.error("Token validation failed", error, {
      operation: "validateToken",
    });
    return null;
  }
}

/**
 * Extract email from token claims (handles both B2C and regular Azure AD)
 */
function getEmailFromClaims(claims: TokenClaims): string | null {
  // Regular Azure AD uses 'email' or 'preferred_username'
  if (claims.email) return claims.email;
  if (claims.preferred_username?.includes("@")) return claims.preferred_username;
  // B2C uses 'emails' array
  if (claims.emails && claims.emails.length > 0) return claims.emails[0];
  return null;
}

/**
 * Extract user ID from request (from validated token)
 */
export async function getUserIdFromRequest(
  request: HttpRequest,
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
  request: HttpRequest,
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
 * NOTE: Does not validate signature - prefer getTokenClaimsAsync for secure validation
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
 * NOTE: Does not validate signature - prefer getUserIdFromRequestAsync for secure validation
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
 * Require authentication with proper JWT validation (async)
 * Supports both Azure AD B2C and regular Azure AD tokens
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
 * This exists for backwards compatibility during migration.
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
 * Require admin access with proper JWT validation (async)
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
 * Require admin access - synchronous version (legacy)
 */
export async function requireAdminLegacy(request: HttpRequest): Promise<{
  authorized: boolean;
  userId: string | null;
  error?: HttpResponseInit;
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
