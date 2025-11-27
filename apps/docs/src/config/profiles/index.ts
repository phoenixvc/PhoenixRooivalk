/**
 * Profile Configuration Index
 *
 * Central export point for all profile templates and utilities.
 * Import from this file to access profile functionality.
 */

// Re-export types and constants
export type { UserProfile, RecommendedPath, ProfileTemplate } from "./types";
export {
  AVAILABLE_ROLES,
  AVAILABLE_INTERESTS,
  CATEGORY_PATHS,
  getCategoryFromDocPath,
} from "./types";

// Re-export internal user profiles
export { INTERNAL_USER_PROFILES, getUserProfile } from "./internal-users";

// Import individual templates
import { technicalSoftwareTemplate } from "./technical-software";
import { technicalMechanicalTemplate } from "./technical-mechanical";
import { operationsTemplate } from "./operations";
import { legalTemplate } from "./legal";
import { advisoryTemplate } from "./advisory";
import { businessMarketingTemplate } from "./business-marketing";
import { executiveFinancialTemplate } from "./executive-financial";
import { productTemplate } from "./product";

import { ProfileTemplate, RecommendedPath, UserProfile } from "./types";

/**
 * All available profile templates as an array for iteration.
 * Ordered by common use case priority.
 */
export const PROFILE_TEMPLATES_ARRAY: ProfileTemplate[] = [
  businessMarketingTemplate,
  technicalSoftwareTemplate,
  technicalMechanicalTemplate,
  executiveFinancialTemplate,
  operationsTemplate,
  productTemplate,
  legalTemplate,
  advisoryTemplate,
];

/**
 * Map of template keys to full ProfileTemplate objects.
 */
export const PROFILE_TEMPLATES_MAP: Record<string, ProfileTemplate> = {
  [technicalSoftwareTemplate.templateKey]: technicalSoftwareTemplate,
  [technicalMechanicalTemplate.templateKey]: technicalMechanicalTemplate,
  [operationsTemplate.templateKey]: operationsTemplate,
  [legalTemplate.templateKey]: legalTemplate,
  [advisoryTemplate.templateKey]: advisoryTemplate,
  [businessMarketingTemplate.templateKey]: businessMarketingTemplate,
  [executiveFinancialTemplate.templateKey]: executiveFinancialTemplate,
  [productTemplate.templateKey]: productTemplate,
};

/**
 * PROFILE_TEMPLATES - backwards compatible format.
 * Maps template keys to partial UserProfile objects.
 * Use PROFILE_TEMPLATES_MAP for full ProfileTemplate access.
 * Use PROFILE_TEMPLATES_ARRAY for iteration with display metadata.
 */
export const PROFILE_TEMPLATES: Record<string, Partial<UserProfile>> =
  Object.fromEntries(
    PROFILE_TEMPLATES_ARRAY.map((template) => [
      template.templateKey,
      {
        roles: template.roles,
        focusAreas: template.focusAreas,
        interests: template.interests,
        experienceLevel: template.experienceLevel,
        profileDescription: template.profileDescription,
        recommendedPaths: template.recommendedPaths,
      },
    ]),
  );

/**
 * Get recommended paths for a user, sorted by priority.
 */
export function getRecommendedPaths(profile: UserProfile): RecommendedPath[] {
  return [...profile.recommendedPaths].sort((a, b) => b.priority - a.priority);
}

/**
 * Convert profile to AI-compatible recommendation format.
 */
export function profileToRecommendations(
  profile: UserProfile,
  maxItems: number = 5,
): Array<{ docId: string; relevanceScore: number; reason: string }> {
  const paths = getRecommendedPaths(profile).slice(0, maxItems);

  return paths.map((path) => ({
    docId: path.docId,
    relevanceScore: path.priority / 5, // Normalize to 0-1
    reason: path.reason,
  }));
}

/**
 * Get a template by its key.
 */
export function getTemplateByKey(key: string): ProfileTemplate | undefined {
  return PROFILE_TEMPLATES_MAP[key];
}

/**
 * Get all templates as an array with full metadata.
 * Useful for building selection UIs.
 */
export function getAllTemplates(): ProfileTemplate[] {
  return [...PROFILE_TEMPLATES_ARRAY];
}

/**
 * Convert a ProfileTemplate to a UserProfile.
 * Used when a user selects a template as their base profile.
 */
export function templateToUserProfile(
  template: ProfileTemplate,
  userName?: string,
): UserProfile {
  return {
    name: userName || template.name,
    roles: [...template.roles],
    focusAreas: [...template.focusAreas],
    interests: [...template.interests],
    experienceLevel: template.experienceLevel,
    profileDescription: template.profileDescription,
    recommendedPaths: [...template.recommendedPaths],
  };
}
