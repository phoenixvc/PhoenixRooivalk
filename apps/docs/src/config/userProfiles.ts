/**
 * User Profiles Configuration
 *
 * Re-exports all profile functionality from the profiles/ directory.
 * This file maintains backwards compatibility with existing imports.
 *
 * For new code, prefer importing directly from './profiles'.
 */

// Re-export types
export type { UserProfile, RecommendedPath, ProfileTemplate } from "./profiles";

// Re-export values and functions from profiles
export {
  // Constants
  AVAILABLE_ROLES,
  AVAILABLE_INTERESTS,
  CATEGORY_PATHS,
  // Internal users
  INTERNAL_USER_PROFILES,
  // Template collections
  PROFILE_TEMPLATES,
  PROFILE_TEMPLATES_ARRAY,
  PROFILE_TEMPLATES_MAP,
  // Functions
  getUserProfile,
  getRecommendedPaths,
  profileToRecommendations,
  getCategoryFromDocPath,
  getTemplateByKey,
  getAllTemplates,
  templateToUserProfile,
  getRecommendationsForRoles,
} from "./profiles";
