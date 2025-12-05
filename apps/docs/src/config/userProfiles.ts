/**
 * User Profiles Configuration
 *
 * Re-exports all profile functionality from the profiles/ directory.
 * This file maintains backwards compatibility with existing imports.
 *
 * For new code, prefer importing directly from './profiles'.
 */

// Re-export types
export type {
  UserProfile,
  RecommendedPath,
  ProfileTemplate,
  UserProfileResult,
} from "./profiles";

// Re-export values and functions from profiles
export {
  // Constants
  AVAILABLE_ROLES,
  AVAILABLE_INTERESTS,
  CATEGORY_PATHS,
  INTERNAL_DOMAINS,
  DEFAULT_INTERNAL_PROFILE,
  // Internal users
  INTERNAL_USER_PROFILES,
  // Template collections
  PROFILE_TEMPLATES,
  PROFILE_TEMPLATES_ARRAY,
  PROFILE_TEMPLATES_MAP,
  // Functions
  getUserProfile,
  getUserProfileWithMetadata,
  isInternalDomain,
  getRecommendedPaths,
  profileToRecommendations,
  getCategoryFromDocPath,
  getTemplateByKey,
  getAllTemplates,
  templateToUserProfile,
  getRecommendationsForRoles,
} from "./profiles";
