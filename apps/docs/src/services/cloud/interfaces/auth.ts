/**
 * Authentication Service Interface
 *
 * Provides abstraction for authentication operations across different cloud providers.
 * Implementations: Firebase Auth, Azure AD B2C / Entra External ID
 */

import { CloudUser, OAuthProvider, UnsubscribeFn } from './types';

/**
 * Authentication service interface
 */
export interface IAuthService {
  /**
   * Check if the auth service is configured and ready
   */
  isConfigured(): boolean;

  /**
   * Get details about missing configuration
   */
  getMissingConfig(): string[];

  /**
   * Sign in with an OAuth provider
   * @param provider - The OAuth provider to use
   * @returns The authenticated user or null if sign-in fails
   */
  signInWithProvider(provider: OAuthProvider): Promise<CloudUser | null>;

  /**
   * Sign in with Google (convenience method)
   */
  signInWithGoogle(): Promise<CloudUser | null>;

  /**
   * Sign in with GitHub (convenience method)
   */
  signInWithGithub(): Promise<CloudUser | null>;

  /**
   * Sign in with Microsoft (Azure AD)
   */
  signInWithMicrosoft(): Promise<CloudUser | null>;

  /**
   * Sign out the current user
   */
  signOut(): Promise<void>;

  /**
   * Get the currently authenticated user
   */
  getCurrentUser(): CloudUser | null;

  /**
   * Subscribe to authentication state changes
   * @param callback - Called when auth state changes
   * @returns Unsubscribe function
   */
  onAuthStateChanged(callback: (user: CloudUser | null) => void): UnsubscribeFn;

  /**
   * Get the current user's ID token for API calls
   * @param forceRefresh - Force refresh the token
   */
  getIdToken(forceRefresh?: boolean): Promise<string | null>;

  /**
   * Check if a user is an admin based on their email domain
   * @param user - The user to check
   * @param adminDomains - List of admin email domains
   */
  isAdmin(user: CloudUser | null, adminDomains?: string[]): boolean;
}

/**
 * Default admin domains for Phoenix Rooivalk
 */
export const DEFAULT_ADMIN_DOMAINS = ['phoenixrooivalk.com', 'justaghost.dev'];

/**
 * Helper to check if a user is an admin
 */
export function checkIsAdmin(
  user: CloudUser | null,
  adminDomains: string[] = DEFAULT_ADMIN_DOMAINS
): boolean {
  if (!user?.email) return false;
  const emailDomain = user.email.split('@')[1]?.toLowerCase();
  return adminDomains.some(domain => domain.toLowerCase() === emailDomain);
}
