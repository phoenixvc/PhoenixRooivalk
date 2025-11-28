/**
 * Prompt Management Type Definitions
 *
 * Centralized type definitions for prompt templates, versioning, and optimization.
 */

/**
 * Supported AI models for prompt execution
 */
export type AIModel = "chat" | "chatAdvanced" | "chatFast";

/**
 * Prompt category for organization and analytics
 */
export type PromptCategory =
  | "analysis" // Competitor, SWOT, Market analysis
  | "generation" // Content generation, summaries
  | "retrieval" // RAG queries, document search
  | "recommendation" // Reading recommendations
  | "research"; // Person research, fact finding

/**
 * Prompt template metadata for versioning and optimization
 */
export interface PromptMetadata {
  /** Unique identifier for this prompt */
  id: string;

  /** Human-readable name */
  name: string;

  /** Prompt category for analytics */
  category: PromptCategory;

  /** Semantic version (major.minor.patch) */
  version: string;

  /** Description of what this prompt does */
  description: string;

  /** When this version was created */
  createdAt: string;

  /** Who created/updated this version */
  author?: string;

  /** Changelog for this version */
  changelog?: string;

  /** Recommended model for this prompt */
  recommendedModel: AIModel;

  /** Maximum tokens for response */
  maxTokens: number;

  /** Temperature setting (0-1) */
  temperature: number;

  /** Whether this prompt uses RAG context */
  usesRAG: boolean;

  /** Tags for searchability */
  tags: string[];
}

/**
 * System prompt template
 */
export interface SystemPromptTemplate {
  /** Base system prompt text */
  base: string;

  /** Optional context injection point marker */
  contextMarker?: string;

  /** Optional RAG context template */
  ragTemplate?: string;
}

/**
 * User prompt template with variable substitution
 */
export interface UserPromptTemplate {
  /** Template string with {{variable}} placeholders */
  template: string;

  /** Required variables for this template */
  requiredVariables: string[];

  /** Optional variables with defaults */
  optionalVariables?: Record<string, string>;
}

/**
 * Complete prompt template definition
 */
export interface PromptTemplate {
  /** Metadata about this prompt */
  metadata: PromptMetadata;

  /** System prompt configuration */
  system: SystemPromptTemplate;

  /** User prompt configuration */
  user: UserPromptTemplate;

  /** Expected output format (for parsing) */
  outputFormat?: "text" | "json" | "markdown";

  /** JSON schema for output validation (if outputFormat is 'json') */
  outputSchema?: Record<string, unknown>;
}

/**
 * Prompt execution context
 */
export interface PromptContext {
  /** User ID for analytics */
  userId?: string;

  /** RAG context from document search */
  ragContext?: string;

  /** Sources used in RAG context */
  ragSources?: Array<{ title: string; section: string }>;

  /** Additional context to inject */
  additionalContext?: string;

  /** Override model selection */
  modelOverride?: AIModel;

  /** Override temperature */
  temperatureOverride?: number;
}

/**
 * Prompt execution result for analytics
 */
export interface PromptExecutionResult {
  /** Prompt ID that was executed */
  promptId: string;

  /** Version that was executed */
  promptVersion: string;

  /** Whether RAG was used */
  ragUsed: boolean;

  /** Number of RAG sources */
  ragSourceCount: number;

  /** Total tokens used */
  tokensUsed: number;

  /** Execution latency in ms */
  latencyMs: number;

  /** Model used */
  model: string;

  /** Provider used (azure/openai) */
  provider: string;
}
