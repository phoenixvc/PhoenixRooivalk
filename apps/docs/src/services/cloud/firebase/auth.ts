// @ts-nocheck
/**
 * Firebase Authentication Service Implementation
 *
 * Implements IAuthService using Firebase Auth SDK.
 */

import {
  getAuth,
  GoogleAuthProvider,
  GithubAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  Auth,
} from "firebase/auth";
import { FirebaseApp } from "firebase/app";
import {
  IAuthService,
  checkIsAdmin,
  DEFAULT_ADMIN_DOMAINS,
} from "../interfaces/auth";
import {
  CloudUser,
  OAuthProvider as OAuthProviderType,
  UnsubscribeFn,
} from "../interfaces/types";

/**
 * Convert Firebase User to CloudUser
 */
function toCloudUser(user: User): CloudUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    emailVerified: user.emailVerified,
    providerData: user.providerData.map((p) => ({
      providerId: p.providerId,
      uid: p.uid,
      displayName: p.displayName,
      email: p.email,
      photoURL: p.photoURL,
    })),
  };
}

/**
 * Firebase Auth Service
 */
export class FirebaseAuthService implements IAuthService {
  private app: FirebaseApp | null = null;
  private auth: Auth | null = null;
  private initialized = false;

  // OAuth providers
  private googleProvider = new GoogleAuthProvider();
  private githubProvider = new GithubAuthProvider();
  private microsoftProvider = new OAuthProvider("microsoft.com");

  constructor(app: FirebaseApp | null) {
    this.app = app;
    if (app) {
      this.auth = getAuth(app);
      this.initialized = true;
    }
  }

  isConfigured(): boolean {
    return this.initialized && this.auth !== null;
  }

  getMissingConfig(): string[] {
    if (this.isConfigured()) return [];
    return ["Firebase app not initialized"];
  }

  async signInWithProvider(
    provider: OAuthProviderType,
  ): Promise<CloudUser | null> {
    if (!this.auth) return null;

    const authProvider = this.getProvider(provider);
    if (!authProvider) return null;

    try {
      const result = await signInWithPopup(this.auth, authProvider);
      return toCloudUser(result.user);
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
    if (!this.auth) return;
    try {
      await firebaseSignOut(this.auth);
    } catch (error) {
      console.error("Sign-out error:", error);
    }
  }

  getCurrentUser(): CloudUser | null {
    if (!this.auth?.currentUser) return null;
    return toCloudUser(this.auth.currentUser);
  }

  onAuthStateChanged(
    callback: (user: CloudUser | null) => void,
  ): UnsubscribeFn {
    if (!this.auth) {
      callback(null);
      return () => {};
    }

    return onAuthStateChanged(this.auth, (user) => {
      callback(user ? toCloudUser(user) : null);
    });
  }

  async getIdToken(forceRefresh = false): Promise<string | null> {
    if (!this.auth?.currentUser) return null;
    try {
      return await this.auth.currentUser.getIdToken(forceRefresh);
    } catch (error) {
      console.error("Error getting ID token:", error);
      return null;
    }
  }

  isAdmin(
    user: CloudUser | null,
    adminDomains = DEFAULT_ADMIN_DOMAINS,
  ): boolean {
    return checkIsAdmin(user, adminDomains);
  }

  private getProvider(provider: OAuthProviderType) {
    switch (provider) {
      case "google":
        return this.googleProvider;
      case "github":
        return this.githubProvider;
      case "microsoft":
        return this.microsoftProvider;
      default:
        return null;
    }
  }
}
