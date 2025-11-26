/**
 * Gamification and metadata fields for documentation pages
 */
export interface DocFrontmatter {
  /** Unique identifier for the document */
  id?: string;
  /** Page title */
  title?: string;
  /** Sidebar label */
  sidebar_label?: string;
  /** Page description */
  description?: string;
  /** Difficulty level of the content */
  difficulty?: "beginner" | "intermediate" | "advanced" | "expert";
  /** Estimated reading time in minutes */
  estimated_reading_time?: number;
  /** Points awarded for reading this document */
  points?: number;
  /** Tags for categorization */
  tags?: string[];
  /** Prerequisites - IDs of documents that should be read first */
  prerequisites?: string[];
}

/**
 * Difficulty level display configuration
 */
export const DIFFICULTY_CONFIG = {
  beginner: {
    label: "Beginner",
    color: "#10b981",
    emoji: "🌱",
  },
  intermediate: {
    label: "Intermediate",
    color: "#f59e0b",
    emoji: "📈",
  },
  advanced: {
    label: "Advanced",
    color: "#f97316",
    emoji: "🚀",
  },
  expert: {
    label: "Expert",
    color: "#ef4444",
    emoji: "🔥",
  },
} as const;
