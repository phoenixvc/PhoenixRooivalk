/**
 * Firebase Configuration for Phoenix Rooivalk Documentation
 *
 * To enable cloud sync:
 * 1. Create a Firebase project at https://console.firebase.google.com
 * 2. Enable Authentication (Google, GitHub, or Email providers)
 * 3. Create a Firestore database
 * 4. Copy your config values to environment variables or .env file
 *
 * Environment variables needed (set in Netlify/hosting platform):
 * - FIREBASE_API_KEY
 * - FIREBASE_AUTH_DOMAIN
 * - FIREBASE_PROJECT_ID
 * - FIREBASE_STORAGE_BUCKET
 * - FIREBASE_MESSAGING_SENDER_ID
 * - FIREBASE_APP_ID
 *
 * These are exposed to the client via customFields in docusaurus.config.ts
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
  runTransaction,
  Firestore,
  serverTimestamp,
  Timestamp,
  FieldValue,
} from "firebase/firestore";
import {
  getAnalytics,
  Analytics,
  isSupported as isAnalyticsSupported,
} from "firebase/analytics";

// Firebase configuration interface
interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
}

// Get Firebase config from Docusaurus customFields (set at build time)
// This is populated from environment variables in docusaurus.config.ts
const getFirebaseConfig = (): FirebaseConfig => {
  // Check if we're in browser environment and Docusaurus context is available
  if (typeof window !== "undefined") {
    try {
      // Access the config that was injected by Docusaurus at build time
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const docusaurusData = (window as any).__DOCUSAURUS__;
      if (docusaurusData?.siteConfig?.customFields?.firebaseConfig) {
        return docusaurusData.siteConfig.customFields
          .firebaseConfig as FirebaseConfig;
      }
    } catch {
      // Ignore errors accessing window data
    }
  }

  // Fallback to empty config (Firebase won't be configured)
  return {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
    measurementId: "",
  };
};

// Get config lazily to ensure window is available
let _firebaseConfig: FirebaseConfig | null = null;
const getConfig = (): FirebaseConfig => {
  if (!_firebaseConfig) {
    _firebaseConfig = getFirebaseConfig();
  }
  return _firebaseConfig;
};

// Check if Firebase is configured
export const isFirebaseConfigured = (): boolean => {
  const config = getConfig();
  return Boolean(config.apiKey && config.projectId);
};

// Get details about missing Firebase configuration
export const getMissingFirebaseConfig = (): string[] => {
  const config = getConfig();
  const missing: string[] = [];

  if (!config.apiKey) missing.push("FIREBASE_API_KEY");
  if (!config.authDomain) missing.push("FIREBASE_AUTH_DOMAIN");
  if (!config.projectId) missing.push("FIREBASE_PROJECT_ID");
  if (!config.storageBucket) missing.push("FIREBASE_STORAGE_BUCKET");
  if (!config.messagingSenderId) missing.push("FIREBASE_MESSAGING_SENDER_ID");
  if (!config.appId) missing.push("FIREBASE_APP_ID");

  return missing;
};

// Check if GA4 is configured
export const isGA4Configured = (): boolean => {
  const config = getConfig();
  return Boolean(config.measurementId);
};

// Initialize Firebase only if configured
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let analytics: Analytics | null = null;
let initialized = false;

// Lazy initialization function to ensure config is available
const initializeFirebase = (): void => {
  if (initialized) return;
  if (typeof window === "undefined") return;

  const config = getConfig();
  if (!config.apiKey || !config.projectId) return;

  try {
    if (getApps().length === 0) {
      app = initializeApp(config);
    } else {
      app = getApps()[0];
    }
    auth = getAuth(app);
    db = getFirestore(app);

    // Initialize GA4 Analytics if configured and supported
    if (config.measurementId) {
      isAnalyticsSupported().then((supported) => {
        if (supported && app) {
          analytics = getAnalytics(app);
        }
      });
    }

    initialized = true;
  } catch (error) {
    console.error("Failed to initialize Firebase:", error);
  }
};

// Initialize on first import in browser
if (typeof window !== "undefined") {
  // Use setTimeout to ensure Docusaurus data is available
  setTimeout(() => {
    initializeFirebase();
  }, 0);
}

/**
 * Get the GA4 Analytics instance (may be null if not configured/supported)
 */
export const getGA4Analytics = (): Analytics | null => {
  initializeFirebase(); // Ensure initialized
  return analytics;
};

// Auth providers
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

// Authentication functions

/**
 * Authenticates user with Google OAuth provider.
 * @returns {Promise<User | null>} The authenticated user or null if sign-in fails
 */
export const signInWithGoogle = async (): Promise<User | null> => {
  initializeFirebase(); // Ensure initialized
  if (!auth) return null;
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Google sign-in error:", {
      message: error instanceof Error ? error.message : "Unknown error",
      code: (error as unknown as { code?: string })?.code,
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
  initializeFirebase(); // Ensure initialized
  if (!auth) return null;
  try {
    const result = await signInWithPopup(auth, githubProvider);
    return result.user;
  } catch (error) {
    console.error("GitHub sign-in error:", {
      message: error instanceof Error ? error.message : "Unknown error",
      code: (error as unknown as { code?: string })?.code,
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
  initializeFirebase(); // Ensure initialized
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
  initializeFirebase(); // Ensure initialized
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
  initializeFirebase(); // Ensure initialized
  return auth?.currentUser || null;
};

// User Profile data types
export interface UserProfileData {
  // Basic details from profile completion
  firstName: string;
  lastName: string;
  linkedIn: string;
  discord: string;
  whatsApp?: string;
  // Profile selection
  profileKey: string | null;
  roles: string[];
  // Fun facts from AI research
  funFacts?: Array<{
    id: string;
    fact: string;
    category: string;
  }>;
  // Timestamps - use Firestore Timestamp or FieldValue for serverTimestamp()
  createdAt?: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
  profileCompletedAt?: string;
  funFactsGeneratedAt?: string;
}

const DEFAULT_USER_PROFILE: UserProfileData = {
  firstName: "",
  lastName: "",
  linkedIn: "",
  discord: "",
  profileKey: null,
  roles: [],
};

// Firestore data types
export interface UserProgress {
  docs: {
    [docId: string]: {
      completed: boolean;
      completedAt?: string;
      scrollProgress: number;
      timeSpentMs?: number; // Time spent reading this doc in milliseconds
      lastReadAt?: string; // Last time this doc was read
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
    totalTimeSpentMs?: number; // Total time spent across all docs
  };
  // Use Firestore Timestamp or FieldValue for serverTimestamp()
  updatedAt?: Timestamp | FieldValue;
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
  initializeFirebase(); // Ensure initialized
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
  initializeFirebase(); // Ensure initialized
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
  initializeFirebase(); // Ensure initialized
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

// User Profile operations

/**
 * Retrieves user's profile document from Firestore.
 * @param {string} userId - The user's unique identifier
 * @returns {Promise<UserProfileData | null>} The user's profile data or null if not found
 */
export const getUserProfileData = async (
  userId: string,
): Promise<UserProfileData | null> => {
  initializeFirebase(); // Ensure initialized
  if (!db) return null;
  try {
    const docRef = doc(db, "userProfiles", userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfileData;
    }
    return null;
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
};

/**
 * Saves user profile document to Firestore.
 * Creates a new document or updates existing one using a transaction
 * to avoid race conditions.
 * @param {string} userId - The user's unique identifier
 * @param {UserProfileData} profile - Complete profile data to save
 * @returns {Promise<boolean>} True if save succeeded, false otherwise
 */
export const saveUserProfileData = async (
  userId: string,
  profile: UserProfileData,
): Promise<boolean> => {
  initializeFirebase(); // Ensure initialized
  if (!db) return false;
  try {
    const docRef = doc(db, "userProfiles", userId);

    await runTransaction(db, async (transaction) => {
      const existingDoc = await transaction.get(docRef);

      if (existingDoc.exists()) {
        // Update existing document
        transaction.update(docRef, {
          ...profile,
          updatedAt: serverTimestamp(),
        });
      } else {
        // Create new document
        transaction.set(docRef, {
          ...profile,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    });
    return true;
  } catch (error) {
    console.error("Error saving user profile:", error);
    return false;
  }
};

/**
 * Updates specific fields in user's profile document.
 * Uses Firestore transaction to avoid race conditions and lost writes.
 * @param {string} userId - The user's unique identifier
 * @param {Partial<UserProfileData>} updates - Partial profile data to update
 * @returns {Promise<boolean>} True if update succeeded, false otherwise
 */
export const updateUserProfileData = async (
  userId: string,
  updates: Partial<UserProfileData>,
): Promise<boolean> => {
  initializeFirebase(); // Ensure initialized
  if (!db) return false;
  try {
    const docRef = doc(db, "userProfiles", userId);

    await runTransaction(db, async (transaction) => {
      const existingDoc = await transaction.get(docRef);

      if (existingDoc.exists()) {
        transaction.update(docRef, {
          ...updates,
          updatedAt: serverTimestamp(),
        });
      } else {
        // Create document if it doesn't exist
        transaction.set(docRef, {
          ...DEFAULT_USER_PROFILE,
          ...updates,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    });
    return true;
  } catch (error) {
    console.error("Error updating user profile:", error);
    return false;
  }
};

// Export instances for direct access if needed
export { auth, db, app, analytics };

// Re-export GA4 logging function for convenience
export { logEvent } from "firebase/analytics";
