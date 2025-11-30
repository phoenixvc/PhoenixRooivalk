/**
 * Profile Types and Shared Configuration
 *
 * Defines the types and constants used across all profile templates.
 */

export interface UserProfile {
  name: string;
  roles: string[]; // Job functions (e.g., "Business", "Technical - Mechanical")
  focusAreas: string[]; // Documentation categories (e.g., "executive", "technical")
  interests: string[]; // Specific topics of interest (e.g., "ROI", "hardware", "AI")
  experienceLevel: "beginner" | "intermediate" | "advanced"; // For doc difficulty matching
  recommendedPaths: RecommendedPath[];
  profileDescription: string;
}

export interface RecommendedPath {
  docId: string;
  title: string;
  priority: number; // 1-5, higher = more important
  reason: string;
}

/**
 * Profile Template extends UserProfile but includes additional metadata
 * for display in the onboarding flow
 */
export interface ProfileTemplate extends UserProfile {
  templateKey: string; // Unique identifier for the template
  templateName: string; // Display name for selection UI
  templateIcon: string; // Emoji icon for visual representation
  templateDescription: string; // Brief description for selection UI
}

/**
 * Available role options for profile selection
 */
export const AVAILABLE_ROLES = [
  "Founder",
  "Lead",
  "Business",
  "Marketing",
  "Sales",
  "Financial",
  "Executive",
  "Technical - Mechanical",
  "Technical - Software/AI",
  "Operations",
  "Legal",
  "Research",
  "Advisory",
  "Product",
] as const;

/**
 * Available interest tags matching frontmatter tags
 */
export const AVAILABLE_INTERESTS = [
  "counter-uas",
  "hardware",
  "software",
  "ai",
  "machine-learning",
  "rag",
  "llm",
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
 * Category definitions with their doc path prefixes.
 */
export const CATEGORY_PATHS: Record<string, string[]> = {
  executive: ["/docs/executive/"],
  technical: ["/docs/technical/"],
  business: ["/docs/business/"],
  operations: ["/docs/operations/"],
  legal: ["/docs/legal/"],
  research: ["/docs/research/"],
  resources: ["/docs/resources/"],
};

/**
 * Get category from a doc path.
 */
export function getCategoryFromDocPath(docPath: string): string | null {
  for (const [category, prefixes] of Object.entries(CATEGORY_PATHS)) {
    if (prefixes.some((prefix) => docPath.startsWith(prefix))) {
      return category;
    }
  }
  return null;
}
