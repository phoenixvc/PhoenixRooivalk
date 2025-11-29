/**
 * Prompt Management System
 *
 * Centralized prompt management for Phoenix Rooivalk AI features.
 *
 * Architecture:
 * - types.ts: Type definitions for prompts, metadata, and execution
 * - context.ts: Company context definitions for injection
 * - templates/: Individual prompt templates with versioning
 * - executor.ts: Prompt execution with RAG integration
 *
 * Usage:
 * ```typescript
 * import { getPromptTemplate, executePrompt } from './prompts';
 *
 * const template = getPromptTemplate('competitor-analysis');
 * const result = await executePrompt(template, {
 *   variables: { competitors: ['Company A', 'Company B'] },
 *   ragContext: documentContext,
 * });
 * ```
 */

// Type exports
export type {
  AIModel,
  PromptCategory,
  PromptMetadata,
  SystemPromptTemplate,
  UserPromptTemplate,
  PromptTemplate,
  PromptContext,
  PromptExecutionResult,
} from "./types";

// Context exports
export {
  PHOENIX_CORE_CONTEXT,
  PHOENIX_TECHNICAL_CONTEXT,
  PHOENIX_MARKET_CONTEXT,
  getContextForCategory,
  buildRAGContextSection,
} from "./context";

// Template exports
export {
  PROMPT_REGISTRY,
  getPromptTemplate,
  listPromptIds,
  getPromptsByCategory,
  COMPETITOR_PROMPT,
  SWOT_PROMPT,
  MARKET_PROMPT,
  RAG_QUERY_PROMPT,
  RECOMMENDATIONS_PROMPT,
} from "./templates";

// Builder utilities for prompt construction
export {
  buildSystemPrompt,
  buildUserPrompt,
  buildPrompts,
  getModelConfig,
} from "./builder";

// Legacy compatibility - re-export from ai/prompts for backward compatibility
// NOTE: Legacy exports maintained for gradual migration. Use new template system for new code.
import {
  PROMPTS as LegacyPROMPTS,
  PHOENIX_CONTEXT as LegacyContext,
} from "../ai/prompts";

/**
 * @deprecated Use getPromptTemplate() and buildPrompts() instead
 * Legacy PROMPTS object for backwards compatibility
 */
export const PROMPTS = LegacyPROMPTS;

/**
 * @deprecated Use PHOENIX_CORE_CONTEXT instead
 */
export const PHOENIX_CONTEXT = LegacyContext;
