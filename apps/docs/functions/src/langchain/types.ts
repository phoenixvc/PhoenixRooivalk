/**
 * LangChain Types - Phase 2.4
 *
 * Type definitions for LangChain integration.
 * Provides foundation for advanced AI workflows and agent capabilities.
 */

/**
 * Supported LangChain models
 */
export type LangChainModel = "gpt-4" | "gpt-3.5-turbo" | "azure-openai";

/**
 * Chain execution result
 */
export interface ChainResult<T = unknown> {
  /** The output of the chain */
  output: T;
  /** Intermediate steps (for debugging) */
  intermediateSteps?: ChainStep[];
  /** Token usage statistics */
  tokenUsage?: TokenUsage;
  /** Execution time in milliseconds */
  executionTimeMs: number;
  /** Whether the chain completed successfully */
  success: boolean;
  /** Error message if failed */
  error?: string;
}

/**
 * Chain execution step
 */
export interface ChainStep {
  /** Step name/identifier */
  name: string;
  /** Input to this step */
  input: unknown;
  /** Output from this step */
  output: unknown;
  /** Time taken for this step */
  timeMs: number;
}

/**
 * Token usage tracking
 */
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/**
 * Document for RAG processing
 */
export interface LangChainDocument {
  /** Document ID */
  id: string;
  /** Document content */
  pageContent: string;
  /** Document metadata */
  metadata: {
    title?: string;
    source?: string;
    category?: string;
    url?: string;
    createdAt?: string;
    [key: string]: unknown;
  };
}

/**
 * Tool definition for agents
 */
export interface ToolDefinition {
  /** Unique tool name */
  name: string;
  /** Tool description for the LLM */
  description: string;
  /** Input schema (JSON Schema) */
  inputSchema: Record<string, unknown>;
  /** Tool function */
  func: (input: unknown) => Promise<unknown>;
}

/**
 * Agent configuration
 */
export interface AgentConfig {
  /** Agent name */
  name: string;
  /** System prompt for the agent */
  systemPrompt: string;
  /** Available tools */
  tools: ToolDefinition[];
  /** Model to use */
  model: LangChainModel;
  /** Maximum iterations for agent loops */
  maxIterations?: number;
  /** Temperature for generation */
  temperature?: number;
  /** Verbose logging */
  verbose?: boolean;
}

/**
 * Agent execution result
 */
export interface AgentResult {
  /** Final output */
  output: string;
  /** Tools used during execution */
  toolsUsed: string[];
  /** Number of iterations */
  iterations: number;
  /** Intermediate thoughts/reasoning */
  thoughts?: string[];
  /** Token usage */
  tokenUsage?: TokenUsage;
  /** Success status */
  success: boolean;
  /** Error if failed */
  error?: string;
}

/**
 * Memory configuration
 */
export interface MemoryConfig {
  /** Type of memory */
  type: "buffer" | "summary" | "conversation";
  /** Maximum messages to keep */
  maxMessages?: number;
  /** Maximum tokens for summary */
  maxTokens?: number;
}

/**
 * Chat message for conversation memory
 */
export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
}

/**
 * Retriever configuration for RAG
 */
export interface RetrieverConfig {
  /** Number of documents to retrieve */
  topK?: number;
  /** Minimum similarity score */
  minScore?: number;
  /** Search type */
  searchType?: "similarity" | "hybrid" | "mmr";
  /** Category filter */
  category?: string;
}

/**
 * Chain types available
 */
export type ChainType =
  | "conversational"
  | "qa"
  | "summarization"
  | "analysis"
  | "recommendation";

/**
 * Chain configuration
 */
export interface ChainConfig {
  /** Chain type */
  type: ChainType;
  /** Model to use */
  model?: LangChainModel;
  /** Temperature */
  temperature?: number;
  /** Memory configuration */
  memory?: MemoryConfig;
  /** Retriever configuration for RAG chains */
  retriever?: RetrieverConfig;
  /** Custom prompt template */
  promptTemplate?: string;
  /** Maximum tokens for response */
  maxTokens?: number;
}

/**
 * Callback for streaming responses
 */
export type StreamCallback = (token: string) => void;

/**
 * Options for chain execution
 */
export interface ChainExecutionOptions {
  /** Stream tokens as they're generated */
  stream?: boolean;
  /** Callback for streaming */
  onToken?: StreamCallback;
  /** Include intermediate steps in result */
  includeSteps?: boolean;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Abort signal for cancellation */
  signal?: AbortSignal;
}
