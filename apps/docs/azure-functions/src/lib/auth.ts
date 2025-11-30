/**
 * Authentication Helpers
 *
 * Validates Azure AD B2C tokens for authenticated functions using JWKS.
 */

import { HttpRequest } from "@azure/functions";
import * as jose from "jose";

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
}

/**
 * Admin email domains
 */
const ADMIN_DOMAINS = ["phoenixrooivalk.com", "justaghost.dev"];

/**
 * JWKS cache for Azure AD B2C public keys
 */
let jwksCache: jose.JWTVerifyGetKey | null = null;
let jwksCacheExpiry = 0;
const JWKS_CACHE_TTL = 3600000; // 1 hour in ms

/**
 * Get Azure AD B2C configuration from environment
 */
function getAzureB2CConfig(): {
  tenantId: string;
  clientId: string;
  policyName: string;
} | null {
  const tenantId = process.env.AZURE_ENTRA_TENANT_ID;
  const clientId = process.env.AZURE_ENTRA_CLIENT_ID;
  const policyName = process.env.AZURE_B2C_POLICY_NAME || "B2C_1_signupsignin";

  if (!tenantId || !clientId) {
    return null;
  }

  return { tenantId, clientId, policyName };
}

/**
 * Get JWKS remote key set for Azure AD B2C
 */
async function getJwks(): Promise<jose.JWTVerifyGetKey | null> {
  const config = getAzureB2CConfig();
  if (!config) {
    return null;
  }

  const now = Date.now();
  if (jwksCache && now < jwksCacheExpiry) {
    return jwksCache;
  }

  try {
    // Azure AD B2C JWKS endpoint
    // Format: https://{tenant}.b2clogin.com/{tenant}.onmicrosoft.com/{policy}/discovery/v2.0/keys
    const jwksUrl = `https://${config.tenantId}.b2clogin.com/${config.tenantId}.onmicrosoft.com/${config.policyName}/discovery/v2.0/keys`;

    jwksCache = jose.createRemoteJWKSet(new URL(jwksUrl));
    jwksCacheExpiry = now + JWKS_CACHE_TTL;

    return jwksCache;
  } catch {
    return null;
  }
}

/**
 * Validate JWT token with proper signature verification
 */
async function validateJwtToken(token: string): Promise<TokenClaims | null> {
  const config = getAzureB2CConfig();
  if (!config) {
    // Fall back to decode-only if Azure B2C is not configured
    // This allows local development without B2C setup
    console.warn(
      "Azure B2C not configured - JWT validation disabled. Set AZURE_ENTRA_TENANT_ID and AZURE_ENTRA_CLIENT_ID for production.",
    );
    try {
      const [, payload] = token.split(".");
      const decoded = JSON.parse(
        Buffer.from(payload, "base64url").toString("utf8"),
      );
      return decoded as TokenClaims;
    } catch {
      return null;
    }
  }

  const jwks = await getJwks();
  if (!jwks) {
    return null;
  }

  try {
    // Expected issuer format for Azure AD B2C
    const expectedIssuer = `https://${config.tenantId}.b2clogin.com/${config.tenantId}.onmicrosoft.com/${config.policyName}/v2.0/`;

    const { payload } = await jose.jwtVerify(token, jwks, {
      issuer: expectedIssuer,
      audience: config.clientId,
      clockTolerance: 60, // Allow 60 seconds clock skew
    });

    return payload as unknown as TokenClaims;
  } catch (error) {
    if (error instanceof jose.errors.JWTExpired) {
      console.error("JWT token has expired");
    } else if (error instanceof jose.errors.JWTClaimValidationFailed) {
      console.error("JWT claim validation failed:", error.message);
    } else if (error instanceof jose.errors.JWSSignatureVerificationFailed) {
      console.error("JWT signature verification failed");
    } else {
      console.error("JWT validation error:", error);
    }
    return null;
  }
}

/**
 * Synchronously decode JWT payload (for backwards compatibility)
 * WARNING: Does not validate signature - use validateJwtToken for secure validation
 */
function decodeJwtPayload(token: string): TokenClaims | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

/**
 * Get token claims from request (synchronous, for legacy compatibility)
 * NOTE: Does not validate signature - prefer requireAuthAsync for secure validation
 */
export function getTokenClaims(request: HttpRequest): TokenClaims | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);
  return decodeJwtPayload(token);
}

/**
 * Extract user ID from request (synchronous)
 * NOTE: Does not validate signature - prefer requireAuthAsync for secure validation
 */
export function getUserIdFromRequest(request: HttpRequest): string | null {
  const claims = getTokenClaims(request);
  return claims?.sub || claims?.oid || null;
}

/**
 * Check if user is admin based on email domain
 */
export function isAdmin(request: HttpRequest): boolean {
  const claims = getTokenClaims(request);
  if (!claims?.email) return false;

  const domain = claims.email.split("@")[1]?.toLowerCase();
  return ADMIN_DOMAINS.includes(domain);
}

/**
 * Check if user is admin based on validated claims
 */
function isAdminFromClaims(claims: TokenClaims): boolean {
  if (!claims?.email) return false;
  const domain = claims.email.split("@")[1]?.toLowerCase();
  return ADMIN_DOMAINS.includes(domain);
}

/**
 * Require authentication with proper JWT validation (async)
 * This validates JWT signature using Azure AD B2C JWKS
 */
export async function requireAuthAsync(request: HttpRequest): Promise<{
  authenticated: boolean;
  userId: string | null;
  claims?: TokenClaims;
  error?: { status: number; body: object };
}> {
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
  const claims = await validateJwtToken(token);

  if (!claims) {
    return {
      authenticated: false,
      userId: null,
      error: {
        status: 401,
        body: { error: "Invalid or expired token", code: "unauthenticated" },
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
        body: { error: "Token missing user identifier", code: "unauthenticated" },
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
  const userId = getUserIdFromRequest(request);

  if (!userId) {
    return {
      authenticated: false,
      userId: null,
      error: {
        status: 401,
        body: { error: "Authentication required", code: "unauthenticated" },
      },
    };
  }

  return { authenticated: true, userId };
}

/**
 * Require admin access with proper JWT validation (async)
 */
export async function requireAdminAsync(request: HttpRequest): Promise<{
  authorized: boolean;
  userId: string | null;
  error?: { status: number; body: object };
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
        body: { error: "Admin access required", code: "permission-denied" },
      },
    };
  }

  return { authorized: true, userId: authResult.userId };
}

/**
 * Require admin access - synchronous version (legacy)
 */
export function requireAdmin(request: HttpRequest): {
  authorized: boolean;
  userId: string | null;
  error?: { status: number; body: object };
} {
  const authResult = requireAuth(request);
  if (!authResult.authenticated) {
    return { authorized: false, userId: null, error: authResult.error };
  }

  if (!isAdmin(request)) {
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
 * Validate authorization header with proper JWT validation
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
    const claims = await validateJwtToken(token);

    if (!claims) {
      return { valid: false };
    }

    const userId = claims.sub || claims.oid;
    if (!userId) {
      return { valid: false };
    }

    const isAdminUser = isAdminFromClaims(claims);
    return { valid: true, userId, isAdmin: isAdminUser };
  }

  return { valid: false };
}
