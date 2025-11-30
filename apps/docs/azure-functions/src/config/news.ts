/**
 * News Configuration
 *
 * Dynamic configuration for news categories, roles, and interests.
 * Can be extended to load from database or external config.
 */

/**
 * News category definition
 */
export interface NewsCategoryConfig {
  id: string;
  name: string;
  description: string;
  icon?: string;
  color?: string;
}

/**
 * Default news categories
 * These can be overridden by database values
 */
export const DEFAULT_NEWS_CATEGORIES: NewsCategoryConfig[] = [
  {
    id: "counter-uas",
    name: "Counter-UAS",
    description: "Directly about counter-drone technology",
    icon: "shield",
    color: "#dc2626",
  },
  {
    id: "defense-tech",
    name: "Defense Technology",
    description: "General defense technology news",
    icon: "chip",
    color: "#2563eb",
  },
  {
    id: "drone-industry",
    name: "Drone Industry",
    description: "Drone manufacturing and operations",
    icon: "plane",
    color: "#7c3aed",
  },
  {
    id: "regulatory",
    name: "Regulatory",
    description: "Laws, regulations, certifications",
    icon: "document",
    color: "#059669",
  },
  {
    id: "market-analysis",
    name: "Market Analysis",
    description: "Market research and investment",
    icon: "chart",
    color: "#d97706",
  },
  {
    id: "product-updates",
    name: "Product Updates",
    description: "Phoenix Rooivalk product news",
    icon: "rocket",
    color: "#f97316",
  },
  {
    id: "company-news",
    name: "Company News",
    description: "Phoenix Rooivalk company announcements",
    icon: "building",
    color: "#0891b2",
  },
  {
    id: "research",
    name: "Research",
    description: "Academic and R&D developments",
    icon: "beaker",
    color: "#6366f1",
  },
  {
    id: "partnerships",
    name: "Partnerships",
    description: "Industry collaborations and contracts",
    icon: "users",
    color: "#ec4899",
  },
];

/**
 * Target roles for news personalization
 */
export const TARGET_ROLES = [
  "Technical - Software/AI",
  "Technical - Mechanical",
  "Business",
  "Marketing",
  "Sales",
  "Financial",
  "Executive",
  "Legal",
  "Operations",
  "Research",
  "Product",
] as const;

/**
 * Target interests for news personalization
 */
export const TARGET_INTERESTS = [
  "counter-uas",
  "hardware",
  "software",
  "ai",
  "machine-learning",
  "compliance",
  "itar",
  "defense",
  "commercial",
  "roi",
  "investment",
  "manufacturing",
  "deployment",
  "strategy",
  "market-analysis",
] as const;

/**
 * Experience levels
 */
export const EXPERIENCE_LEVELS = [
  "beginner",
  "intermediate",
  "advanced",
] as const;

export type NewsCategory = (typeof DEFAULT_NEWS_CATEGORIES)[number]["id"];
export type TargetRole = (typeof TARGET_ROLES)[number];
export type TargetInterest = (typeof TARGET_INTERESTS)[number];
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

/**
 * Get category config by ID
 */
export function getCategoryConfig(
  categoryId: string,
): NewsCategoryConfig | undefined {
  return DEFAULT_NEWS_CATEGORIES.find((c) => c.id === categoryId);
}

/**
 * Get all category IDs
 */
export function getCategoryIds(): string[] {
  return DEFAULT_NEWS_CATEGORIES.map((c) => c.id);
}

/**
 * Validate category ID
 */
export function isValidCategory(categoryId: string): boolean {
  return DEFAULT_NEWS_CATEGORIES.some((c) => c.id === categoryId);
}

/**
 * Get category list formatted for prompts
 */
export function getCategoriesForPrompt(): string {
  return DEFAULT_NEWS_CATEGORIES.map((c) => `- ${c.id}: ${c.description}`).join(
    "\n",
  );
}

/**
 * Get roles formatted for prompts
 */
export function getRolesForPrompt(): string {
  return TARGET_ROLES.map((r) => `- ${r}`).join("\n");
}

/**
 * Get interests formatted for prompts
 */
export function getInterestsForPrompt(): string {
  return TARGET_INTERESTS.map((i) => `- ${i}`).join(", ");
}
