import * as React from "react";
import { useEffect, useState } from "react";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "reading" | "exploration" | "expertise" | "special";
  requirement: {
    type: "docs_read" | "category_complete" | "time_spent" | "streak";
    value: number;
    category?: string;
  };
  points: number;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
}

export const ACHIEVEMENTS: Achievement[] = [
  // Reading achievements
  {
    id: "first-read",
    name: "First Steps",
    description: "Read your first document",
    icon: "👣",
    category: "reading",
    requirement: { type: "docs_read", value: 1 },
    points: 10,
    rarity: "common",
  },
  {
    id: "curious-mind",
    name: "Curious Mind",
    description: "Read 5 documents",
    icon: "🔍",
    category: "reading",
    requirement: { type: "docs_read", value: 5 },
    points: 25,
    rarity: "common",
  },
  {
    id: "knowledge-seeker",
    name: "Knowledge Seeker",
    description: "Read 15 documents",
    icon: "📖",
    category: "reading",
    requirement: { type: "docs_read", value: 15 },
    points: 50,
    rarity: "uncommon",
  },
  {
    id: "doc-devourer",
    name: "Doc Devourer",
    description: "Read 30 documents",
    icon: "📚",
    category: "reading",
    requirement: { type: "docs_read", value: 30 },
    points: 100,
    rarity: "rare",
  },
  {
    id: "documentation-master",
    name: "Documentation Master",
    description: "Read 50 documents",
    icon: "🎓",
    category: "reading",
    requirement: { type: "docs_read", value: 50 },
    points: 200,
    rarity: "epic",
  },
  {
    id: "omniscient",
    name: "Omniscient",
    description: "Read all 100+ documents",
    icon: "🌟",
    category: "reading",
    requirement: { type: "docs_read", value: 100 },
    points: 500,
    rarity: "legendary",
  },

  // Category completion achievements
  {
    id: "executive-expert",
    name: "Executive Expert",
    description: "Complete all Executive documentation",
    icon: "📊",
    category: "expertise",
    requirement: { type: "category_complete", value: 1, category: "executive" },
    points: 75,
    rarity: "uncommon",
  },
  {
    id: "tech-guru",
    name: "Tech Guru",
    description: "Complete all Technical documentation",
    icon: "💻",
    category: "expertise",
    requirement: { type: "category_complete", value: 1, category: "technical" },
    points: 150,
    rarity: "rare",
  },
  {
    id: "business-brain",
    name: "Business Brain",
    description: "Complete all Business documentation",
    icon: "💼",
    category: "expertise",
    requirement: { type: "category_complete", value: 1, category: "business" },
    points: 100,
    rarity: "rare",
  },
  {
    id: "legal-eagle",
    name: "Legal Eagle",
    description: "Complete all Legal documentation",
    icon: "⚖️",
    category: "expertise",
    requirement: { type: "category_complete", value: 1, category: "legal" },
    points: 50,
    rarity: "uncommon",
  },
  {
    id: "ops-operator",
    name: "Ops Operator",
    description: "Complete all Operations documentation",
    icon: "🚀",
    category: "expertise",
    requirement: { type: "category_complete", value: 1, category: "operations" },
    points: 100,
    rarity: "rare",
  },
  {
    id: "research-ranger",
    name: "Research Ranger",
    description: "Complete all Research documentation",
    icon: "🔬",
    category: "expertise",
    requirement: { type: "category_complete", value: 1, category: "research" },
    points: 125,
    rarity: "rare",
  },

  // Special achievements
  {
    id: "early-bird",
    name: "Early Bird",
    description: "Read documentation before 7 AM",
    icon: "🌅",
    category: "special",
    requirement: { type: "time_spent", value: 1 },
    points: 25,
    rarity: "uncommon",
  },
  {
    id: "night-owl",
    name: "Night Owl",
    description: "Read documentation after 11 PM",
    icon: "🦉",
    category: "special",
    requirement: { type: "time_spent", value: 1 },
    points: 25,
    rarity: "uncommon",
  },
  {
    id: "weekend-warrior",
    name: "Weekend Warrior",
    description: "Read documentation on a weekend",
    icon: "⚔️",
    category: "special",
    requirement: { type: "time_spent", value: 1 },
    points: 25,
    rarity: "uncommon",
  },
  {
    id: "streak-starter",
    name: "Streak Starter",
    description: "Read docs 3 days in a row",
    icon: "🔥",
    category: "exploration",
    requirement: { type: "streak", value: 3 },
    points: 50,
    rarity: "uncommon",
  },
  {
    id: "on-fire",
    name: "On Fire",
    description: "Read docs 7 days in a row",
    icon: "🔥🔥",
    category: "exploration",
    requirement: { type: "streak", value: 7 },
    points: 100,
    rarity: "rare",
  },
  {
    id: "unstoppable",
    name: "Unstoppable",
    description: "Read docs 14 days in a row",
    icon: "💪",
    category: "exploration",
    requirement: { type: "streak", value: 14 },
    points: 200,
    rarity: "epic",
  },
];

const ACHIEVEMENTS_STORAGE_KEY = "phoenix-docs-achievements";

interface AchievementProgress {
  unlockedAchievements: string[];
  totalPoints: number;
  currentStreak: number;
  lastReadDate?: string;
}

export function useAchievements() {
  const [achievementProgress, setAchievementProgress] =
    useState<AchievementProgress>({
      unlockedAchievements: [],
      totalPoints: 0,
      currentStreak: 0,
    });
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(
    null
  );

  useEffect(() => {
    const stored = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
    if (stored) {
      setAchievementProgress(JSON.parse(stored));
    }
  }, []);

  const unlockAchievement = (achievementId: string) => {
    const achievement = ACHIEVEMENTS.find((a) => a.id === achievementId);
    if (
      !achievement ||
      achievementProgress.unlockedAchievements.includes(achievementId)
    ) {
      return;
    }

    const newProgress = {
      ...achievementProgress,
      unlockedAchievements: [
        ...achievementProgress.unlockedAchievements,
        achievementId,
      ],
      totalPoints: achievementProgress.totalPoints + achievement.points,
    };

    setAchievementProgress(newProgress);
    localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(newProgress));
    setNewAchievement(achievement);

    // Auto-dismiss after 5 seconds
    setTimeout(() => setNewAchievement(null), 5000);
  };

  const checkAndUnlockAchievements = (docsReadCount: number) => {
    ACHIEVEMENTS.forEach((achievement) => {
      if (achievementProgress.unlockedAchievements.includes(achievement.id)) {
        return;
      }

      if (
        achievement.requirement.type === "docs_read" &&
        docsReadCount >= achievement.requirement.value
      ) {
        unlockAchievement(achievement.id);
      }
    });

    // Check time-based achievements
    const hour = new Date().getHours();
    const day = new Date().getDay();

    if (hour < 7 && !achievementProgress.unlockedAchievements.includes("early-bird")) {
      unlockAchievement("early-bird");
    }
    if (hour >= 23 && !achievementProgress.unlockedAchievements.includes("night-owl")) {
      unlockAchievement("night-owl");
    }
    if (
      (day === 0 || day === 6) &&
      !achievementProgress.unlockedAchievements.includes("weekend-warrior")
    ) {
      unlockAchievement("weekend-warrior");
    }
  };

  const isUnlocked = (achievementId: string) => {
    return achievementProgress.unlockedAchievements.includes(achievementId);
  };

  const getLevel = () => {
    const points = achievementProgress.totalPoints;
    if (points >= 1000) return { level: 5, title: "Phoenix Master", icon: "🏆" };
    if (points >= 500) return { level: 4, title: "Expert", icon: "⭐" };
    if (points >= 200) return { level: 3, title: "Advanced", icon: "🎯" };
    if (points >= 50) return { level: 2, title: "Intermediate", icon: "📈" };
    return { level: 1, title: "Beginner", icon: "🌱" };
  };

  return {
    achievementProgress,
    newAchievement,
    unlockAchievement,
    checkAndUnlockAchievements,
    isUnlocked,
    getLevel,
    dismissNotification: () => setNewAchievement(null),
  };
}

// Achievement notification popup
export function AchievementNotification({
  achievement,
  onDismiss,
}: {
  achievement: Achievement;
  onDismiss: () => void;
}): React.ReactElement {
  return (
    <div className="achievement-notification" onClick={onDismiss}>
      <div className="achievement-notification-content">
        <div className="achievement-notification-icon">{achievement.icon}</div>
        <div className="achievement-notification-text">
          <div className="achievement-notification-title">
            Achievement Unlocked!
          </div>
          <div className="achievement-notification-name">{achievement.name}</div>
          <div className="achievement-notification-desc">
            {achievement.description}
          </div>
          <div className="achievement-notification-points">
            +{achievement.points} points
          </div>
        </div>
      </div>
      <div
        className={`achievement-notification-rarity achievement-rarity--${achievement.rarity}`}
      >
        {achievement.rarity}
      </div>
    </div>
  );
}

// Achievement badge display
export function AchievementBadge({
  achievement,
  unlocked,
}: {
  achievement: Achievement;
  unlocked: boolean;
}): React.ReactElement {
  return (
    <div
      className={`achievement-badge ${unlocked ? "achievement-badge--unlocked" : "achievement-badge--locked"}`}
      title={unlocked ? achievement.description : "???"}
    >
      <div className="achievement-badge-icon">
        {unlocked ? achievement.icon : "🔒"}
      </div>
      <div className="achievement-badge-name">
        {unlocked ? achievement.name : "???"}
      </div>
      {unlocked && (
        <div
          className={`achievement-badge-rarity achievement-rarity--${achievement.rarity}`}
        >
          {achievement.points} pts
        </div>
      )}
    </div>
  );
}

// Full achievements panel
export default function AchievementsPanel(): React.ReactElement {
  const { achievementProgress, isUnlocked, getLevel } = useAchievements();
  const levelInfo = getLevel();

  const categorizedAchievements = {
    reading: ACHIEVEMENTS.filter((a) => a.category === "reading"),
    expertise: ACHIEVEMENTS.filter((a) => a.category === "expertise"),
    exploration: ACHIEVEMENTS.filter((a) => a.category === "exploration"),
    special: ACHIEVEMENTS.filter((a) => a.category === "special"),
  };

  return (
    <div className="achievements-panel">
      <div className="achievements-header">
        <div className="achievements-level">
          <span className="achievements-level-icon">{levelInfo.icon}</span>
          <span className="achievements-level-title">{levelInfo.title}</span>
          <span className="achievements-level-number">Lvl {levelInfo.level}</span>
        </div>
        <div className="achievements-points">
          <span className="achievements-points-value">
            {achievementProgress.totalPoints}
          </span>
          <span className="achievements-points-label">Total Points</span>
        </div>
        <div className="achievements-count">
          <span className="achievements-count-value">
            {achievementProgress.unlockedAchievements.length}
          </span>
          <span className="achievements-count-label">
            / {ACHIEVEMENTS.length} Achievements
          </span>
        </div>
      </div>

      {Object.entries(categorizedAchievements).map(([category, achievements]) => (
        <div key={category} className="achievements-category">
          <h3 className="achievements-category-title">
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </h3>
          <div className="achievements-grid">
            {achievements.map((achievement) => (
              <AchievementBadge
                key={achievement.id}
                achievement={achievement}
                unlocked={isUnlocked(achievement.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
