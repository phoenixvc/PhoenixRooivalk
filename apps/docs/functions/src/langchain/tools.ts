/**
 * LangChain Tools - Phase 2.4
 *
 * Custom tools for LangChain agents.
 * Provides tools for document search, analysis, and external integrations.
 */

import { ToolDefinition } from "./types";
import { searchDocuments } from "../rag/search";
import { hybridSearch } from "../rag/hybrid-search";
import { askDocumentation } from "../rag/query";

/**
 * Document search tool
 */
export const documentSearchTool: ToolDefinition = {
  name: "search_documents",
  description: `Search Phoenix Rooivalk documentation for relevant information.
Use this tool when you need to find specific information about the product,
specifications, or technical details.`,
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "The search query",
      },
      category: {
        type: "string",
        description:
          "Optional category filter (e.g., 'technical', 'specifications')",
      },
      limit: {
        type: "number",
        description: "Maximum number of results (default: 5)",
      },
    },
    required: ["query"],
  },
  func: async (input: unknown) => {
    const {
      query,
      category,
      limit = 5,
    } = input as {
      query: string;
      category?: string;
      limit?: number;
    };

    const results = await searchDocuments(query, {
      topK: limit,
      category,
      minScore: 0.5,
    });

    return results.map((r) => ({
      title: r.title,
      content: r.content.substring(0, 500),
      source: r.source,
      score: r.score,
    }));
  },
};

/**
 * Hybrid search tool with semantic + keyword matching
 */
export const hybridSearchTool: ToolDefinition = {
  name: "hybrid_search",
  description: `Perform hybrid search combining semantic and keyword matching.
Use this for more precise searches when you need both meaning-based and exact matches.`,
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "The search query",
      },
      vectorWeight: {
        type: "number",
        description: "Weight for semantic search (0-1, default: 0.7)",
      },
      keywordWeight: {
        type: "number",
        description: "Weight for keyword search (0-1, default: 0.3)",
      },
    },
    required: ["query"],
  },
  func: async (input: unknown) => {
    const { query, vectorWeight, keywordWeight } = input as {
      query: string;
      vectorWeight?: number;
      keywordWeight?: number;
    };

    const results = await hybridSearch(query, {
      vectorWeight,
      keywordWeight,
      topK: 5,
    });

    return results.map((r) => ({
      title: r.title,
      content: r.content.substring(0, 500),
      combinedScore: r.combinedScore,
      scoreBreakdown: r.scoreBreakdown,
    }));
  },
};

/**
 * Q&A tool for direct questions
 */
export const questionAnswerTool: ToolDefinition = {
  name: "ask_question",
  description: `Ask a specific question about Phoenix Rooivalk documentation.
Use this when you need a direct answer rather than searching for documents.`,
  inputSchema: {
    type: "object",
    properties: {
      question: {
        type: "string",
        description: "The question to ask",
      },
      format: {
        type: "string",
        enum: ["concise", "detailed"],
        description: "Response format preference",
      },
    },
    required: ["question"],
  },
  func: async (input: unknown) => {
    const { question, format = "concise" } = input as {
      question: string;
      format?: "concise" | "detailed";
    };

    const result = await askDocumentation(question, { format });

    return {
      answer: result.answer,
      confidence: result.confidence,
      sources: result.sources,
    };
  },
};

/**
 * Calculator tool for numerical computations
 */
export const calculatorTool: ToolDefinition = {
  name: "calculator",
  description: `Perform mathematical calculations.
Use this for any numerical computations, unit conversions, or mathematical operations.`,
  inputSchema: {
    type: "object",
    properties: {
      expression: {
        type: "string",
        description:
          "Mathematical expression to evaluate (e.g., '2 + 2', '100 * 0.15')",
      },
    },
    required: ["expression"],
  },
  func: async (input: unknown) => {
    const { expression } = input as { expression: string };

    // Safe evaluation using Function constructor with limited scope
    try {
      // Only allow basic math operations
      const sanitized = expression.replace(/[^0-9+\-*/().%\s]/g, "");
      if (sanitized !== expression) {
        return { error: "Invalid characters in expression" };
      }

      // Use Function for safe evaluation
      const result = new Function(`return ${sanitized}`)();
      return { result, expression };
    } catch (error) {
      return { error: `Failed to evaluate: ${(error as Error).message}` };
    }
  },
};

/**
 * Date/time tool
 */
export const dateTimeTool: ToolDefinition = {
  name: "datetime",
  description: `Get current date and time information.
Use this when you need to know the current date, time, or perform date calculations.`,
  inputSchema: {
    type: "object",
    properties: {
      format: {
        type: "string",
        enum: ["iso", "readable", "date", "time"],
        description: "Output format (default: readable)",
      },
      timezone: {
        type: "string",
        description: "Timezone (e.g., 'UTC', 'America/New_York')",
      },
    },
  },
  func: async (input: unknown) => {
    const { format = "readable", timezone = "UTC" } = input as {
      format?: string;
      timezone?: string;
    };

    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { timeZone: timezone };

    switch (format) {
      case "iso":
        return { datetime: now.toISOString() };
      case "date":
        return { date: now.toLocaleDateString("en-US", options) };
      case "time":
        return { time: now.toLocaleTimeString("en-US", options) };
      default:
        return {
          datetime: now.toLocaleString("en-US", options),
          timestamp: now.getTime(),
        };
    }
  },
};

/**
 * Summary tool for text summarization
 */
export const summaryTool: ToolDefinition = {
  name: "summarize",
  description: `Summarize a piece of text or document content.
Use this when you need to condense long content into key points.`,
  inputSchema: {
    type: "object",
    properties: {
      text: {
        type: "string",
        description: "The text to summarize",
      },
      maxLength: {
        type: "number",
        description: "Maximum length of summary in words (default: 100)",
      },
    },
    required: ["text"],
  },
  func: async (input: unknown) => {
    const { text, maxLength = 100 } = input as {
      text: string;
      maxLength?: number;
    };

    // Use the Q&A system for summarization
    const result = await askDocumentation(
      `Please summarize the following in ${maxLength} words or less:\n\n${text}`,
      { format: "concise" },
    );

    return {
      summary: result.answer,
      originalLength: text.split(/\s+/).length,
    };
  },
};

/**
 * All available tools
 */
export const AVAILABLE_TOOLS: ToolDefinition[] = [
  documentSearchTool,
  hybridSearchTool,
  questionAnswerTool,
  calculatorTool,
  dateTimeTool,
  summaryTool,
];

/**
 * Get tool by name
 */
export function getTool(name: string): ToolDefinition | undefined {
  return AVAILABLE_TOOLS.find((t) => t.name === name);
}

/**
 * Get tools by names
 */
export function getTools(names: string[]): ToolDefinition[] {
  return names
    .map((name) => getTool(name))
    .filter((tool): tool is ToolDefinition => tool !== undefined);
}

/**
 * List all available tool names
 */
export function listToolNames(): string[] {
  return AVAILABLE_TOOLS.map((t) => t.name);
}

/**
 * Format tool descriptions for LLM prompt
 */
export function formatToolsForPrompt(tools: ToolDefinition[]): string {
  return tools
    .map(
      (t) =>
        `Tool: ${t.name}\nDescription: ${t.description}\nInput: ${JSON.stringify(t.inputSchema, null, 2)}`,
    )
    .join("\n\n---\n\n");
}
