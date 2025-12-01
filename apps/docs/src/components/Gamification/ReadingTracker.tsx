import { useEffect, useCallback, useRef } from "react";
import { useLocation } from "@docusaurus/router";
import { useAuth } from "../../contexts/AuthContext";
import { useAchievements } from "./Achievements";
import {
  emitDocumentCompletion,
  emitReadingChallenge,
} from "./CompletionToast";

/**
 * ReadingTracker component automatically tracks user progress through documentation pages.
 * It monitors:
 * - Scroll position (basic tracking)
 * - Time spent actively reading (page visible and focused)
 * - Estimated reading time vs actual time (engagement verification)
 *
 * If a user scrolls to 90%+ but hasn't spent enough time, they get a challenge
 * instead of automatic completion credit.
 *
 * Progress is synced to cloud when user is authenticated, otherwise saved locally.
 */

// Time tracking constants
const TIME_UPDATE_INTERVAL = 5000; // Update every 5 seconds
const MIN_TIME_UPDATE = 1000; // Minimum 1 second before recording

// Reading speed assumptions (words per minute)
const SLOW_READER_WPM = 150; // Minimum expected reading speed
const AVG_READER_WPM = 200; // Average reading speed
const FAST_READER_WPM = 300; // Fast reader (skimming acceptable)

// Engagement thresholds
const MIN_ENGAGEMENT_RATIO = 0.25; // Must spend at least 25% of expected reading time
const GOOD_ENGAGEMENT_RATIO = 0.5; // 50%+ is considered good engagement
const EXCELLENT_ENGAGEMENT_RATIO = 0.75; // 75%+ is excellent engagement

// Calculate expected reading time for a document (in milliseconds)
function calculateExpectedReadingTime(wordCount: number): {
  minimum: number;
  average: number;
  fast: number;
} {
  return {
    minimum: (wordCount / SLOW_READER_WPM) * 60 * 1000,
    average: (wordCount / AVG_READER_WPM) * 60 * 1000,
    fast: (wordCount / FAST_READER_WPM) * 60 * 1000,
  };
}

// Estimate word count from document content
function estimateWordCount(): number {
  if (typeof document === "undefined") return 1000; // Default estimate

  const articleContent = document.querySelector("article");
  if (!articleContent) return 1000;

  // Get text content, excluding code blocks and metadata
  const textContent =
    articleContent.innerText || articleContent.textContent || "";
  const words = textContent.trim().split(/\s+/).filter(Boolean);

  return Math.max(words.length, 100); // At least 100 words
}

export function ReadingTracker(): null {
  const location = useLocation();
  const { progress, updateProgress } = useAuth();
  const { checkAndUnlockAchievements } = useAchievements();
  const lastAchievementCheckRef = useRef<number>(0);

  // Time tracking refs
  const isActiveRef = useRef(true);
  const lastActiveTimeRef = useRef(Date.now());
  const accumulatedTimeRef = useRef(0);
  const totalSessionTimeRef = useRef(0); // Total time for this doc session
  const currentDocIdRef = useRef<string | null>(null);
  const wordCountRef = useRef<number>(0);
  const hasShownChallengeRef = useRef<Set<string>>(new Set());
  const scrollCompletedRef = useRef(false);

  // Check if user has engaged enough to earn completion credit
  const checkEngagement = useCallback(
    (
      docId: string,
      timeSpentMs: number,
    ): {
      isEngaged: boolean;
      engagementRatio: number;
      expectedTime: number;
      message: string;
    } => {
      const wordCount = wordCountRef.current || estimateWordCount();
      const expectedTimes = calculateExpectedReadingTime(wordCount);

      // Use the "fast reader" time as minimum baseline
      const minimumTime = expectedTimes.fast * MIN_ENGAGEMENT_RATIO;
      const engagementRatio = timeSpentMs / expectedTimes.average;

      if (timeSpentMs >= minimumTime) {
        if (engagementRatio >= EXCELLENT_ENGAGEMENT_RATIO) {
          return {
            isEngaged: true,
            engagementRatio,
            expectedTime: expectedTimes.average,
            message:
              "Excellent reading! You thoroughly engaged with this content.",
          };
        } else if (engagementRatio >= GOOD_ENGAGEMENT_RATIO) {
          return {
            isEngaged: true,
            engagementRatio,
            expectedTime: expectedTimes.average,
            message: "Good reading pace. Content completed!",
          };
        } else {
          return {
            isEngaged: true,
            engagementRatio,
            expectedTime: expectedTimes.average,
            message: "Quick read! Document marked as complete.",
          };
        }
      }

      // Not enough engagement
      const timeNeeded = Math.ceil((minimumTime - timeSpentMs) / 1000);
      return {
        isEngaged: false,
        engagementRatio,
        expectedTime: expectedTimes.average,
        message: `You scrolled through in ${Math.round(timeSpentMs / 1000)}s, but this document needs at least ${Math.ceil(minimumTime / 1000)}s to read. Spend ${timeNeeded} more seconds to earn credit.`,
      };
    },
    [],
  );

  // Update time spent on a document
  const updateTimeSpent = useCallback(
    async (docId: string, additionalMs: number) => {
      if (!progress || additionalMs < MIN_TIME_UPDATE) return;

      const currentDoc = progress.docs[docId] || {
        scrollProgress: 0,
        completed: false,
        timeSpentMs: 0,
      };

      const newTimeSpent = (currentDoc.timeSpentMs || 0) + additionalMs;
      const totalTimeSpent =
        (progress.stats.totalTimeSpentMs || 0) + additionalMs;
      await updateProgress({
        docs: {
          [docId]: {
            ...currentDoc,
            timeSpentMs: newTimeSpent,
            lastReadAt: new Date().toISOString(),
          },
        },
        stats: {
          ...progress.stats,
          totalTimeSpentMs: totalTimeSpent,
        },
      });
    },
    [progress, updateProgress],
  );

  // Update scroll progress for a document with engagement verification
  const updateScrollProgress = useCallback(
    async (docId: string, scrollPercent: number) => {
      if (!progress) return;

      const currentDoc = progress.docs[docId] || {
        scrollProgress: 0,
        completed: false,
        timeSpentMs: 0,
      };

      // Only update if scroll progress increased
      if (scrollPercent > currentDoc.scrollProgress) {
        const reachedEnd = scrollPercent >= 90;
        const wasAlreadyCompleted = currentDoc.completed;

        // If reaching end for first time, check engagement
        if (reachedEnd && !wasAlreadyCompleted && !scrollCompletedRef.current) {
          scrollCompletedRef.current = true;

          const totalTime =
            totalSessionTimeRef.current + (currentDoc.timeSpentMs || 0);
          const engagement = checkEngagement(docId, totalTime);

          if (engagement.isEngaged) {
            // User has engaged enough - grant completion
            await updateProgress({
              docs: {
                [docId]: {
                  ...currentDoc,
                  scrollProgress: scrollPercent,
                  completed: true,
                  completedAt: new Date().toISOString(),
                },
              },
            });

            // Show success toast and check achievements
            const now = Date.now();
            if (now - lastAchievementCheckRef.current > 1000) {
              lastAchievementCheckRef.current = now;
              const completedCount =
                Object.values(progress.docs).filter((d) => d.completed).length +
                1;
              checkAndUnlockAchievements(completedCount);

              emitDocumentCompletion({
                docId,
                title: docId,
                completedAt: new Date().toISOString(),
                message: engagement.message,
              });
            }
          } else {
            // Not enough engagement - show challenge
            if (!hasShownChallengeRef.current.has(docId)) {
              hasShownChallengeRef.current.add(docId);

              emitReadingChallenge({
                docId,
                title: docId,
                timeSpent: totalTime,
                expectedTime: engagement.expectedTime,
                message: engagement.message,
              });
            }

            // Still update scroll progress but don't mark complete
            await updateProgress({
              docs: {
                [docId]: {
                  ...currentDoc,
                  scrollProgress: scrollPercent,
                  completed: false,
                },
              },
            });
          }
        } else if (!reachedEnd) {
          // Normal scroll progress update
          await updateProgress({
            docs: {
              [docId]: {
                ...currentDoc,
                scrollProgress: scrollPercent,
              },
            },
          });
        }
      }
    },
    [progress, updateProgress, checkAndUnlockAchievements, checkEngagement],
  );

  // Effect for time tracking
  useEffect(() => {
    // Only track docs pages
    if (!location.pathname.startsWith("/docs/")) {
      return;
    }

    const docId = location.pathname.replace(/^\/docs\//, "").replace(/\/$/, "");

    // Reset time tracking for new doc
    currentDocIdRef.current = docId;
    isActiveRef.current = !document.hidden;
    lastActiveTimeRef.current = Date.now();
    accumulatedTimeRef.current = 0;
    totalSessionTimeRef.current = 0;
    scrollCompletedRef.current = false;

    // Estimate word count after DOM is ready
    requestAnimationFrame(() => {
      wordCountRef.current = estimateWordCount();
    });

    // Handle visibility change
    const handleVisibilityChange = () => {
      const now = Date.now();

      if (document.hidden) {
        // Page became hidden - accumulate time if was active
        if (isActiveRef.current) {
          const elapsed = now - lastActiveTimeRef.current;
          accumulatedTimeRef.current += elapsed;
          totalSessionTimeRef.current += elapsed;
        }
        isActiveRef.current = false;
      } else {
        // Page became visible - reset active time
        isActiveRef.current = true;
        lastActiveTimeRef.current = now;
      }
    };

    // Handle window focus/blur
    const handleFocus = () => {
      isActiveRef.current = true;
      lastActiveTimeRef.current = Date.now();
    };

    const handleBlur = () => {
      const now = Date.now();
      if (isActiveRef.current) {
        const elapsed = now - lastActiveTimeRef.current;
        accumulatedTimeRef.current += elapsed;
        totalSessionTimeRef.current += elapsed;
      }
      isActiveRef.current = false;
    };

    // Periodic time update
    const timeInterval = setInterval(() => {
      if (!currentDocIdRef.current) return;

      const now = Date.now();
      let timeToRecord = accumulatedTimeRef.current;

      if (isActiveRef.current) {
        const elapsed = now - lastActiveTimeRef.current;
        timeToRecord += elapsed;
        totalSessionTimeRef.current += elapsed;
        lastActiveTimeRef.current = now;
      }

      // Reset accumulated time
      accumulatedTimeRef.current = 0;

      if (timeToRecord >= MIN_TIME_UPDATE) {
        updateTimeSpent(currentDocIdRef.current, timeToRecord);
      }
    }, TIME_UPDATE_INTERVAL);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    // Cleanup - save remaining time
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
      clearInterval(timeInterval);

      // Save any remaining accumulated time
      const now = Date.now();
      let finalTime = accumulatedTimeRef.current;
      if (isActiveRef.current) {
        finalTime += now - lastActiveTimeRef.current;
      }
      if (finalTime >= MIN_TIME_UPDATE && currentDocIdRef.current) {
        updateTimeSpent(currentDocIdRef.current, finalTime);
      }
    };
  }, [location.pathname, updateTimeSpent]);

  // Effect for scroll tracking
  useEffect(() => {
    // Only track docs pages
    if (!location.pathname.startsWith("/docs/")) {
      return;
    }

    // Extract doc ID from pathname
    const docId = location.pathname.replace(/^\/docs\//, "").replace(/\/$/, "");

    let ticking = false;

    const trackScrollPosition = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const trackableHeight = documentHeight - windowHeight;

      if (trackableHeight <= 0) {
        // Page is too short to scroll, mark as 100%
        updateScrollProgress(docId, 100);
        return;
      }

      const scrollPercent = Math.min(
        100,
        Math.round((scrollTop / trackableHeight) * 100),
      );

      updateScrollProgress(docId, scrollPercent);
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(trackScrollPosition);
        ticking = true;
      }
    };

    // Initial progress update
    trackScrollPosition();

    // Listen for scroll events
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Cleanup
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [location.pathname, updateScrollProgress]);

  return null;
}
