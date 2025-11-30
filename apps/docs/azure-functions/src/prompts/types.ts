/**
 * Prompt Template Types
 *
 * Type definitions for prompt templates, matching the Firebase functions
 * prompt system for consistency.
 */

/**
 * Supported AI models
 */
export type AIModel = "chat" | "chatAdvanced" | "chatFast";

/**
 * Prompt category for organization
 */
export type PromptCategory =
  | "analysis"
  | "generation"
  | "retrieval"
  | "recommendation"
  | "research";

/**
 * Prompt metadata
 */
export interface PromptMetadata {
  id: string;
  name: string;
  description: string;
  category: PromptCategory;
  version: string;
  recommendedModel: AIModel;
  maxTokens: number;
  temperature: number;
  tags: string[];
}

/**
 * System prompt template
 */
export interface SystemPromptTemplate {
  base: string;
  contextMarker?: string;
}

/**
 * User prompt template
 */
export interface UserPromptTemplate {
  template: string;
  requiredVariables: string[];
  optionalVariables?: Record<string, string>;
}

/**
 * Complete prompt template
 */
export interface PromptTemplate {
  metadata: PromptMetadata;
  system: SystemPromptTemplate;
  user: UserPromptTemplate;
  outputFormat?: "text" | "json" | "markdown";
}

/**
 * Build user prompt with variable substitution
 */
export function buildUserPrompt(
  template: PromptTemplate,
  variables: Record<string, string | string[] | undefined>,
): string {
  let result = template.user.template;

  // Merge with defaults
  const mergedVariables = {
    ...template.user.optionalVariables,
    ...variables,
  };

  // Validate required variables
  for (const required of template.user.requiredVariables) {
    if (!mergedVariables[required]) {
      throw new Error(`Missing required variable: ${required}`);
    }
  }

  // Substitute variables
  result = result.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
    const value = mergedVariables[key];
    if (value === undefined) return "";
    return Array.isArray(value) ? value.join(", ") : value;
  });

  return result;
}

/**
 * Get model configuration from template
 */
export function getModelConfig(template: PromptTemplate): {
  model: AIModel;
  maxTokens: number;
  temperature: number;
} {
  return {
    model: template.metadata.recommendedModel,
    maxTokens: template.metadata.maxTokens,
    temperature: template.metadata.temperature,
  };
}
