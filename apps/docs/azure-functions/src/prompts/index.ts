/**
 * Prompts Index
 *
 * Central export for all prompt templates.
 */

export type {
  AIModel,
  PromptCategory,
  PromptMetadata,
  SystemPromptTemplate,
  UserPromptTemplate,
  PromptTemplate,
} from "./types";

export { buildUserPrompt, getModelConfig } from "./types";

export {
  NEWS_CATEGORIZATION_PROMPT,
  NEWS_PERSONALIZATION_PROMPT,
  NEWS_SUMMARY_PROMPT,
} from "./news";
