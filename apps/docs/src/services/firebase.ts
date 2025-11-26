/**
 * Firebase Configuration for Phoenix Rooivalk Documentation
 *
 * To enable cloud sync:
 * 1. Create a Firebase project at https://console.firebase.google.com
 * 2. Enable Authentication (Google, GitHub, or Email providers)
 * 3. Create a Firestore database
 * 4. Copy your config values to environment variables or .env file
 *
 * Environment variables needed:
 * - FIREBASE_API_KEY
 * - FIREBASE_AUTH_DOMAIN
 * - FIREBASE_PROJECT_ID
 * - FIREBASE_STORAGE_BUCKET
 * - FIREBASE_MESSAGING_SENDER_ID
 * - FIREBASE_APP_ID
 */

import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  Auth,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  Firestore,
  serverTimestamp,
} from "firebase/firestore";

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.FIREBASE_APP_ID || "",
};

// Check if Firebase is configured
export const isFirebaseConfigured = (): boolean => {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
};

// Initialize Firebase only if configured
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured() && typeof window !== "undefined") {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  auth = getAuth(app);
  db = getFirestore(app);
}

// Auth providers
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

// Authentication functions

/**
 * Authenticates user with Google OAuth provider.
 * @returns {Promise<User | null>} The authenticated user or null if sign-in fails
 */
export const signInWithGoogle = async (): Promise<User | null> => {
  if (!auth) return null;
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Google sign-in error:", {
      message: error instanceof Error ? error.message : "Unknown error",
      code: (error as any)?.code,
      error,
    });
    return null;
  }
};

/**
 * Authenticates user with GitHub OAuth provider.
 * @returns {Promise<User | null>} The authenticated user or null if sign-in fails
 */
export const signInWithGithub = async (): Promise<User | null> => {
  if (!auth) return null;
  try {
    const result = await signInWithPopup(auth, githubProvider);
    return result.user;
  } catch (error) {
    console.error("GitHub sign-in error:", {
      message: error instanceof Error ? error.message : "Unknown error",
      code: (error as any)?.code,
      error,
    });
    return null;
  }
};

/**
 * Signs out the current user.
 * @returns {Promise<void>}
 */
export const signOut = async (): Promise<void> => {
  if (!auth) return;
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Sign-out error:", error);
  }
};

/**
 * Registers a callback for authentication state changes.
 * @param {(user: User | null) => void} callback - Function called when auth state changes
 * @returns {() => void} Unsubscribe function to stop listening to auth changes
 */
export const onAuthChange = (
  callback: (user: User | null) => void,
): (() => void) => {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};

/**
 * Gets the currently authenticated user.
 * @returns {User | null} The current user or null if not authenticated
 */
export const getCurrentUser = (): User | null => {
  return auth?.currentUser || null;
};

// Firestore data types
export interface UserProgress {
  docs: {
    [docId: string]: {
      completed: boolean;
      completedAt?: string;
      scrollProgress: number;
    };
  };
  achievements: {
    [achievementId: string]: {
      unlockedAt: string;
    };
  };
  stats: {
    totalPoints: number;
    level: number;
    streak: number;
    lastVisit?: string;
  };
  updatedAt?: unknown;
}

const DEFAULT_PROGRESS: UserProgress = {
  docs: {},
  achievements: {},
  stats: {
    totalPoints: 0,
    level: 1,
    streak: 0,
  },
};

// Firestore operations

/**
 * Retrieves user's progress document from Firestore.
 * Creates a default progress document if none exists for the user.
 * @param {string} userId - The user's unique identifier
 * @returns {Promise<UserProgress>} The user's progress data or default values if not found
 */
export const getUserProgress = async (
  userId: string,
): Promise<UserProgress> => {
  if (!db) return DEFAULT_PROGRESS;
  try {
    const docRef = doc(db, "userProgress", userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProgress;
    }
    // Create default progress for new users
    await setDoc(docRef, { ...DEFAULT_PROGRESS, updatedAt: serverTimestamp() });
    return DEFAULT_PROGRESS;
  } catch (error) {
    console.error("Error getting user progress:", error);
    return DEFAULT_PROGRESS;
  }
};

/**
 * Updates specific fields in user's progress document.
 * Uses Firestore merge semantics to update only provided fields.
 * @param {string} userId - The user's unique identifier
 * @param {Partial<UserProgress>} progress - Partial progress data to update
 * @returns {Promise<boolean>} True if update succeeded, false otherwise
 */
export const updateUserProgress = async (
  userId: string,
  progress: Partial<UserProgress>,
): Promise<boolean> => {
  if (!db) return false;
  try {
    const docRef = doc(db, "userProgress", userId);
    await updateDoc(docRef, {
      ...progress,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Error updating user progress:", error);
    return false;
  }
};

/**
 * Saves complete user progress document to Firestore.
 * Overwrites the entire document with provided data.
 * @param {string} userId - The user's unique identifier
 * @param {UserProgress} progress - Complete progress data to save
 * @returns {Promise<boolean>} True if save succeeded, false otherwise
 */
export const saveUserProgress = async (
  userId: string,
  progress: UserProgress,
): Promise<boolean> => {
  if (!db) return false;
  try {
    const docRef = doc(db, "userProgress", userId);
    await setDoc(docRef, {
      ...progress,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Error saving user progress:", error);
    return false;
  }
};

// Export instances for direct access if needed
export { auth, db, app };
