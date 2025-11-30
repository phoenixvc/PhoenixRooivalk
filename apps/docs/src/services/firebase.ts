/**
 * Firebase Compatibility Layer
 *
 * This file provides backward compatibility for components that were using
 * Firebase directly. It re-exports functionality from the cloud provider
 * which now uses Azure (or offline fallback).
 *
 * @deprecated Import from './cloud' instead
 */

import {
  getCloudServices,
  getAuthService,
  getDatabaseService,
  getCurrentProvider,
  isCloudConfigured,
} from "./cloud";

// Re-export User type - create a compatible type since we're not using Firebase
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

// Re-export UserProgress type
export interface UserProgress {
  docs: Record<
    string,
    {
      scrollProgress: number;
      completed: boolean;
      completedAt?: string;
      lastVisited?: string;
    }
  >;
  achievements: Record<
    string,
    {
      unlockedAt: string;
    }
  >;
  stats: {
    totalPoints: number;
    level: number;
    streak: number;
    lastVisit?: string;
  };
}

// Re-export UserProfileData type
export interface UserProfileData {
  profileKey?: string | null;
  roles: string[];
  displayName?: string;
  bio?: string;
  company?: string;
  updatedAt?: string;
}

/**
 * Check if cloud services are configured
 */
export function isFirebaseConfigured(): boolean {
  return isCloudConfigured();
}

/**
 * Get missing configuration items
 */
export function getMissingFirebaseConfig(): string[] {
  const provider = getCurrentProvider();
  if (provider === "offline") {
    return ["AZURE_ENTRA_CLIENT_ID", "AZURE_ENTRA_TENANT_ID"];
  }
  return [];
}

/**
 * Listen to auth state changes
 */
export function onAuthChange(
  callback: (user: User | null) => void,
): () => void {
  const auth = getAuthService();
  return auth.onAuthStateChanged((cloudUser) => {
    if (cloudUser) {
      // Convert cloud user to compatible User type
      const user: User = {
        uid: cloudUser.uid,
        email: cloudUser.email,
        displayName: cloudUser.displayName,
        photoURL: cloudUser.photoURL,
        emailVerified: cloudUser.emailVerified || false,
        providerData: cloudUser.providerData || [],
      };
      callback(user);
    } else {
      callback(null);
    }
  });
}

/**
 * Sign in with Google
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
 * Sign in with GitHub
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
 * Get user progress from database
 */
export async function getUserProgress(userId: string): Promise<UserProgress> {
  const db = getDatabaseService();
  const data = await db.getDocument<UserProgress>(`users/${userId}/progress`, "current");
  return (
    data || {
      docs: {},
      achievements: {},
      stats: { totalPoints: 0, level: 1, streak: 0 },
    }
  );
}

/**
 * Save user progress to database
 */
export async function saveUserProgress(
  userId: string,
  progress: UserProgress,
): Promise<void> {
  const db = getDatabaseService();
  await db.setDocument(`users/${userId}/progress`, "current", progress);
}

/**
 * Get user profile data from database
 */
export async function getUserProfileData(
  userId: string,
): Promise<UserProfileData | null> {
  const db = getDatabaseService();
  return db.getDocument<UserProfileData>("users", userId);
}

/**
 * Update user profile data in database
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
  const cloudUser = auth.currentUser;
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
