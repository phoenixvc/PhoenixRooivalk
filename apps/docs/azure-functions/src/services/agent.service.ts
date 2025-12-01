/**
 * LangChain-style AI Agent Service
 *
 * Implements an agentic AI system with tools and chain-of-thought reasoning.
 * Uses Azure OpenAI for LLM capabilities.
 */

import { createLogger, Logger } from "../lib/logger";
import { generateCompletion } from "../lib/openai";
import { hybridSearch, SearchResult } from "./hybrid-search.service";
import { newsRepository, NewsArticle } from "../repositories";

const logger: Logger = createLogger({ feature: "ai-agent" });

/**
 * Tool definition for the agent
 */
export interface AgentTool {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, { type: string; description: string }>;
    required?: string[];
  };
  execute: (params: Record<string, unknown>) => Promise<unknown>;
}

/**
 * Agent execution step
 */
export interface AgentStep {
  thought: string;
  action?: string;
  actionInput?: Record<string, unknown>;
  observation?: unknown;
  finalAnswer?: string;
}

/**
 * Agent execution result
 */
export interface AgentResult {
  answer: string;
  steps: AgentStep[];
  tokensUsed?: number;
  executionTimeMs: number;
}

/**
 * Agent options
 */
export interface AgentOptions {
  maxIterations?: number;
  temperature?: number;
  verbose?: boolean;
}

/**
 * Create the document search tool
 */
function createSearchTool(): AgentTool {
  return {
    name: "search_documents",
    description:
      "Search through documents and articles using semantic search. Use this to find relevant information.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query",
        },
        limit: {
          type: "number",
          description: "Maximum number of results (default: 5)",
        },
      },
      required: ["query"],
    },
    execute: async (params) => {
      const results = await hybridSearch(params.query as string, {
        limit: (params.limit as number) || 5,
      });
      return results.map((r) => ({
        title: r.title,
        content: r.content?.substring(0, 500),
        score: r.score,
      }));
    },
  };
}

/**
 * Create the news retrieval tool
 */
function createNewsTool(): AgentTool {
  return {
    name: "get_recent_news",
    description:
      "Get recent news articles. Use this to find current events and recent developments.",
    parameters: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description:
            "News category to filter by (e.g., technology, security)",
        },
        limit: {
          type: "number",
          description: "Maximum number of articles (default: 5)",
        },
      },
      required: [],
    },
    execute: async (params) => {
      const articles = await newsRepository.findRecent({
        category: params.category as string | undefined,
        limit: (params.limit as number) || 5,
      });
      return articles.map((a: NewsArticle) => ({
        title: a.title,
        summary: a.summary,
        category: a.category,
        publishedAt: a.publishedAt,
      }));
    },
  };
}

/**
 * Create the calculator tool
 */
function createCalculatorTool(): AgentTool {
  return {
    name: "calculator",
    description:
      "Perform mathematical calculations. Use this for any math operations.",
    parameters: {
      type: "object",
      properties: {
        expression: {
          type: "string",
          description:
            "Mathematical expression to evaluate (e.g., '2 + 2 * 3')",
        },
      },
      required: ["expression"],
    },
    execute: async (params) => {
      const expression = params.expression as string;

      try {
        // Safe evaluation using a simple parser (no eval/Function)
        const result = safeEvaluate(expression);
        return { result, expression };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Invalid expression";
        return { error: errorMessage, expression };
      }
    },
  };
}

/**
 * Safe mathematical expression evaluator
 * Only supports: numbers, +, -, *, /, %, parentheses, and spaces
 */
function safeEvaluate(expression: string): number {
  // Validate that expression only contains allowed characters
  const allowedPattern = /^[\d+\-*/%().\s]+$/;
  if (!allowedPattern.test(expression)) {
    throw new Error("Expression contains invalid characters");
  }

  // Tokenize
  const tokens = tokenize(expression);

  // Parse and evaluate using recursive descent parser
  let pos = 0;

  function parseExpression(): number {
    let left = parseTerm();

    while (
      pos < tokens.length &&
      (tokens[pos] === "+" || tokens[pos] === "-")
    ) {
      const op = tokens[pos++];
      const right = parseTerm();
      left = op === "+" ? left + right : left - right;
    }

    return left;
  }

  function parseTerm(): number {
    let left = parseFactor();

    while (
      pos < tokens.length &&
      (tokens[pos] === "*" || tokens[pos] === "/" || tokens[pos] === "%")
    ) {
      const op = tokens[pos++];
      const right = parseFactor();
      if (op === "*") left *= right;
      else if (op === "/") {
        if (right === 0) throw new Error("Division by zero");
        left /= right;
      } else left %= right;
    }

    return left;
  }

  function parseFactor(): number {
    // Handle negative numbers
    if (tokens[pos] === "-") {
      pos++;
      return -parseFactor();
    }

    // Handle parentheses
    if (tokens[pos] === "(") {
      pos++; // skip (
      const result = parseExpression();
      if (tokens[pos] !== ")") throw new Error("Missing closing parenthesis");
      pos++; // skip )
      return result;
    }

    // Parse number
    const num = parseFloat(tokens[pos]);
    if (isNaN(num)) throw new Error(`Invalid number: ${tokens[pos]}`);
    pos++;
    return num;
  }

  const result = parseExpression();

  if (pos < tokens.length) {
    throw new Error("Unexpected characters at end of expression");
  }

  return result;
}

/**
 * Tokenize mathematical expression
 */
function tokenize(expression: string): string[] {
  const tokens: string[] = [];
  let current = "";

  for (const char of expression) {
    if (char === " ") {
      if (current) {
        tokens.push(current);
        current = "";
      }
    } else if ("+-*/%()".includes(char)) {
      if (current) {
        tokens.push(current);
        current = "";
      }
      tokens.push(char);
    } else {
      current += char;
    }
  }

  if (current) {
    tokens.push(current);
  }

  return tokens;
}

/**
 * Create the current time tool
 */
function createTimeTool(): AgentTool {
  return {
    name: "get_current_time",
    description:
      "Get the current date and time. Use this when asked about today's date or current time.",
    parameters: {
      type: "object",
      properties: {
        timezone: {
          type: "string",
          description: "Timezone (e.g., 'UTC', 'America/New_York')",
        },
      },
      required: [],
    },
    execute: async (params) => {
      const now = new Date();
      const timezone = (params.timezone as string) || "UTC";
      try {
        return {
          iso: now.toISOString(),
          formatted: now.toLocaleString("en-US", { timeZone: timezone }),
          timezone,
        };
      } catch (error) {
        logger.warn("Invalid timezone, falling back to UTC", {
          operation: "timeTool",
          timezone,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        return {
          iso: now.toISOString(),
          formatted: now.toUTCString(),
          timezone: "UTC",
        };
      }
    },
  };
}

/**
 * Default tools available to the agent
 */
const defaultTools: AgentTool[] = [
  createSearchTool(),
  createNewsTool(),
  createCalculatorTool(),
  createTimeTool(),
];

/**
 * Build the system prompt for the agent
 */
function buildAgentSystemPrompt(tools: AgentTool[]): string {
  const toolDescriptions = tools
    .map(
      (tool) =>
        `${tool.name}: ${tool.description}\n  Parameters: ${JSON.stringify(tool.parameters.properties)}`,
    )
    .join("\n\n");

  return `You are a helpful AI assistant with access to tools. You should think step by step and use tools when needed to answer questions accurately.

Available tools:
${toolDescriptions}

When you need to use a tool, respond in this exact format:
Thought: [your reasoning about what to do next]
Action: [tool name]
Action Input: [JSON object with parameters]

When you observe the result, you'll continue with:
Thought: [your reasoning about the observation]

When you have enough information to answer, respond:
Thought: I now have enough information to answer.
Final Answer: [your complete answer]

Important:
- Always start with a Thought
- Use tools when you need information you don't have
- Provide a Final Answer when you're ready
- Be concise but thorough`;
}

/**
 * Parse the LLM response to extract action or final answer
 */
function parseAgentResponse(response: string): AgentStep {
  const step: AgentStep = { thought: "" };

  // Extract thought
  const thoughtMatch = response.match(
    /Thought:\s*(.+?)(?=\n(?:Action|Final Answer)|$)/s,
  );
  if (thoughtMatch) {
    step.thought = thoughtMatch[1].trim();
  }

  // Check for final answer
  const finalMatch = response.match(/Final Answer:\s*(.+)/s);
  if (finalMatch) {
    step.finalAnswer = finalMatch[1].trim();
    return step;
  }

  // Check for action
  const actionMatch = response.match(/Action:\s*(\w+)/);
  if (actionMatch) {
    step.action = actionMatch[1];

    // Extract action input
    const inputMatch = response.match(/Action Input:\s*({[\s\S]*?})/);
    if (inputMatch) {
      try {
        step.actionInput = JSON.parse(inputMatch[1]);
      } catch (error) {
        logger.debug("Failed to parse action input as JSON, using raw value", {
          operation: "parseAgentResponse",
          raw: inputMatch[1],
          error: error instanceof Error ? error.message : "Unknown error",
        });
        step.actionInput = { raw: inputMatch[1] };
      }
    }
  }

  return step;
}

/**
 * Execute the agent with a given query
 */
export async function runAgent(
  query: string,
  options: AgentOptions = {},
  customTools?: AgentTool[],
): Promise<AgentResult> {
  const { maxIterations = 5, temperature = 0.2, verbose = false } = options;
  const tools = customTools || defaultTools;

  const startTime = Date.now();
  const steps: AgentStep[] = [];

  logger.info("Running agent", { query, maxIterations });

  const systemPrompt = buildAgentSystemPrompt(tools);
  let conversationHistory = `User: ${query}\n\n`;

  for (let i = 0; i < maxIterations; i++) {
    if (verbose) {
      logger.debug(`Agent iteration ${i + 1}`, { conversationHistory });
    }

    // Get LLM response
    const response = await generateCompletion(
      systemPrompt,
      conversationHistory,
      {
        temperature,
        maxTokens: 1024,
      },
    );

    const step = parseAgentResponse(response);
    steps.push(step);

    // Check for final answer
    if (step.finalAnswer) {
      logger.info("Agent completed with final answer", {
        iterations: i + 1,
        executionTimeMs: Date.now() - startTime,
      });

      return {
        answer: step.finalAnswer,
        steps,
        executionTimeMs: Date.now() - startTime,
      };
    }

    // Execute tool if action specified
    if (step.action) {
      const tool = tools.find((t) => t.name === step.action);

      if (tool) {
        try {
          const observation = await tool.execute(step.actionInput || {});
          step.observation = observation;

          // Add to conversation
          conversationHistory += `Thought: ${step.thought}\n`;
          conversationHistory += `Action: ${step.action}\n`;
          conversationHistory += `Action Input: ${JSON.stringify(step.actionInput)}\n`;
          conversationHistory += `Observation: ${JSON.stringify(observation)}\n\n`;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          step.observation = { error: errorMessage };
          conversationHistory += `Observation: Error - ${errorMessage}\n\n`;
        }
      } else {
        step.observation = { error: `Unknown tool: ${step.action}` };
        conversationHistory += `Observation: Unknown tool: ${step.action}\n\n`;
      }
    } else {
      // No action and no final answer - prompt to continue
      conversationHistory += `${response}\n\nPlease continue. Either use a tool or provide a Final Answer.\n\n`;
    }
  }

  // Max iterations reached
  logger.warn("Agent reached max iterations", { maxIterations });

  const lastStep = steps[steps.length - 1];
  const answer =
    lastStep?.finalAnswer ||
    "I wasn't able to complete the task within the allowed iterations. Here's what I found: " +
      steps
        .filter((s) => s.observation)
        .map((s) => JSON.stringify(s.observation))
        .join("; ");

  return {
    answer,
    steps,
    executionTimeMs: Date.now() - startTime,
  };
}

/**
 * Run agent with streaming (returns async generator)
 */
export async function* runAgentStreaming(
  query: string,
  options: AgentOptions = {},
  customTools?: AgentTool[],
): AsyncGenerator<AgentStep, AgentResult, undefined> {
  const { maxIterations = 5, temperature = 0.2 } = options;
  const tools = customTools || defaultTools;

  const startTime = Date.now();
  const steps: AgentStep[] = [];

  const systemPrompt = buildAgentSystemPrompt(tools);
  let conversationHistory = `User: ${query}\n\n`;

  for (let i = 0; i < maxIterations; i++) {
    const response = await generateCompletion(
      systemPrompt,
      conversationHistory,
      {
        temperature,
        maxTokens: 1024,
      },
    );

    const step = parseAgentResponse(response);
    steps.push(step);

    // Yield the step
    yield step;

    if (step.finalAnswer) {
      return {
        answer: step.finalAnswer,
        steps,
        executionTimeMs: Date.now() - startTime,
      };
    }

    if (step.action) {
      const tool = tools.find((t) => t.name === step.action);

      if (tool) {
        try {
          const observation = await tool.execute(step.actionInput || {});
          step.observation = observation;
          yield step; // Yield again with observation

          conversationHistory += `Thought: ${step.thought}\n`;
          conversationHistory += `Action: ${step.action}\n`;
          conversationHistory += `Action Input: ${JSON.stringify(step.actionInput)}\n`;
          conversationHistory += `Observation: ${JSON.stringify(observation)}\n\n`;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          step.observation = { error: errorMessage };
          conversationHistory += `Observation: Error - ${errorMessage}\n\n`;
        }
      } else {
        step.observation = { error: `Unknown tool: ${step.action}` };
        conversationHistory += `Observation: Unknown tool: ${step.action}\n\n`;
      }
    } else {
      conversationHistory += `${response}\n\nPlease continue.\n\n`;
    }
  }

  const lastStep = steps[steps.length - 1];
  return {
    answer: lastStep?.finalAnswer || "Max iterations reached",
    steps,
    executionTimeMs: Date.now() - startTime,
  };
}

/**
 * Create a custom agent with specific tools
 */
export function createAgent(
  customTools: AgentTool[],
  options: AgentOptions = {},
): {
  run: (query: string) => Promise<AgentResult>;
  runStreaming: (
    query: string,
  ) => AsyncGenerator<AgentStep, AgentResult, undefined>;
} {
  return {
    run: (query: string) => runAgent(query, options, customTools),
    runStreaming: (query: string) =>
      runAgentStreaming(query, options, customTools),
  };
}

/**
 * Export default tools for customization
 */
export const tools = {
  search: createSearchTool,
  news: createNewsTool,
  calculator: createCalculatorTool,
  time: createTimeTool,
};
