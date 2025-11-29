/**
 * LangChain Chains - Phase 2.4
 *
 * Chain implementations for various AI workflows.
 * Provides composable chains for Q&A, summarization, and analysis.
 */

import { getAIProvider } from "../ai-provider";
import { searchDocuments } from "../rag/search";
import { hybridSearch } from "../rag/hybrid-search";
import {
  ChainConfig,
  ChainResult,
  ChainStep,
  ChainExecutionOptions,
  LangChainDocument,
  ChatMessage,
  TokenUsage,
} from "./types";

/**
 * Base chain class for common functionality
 */
abstract class BaseChain {
  protected config: ChainConfig;
  protected messages: ChatMessage[] = [];

  constructor(config: ChainConfig) {
    this.config = {
      model: "azure-openai",
      temperature: 0.7,
      maxTokens: 1000,
      ...config,
    };
  }

  /**
   * Execute the chain
   */
  abstract execute(
    input: string,
    options?: ChainExecutionOptions,
  ): Promise<ChainResult<string>>;

  /**
   * Call the AI provider
   */
  protected async callLLM(
    prompt: string,
    systemPrompt?: string,
  ): Promise<{ response: string; usage?: TokenUsage }> {
    const provider = getAIProvider();
    const startTime = Date.now();

    try {
      const response = await provider.chat({
        messages: [
          ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
          { role: "user" as const, content: prompt },
        ],
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
      });

      return {
        response: response.content,
        usage: {
          promptTokens: response.usage?.promptTokens || 0,
          completionTokens: response.usage?.completionTokens || 0,
          totalTokens: response.usage?.totalTokens || 0,
        },
      };
    } catch (error) {
      throw new Error(`LLM call failed: ${(error as Error).message}`);
    }
  }

  /**
   * Add message to memory
   */
  protected addToMemory(role: "user" | "assistant", content: string): void {
    if (!this.config.memory) return;

    this.messages.push({
      role,
      content,
      timestamp: new Date().toISOString(),
    });

    // Trim to max messages
    const maxMessages = this.config.memory.maxMessages || 10;
    if (this.messages.length > maxMessages) {
      this.messages = this.messages.slice(-maxMessages);
    }
  }

  /**
   * Get memory context
   */
  protected getMemoryContext(): string {
    if (!this.config.memory || this.messages.length === 0) {
      return "";
    }

    return this.messages
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");
  }

  /**
   * Clear memory
   */
  clearMemory(): void {
    this.messages = [];
  }
}

/**
 * Conversational chain with memory
 */
export class ConversationalChain extends BaseChain {
  private systemPrompt: string;

  constructor(config: ChainConfig = { type: "conversational" }) {
    super({
      ...config,
      memory: config.memory || { type: "buffer", maxMessages: 10 },
    });

    this.systemPrompt = `You are a helpful AI assistant for Phoenix Rooivalk documentation.
You provide accurate, helpful responses about defense industry topics, technical specifications,
and documentation guidance. Be professional and thorough.`;
  }

  async execute(
    input: string,
    options?: ChainExecutionOptions,
  ): Promise<ChainResult<string>> {
    const startTime = Date.now();
    const steps: ChainStep[] = [];

    try {
      // Step 1: Build context from memory
      const memoryContext = this.getMemoryContext();
      steps.push({
        name: "memory_retrieval",
        input: null,
        output: memoryContext,
        timeMs: Date.now() - startTime,
      });

      // Step 2: Build prompt with context
      const prompt = memoryContext
        ? `Previous conversation:\n${memoryContext}\n\nUser: ${input}`
        : input;

      // Step 3: Call LLM
      const { response, usage } = await this.callLLM(prompt, this.systemPrompt);
      steps.push({
        name: "llm_call",
        input: prompt,
        output: response,
        timeMs: Date.now() - startTime,
      });

      // Step 4: Update memory
      this.addToMemory("user", input);
      this.addToMemory("assistant", response);

      return {
        output: response,
        intermediateSteps: options?.includeSteps ? steps : undefined,
        tokenUsage: usage,
        executionTimeMs: Date.now() - startTime,
        success: true,
      };
    } catch (error) {
      return {
        output: "",
        intermediateSteps: steps,
        executionTimeMs: Date.now() - startTime,
        success: false,
        error: (error as Error).message,
      };
    }
  }
}

/**
 * RAG Q&A chain with document retrieval
 */
export class RAGQAChain extends BaseChain {
  constructor(config: ChainConfig = { type: "qa" }) {
    super({
      ...config,
      retriever: config.retriever || { topK: 5, minScore: 0.5 },
    });
  }

  async execute(
    input: string,
    options?: ChainExecutionOptions,
  ): Promise<ChainResult<string>> {
    const startTime = Date.now();
    const steps: ChainStep[] = [];

    try {
      // Step 1: Retrieve relevant documents
      const searchType = this.config.retriever?.searchType || "hybrid";
      let documents: LangChainDocument[];

      if (searchType === "hybrid") {
        const results = await hybridSearch(input, {
          topK: this.config.retriever?.topK || 5,
          minScore: this.config.retriever?.minScore || 0.5,
          category: this.config.retriever?.category,
        });
        documents = results.map((r) => ({
          id: r.docId,
          pageContent: r.content,
          metadata: { title: r.title, source: r.source },
        }));
      } else {
        const results = await searchDocuments(input, {
          topK: this.config.retriever?.topK || 5,
          minScore: this.config.retriever?.minScore || 0.5,
          category: this.config.retriever?.category,
        });
        documents = results.map((r) => ({
          id: r.docId,
          pageContent: r.content,
          metadata: { title: r.title, source: r.source },
        }));
      }

      steps.push({
        name: "document_retrieval",
        input: input,
        output: `Retrieved ${documents.length} documents`,
        timeMs: Date.now() - startTime,
      });

      // Step 2: Build context from documents
      const context = documents
        .map((d) => `[${d.metadata.title || d.id}]\n${d.pageContent}`)
        .join("\n\n---\n\n");

      // Step 3: Generate answer
      const systemPrompt = `You are a knowledgeable assistant for Phoenix Rooivalk documentation.
Answer questions based ONLY on the provided context. If the context doesn't contain
relevant information, say so clearly. Be accurate and cite sources when possible.`;

      const prompt = `Context:\n${context}\n\nQuestion: ${input}\n\nAnswer:`;

      const { response, usage } = await this.callLLM(prompt, systemPrompt);
      steps.push({
        name: "answer_generation",
        input: prompt.substring(0, 200) + "...",
        output: response,
        timeMs: Date.now() - startTime,
      });

      return {
        output: response,
        intermediateSteps: options?.includeSteps ? steps : undefined,
        tokenUsage: usage,
        executionTimeMs: Date.now() - startTime,
        success: true,
      };
    } catch (error) {
      return {
        output: "",
        intermediateSteps: steps,
        executionTimeMs: Date.now() - startTime,
        success: false,
        error: (error as Error).message,
      };
    }
  }
}

/**
 * Summarization chain for document condensation
 */
export class SummarizationChain extends BaseChain {
  constructor(config: ChainConfig = { type: "summarization" }) {
    super(config);
  }

  async execute(
    input: string,
    options?: ChainExecutionOptions,
  ): Promise<ChainResult<string>> {
    const startTime = Date.now();
    const steps: ChainStep[] = [];

    try {
      const systemPrompt = `You are an expert at summarizing technical documentation.
Create clear, concise summaries that capture key points, specifications, and important details.
Structure your summary with bullet points for clarity.`;

      const prompt = `Please summarize the following content:\n\n${input}\n\nSummary:`;

      const { response, usage } = await this.callLLM(prompt, systemPrompt);
      steps.push({
        name: "summarization",
        input: input.substring(0, 200) + "...",
        output: response,
        timeMs: Date.now() - startTime,
      });

      return {
        output: response,
        intermediateSteps: options?.includeSteps ? steps : undefined,
        tokenUsage: usage,
        executionTimeMs: Date.now() - startTime,
        success: true,
      };
    } catch (error) {
      return {
        output: "",
        intermediateSteps: steps,
        executionTimeMs: Date.now() - startTime,
        success: false,
        error: (error as Error).message,
      };
    }
  }
}

/**
 * Analysis chain for structured analysis
 */
export class AnalysisChain extends BaseChain {
  private analysisType: "swot" | "competitor" | "market" | "general";

  constructor(
    config: ChainConfig = { type: "analysis" },
    analysisType: "swot" | "competitor" | "market" | "general" = "general",
  ) {
    super(config);
    this.analysisType = analysisType;
  }

  async execute(
    input: string,
    options?: ChainExecutionOptions,
  ): Promise<ChainResult<string>> {
    const startTime = Date.now();
    const steps: ChainStep[] = [];

    try {
      const systemPrompts: Record<string, string> = {
        swot: `You are a strategic analyst. Provide comprehensive SWOT analysis
with Strengths, Weaknesses, Opportunities, and Threats clearly organized.`,
        competitor: `You are a competitive intelligence analyst. Analyze competitors
with focus on their strengths, market position, and strategic implications.`,
        market: `You are a market research analyst. Provide data-driven market analysis
with trends, opportunities, and strategic recommendations.`,
        general: `You are a technical analyst. Provide thorough, structured analysis
with key findings, implications, and recommendations.`,
      };

      const systemPrompt = systemPrompts[this.analysisType];
      const { response, usage } = await this.callLLM(input, systemPrompt);

      steps.push({
        name: `${this.analysisType}_analysis`,
        input: input.substring(0, 200) + "...",
        output: response,
        timeMs: Date.now() - startTime,
      });

      return {
        output: response,
        intermediateSteps: options?.includeSteps ? steps : undefined,
        tokenUsage: usage,
        executionTimeMs: Date.now() - startTime,
        success: true,
      };
    } catch (error) {
      return {
        output: "",
        intermediateSteps: steps,
        executionTimeMs: Date.now() - startTime,
        success: false,
        error: (error as Error).message,
      };
    }
  }
}

/**
 * Recommendation chain for content recommendations
 */
export class RecommendationChain extends BaseChain {
  constructor(config: ChainConfig = { type: "recommendation" }) {
    super(config);
  }

  async execute(
    input: string,
    options?: ChainExecutionOptions,
  ): Promise<ChainResult<string>> {
    const startTime = Date.now();
    const steps: ChainStep[] = [];

    try {
      // Step 1: Retrieve related documents
      const results = await hybridSearch(input, {
        topK: 10,
        minScore: 0.4,
      });

      steps.push({
        name: "document_search",
        input: input,
        output: `Found ${results.length} related documents`,
        timeMs: Date.now() - startTime,
      });

      // Step 2: Generate recommendations
      const docList = results
        .map((r) => `- ${r.title}: ${r.content.substring(0, 100)}...`)
        .join("\n");

      const systemPrompt = `You are a documentation recommendation system.
Based on the user's interests and the available documents, provide personalized
recommendations with brief explanations of why each is relevant.`;

      const prompt = `User interests: ${input}\n\nAvailable documents:\n${docList}\n\nRecommendations:`;

      const { response, usage } = await this.callLLM(prompt, systemPrompt);

      steps.push({
        name: "recommendation_generation",
        input: input,
        output: response,
        timeMs: Date.now() - startTime,
      });

      return {
        output: response,
        intermediateSteps: options?.includeSteps ? steps : undefined,
        tokenUsage: usage,
        executionTimeMs: Date.now() - startTime,
        success: true,
      };
    } catch (error) {
      return {
        output: "",
        intermediateSteps: steps,
        executionTimeMs: Date.now() - startTime,
        success: false,
        error: (error as Error).message,
      };
    }
  }
}

/**
 * Create a chain from configuration
 */
export function createChain(config: ChainConfig): BaseChain {
  switch (config.type) {
    case "conversational":
      return new ConversationalChain(config);
    case "qa":
      return new RAGQAChain(config);
    case "summarization":
      return new SummarizationChain(config);
    case "analysis":
      return new AnalysisChain(config);
    case "recommendation":
      return new RecommendationChain(config);
    default:
      throw new Error(`Unknown chain type: ${config.type}`);
  }
}
