/**
 * Prompt Builder Utility
 *
 * Builds system and user prompts from templates with variable substitution
 * and RAG context injection.
 */

import { PromptTemplate, PromptContext } from "./types";
import { buildRAGContextSection } from "./context";

/**
 * Simple mustache-style variable substitution
 * Supports {{variable}} and {{#condition}}content{{/condition}}
 */
function substituteVariables(
  template: string,
  variables: Record<string, string | string[] | undefined>,
): string {
  let result = template;

  // Handle conditional sections {{#var}}...{{/var}}
  const conditionalPattern = /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g;
  result = result.replace(conditionalPattern, (_match, key, content) => {
    const value = variables[key];
    if (value && (Array.isArray(value) ? value.length > 0 : value.length > 0)) {
      // Replace inner {{variable}} with actual value
      return content.replace(
        new RegExp(`\\{\\{${key}\\}\\}`, "g"),
        Array.isArray(value) ? value.join(", ") : value,
      );
    }
    return "";
  });

  // Handle simple variable substitution {{variable}}
  result = result.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
    const value = variables[key];
    if (value === undefined) return "";
    return Array.isArray(value) ? value.join(", ") : value;
  });

  return result;
}

/**
 * Build the complete system prompt from a template
 */
export function buildSystemPrompt(
  template: PromptTemplate,
  context?: PromptContext,
): string {
  let systemPrompt = template.system.base;

  // Inject RAG context if available
  if (context?.ragContext && template.system.ragTemplate) {
    const ragSection = template.system.ragTemplate.replace(
      template.system.contextMarker || "{{RAG_CONTEXT}}",
      context.ragContext,
    );
    systemPrompt = `${systemPrompt}\n\n${ragSection}`;
  } else if (context?.ragContext) {
    // Fallback: use buildRAGContextSection if no template
    const ragSection = buildRAGContextSection(
      context.ragContext,
      context.ragSources || [],
    );
    if (ragSection) {
      systemPrompt = `${systemPrompt}\n\n${ragSection}`;
    }
  }

  // Inject additional context if provided
  if (context?.additionalContext) {
    systemPrompt = `${systemPrompt}\n\n${context.additionalContext}`;
  }

  return systemPrompt;
}

/**
 * Build the user prompt from a template with variable substitution
 */
export function buildUserPrompt(
  template: PromptTemplate,
  variables: Record<string, string | string[] | undefined>,
): string {
  // Merge with defaults
  const mergedVariables = {
    ...template.user.optionalVariables,
    ...variables,
  };

  // Validate required variables
  for (const requiredVar of template.user.requiredVariables) {
    if (!mergedVariables[requiredVar]) {
      throw new Error(
        `Missing required variable: ${requiredVar} for prompt ${template.metadata.id}`,
      );
    }
  }

  return substituteVariables(template.user.template, mergedVariables);
}

/**
 * Build both system and user prompts from a template
 */
export function buildPrompts(
  template: PromptTemplate,
  variables: Record<string, string | string[] | undefined>,
  context?: PromptContext,
): { systemPrompt: string; userPrompt: string } {
  return {
    systemPrompt: buildSystemPrompt(template, context),
    userPrompt: buildUserPrompt(template, variables),
  };
}

/**
 * Get model configuration from template
 */
export function getModelConfig(template: PromptTemplate): {
  model: "chat" | "chatAdvanced" | "chatFast";
  maxTokens: number;
  temperature: number;
} {
  return {
    model: template.metadata.recommendedModel,
    maxTokens: template.metadata.maxTokens,
    temperature: template.metadata.temperature,
  };
}
