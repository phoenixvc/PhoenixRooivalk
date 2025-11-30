/**
 * React Hooks for Cloud Services
 *
 * Provides React hooks for accessing cloud services and managing state.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getCloudServices,
  getCurrentProvider,
  switchProvider,
  CloudProvider,
  CloudServices,
} from './provider';
import { CloudUser } from './interfaces/types';
import { UserProgress, UserProfileData, DEFAULT_USER_PROGRESS } from './interfaces/database';

/**
 * Hook to get cloud services
 */
export function useCloudServices(): CloudServices {
  return useMemo(() => getCloudServices(), []);
}

/**
 * Hook to get current cloud provider
 */
export function useCloudProvider(): {
  provider: CloudProvider;
  switchTo: (provider: CloudProvider) => void;
} {
  const [provider, setProvider] = useState<CloudProvider>(getCurrentProvider());

  const switchTo = useCallback((newProvider: CloudProvider) => {
    switchProvider(newProvider);
    setProvider(newProvider);
    // Note: Full effect requires page reload
    window.location.reload();
  }, []);

  return { provider, switchTo };
}

/**
 * Hook for authentication state
 */
export function useCloudAuth(): {
  user: CloudUser | null;
  loading: boolean;
  isConfigured: boolean;
  signInWithGoogle: () => Promise<CloudUser | null>;
  signInWithGithub: () => Promise<CloudUser | null>;
  signInWithMicrosoft: () => Promise<CloudUser | null>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
} {
  const services = useCloudServices();
  const [user, setUser] = useState<CloudUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!services.auth.isConfigured()) {
      setLoading(false);
      return;
    }

    const unsubscribe = services.auth.onAuthStateChanged((authUser) => {
      setUser(authUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [services.auth]);

  const signInWithGoogle = useCallback(async () => {
    setLoading(true);
    const result = await services.auth.signInWithGoogle();
    if (!result) setLoading(false);
    return result;
  }, [services.auth]);

  const signInWithGithub = useCallback(async () => {
    setLoading(true);
    const result = await services.auth.signInWithGithub();
    if (!result) setLoading(false);
    return result;
  }, [services.auth]);

  const signInWithMicrosoft = useCallback(async () => {
    setLoading(true);
    const result = await services.auth.signInWithMicrosoft();
    if (!result) setLoading(false);
    return result;
  }, [services.auth]);

  const signOut = useCallback(async () => {
    await services.auth.signOut();
    setUser(null);
  }, [services.auth]);

  const isAdmin = useMemo(
    () => services.auth.isAdmin(user),
    [services.auth, user]
  );

  return {
    user,
    loading,
    isConfigured: services.auth.isConfigured(),
    signInWithGoogle,
    signInWithGithub,
    signInWithMicrosoft,
    signOut,
    isAdmin,
  };
}

/**
 * Hook for user progress
 */
export function useUserProgress(userId: string | null): {
  progress: UserProgress | null;
  loading: boolean;
  updateProgress: (updates: Partial<UserProgress>) => Promise<void>;
  markDocAsRead: (docId: string) => Promise<void>;
  unlockAchievement: (achievementId: string, points: number) => Promise<void>;
} {
  const services = useCloudServices();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);

  // Load progress from database
  useEffect(() => {
    if (!userId || !services.database.isConfigured()) {
      setProgress(getLocalProgress());
      setLoading(false);
      return;
    }

    const loadProgress = async () => {
      const dbProgress = await services.database.getDocument<UserProgress>(
        'userProgress',
        userId
      );

      if (dbProgress) {
        setProgress(dbProgress);
        saveLocalProgress(dbProgress);
      } else {
        const local = getLocalProgress();
        setProgress(local);
        // Create initial progress in database
        await services.database.setDocument('userProgress', userId, {
          ...local,
          updatedAt: services.database.getFieldOperations().serverTimestamp(),
        });
      }
      setLoading(false);
    };

    loadProgress();
  }, [userId, services.database]);

  const updateProgress = useCallback(
    async (updates: Partial<UserProgress>) => {
      if (!progress) return;

      const newProgress: UserProgress = {
        ...progress,
        ...updates,
        docs: { ...progress.docs, ...updates.docs },
        achievements: { ...progress.achievements, ...updates.achievements },
        stats: { ...progress.stats, ...updates.stats },
      };

      setProgress(newProgress);
      saveLocalProgress(newProgress);

      if (userId && services.database.isConfigured()) {
        await services.database.setDocument('userProgress', userId, {
          ...newProgress,
          updatedAt: services.database.getFieldOperations().serverTimestamp(),
        }, true);
      }
    },
    [progress, userId, services.database]
  );

  const markDocAsRead = useCallback(
    async (docId: string) => {
      const now = new Date().toISOString();
      const currentDoc = progress?.docs[docId] || { scrollProgress: 0, completed: false };

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
    [progress, updateProgress]
  );

  const unlockAchievement = useCallback(
    async (achievementId: string, points: number) => {
      if (progress?.achievements[achievementId]) return;

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
    [progress, updateProgress]
  );

  return {
    progress,
    loading,
    updateProgress,
    markDocAsRead,
    unlockAchievement,
  };
}

/**
 * Hook for analytics
 */
export function useCloudAnalytics(): {
  trackPageView: (pageUrl: string, pageTitle: string, userId?: string | null) => Promise<void>;
  trackEvent: (name: string, params?: Record<string, unknown>) => Promise<void>;
  updateScrollDepth: (depth: number) => void;
} {
  const services = useCloudServices();

  const trackPageView = useCallback(
    async (pageUrl: string, pageTitle: string, userId?: string | null) => {
      await services.analytics.trackPageView({
        pageUrl,
        pageTitle,
        userId,
        sessionId: services.analytics.getSessionId(),
        isAuthenticated: Boolean(userId),
        referrer: typeof document !== 'undefined' ? document.referrer : undefined,
        screenWidth: typeof window !== 'undefined' ? window.innerWidth : undefined,
        screenHeight: typeof window !== 'undefined' ? window.innerHeight : undefined,
      });
    },
    [services.analytics]
  );

  const trackEvent = useCallback(
    async (name: string, params?: Record<string, unknown>) => {
      await services.analytics.trackEvent({ name, params });
    },
    [services.analytics]
  );

  const updateScrollDepth = useCallback(
    (depth: number) => {
      services.analytics.updateScrollDepth(depth);
    },
    [services.analytics]
  );

  return { trackPageView, trackEvent, updateScrollDepth };
}

// ============================================================================
// Local Storage Helpers
// ============================================================================

const LOCAL_PROGRESS_KEY = 'phoenix-docs-progress';
const LOCAL_ACHIEVEMENTS_KEY = 'phoenix-docs-achievements';
const LOCAL_STATS_KEY = 'phoenix-docs-stats';

function getLocalProgress(): UserProgress {
  if (typeof window === 'undefined') {
    return DEFAULT_USER_PROGRESS;
  }

  try {
    const docs = JSON.parse(localStorage.getItem(LOCAL_PROGRESS_KEY) || '{}');
    const achievements = JSON.parse(localStorage.getItem(LOCAL_ACHIEVEMENTS_KEY) || '{}');
    const stats = JSON.parse(
      localStorage.getItem(LOCAL_STATS_KEY) || '{"totalPoints":0,"level":1,"streak":0}'
    );

    return { docs, achievements, stats };
  } catch {
    return DEFAULT_USER_PROGRESS;
  }
}

function saveLocalProgress(progress: UserProgress): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem(LOCAL_PROGRESS_KEY, JSON.stringify(progress.docs));
  localStorage.setItem(LOCAL_ACHIEVEMENTS_KEY, JSON.stringify(progress.achievements));
  localStorage.setItem(LOCAL_STATS_KEY, JSON.stringify(progress.stats));
}
