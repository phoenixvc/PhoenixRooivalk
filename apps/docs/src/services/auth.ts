/**
 * Authentication and Database Services
 *
 * Azure-based implementation for user authentication and data storage.
 * Uses Azure Entra ID (MSAL) for auth and Azure Functions/Cosmos DB for data.
 */

import { getAuthService, getDatabaseService, isCloudConfigured } from "./cloud";
import type {
  UserProgress,
  UserProfileData,
} from "./cloud/interfaces/database";

// Re-export types for backwards compatibility
export type { UserProgress, UserProfileData };

// User type
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  providerData: Array<{
    providerId: string;
    uid: string;
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
  }>;
}

/**
 * Check if Azure services are configured
 */
export function isAuthConfigured(): boolean {
  return isCloudConfigured();
}

/**
 * Get missing Azure configuration
 */
export function getMissingAuthConfig(): string[] {
  if (isCloudConfigured()) return [];

  const missing: string[] = [];
  // Only check config on browser side
  if (typeof window !== "undefined") {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const docusaurusData = (window as any).__DOCUSAURUS__;
      const config = docusaurusData?.siteConfig?.customFields?.azureConfig;
      if (!config?.clientId) {
        missing.push("AZURE_ENTRA_CLIENT_ID");
      }
      if (!config?.tenantId) {
        missing.push("AZURE_ENTRA_TENANT_ID");
      }
    } catch {
      // If we can't access config, assume both are missing
      missing.push("AZURE_ENTRA_CLIENT_ID");
      missing.push("AZURE_ENTRA_TENANT_ID");
    }
  }

  return missing;
}

/**
 * Auth state change listener
 */
export function onAuthChange(
  callback: (user: User | null) => void,
): () => void {
  const auth = getAuthService();
  return auth.onAuthStateChanged((cloudUser) => {
    if (cloudUser) {
      callback({
        uid: cloudUser.uid,
        email: cloudUser.email,
        displayName: cloudUser.displayName,
        photoURL: cloudUser.photoURL,
        emailVerified: cloudUser.emailVerified || false,
        providerData: cloudUser.providerData || [],
      });
    } else {
      callback(null);
    }
  });
}

/**
 * Sign in with Google (via Azure AD B2C or direct)
 */
export async function signInWithGoogle(): Promise<User | null> {
  const auth = getAuthService();
  const result = await auth.signInWithGoogle();
  if (result) {
    return {
      uid: result.uid,
      email: result.email,
      displayName: result.displayName,
      photoURL: result.photoURL,
      emailVerified: result.emailVerified || false,
      providerData: result.providerData || [],
    };
  }
  return null;
}

/**
 * Sign in with GitHub (via Azure AD B2C or direct)
 */
export async function signInWithGithub(): Promise<User | null> {
  const auth = getAuthService();
  const result = await auth.signInWithGithub();
  if (result) {
    return {
      uid: result.uid,
      email: result.email,
      displayName: result.displayName,
      photoURL: result.photoURL,
      emailVerified: result.emailVerified || false,
      providerData: result.providerData || [],
    };
  }
  return null;
}

/**
 * Sign out
 */
export async function signOut(): Promise<void> {
  const auth = getAuthService();
  await auth.signOut();
}

/**
 * Get user progress from Cosmos DB
 */
export async function getUserProgress(userId: string): Promise<UserProgress> {
  const db = getDatabaseService();
  const data = await db.getDocument<UserProgress>(
    `users/${userId}/progress`,
    "current",
  );
  return (
    data || {
      docs: {},
      achievements: {},
      stats: { totalPoints: 0, level: 1, streak: 0 },
    }
  );
}

/**
 * Save user progress to Cosmos DB
 */
export async function saveUserProgress(
  userId: string,
  progress: UserProgress,
): Promise<void> {
  const db = getDatabaseService();
  await db.setDocument(
    `users/${userId}/progress`,
    "current",
    progress as unknown as Record<string, unknown>,
  );
}

/**
 * Get user profile from Cosmos DB
 */
export async function getUserProfileData(
  userId: string,
): Promise<UserProfileData | null> {
  const db = getDatabaseService();
  return db.getDocument<UserProfileData>("users", userId);
}

/**
 * Update user profile in Cosmos DB
 */
export async function updateUserProfileData(
  userId: string,
  data: Partial<UserProfileData>,
): Promise<boolean> {
  const db = getDatabaseService();
  try {
    await db.updateDocument("users", userId, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error("Failed to update user profile:", error);
    return false;
  }
}

/**
 * Get current user
 */
export function getCurrentUser(): User | null {
  const auth = getAuthService();
  const cloudUser = auth.getCurrentUser();
  if (cloudUser) {
    return {
      uid: cloudUser.uid,
      email: cloudUser.email,
      displayName: cloudUser.displayName,
      photoURL: cloudUser.photoURL,
      emailVerified: cloudUser.emailVerified || false,
      providerData: cloudUser.providerData || [],
    };
  }
  return null;
}
