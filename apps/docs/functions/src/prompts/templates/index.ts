/**
 * Prompt Templates Index
 *
 * Central export point for all prompt templates.
 * Import templates from here for type safety and versioning.
 */

// Analysis prompts
export { COMPETITOR_PROMPT } from "./competitor";
export { SWOT_PROMPT } from "./swot";
export { MARKET_PROMPT } from "./market";

// RAG prompts
export { RAG_QUERY_PROMPT, DETAILED_FORMAT, CONCISE_FORMAT } from "./rag-query";

// Recommendation prompts
export { RECOMMENDATIONS_PROMPT } from "./recommendations";

// News prompts
export {
  NEWS_RETRIEVAL_PROMPT,
  NEWS_PERSONALIZATION_PROMPT,
  NEWS_DIGEST_PROMPT,
  NEWS_CATEGORIZATION_PROMPT,
} from "./news";

// Re-export all templates as a registry
import { COMPETITOR_PROMPT } from "./competitor";
import { SWOT_PROMPT } from "./swot";
import { MARKET_PROMPT } from "./market";
import { RAG_QUERY_PROMPT } from "./rag-query";
import { RECOMMENDATIONS_PROMPT } from "./recommendations";
import {
  NEWS_RETRIEVAL_PROMPT,
  NEWS_PERSONALIZATION_PROMPT,
  NEWS_DIGEST_PROMPT,
  NEWS_CATEGORIZATION_PROMPT,
} from "./news";
import { PromptTemplate } from "../types";

/**
 * Prompt Registry - all available prompts indexed by ID
 */
export const PROMPT_REGISTRY: Record<string, PromptTemplate> = {
  "competitor-analysis": COMPETITOR_PROMPT,
  "swot-analysis": SWOT_PROMPT,
  "market-insights": MARKET_PROMPT,
  "rag-query": RAG_QUERY_PROMPT,
  "reading-recommendations": RECOMMENDATIONS_PROMPT,
  "news-retrieval": NEWS_RETRIEVAL_PROMPT,
  "news-personalization": NEWS_PERSONALIZATION_PROMPT,
  "news-digest": NEWS_DIGEST_PROMPT,
  "news-categorization": NEWS_CATEGORIZATION_PROMPT,
};

/**
 * Get a prompt template by ID
 */
export function getPromptTemplate(id: string): PromptTemplate | undefined {
  return PROMPT_REGISTRY[id];
}

/**
 * List all available prompt IDs
 */
export function listPromptIds(): string[] {
  return Object.keys(PROMPT_REGISTRY);
}

/**
 * Get all prompts by category
 */
export function getPromptsByCategory(
  category: string,
): Record<string, PromptTemplate> {
  return Object.fromEntries(
    Object.entries(PROMPT_REGISTRY).filter(
      ([, template]) => template.metadata.category === category,
    ),
  );
}
