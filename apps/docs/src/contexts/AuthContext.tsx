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
  onAuthChange,
  signInWithGoogle,
  signInWithGithub,
  signOut,
  getUserProgress,
  saveUserProgress,
  UserProgress,
} from "../services/firebase";
import { analytics } from "../services/analytics";

// Local storage keys
const LOCAL_PROGRESS_KEY = "phoenix-docs-progress";
const LOCAL_ACHIEVEMENTS_KEY = "phoenix-docs-achievements";
const LOCAL_STATS_KEY = "phoenix-docs-stats";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isConfigured: boolean;
  progress: UserProgress | null;
  signInGoogle: () => Promise<void>;
  signInGithub: () => Promise<void>;
  logout: () => Promise<void>;
  syncProgress: () => Promise<void>;
  updateProgress: (updates: Partial<UserProgress>) => Promise<void>;
  markDocAsRead: (docId: string) => Promise<void>;
  unlockAchievement: (achievementId: string, points: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
  const isConfigured = isFirebaseConfigured();

  // Initialize with local progress
  useEffect(() => {
    const localProgress = getLocalProgress();
    setProgress(localProgress);
  }, []);

  // Listen to auth state changes
  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }

    let previousUser: User | null = null;

    const unsubscribe = onAuthChange(async (authUser) => {
      const wasSignedOut = !previousUser && authUser;
      previousUser = authUser;
      setUser(authUser);

      if (authUser) {
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
          const authMethod = method.includes("google") ? "google" : method.includes("github") ? "github" : method;

          if (isNewUser) {
            // First time signup - track as new conversion
            await analytics.trackSignupCompleted(authUser.uid, authMethod);
          }
          // Could also track returning user sign-ins separately if needed
        }
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [isConfigured]);

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
        await saveUserProgress(user.uid, newProgress);
      }
    },
    [progress, user],
  );

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

  const value: AuthContextType = {
    user,
    loading,
    isConfigured,
    progress,
    signInGoogle,
    signInGithub,
    logout,
    syncProgress,
    updateProgress,
    markDocAsRead,
    unlockAchievement,
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
