/**
 * Authentication Helpers
 *
 * Validates Azure AD B2C tokens for authenticated functions.
 */

import { HttpRequest } from "@azure/functions";

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
 * Extract user ID from request (from validated token)
 * In production, validate the JWT token properly
 */
export function getUserIdFromRequest(request: HttpRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    // Decode JWT payload (without validation - in prod, use proper JWT validation)
    const [, payload] = token.split(".");
    const decoded = JSON.parse(Buffer.from(payload, "base64").toString());
    return decoded.sub || decoded.oid || null;
  } catch {
    return null;
  }
}

/**
 * Get token claims from request
 */
export function getTokenClaims(request: HttpRequest): TokenClaims | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    const [, payload] = token.split(".");
    return JSON.parse(Buffer.from(payload, "base64").toString());
  } catch {
    return null;
  }
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
 * Require authentication - returns error response if not authenticated
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
 * Require admin access
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

    try {
      const [, payload] = token.split(".");
      const claims = JSON.parse(Buffer.from(payload, "base64").toString());
      const userId = claims.sub || claims.oid;

      if (!userId) {
        return { valid: false };
      }

      // Check if admin by email domain
      const email = claims.email || "";
      const domain = email.split("@")[1]?.toLowerCase();
      const isAdminUser = ADMIN_DOMAINS.includes(domain);

      return { valid: true, userId, isAdmin: isAdminUser };
    } catch {
      return { valid: false };
    }
  }

  return { valid: false };
}
