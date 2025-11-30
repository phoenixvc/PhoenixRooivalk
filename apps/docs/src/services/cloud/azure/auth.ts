/**
 * Azure Authentication Service Implementation
 *
 * Implements IAuthService using Azure Entra ID (formerly Azure AD) via MSAL.
 *
 * Note: This requires the @azure/msal-browser package to be installed.
 * npm install @azure/msal-browser
 */

import {
  IAuthService,
  checkIsAdmin,
  DEFAULT_ADMIN_DOMAINS,
} from "../interfaces/auth";
import { CloudUser, OAuthProvider, UnsubscribeFn } from "../interfaces/types";

/**
 * Azure Entra ID Configuration
 */
export interface AzureAuthConfig {
  tenantId: string;
  clientId: string;
  authority?: string;
  redirectUri?: string;
  postLogoutRedirectUri?: string;
  scopes?: string[] | string;
}

/**
 * Token claims from Azure Entra ID
 */
interface AzureTokenClaims {
  sub: string;
  oid?: string;
  email?: string;
  name?: string;
  preferred_username?: string;
  picture?: string;
  email_verified?: boolean;
  idp?: string;
  given_name?: string;
  family_name?: string;
  upn?: string;
}

/**
 * Azure Auth Service
 *
 * Uses MSAL.js for authentication with Azure Entra ID.
 * Supports Microsoft identity provider with single-tenant or multi-tenant configuration.
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
   * Parse scopes from config (can be string or array)
   */
  private parseScopes(): string[] {
    if (!this.config?.scopes) {
      return ["openid", "profile", "email", "User.Read"];
    }
    if (typeof this.config.scopes === "string") {
      return this.config.scopes.split(" ").filter(Boolean);
    }
    return this.config.scopes;
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
      const msal = await import("@azure/msal-browser");

      // Azure Entra ID uses login.microsoftonline.com
      const authority =
        this.config.authority ||
        `https://login.microsoftonline.com/${this.config.tenantId}`;

      const msalConfig = {
        auth: {
          clientId: this.config.clientId,
          authority,
          redirectUri: this.config.redirectUri || window.location.origin,
          postLogoutRedirectUri:
            this.config.postLogoutRedirectUri || window.location.origin,
          knownAuthorities: ["login.microsoftonline.com"],
          navigateToLoginRequestUrl: true,
        },
        cache: {
          cacheLocation: "localStorage",
          storeAuthStateInCookie: false,
        },
        system: {
          loggerOptions: {
            logLevel: msal.LogLevel.Warning,
          },
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
      console.error("Azure Entra ID Auth initialization failed:", error);
      return false;
    }
  }

  isConfigured(): boolean {
    return (
      this.config !== null &&
      Boolean(this.config.clientId && this.config.tenantId)
    );
  }

  getMissingConfig(): string[] {
    const missing: string[] = [];
    if (!this.config) {
      missing.push("Azure Entra ID configuration");
    } else {
      if (!this.config.clientId) missing.push("AZURE_ENTRA_CLIENT_ID");
      if (!this.config.tenantId) missing.push("AZURE_ENTRA_TENANT_ID");
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
    return this.signInWithProvider("google");
  }

  async signInWithGithub(): Promise<CloudUser | null> {
    return this.signInWithProvider("github");
  }

  async signInWithMicrosoft(): Promise<CloudUser | null> {
    return this.signInWithProvider("microsoft");
  }

  async signOut(): Promise<void> {
    if (!this.msalInstance) return;

    try {
      await this.msalInstance.logoutPopup({
        postLogoutRedirectUri:
          this.config?.postLogoutRedirectUri || window.location.origin,
      });
      this.currentUser = null;
      this.notifyAuthStateChange(null);
    } catch (error) {
      console.error("Sign-out error:", error);
    }
  }

  getCurrentUser(): CloudUser | null {
    return this.currentUser;
  }

  onAuthStateChanged(
    callback: (user: CloudUser | null) => void,
  ): UnsubscribeFn {
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

    const scopes = this.parseScopes();

    try {
      const response = await this.msalInstance.acquireTokenSilent({
        scopes,
        account: accounts[0],
        forceRefresh,
      });
      return response.idToken;
    } catch (error) {
      console.error("Error getting ID token:", error);

      // Try interactive if silent fails
      try {
        const response = await this.msalInstance.acquireTokenPopup({
          scopes,
        });
        return response.idToken;
      } catch {
        return null;
      }
    }
  }

  isAdmin(
    user: CloudUser | null,
    adminDomains = DEFAULT_ADMIN_DOMAINS,
  ): boolean {
    return checkIsAdmin(user, adminDomains);
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  private getLoginRequest(provider: OAuthProvider) {
    const scopes = this.parseScopes();
    const baseRequest = { scopes };

    // For Azure Entra ID, we use the Microsoft identity platform directly
    // Note: Google/GitHub providers require external identity federation setup in Entra ID
    switch (provider) {
      case "google":
        return {
          ...baseRequest,
          // Requires Google federation configured in Entra ID
          extraQueryParameters: { domain_hint: "google.com" },
        };
      case "github":
        return {
          ...baseRequest,
          // Requires GitHub federation configured in Entra ID
          extraQueryParameters: { domain_hint: "github.com" },
        };
      case "microsoft":
        return {
          ...baseRequest,
          // Microsoft is native to Entra ID
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

    // Build display name from available claims
    const displayName =
      claims.name ||
      (claims.given_name && claims.family_name
        ? `${claims.given_name} ${claims.family_name}`
        : null) ||
      claims.preferred_username ||
      null;

    // Get email from various possible claims
    const email =
      claims.email || claims.preferred_username || claims.upn || null;

    this.currentUser = {
      uid: claims.oid || claims.sub || account.localAccountId,
      email,
      displayName,
      photoURL: claims.picture || null,
      emailVerified: claims.email_verified ?? (email ? true : false),
      providerData: [
        {
          providerId: claims.idp || "microsoft",
          uid: claims.oid || claims.sub || account.localAccountId,
          displayName,
          email,
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
        console.error("Auth state callback error:", error);
      }
    });
  }
}
