/**
 * LangChain Module - Phase 2.4
 *
 * Foundation for advanced AI workflows using LangChain patterns.
 *
 * Features:
 * - Composable chains for Q&A, summarization, and analysis
 * - Custom tools for document search and external integrations
 * - Agent-based autonomous task execution
 * - Memory management for conversational contexts
 *
 * Usage:
 * ```typescript
 * import { createChain, createQAAgent } from './langchain';
 *
 * // Use a chain
 * const qaChain = createChain({ type: 'qa' });
 * const result = await qaChain.execute('What is Phoenix Rooivalk?');
 *
 * // Use an agent
 * const agent = createQAAgent();
 * const agentResult = await agent.execute('Compare the specifications');
 * ```
 */

// Type exports
export type {
  LangChainModel,
  ChainResult,
  ChainStep,
  TokenUsage,
  LangChainDocument,
  ToolDefinition,
  AgentConfig,
  AgentResult,
  MemoryConfig,
  ChatMessage,
  RetrieverConfig,
  ChainType,
  ChainConfig,
  StreamCallback,
  ChainExecutionOptions,
} from "./types";

// Chain exports
export {
  ConversationalChain,
  RAGQAChain,
  SummarizationChain,
  AnalysisChain,
  RecommendationChain,
  createChain,
} from "./chains";

// Tool exports
export {
  documentSearchTool,
  hybridSearchTool,
  questionAnswerTool,
  calculatorTool,
  dateTimeTool,
  summaryTool,
  AVAILABLE_TOOLS,
  getTool,
  getTools,
  listToolNames,
  formatToolsForPrompt,
} from "./tools";

// Agent exports
export {
  Agent,
  createQAAgent,
  createAnalysisAgent,
  createResearchAgent,
} from "./agent";
