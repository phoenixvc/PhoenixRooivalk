/**
 * LangChain Agent - Phase 2.4
 *
 * Agent implementation for autonomous task execution.
 * Combines tools with reasoning to accomplish complex tasks.
 */

import { getAIProvider } from "../ai-provider";
import { AgentConfig, AgentResult, ChatMessage, TokenUsage } from "./types";
import { AVAILABLE_TOOLS, formatToolsForPrompt, getTool } from "./tools";

/**
 * Default agent configuration
 */
const DEFAULT_AGENT_CONFIG: Partial<AgentConfig> = {
  model: "azure-openai",
  maxIterations: 5,
  temperature: 0.3,
  verbose: false,
};

/**
 * Agent class for autonomous task execution
 */
export class Agent {
  private config: AgentConfig;
  private conversationHistory: ChatMessage[] = [];
  private tokenUsage: TokenUsage = {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
  };

  constructor(
    config: Partial<AgentConfig> & { name: string; systemPrompt: string },
  ) {
    this.config = {
      ...DEFAULT_AGENT_CONFIG,
      tools: AVAILABLE_TOOLS,
      ...config,
    } as AgentConfig;
  }

  /**
   * Execute agent with a task
   */
  async execute(task: string): Promise<AgentResult> {
    const thoughts: string[] = [];
    const toolsUsed: string[] = [];
    let iterations = 0;

    try {
      // Add task to history
      this.conversationHistory.push({
        role: "user",
        content: task,
      });

      while (iterations < (this.config.maxIterations || 5)) {
        iterations++;

        // Generate thought and action
        const response = await this.think(task, thoughts);

        if (this.config.verbose) {
          console.log(`[Agent] Iteration ${iterations}:`, response.thought);
        }

        thoughts.push(response.thought);

        // Check if we have a final answer
        if (response.action === "final_answer") {
          this.conversationHistory.push({
            role: "assistant",
            content: response.answer || "",
          });

          return {
            output: response.answer || "",
            toolsUsed,
            iterations,
            thoughts: this.config.verbose ? thoughts : undefined,
            tokenUsage: this.tokenUsage,
            success: true,
          };
        }

        // Execute tool
        if (response.action && response.actionInput) {
          const toolResult = await this.executeTool(
            response.action,
            response.actionInput,
          );

          if (toolResult.success) {
            toolsUsed.push(response.action);
            thoughts.push(`Tool result: ${JSON.stringify(toolResult.result)}`);
          } else {
            thoughts.push(`Tool error: ${toolResult.error}`);
          }
        }
      }

      // Max iterations reached
      return {
        output:
          "I was unable to complete the task within the allowed iterations.",
        toolsUsed,
        iterations,
        thoughts: this.config.verbose ? thoughts : undefined,
        tokenUsage: this.tokenUsage,
        success: false,
        error: "Max iterations reached",
      };
    } catch (error) {
      return {
        output: "",
        toolsUsed,
        iterations,
        thoughts,
        tokenUsage: this.tokenUsage,
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Think about the current task and decide on action
   */
  private async think(
    task: string,
    previousThoughts: string[],
  ): Promise<{
    thought: string;
    action: string;
    actionInput?: unknown;
    answer?: string;
  }> {
    const provider = getAIProvider();

    const toolsDescription = formatToolsForPrompt(this.config.tools);

    const systemPrompt = `${this.config.systemPrompt}

You have access to the following tools:

${toolsDescription}

To use a tool, respond with:
Thought: [your reasoning about what to do]
Action: [tool name or "final_answer"]
Action Input: [JSON input for the tool, or your final answer]

Always think step by step. When you have enough information to answer, use Action: final_answer.`;

    const previousContext =
      previousThoughts.length > 0
        ? `\n\nPrevious thoughts and observations:\n${previousThoughts.join("\n")}`
        : "";

    const userMessage = `Task: ${task}${previousContext}\n\nWhat should I do next?`;

    const response = await provider.chat({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: this.config.temperature,
      maxTokens: 500,
    });

    // Update token usage
    if (response.usage) {
      this.tokenUsage.promptTokens += response.usage.promptTokens || 0;
      this.tokenUsage.completionTokens += response.usage.completionTokens || 0;
      this.tokenUsage.totalTokens += response.usage.totalTokens || 0;
    }

    // Parse response
    return this.parseAgentResponse(response.content);
  }

  /**
   * Parse agent response to extract thought, action, and input
   */
  private parseAgentResponse(response: string): {
    thought: string;
    action: string;
    actionInput?: unknown;
    answer?: string;
  } {
    const thoughtMatch = response.match(/Thought:\s*([\s\S]+?)(?=Action:|$)/);
    const actionMatch = response.match(/Action:\s*(\w+)/);
    const inputMatch = response.match(/Action Input:\s*([\s\S]+?)$/);

    const thought = thoughtMatch?.[1]?.trim() || response;
    const action = actionMatch?.[1]?.trim() || "final_answer";

    let actionInput: unknown;
    if (inputMatch) {
      const inputStr = inputMatch[1].trim();
      try {
        // Try to parse as JSON
        actionInput = JSON.parse(inputStr);
      } catch {
        // Use as string
        actionInput = inputStr;
      }
    }

    // If action is final_answer, the input is the answer
    if (action === "final_answer") {
      return {
        thought,
        action: "final_answer",
        answer: typeof actionInput === "string" ? actionInput : thought,
      };
    }

    return {
      thought,
      action,
      actionInput,
    };
  }

  /**
   * Execute a tool with given input
   */
  private async executeTool(
    toolName: string,
    input: unknown,
  ): Promise<{ success: boolean; result?: unknown; error?: string }> {
    const tool = getTool(toolName);

    if (!tool) {
      return {
        success: false,
        error: `Tool '${toolName}' not found`,
      };
    }

    try {
      const result = await tool.func(input);
      return { success: true, result };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
    this.tokenUsage = {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    };
  }

  /**
   * Get current token usage
   */
  getTokenUsage(): TokenUsage {
    return { ...this.tokenUsage };
  }
}

/**
 * Create a documentation Q&A agent
 */
export function createQAAgent(verbose = false): Agent {
  return new Agent({
    name: "documentation-qa-agent",
    systemPrompt: `You are an expert assistant for Phoenix Rooivalk documentation.
Your goal is to answer user questions accurately using the available documentation.
Always search for relevant information before providing answers.
Be thorough but concise in your responses.`,
    tools: [
      getTool("search_documents")!,
      getTool("hybrid_search")!,
      getTool("ask_question")!,
    ].filter(Boolean),
    verbose,
  });
}

/**
 * Create an analysis agent
 */
export function createAnalysisAgent(verbose = false): Agent {
  return new Agent({
    name: "analysis-agent",
    systemPrompt: `You are a strategic analyst specializing in defense technology.
Your goal is to provide thorough analysis based on documentation and data.
Use search tools to gather information, then synthesize insights.
Provide structured analysis with clear recommendations.`,
    tools: [
      getTool("search_documents")!,
      getTool("hybrid_search")!,
      getTool("summarize")!,
      getTool("calculator")!,
    ].filter(Boolean),
    maxIterations: 8,
    verbose,
  });
}

/**
 * Create a research agent
 */
export function createResearchAgent(verbose = false): Agent {
  return new Agent({
    name: "research-agent",
    systemPrompt: `You are a research assistant for technical documentation.
Your goal is to thoroughly research topics by searching multiple sources.
Compile comprehensive information and provide well-structured summaries.
Always cite your sources and note any information gaps.`,
    tools: [
      getTool("search_documents")!,
      getTool("hybrid_search")!,
      getTool("ask_question")!,
      getTool("summarize")!,
    ].filter(Boolean),
    maxIterations: 10,
    verbose,
  });
}
