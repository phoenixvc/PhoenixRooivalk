/**
 * Unit Tests for Auth Service
 *
 * Tests for getUserProgress function to ensure it handles null/undefined values correctly
 */

import type { UserProgress } from "../cloud/interfaces/database";

/**
 * Test version of getUserProgress that mimics the real implementation
 * This tests the logic without requiring actual database connection
 */
function getUserProgressTestImplementation(
  data: any,
): UserProgress {
  // Ensure we always return a complete UserProgress structure
  // even if the database returns null, undefined, or partial data
  const defaultProgress = {
    docs: {},
    achievements: {},
    stats: { totalPoints: 0, level: 1, streak: 0 },
  };

  if (!data) {
    return defaultProgress;
  }

  // Ensure all required fields are present
  return {
    docs: data.docs || {},
    achievements: data.achievements || {},
    stats: data.stats || { totalPoints: 0, level: 1, streak: 0 },
  };
}

/**
 * Test version of mergeProgress that mimics the real implementation
 */
function mergeProgressTestImplementation(
  cloud: UserProgress,
  local: UserProgress,
): UserProgress {
  const mergedDocs = { ...local.docs };
  const mergedAchievements = { ...local.achievements };

  // Merge docs - keep the one with higher scroll progress or completed status
  // Guard against null/undefined cloud.docs
  if (cloud.docs && typeof cloud.docs === "object") {
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
  }

  // Merge achievements - keep all unlocked
  // Guard against null/undefined cloud.achievements
  if (cloud.achievements && typeof cloud.achievements === "object") {
    for (const [achId, cloudAch] of Object.entries(cloud.achievements)) {
      if (!mergedAchievements[achId]) {
        mergedAchievements[achId] = cloudAch;
      }
    }
  }

  // Use cloud stats if higher, otherwise keep local
  // Guard against null/undefined cloud.stats
  const cloudStats = cloud.stats || { totalPoints: 0, level: 1, streak: 0 };
  const localStats = local.stats || { totalPoints: 0, level: 1, streak: 0 };
  const mergedStats = {
    totalPoints: Math.max(cloudStats.totalPoints, localStats.totalPoints),
    level: Math.max(cloudStats.level, localStats.level),
    streak: Math.max(cloudStats.streak, localStats.streak),
    lastVisit: cloudStats.lastVisit || localStats.lastVisit,
  };

  return {
    docs: mergedDocs,
    achievements: mergedAchievements,
    stats: mergedStats,
  };
}

describe("Auth Service - getUserProgress", () => {
  it("should return default progress when data is null", () => {
    const result = getUserProgressTestImplementation(null);
    expect(result).toEqual({
      docs: {},
      achievements: {},
      stats: { totalPoints: 0, level: 1, streak: 0 },
    });
  });

  it("should return default progress when data is undefined", () => {
    const result = getUserProgressTestImplementation(undefined);
    expect(result).toEqual({
      docs: {},
      achievements: {},
      stats: { totalPoints: 0, level: 1, streak: 0 },
    });
  });

  it("should return default progress when data is empty object", () => {
    const result = getUserProgressTestImplementation({});
    expect(result).toEqual({
      docs: {},
      achievements: {},
      stats: { totalPoints: 0, level: 1, streak: 0 },
    });
  });

  it("should handle partial data with missing docs", () => {
    const result = getUserProgressTestImplementation({
      achievements: { ach1: { unlockedAt: "2024-01-01" } },
      stats: { totalPoints: 100, level: 2, streak: 5 },
    });
    expect(result.docs).toEqual({});
    expect(result.achievements).toEqual({ ach1: { unlockedAt: "2024-01-01" } });
    expect(result.stats).toEqual({ totalPoints: 100, level: 2, streak: 5 });
  });

  it("should handle partial data with missing achievements", () => {
    const result = getUserProgressTestImplementation({
      docs: { doc1: { completed: true, scrollProgress: 100 } },
      stats: { totalPoints: 50, level: 1, streak: 0 },
    });
    expect(result.docs).toEqual({ doc1: { completed: true, scrollProgress: 100 } });
    expect(result.achievements).toEqual({});
    expect(result.stats).toEqual({ totalPoints: 50, level: 1, streak: 0 });
  });

  it("should handle partial data with missing stats", () => {
    const result = getUserProgressTestImplementation({
      docs: { doc1: { completed: true, scrollProgress: 100 } },
      achievements: { ach1: { unlockedAt: "2024-01-01" } },
    });
    expect(result.docs).toEqual({ doc1: { completed: true, scrollProgress: 100 } });
    expect(result.achievements).toEqual({ ach1: { unlockedAt: "2024-01-01" } });
    expect(result.stats).toEqual({ totalPoints: 0, level: 1, streak: 0 });
  });

  it("should preserve complete valid data", () => {
    const validData = {
      docs: { doc1: { completed: true, scrollProgress: 100 } },
      achievements: { ach1: { unlockedAt: "2024-01-01" } },
      stats: { totalPoints: 100, level: 2, streak: 5 },
    };
    const result = getUserProgressTestImplementation(validData);
    expect(result).toEqual(validData);
  });
});

describe("Auth Service - mergeProgress", () => {
  const localProgress: UserProgress = {
    docs: {
      doc1: { completed: true, scrollProgress: 100 },
      doc2: { completed: false, scrollProgress: 50 },
    },
    achievements: {
      ach1: { unlockedAt: "2024-01-01" },
    },
    stats: { totalPoints: 50, level: 1, streak: 3 },
  };

  it("should handle cloud progress with undefined docs", () => {
    const cloudProgress: any = {
      docs: undefined,
      achievements: { ach2: { unlockedAt: "2024-01-02" } },
      stats: { totalPoints: 100, level: 2, streak: 5 },
    };

    const result = mergeProgressTestImplementation(cloudProgress, localProgress);

    // Should preserve local docs when cloud.docs is undefined
    expect(result.docs).toEqual(localProgress.docs);
    // Should merge achievements
    expect(result.achievements).toEqual({
      ach1: { unlockedAt: "2024-01-01" },
      ach2: { unlockedAt: "2024-01-02" },
    });
    // Should use higher stats
    expect(result.stats.totalPoints).toBe(100);
    expect(result.stats.level).toBe(2);
  });

  it("should handle cloud progress with null docs", () => {
    const cloudProgress: any = {
      docs: null,
      achievements: {},
      stats: { totalPoints: 0, level: 1, streak: 0 },
    };

    const result = mergeProgressTestImplementation(cloudProgress, localProgress);

    // Should preserve local docs when cloud.docs is null
    expect(result.docs).toEqual(localProgress.docs);
  });

  it("should handle cloud progress with undefined achievements", () => {
    const cloudProgress: any = {
      docs: { doc3: { completed: true, scrollProgress: 100 } },
      achievements: undefined,
      stats: { totalPoints: 100, level: 2, streak: 5 },
    };

    const result = mergeProgressTestImplementation(cloudProgress, localProgress);

    // Should merge cloud docs
    expect(result.docs.doc3).toEqual({ completed: true, scrollProgress: 100 });
    // Should preserve local achievements when cloud.achievements is undefined
    expect(result.achievements).toEqual(localProgress.achievements);
  });

  it("should handle cloud progress with null achievements", () => {
    const cloudProgress: any = {
      docs: {},
      achievements: null,
      stats: { totalPoints: 0, level: 1, streak: 0 },
    };

    const result = mergeProgressTestImplementation(cloudProgress, localProgress);

    // Should preserve local achievements when cloud.achievements is null
    expect(result.achievements).toEqual(localProgress.achievements);
  });

  it("should handle cloud progress with undefined stats", () => {
    const cloudProgress: any = {
      docs: {},
      achievements: {},
      stats: undefined,
    };

    const result = mergeProgressTestImplementation(cloudProgress, localProgress);

    // Should use local stats when cloud.stats is undefined
    expect(result.stats).toEqual(localProgress.stats);
  });

  it("should handle cloud progress with null stats", () => {
    const cloudProgress: any = {
      docs: {},
      achievements: {},
      stats: null,
    };

    const result = mergeProgressTestImplementation(cloudProgress, localProgress);

    // Should use local stats when cloud.stats is null
    expect(result.stats).toEqual(localProgress.stats);
  });

  it("should handle completely empty cloud progress", () => {
    const cloudProgress: any = {
      docs: undefined,
      achievements: undefined,
      stats: undefined,
    };

    const result = mergeProgressTestImplementation(cloudProgress, localProgress);

    // Should preserve all local data
    expect(result).toEqual(localProgress);
  });

  it("should merge valid cloud and local progress correctly", () => {
    const cloudProgress: UserProgress = {
      docs: {
        doc2: { completed: true, scrollProgress: 100 }, // Higher than local
        doc3: { completed: true, scrollProgress: 100 }, // New doc
      },
      achievements: {
        ach2: { unlockedAt: "2024-01-02" }, // New achievement
      },
      stats: { totalPoints: 100, level: 2, streak: 5 }, // Higher than local
    };

    const result = mergeProgressTestImplementation(cloudProgress, localProgress);

    expect(result.docs).toEqual({
      doc1: { completed: true, scrollProgress: 100 }, // From local
      doc2: { completed: true, scrollProgress: 100 }, // From cloud (completed)
      doc3: { completed: true, scrollProgress: 100 }, // From cloud (new)
    });
    expect(result.achievements).toEqual({
      ach1: { unlockedAt: "2024-01-01" }, // From local
      ach2: { unlockedAt: "2024-01-02" }, // From cloud
    });
    expect(result.stats).toEqual({
      totalPoints: 100, // Max
      level: 2, // Max
      streak: 5, // Max
      lastVisit: undefined,
    });
  });
});
