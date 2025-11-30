/**
 * Azure Authentication Service Implementation
 *
 * Implements IAuthService using Azure AD B2C / Entra External ID via MSAL.
 *
 * Note: This requires the @azure/msal-browser package to be installed.
 * npm install @azure/msal-browser
 */

import {
  IAuthService,
  checkIsAdmin,
  DEFAULT_ADMIN_DOMAINS,
} from '../interfaces/auth';
import {
  CloudUser,
  OAuthProvider,
  UnsubscribeFn,
  CloudServiceConfig,
} from '../interfaces/types';

/**
 * Azure AD B2C Configuration
 */
export interface AzureAuthConfig {
  tenantId: string;
  clientId: string;
  authority?: string;
  redirectUri?: string;
  scopes?: string[];
}

/**
 * Token claims from Azure AD
 */
interface AzureTokenClaims {
  sub: string;
  email?: string;
  name?: string;
  preferred_username?: string;
  picture?: string;
  email_verified?: boolean;
  idp?: string;
}

/**
 * Azure Auth Service
 *
 * Uses MSAL.js for authentication with Azure AD B2C or Entra External ID.
 * Supports Google, GitHub, and Microsoft identity providers.
 */
export class AzureAuthService implements IAuthService {
  private msalInstance: any = null; // PublicClientApplication
  private currentUser: CloudUser | null = null;
  private authStateCallbacks: Set<(user: CloudUser | null) => void> = new Set();
  private config: AzureAuthConfig | null = null;
  private initialized = false;

  constructor(config?: AzureAuthConfig) {
    this.config = config || null;
  }

  /**
   * Initialize MSAL instance
   * Must be called before using auth methods
   */
  async initialize(): Promise<boolean> {
    if (this.initialized) return true;
    if (!this.config) return false;

    try {
      // Dynamically import MSAL to avoid bundling when not used
      const msal = await import('@azure/msal-browser');

      const msalConfig = {
        auth: {
          clientId: this.config.clientId,
          authority: this.config.authority ||
            `https://${this.config.tenantId}.b2clogin.com/${this.config.tenantId}.onmicrosoft.com/B2C_1_SignUpSignIn`,
          redirectUri: this.config.redirectUri || window.location.origin,
          knownAuthorities: [`${this.config.tenantId}.b2clogin.com`],
        },
        cache: {
          cacheLocation: 'localStorage',
          storeAuthStateInCookie: false,
        },
      };

      this.msalInstance = new msal.PublicClientApplication(msalConfig);
      await this.msalInstance.initialize();

      // Handle redirect response
      const response = await this.msalInstance.handleRedirectPromise();
      if (response) {
        this.handleAuthResponse(response);
      } else {
        // Check for existing session
        const accounts = this.msalInstance.getAllAccounts();
        if (accounts.length > 0) {
          this.setUserFromAccount(accounts[0]);
        }
      }

      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Azure Auth initialization failed:', error);
      return false;
    }
  }

  isConfigured(): boolean {
    return this.config !== null && Boolean(this.config.clientId && this.config.tenantId);
  }

  getMissingConfig(): string[] {
    const missing: string[] = [];
    if (!this.config) {
      missing.push('Azure AD configuration');
    } else {
      if (!this.config.clientId) missing.push('AZURE_CLIENT_ID');
      if (!this.config.tenantId) missing.push('AZURE_TENANT_ID');
    }
    return missing;
  }

  async signInWithProvider(provider: OAuthProvider): Promise<CloudUser | null> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.msalInstance) return null;

    try {
      const loginRequest = this.getLoginRequest(provider);

      // Use popup for cross-origin providers
      const response = await this.msalInstance.loginPopup(loginRequest);
      this.handleAuthResponse(response);
      return this.currentUser;
    } catch (error) {
      console.error(`${provider} sign-in error:`, error);
      return null;
    }
  }

  async signInWithGoogle(): Promise<CloudUser | null> {
    return this.signInWithProvider('google');
  }

  async signInWithGithub(): Promise<CloudUser | null> {
    return this.signInWithProvider('github');
  }

  async signInWithMicrosoft(): Promise<CloudUser | null> {
    return this.signInWithProvider('microsoft');
  }

  async signOut(): Promise<void> {
    if (!this.msalInstance) return;

    try {
      await this.msalInstance.logoutPopup({
        postLogoutRedirectUri: window.location.origin,
      });
      this.currentUser = null;
      this.notifyAuthStateChange(null);
    } catch (error) {
      console.error('Sign-out error:', error);
    }
  }

  getCurrentUser(): CloudUser | null {
    return this.currentUser;
  }

  onAuthStateChanged(callback: (user: CloudUser | null) => void): UnsubscribeFn {
    this.authStateCallbacks.add(callback);

    // Immediately call with current state
    callback(this.currentUser);

    return () => {
      this.authStateCallbacks.delete(callback);
    };
  }

  async getIdToken(forceRefresh = false): Promise<string | null> {
    if (!this.msalInstance) return null;

    const accounts = this.msalInstance.getAllAccounts();
    if (accounts.length === 0) return null;

    try {
      const response = await this.msalInstance.acquireTokenSilent({
        scopes: this.config?.scopes || ['openid', 'profile', 'email'],
        account: accounts[0],
        forceRefresh,
      });
      return response.idToken;
    } catch (error) {
      console.error('Error getting ID token:', error);

      // Try interactive if silent fails
      try {
        const response = await this.msalInstance.acquireTokenPopup({
          scopes: this.config?.scopes || ['openid', 'profile', 'email'],
        });
        return response.idToken;
      } catch {
        return null;
      }
    }
  }

  isAdmin(user: CloudUser | null, adminDomains = DEFAULT_ADMIN_DOMAINS): boolean {
    return checkIsAdmin(user, adminDomains);
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  private getLoginRequest(provider: OAuthProvider) {
    const baseRequest = {
      scopes: this.config?.scopes || ['openid', 'profile', 'email'],
    };

    // For Azure AD B2C, identity providers are configured in user flows
    // The provider hint is passed via domain_hint or idp parameter
    switch (provider) {
      case 'google':
        return {
          ...baseRequest,
          extraQueryParameters: { domain_hint: 'google.com' },
        };
      case 'github':
        return {
          ...baseRequest,
          extraQueryParameters: { domain_hint: 'github.com' },
        };
      case 'microsoft':
        return {
          ...baseRequest,
          // Microsoft is the default for Azure AD
        };
      default:
        return baseRequest;
    }
  }

  private handleAuthResponse(response: any): void {
    if (response?.account) {
      this.setUserFromAccount(response.account);
    }
  }

  private setUserFromAccount(account: any): void {
    const claims = account.idTokenClaims as AzureTokenClaims;

    this.currentUser = {
      uid: claims.sub || account.localAccountId,
      email: claims.email || claims.preferred_username || null,
      displayName: claims.name || null,
      photoURL: claims.picture || null,
      emailVerified: claims.email_verified || false,
      providerData: [
        {
          providerId: claims.idp || 'azure',
          uid: claims.sub || account.localAccountId,
          displayName: claims.name || null,
          email: claims.email || null,
          photoURL: claims.picture || null,
        },
      ],
    };

    this.notifyAuthStateChange(this.currentUser);
  }

  private notifyAuthStateChange(user: CloudUser | null): void {
    this.authStateCallbacks.forEach((callback) => {
      try {
        callback(user);
      } catch (error) {
        console.error('Auth state callback error:', error);
      }
    });
  }
}
