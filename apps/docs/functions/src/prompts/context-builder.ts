/**
 * Context Builder - Phase 2.2 Context Optimization
 *
 * Implements token budget management for optimal context usage.
 * Features:
 * - Token estimation
 * - Priority-based context inclusion
 * - RAG context truncation
 * - Category-specific context injection
 */

import { PromptCategory, PromptContext } from "./types";
import { PHOENIX_CORE_CONTEXT, buildRAGContextSection } from "./context";

/**
 * Token estimation constants
 * Based on GPT tokenization (approximately 4 chars per token)
 */
const CHARS_PER_TOKEN = 4;
const DEFAULT_MAX_TOKENS = 4000;

/**
 * Context budget allocation
 */
export interface TokenBudget {
  /** Maximum total tokens for context */
  maxTokens: number;
  /** Tokens reserved for core context (always included) */
  coreReserve: number;
  /** Tokens reserved for category-specific context */
  categoryReserve: number;
  /** Remaining budget for RAG context */
  ragBudget: number;
}

/**
 * Result of context building with budget
 */
export interface ContextBuildResult {
  /** The built context string */
  context: string;
  /** Estimated token count */
  tokenCount: number;
  /** Whether any content was truncated */
  truncated: boolean;
  /** Breakdown of token usage */
  breakdown: {
    core: number;
    category: number;
    rag: number;
  };
}

/**
 * Category-specific context strings
 */
const CATEGORY_CONTEXTS: Partial<Record<PromptCategory, string>> = {
  analysis: `
ANALYSIS CONTEXT:
When analyzing topics related to Phoenix Rooivalk:
- Focus on technical accuracy and data-driven insights
- Reference documented specifications where relevant
- Consider market positioning and competitive landscape
- Highlight unique value propositions
`,
  recommendation: `
RECOMMENDATION CONTEXT:
For reading recommendations:
- Consider user's reading history and interests
- Suggest logical learning progressions
- Balance technical depth with accessibility
- Include related topics for comprehensive understanding
`,
  research: `
RESEARCH CONTEXT:
For market research and intelligence:
- Use verifiable data sources where possible
- Consider regional market variations
- Include regulatory and compliance factors
- Highlight emerging trends and opportunities
`,
};

/**
 * Estimate token count for a string
 * Uses character-based estimation (approximately 4 chars per token for English)
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/**
 * Truncate text to fit within token budget
 * Attempts to truncate at sentence boundaries where possible
 */
export function truncateToTokens(
  text: string,
  maxTokens: number,
  options: { preserveSentences?: boolean; addEllipsis?: boolean } = {},
): string {
  const { preserveSentences = true, addEllipsis = true } = options;

  if (!text || estimateTokens(text) <= maxTokens) {
    return text;
  }

  const maxChars = maxTokens * CHARS_PER_TOKEN;
  let truncated = text.substring(0, maxChars);

  if (preserveSentences) {
    // Find the last complete sentence
    const lastSentenceEnd = Math.max(
      truncated.lastIndexOf(". "),
      truncated.lastIndexOf(".\n"),
      truncated.lastIndexOf("! "),
      truncated.lastIndexOf("? "),
    );

    if (lastSentenceEnd > maxChars * 0.5) {
      truncated = truncated.substring(0, lastSentenceEnd + 1);
    }
  }

  return addEllipsis ? `${truncated.trim()}...` : truncated.trim();
}

/**
 * Calculate token budget for a prompt category
 */
export function calculateTokenBudget(
  category: PromptCategory,
  maxTokens: number = DEFAULT_MAX_TOKENS,
): TokenBudget {
  const coreTokens = estimateTokens(PHOENIX_CORE_CONTEXT);
  const categoryContext = CATEGORY_CONTEXTS[category] || "";
  const categoryTokens = estimateTokens(categoryContext);

  // Reserve 60% for core, 15% for category, 25% for RAG
  const coreReserve = Math.min(coreTokens, Math.floor(maxTokens * 0.6));
  const categoryReserve = Math.min(
    categoryTokens,
    Math.floor(maxTokens * 0.15),
  );
  const ragBudget = maxTokens - coreReserve - categoryReserve;

  return {
    maxTokens,
    coreReserve,
    categoryReserve,
    ragBudget: Math.max(ragBudget, 0),
  };
}

/**
 * Build context within token budget
 * Prioritizes: Core context > Category context > RAG context
 */
export function buildContextWithBudget(
  category: PromptCategory,
  ragContext: string | undefined,
  maxTokens: number = DEFAULT_MAX_TOKENS,
): ContextBuildResult {
  const budget = calculateTokenBudget(category, maxTokens);
  const contextParts: string[] = [];
  let truncated = false;

  const breakdown = {
    core: 0,
    category: 0,
    rag: 0,
  };

  // Priority 1: Core context (always included, may be truncated if very limited budget)
  const coreTokens = estimateTokens(PHOENIX_CORE_CONTEXT);
  if (coreTokens <= budget.coreReserve) {
    contextParts.push(PHOENIX_CORE_CONTEXT);
    breakdown.core = coreTokens;
  } else {
    const truncatedCore = truncateToTokens(
      PHOENIX_CORE_CONTEXT,
      budget.coreReserve,
    );
    contextParts.push(truncatedCore);
    breakdown.core = estimateTokens(truncatedCore);
    truncated = true;
  }

  // Priority 2: Category-specific context
  const categoryContext = CATEGORY_CONTEXTS[category];
  if (categoryContext) {
    const categoryTokens = estimateTokens(categoryContext);
    if (categoryTokens <= budget.categoryReserve) {
      contextParts.push(categoryContext);
      breakdown.category = categoryTokens;
    } else if (budget.categoryReserve > 50) {
      const truncatedCategory = truncateToTokens(
        categoryContext,
        budget.categoryReserve,
      );
      contextParts.push(truncatedCategory);
      breakdown.category = estimateTokens(truncatedCategory);
      truncated = true;
    }
  }

  // Priority 3: RAG context (remaining budget)
  if (ragContext && budget.ragBudget > 0) {
    const ragTokens = estimateTokens(ragContext);

    if (ragTokens <= budget.ragBudget) {
      contextParts.push(`\nRELEVANT DOCUMENTATION:\n${ragContext}`);
      breakdown.rag = ragTokens;
    } else {
      // Truncate RAG context to fit
      const truncatedRag = truncateToTokens(ragContext, budget.ragBudget - 50); // Reserve space for header
      contextParts.push(
        `\nRELEVANT DOCUMENTATION (truncated):\n${truncatedRag}\n\n[...additional context truncated for brevity]`,
      );
      breakdown.rag = estimateTokens(truncatedRag) + 20;
      truncated = true;
    }
  }

  const context = contextParts.join("\n\n");
  const tokenCount = breakdown.core + breakdown.category + breakdown.rag;

  return {
    context,
    tokenCount,
    truncated,
    breakdown,
  };
}

/**
 * Build optimized prompt context
 * Combines buildContextWithBudget with additional optimizations
 */
export function buildOptimizedContext(
  promptContext: PromptContext & { category?: PromptCategory },
  maxTokens: number = DEFAULT_MAX_TOKENS,
): ContextBuildResult {
  const category = promptContext.category || "analysis";

  // Build RAG section if context provided
  let ragSection: string | undefined;
  if (promptContext.ragContext) {
    ragSection = buildRAGContextSection(
      promptContext.ragContext,
      promptContext.ragSources || [],
    );
  }

  // Add additional context if provided
  if (promptContext.additionalContext && ragSection) {
    ragSection = `${ragSection}\n\nADDITIONAL CONTEXT:\n${promptContext.additionalContext}`;
  } else if (promptContext.additionalContext) {
    ragSection = promptContext.additionalContext;
  }

  return buildContextWithBudget(category, ragSection, maxTokens);
}

/**
 * Get token usage report for monitoring
 */
export function getTokenUsageReport(result: ContextBuildResult): string {
  const { tokenCount, breakdown, truncated } = result;
  const lines = [
    `Token Usage Report:`,
    `- Core context: ${breakdown.core} tokens`,
    `- Category context: ${breakdown.category} tokens`,
    `- RAG context: ${breakdown.rag} tokens`,
    `- Total: ${tokenCount} tokens`,
    truncated ? `- WARNING: Content was truncated to fit budget` : "",
  ];

  return lines.filter(Boolean).join("\n");
}
