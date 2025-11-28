/**
 * Authentication Context for Phoenix Rooivalk Documentation
 * Provides user authentication state and sync functionality across the app
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { User } from "firebase/auth";
import {
  isFirebaseConfigured,
  getMissingFirebaseConfig,
  onAuthChange,
  signInWithGoogle,
  signInWithGithub,
  signOut,
  getUserProgress,
  saveUserProgress,
  UserProgress,
  getUserProfileData,
  updateUserProfileData,
  UserProfileData,
} from "../services/firebase";
import { analytics } from "../services/analytics";
import {
  isOnline,
  queueUpdate,
  getQueuedUpdates,
  removeFromQueue,
} from "../components/Offline";
import {
  getUserProfile as getKnownUserProfile,
  UserProfile,
  INTERNAL_USER_PROFILES,
} from "../config/userProfiles";

// Local storage keys
const LOCAL_PROGRESS_KEY = "phoenix-docs-progress";
const LOCAL_ACHIEVEMENTS_KEY = "phoenix-docs-achievements";
const LOCAL_STATS_KEY = "phoenix-docs-stats";
const PROFILE_DATA_KEY = "phoenix-docs-user-profile";

/**
 * User profile state for centralized profile management
 */
export interface UserProfileState {
  knownProfile: UserProfile | null; // Detected profile from INTERNAL_USER_PROFILES
  confirmedRoles: string[]; // User's confirmed/selected roles
  profileKey: string | null; // Key in INTERNAL_USER_PROFILES (e.g., "martyn")
  isProfileLoaded: boolean; // True once profile detection is complete
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isConfigured: boolean;
  missingConfig: string[];
  progress: UserProgress | null;
  userProfile: UserProfileState;
  signInGoogle: () => Promise<void>;
  signInGithub: () => Promise<void>;
  logout: () => Promise<void>;
  syncProgress: () => Promise<void>;
  updateProgress: (updates: Partial<UserProgress>) => Promise<void>;
  updateUserRoles: (roles: string[]) => void;
  refreshUserProfile: () => void;
  markDocAsRead: (docId: string) => Promise<void>;
  unlockAchievement: (achievementId: string, points: number) => Promise<void>;
  saveProfileToFirebase: (data: Partial<UserProfileData>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default profile state
const DEFAULT_PROFILE_STATE: UserProfileState = {
  knownProfile: null,
  confirmedRoles: [],
  profileKey: null,
  isProfileLoaded: false,
};

// Helper to get saved profile data from localStorage
const getSavedProfileData = (): {
  profileKey: string;
  roles: string[];
} | null => {
  if (typeof window === "undefined") return null;
  try {
    const data = localStorage.getItem(PROFILE_DATA_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

// Helper to save profile data to localStorage
const saveProfileData = (profileKey: string | null, roles: string[]): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROFILE_DATA_KEY, JSON.stringify({ profileKey, roles }));
};

// Helper to detect profile for a user
const detectUserProfile = (
  email?: string | null,
  displayName?: string | null,
): { profile: UserProfile | null; profileKey: string | null } => {
  const profile = getKnownUserProfile(email, displayName);
  if (!profile) return { profile: null, profileKey: null };

  // Find the profile key
  for (const [key, p] of Object.entries(INTERNAL_USER_PROFILES)) {
    if (p.name === profile.name) {
      return { profile, profileKey: key };
    }
  }
  return { profile, profileKey: null };
};

// Helper to get local progress
const getLocalProgress = (): UserProgress => {
  if (typeof window === "undefined") {
    return {
      docs: {},
      achievements: {},
      stats: { totalPoints: 0, level: 1, streak: 0 },
    };
  }

  try {
    const docs = JSON.parse(localStorage.getItem(LOCAL_PROGRESS_KEY) || "{}");
    const achievements = JSON.parse(
      localStorage.getItem(LOCAL_ACHIEVEMENTS_KEY) || "{}",
    );
    const stats = JSON.parse(
      localStorage.getItem(LOCAL_STATS_KEY) ||
        '{"totalPoints":0,"level":1,"streak":0}',
    );

    return { docs, achievements, stats };
  } catch (error) {
    console.error("Error parsing local progress:", error);
    return {
      docs: {},
      achievements: {},
      stats: { totalPoints: 0, level: 1, streak: 0 },
    };
  }
};

// Helper to save local progress
const saveLocalProgress = (progress: UserProgress): void => {
  if (typeof window === "undefined") return;

  localStorage.setItem(LOCAL_PROGRESS_KEY, JSON.stringify(progress.docs));
  localStorage.setItem(
    LOCAL_ACHIEVEMENTS_KEY,
    JSON.stringify(progress.achievements),
  );
  localStorage.setItem(LOCAL_STATS_KEY, JSON.stringify(progress.stats));
};

// Merge cloud and local progress (cloud wins for conflicts, but keeps local-only data)
const mergeProgress = (
  cloud: UserProgress,
  local: UserProgress,
): UserProgress => {
  const mergedDocs = { ...local.docs };
  const mergedAchievements = { ...local.achievements };

  // Merge docs - keep the one with higher scroll progress or completed status
  for (const [docId, cloudDoc] of Object.entries(cloud.docs)) {
    const localDoc = mergedDocs[docId];
    if (!localDoc) {
      mergedDocs[docId] = cloudDoc;
    } else if (cloudDoc.completed && !localDoc.completed) {
      mergedDocs[docId] = cloudDoc;
    } else if (cloudDoc.scrollProgress > localDoc.scrollProgress) {
      mergedDocs[docId] = cloudDoc;
    }
  }

  // Merge achievements - keep all unlocked
  for (const [achId, cloudAch] of Object.entries(cloud.achievements)) {
    if (!mergedAchievements[achId]) {
      mergedAchievements[achId] = cloudAch;
    }
  }

  // Use cloud stats if higher, otherwise keep local
  const mergedStats = {
    totalPoints: Math.max(cloud.stats.totalPoints, local.stats.totalPoints),
    level: Math.max(cloud.stats.level, local.stats.level),
    streak: Math.max(cloud.stats.streak, local.stats.streak),
    lastVisit: cloud.stats.lastVisit || local.stats.lastVisit,
  };

  return {
    docs: mergedDocs,
    achievements: mergedAchievements,
    stats: mergedStats,
  };
};

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({
  children,
}: AuthProviderProps): React.ReactElement {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileState>(
    DEFAULT_PROFILE_STATE,
  );
  const isConfigured = isFirebaseConfigured();
  const missingConfig = getMissingFirebaseConfig();

  // Debug logging on mount
  useEffect(() => {
    console.log("[AuthContext] Provider mounted", {
      isConfigured,
      missingConfig,
      loading,
    });
  }, []);

  // Initialize with local progress
  useEffect(() => {
    console.log("[AuthContext] Initializing local progress");
    const localProgress = getLocalProgress();
    setProgress(localProgress);
  }, []);

  // Listen to auth state changes
  useEffect(() => {
    console.log("[AuthContext] Setting up auth listener", { isConfigured });
    if (!isConfigured) {
      console.log("[AuthContext] Firebase not configured, setting loading=false");
      setLoading(false);
      return;
    }

    let previousUser: User | null = null;

    const unsubscribe = onAuthChange(async (authUser) => {
      console.log("[AuthContext] Auth state changed", {
        authUser: authUser ? { uid: authUser.uid, email: authUser.email } : null,
        previousUser: previousUser ? { uid: previousUser.uid } : null,
      });
      const wasSignedOut = !previousUser && authUser;
      previousUser = authUser;
      setUser(authUser);

      if (authUser) {
        console.log("[AuthContext] User signed in, syncing progress...");
        // User signed in - sync progress
        const cloudProgress = await getUserProgress(authUser.uid);
        const localProgress = getLocalProgress();
        const merged = mergeProgress(cloudProgress, localProgress);

        // Check if this is a new user (no cloud progress = first sign in)
        const isNewUser = Object.keys(cloudProgress.docs).length === 0;

        setProgress(merged);
        saveLocalProgress(merged);

        // Save merged progress back to cloud
        await saveUserProgress(authUser.uid, merged);

        // Track signup/signin events
        if (wasSignedOut) {
          const method = authUser.providerData[0]?.providerId || "unknown";
          const authMethod = method.includes("google")
            ? "google"
            : method.includes("github")
              ? "github"
              : method;

          if (isNewUser) {
            // First time signup - track as new conversion
            await analytics.trackSignupCompleted(authUser.uid, authMethod);
          }
          // Could also track returning user sign-ins separately if needed
        }
        console.log("[AuthContext] User sync complete, setting loading=false");
      } else {
        console.log("[AuthContext] No user, setting loading=false");
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [isConfigured]);

  // Detect and load user profile when user changes
  useEffect(() => {
    if (!user) {
      // Reset profile when logged out
      setUserProfile(DEFAULT_PROFILE_STATE);
      return;
    }

    // Capture current user in a local const to ensure non-null in async closure
    const currentUser = user;

    // Async function to load and merge profile data
    async function loadUserProfile() {
      // Detect known profile from internal profiles
      const { profile, profileKey: detectedProfileKey } = detectUserProfile(
        currentUser.email,
        currentUser.displayName,
      );

      // Get local profile data from localStorage
      const localProfile = getSavedProfileData();

      // Fetch profile data from Firestore
      const cloudProfile = await getUserProfileData(currentUser.uid);

      // Merge strategy: Cloud wins for conflicts, but keep local-only data
      let mergedProfileKey: string | null = detectedProfileKey;
      let mergedRoles: string[] = [];

      if (cloudProfile) {
        // Cloud data exists - use cloud values as source of truth
        mergedProfileKey = cloudProfile.profileKey ?? detectedProfileKey;
        mergedRoles = cloudProfile.roles || [];
      }

      // If no cloud roles, fallback to local, then to detected profile defaults
      if (mergedRoles.length === 0) {
        if (localProfile?.roles && localProfile.roles.length > 0) {
          mergedRoles = localProfile.roles;
        } else if (profile) {
          mergedRoles = profile.roles;
        }
      }

      // Update localStorage with merged data for fast access
      saveProfileData(mergedProfileKey, mergedRoles);

      setUserProfile({
        knownProfile: profile,
        confirmedRoles: mergedRoles,
        profileKey: mergedProfileKey,
        isProfileLoaded: true,
      });
    }

    loadUserProfile();
  }, [user]);

  // Update user roles (called from ProfileConfirmation or Profile Settings)
  const updateUserRoles = useCallback(
    (roles: string[]) => {
      setUserProfile((prev) => ({
        ...prev,
        confirmedRoles: roles,
      }));
      saveProfileData(userProfile.profileKey, roles);
    },
    [userProfile.profileKey],
  );

  // Refresh user profile from localStorage (called after onboarding profile selection)
  const refreshUserProfile = useCallback(() => {
    if (!user) return;

    // Re-detect known profile
    const { profile, profileKey } = detectUserProfile(
      user.email,
      user.displayName,
    );

    // Get saved profile data (may have been updated by onboarding)
    const savedProfile = getSavedProfileData();

    // Determine the profile key to use - prefer saved if available
    const effectiveProfileKey = savedProfile?.profileKey || profileKey;

    // Determine roles: use saved roles if available, otherwise defaults from profile
    let confirmedRoles: string[] = [];
    if (savedProfile?.roles && savedProfile.roles.length > 0) {
      confirmedRoles = savedProfile.roles;
    } else if (profile) {
      confirmedRoles = profile.roles;
    }

    setUserProfile({
      knownProfile: profile,
      confirmedRoles,
      profileKey: effectiveProfileKey,
      isProfileLoaded: true,
    });
  }, [user]);

  const signInGoogle = useCallback(async () => {
    setLoading(true);
    const result = await signInWithGoogle();
    if (!result) {
      // Sign-in failed, reset loading state
      // Note: On success, the auth state listener will handle setLoading(false)
      setLoading(false);
    }
  }, []);

  const signInGithub = useCallback(async () => {
    setLoading(true);
    const result = await signInWithGithub();
    if (!result) {
      // Sign-in failed, reset loading state
      // Note: On success, the auth state listener will handle setLoading(false)
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut();
    setUser(null);
    // Keep local progress on logout
  }, []);

  const syncProgress = useCallback(async () => {
    if (!user || !progress) return;

    await saveUserProgress(user.uid, progress);
  }, [user, progress]);

  const updateProgress = useCallback(
    async (updates: Partial<UserProgress>) => {
      if (!progress) {
        console.warn("Cannot update progress: progress not initialized");
        return;
      }

      const newProgress = {
        ...progress,
        ...updates,
        docs: { ...progress.docs, ...updates.docs },
        achievements: { ...progress.achievements, ...updates.achievements },
        stats: { ...progress.stats, ...updates.stats },
      } as UserProgress;

      setProgress(newProgress);
      saveLocalProgress(newProgress);

      if (user) {
        // If offline, queue the update for later
        if (!isOnline()) {
          queueUpdate({
            type: "progress",
            data: { userId: user.uid, progress: newProgress },
          });
          return;
        }

        // Online - save directly
        await saveUserProgress(user.uid, newProgress);
      }
    },
    [progress, user],
  );

  // Sync queued updates when coming back online
  const syncQueuedUpdates = useCallback(async () => {
    if (!user || !isOnline()) return;

    const queue = getQueuedUpdates();

    // Sync progress updates
    const progressUpdates = queue.filter((item) => item.type === "progress");
    for (const update of progressUpdates) {
      try {
        const data = update.data as { userId: string; progress: UserProgress };
        if (data.userId === user.uid) {
          await saveUserProgress(user.uid, data.progress);
          removeFromQueue(update.id);
        }
      } catch (error) {
        console.error("Failed to sync queued progress update:", error);
      }
    }

    // Sync profile updates
    const profileUpdates = queue.filter((item) => item.type === "profile");
    for (const update of profileUpdates) {
      try {
        const data = update.data as {
          userId: string;
          profile: Partial<UserProfileData>;
        };
        if (data.userId === user.uid) {
          await updateUserProfileData(user.uid, data.profile);
          removeFromQueue(update.id);
        }
      } catch (error) {
        console.error("Failed to sync queued profile update:", error);
      }
    }
  }, [user]);

  // Listen for online events to sync queued updates
  useEffect(() => {
    const handleOnline = () => {
      syncQueuedUpdates();
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [syncQueuedUpdates]);

  const markDocAsRead = useCallback(
    async (docId: string) => {
      const now = new Date().toISOString();
      const currentDoc = progress?.docs[docId] || {
        scrollProgress: 0,
        completed: false,
      };

      await updateProgress({
        docs: {
          [docId]: {
            ...currentDoc,
            completed: true,
            completedAt: now,
            scrollProgress: 100,
          },
        },
      });
    },
    [progress, updateProgress],
  );

  const unlockAchievement = useCallback(
    async (achievementId: string, points: number) => {
      if (progress?.achievements[achievementId]) return; // Already unlocked

      const now = new Date().toISOString();
      const newTotalPoints = (progress?.stats.totalPoints || 0) + points;
      const newLevel = Math.floor(newTotalPoints / 100) + 1;

      await updateProgress({
        achievements: {
          [achievementId]: { unlockedAt: now },
        },
        stats: {
          totalPoints: newTotalPoints,
          level: newLevel,
          streak: progress?.stats.streak || 0,
        },
      });
    },
    [progress, updateProgress],
  );

  // Save user profile data to Firebase
  const saveProfileToFirebase = useCallback(
    async (data: Partial<UserProfileData>): Promise<boolean> => {
      if (!user) {
        console.warn("Cannot save profile: user not authenticated");
        return false;
      }

      // If offline, queue the update for later
      if (!isOnline()) {
        queueUpdate({
          type: "profile",
          data: { userId: user.uid, profile: data },
        });
        return true; // Queued successfully
      }

      // Online - save directly to Firebase
      const success = await updateUserProfileData(user.uid, data);

      if (success) {
        // Also update local storage for faster access
        const savedProfile = getSavedProfileData();
        if (data.profileKey !== undefined || data.roles !== undefined) {
          saveProfileData(
            data.profileKey ?? savedProfile?.profileKey ?? null,
            data.roles ?? savedProfile?.roles ?? [],
          );
        }
      }

      return success;
    },
    [user],
  );

  const value: AuthContextType = {
    user,
    loading,
    isConfigured,
    missingConfig,
    progress,
    userProfile,
    signInGoogle,
    signInGithub,
    logout,
    syncProgress,
    updateProgress,
    updateUserRoles,
    refreshUserProfile,
    markDocAsRead,
    unlockAchievement,
    saveProfileToFirebase,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
