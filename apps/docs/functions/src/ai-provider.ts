/**
 * AI Provider Abstraction for Phoenix Rooivalk Documentation
 *
 * Supports multiple AI providers with automatic fallback:
 * - Azure AI Foundry (recommended - free credits available)
 * - OpenAI (fallback)
 *
 * Models available on Azure:
 * - gpt-4o (965K quota) → Main chat/RAG queries
 * - text-embedding-3-small (492K quota) → Embeddings
 * - gpt-5-nano (250K quota) → Quick summaries
 * - claude-sonnet-4-5 (2M quota) → Complex analysis
 */

import * as functions from "firebase-functions";

// Provider configuration
export interface AIProviderConfig {
  provider: "azure" | "openai";
  endpoint?: string; // Azure endpoint
  apiKey: string;
  deploymentName?: string; // Azure deployment name
  apiVersion?: string; // Azure API version
}

// Model routing - which model to use for what purpose
export const MODEL_ROUTING = {
  // Azure deployments
  azure: {
    chat: "gpt-4o", // Main chat/RAG queries
    chatFast: "gpt-5-nano", // Quick summaries
    chatAdvanced: "claude-sonnet-4-5", // Complex analysis
    embedding: "text-embedding-3-small",
  },
  // OpenAI models (fallback)
  openai: {
    chat: "gpt-4o-mini",
    chatFast: "gpt-4o-mini",
    chatAdvanced: "gpt-4o",
    embedding: "text-embedding-3-small",
  },
};

// Response tracking interface
export interface AIRequestMetrics {
  provider: string;
  model: string;
  latencyMs: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cached: boolean;
  timestamp: Date;
}

/**
 * Get provider configuration from environment
 */
export function getProviderConfig(): AIProviderConfig {
  const config = functions.config();

  // Check for Azure first (preferred due to free credits)
  if (config.azure?.endpoint && config.azure?.key) {
    return {
      provider: "azure",
      endpoint: config.azure.endpoint,
      apiKey: config.azure.key,
      deploymentName: config.azure.deployment,
      apiVersion: config.azure.api_version || "2024-02-15-preview",
    };
  }

  // Fallback to OpenAI
  if (config.openai?.key) {
    return {
      provider: "openai",
      apiKey: config.openai.key,
    };
  }

  throw new functions.https.HttpsError(
    "failed-precondition",
    "No AI provider configured. Set azure.key/azure.endpoint or openai.key",
  );
}

/**
 * Build the appropriate API URL based on provider
 */
function buildApiUrl(
  config: AIProviderConfig,
  endpoint: "chat" | "embeddings",
  model?: string,
): string {
  if (config.provider === "azure") {
    const deployment =
      model || config.deploymentName || MODEL_ROUTING.azure.chat;
    return `${config.endpoint}/openai/deployments/${deployment}/${endpoint === "chat" ? "chat/completions" : "embeddings"}?api-version=${config.apiVersion}`;
  }

  // OpenAI
  return endpoint === "chat"
    ? "https://api.openai.com/v1/chat/completions"
    : "https://api.openai.com/v1/embeddings";
}

/**
 * Build request headers based on provider
 */
function buildHeaders(config: AIProviderConfig): Record<string, string> {
  if (config.provider === "azure") {
    return {
      "Content-Type": "application/json",
      "api-key": config.apiKey,
    };
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${config.apiKey}`,
  };
}

/**
 * Chat completion with provider abstraction
 */
export async function chatCompletion(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  options: {
    model?: "chat" | "chatFast" | "chatAdvanced";
    maxTokens?: number;
    temperature?: number;
  } = {},
): Promise<{
  content: string;
  metrics: AIRequestMetrics;
}> {
  const config = getProviderConfig();
  const modelType = options.model || "chat";
  const modelName = MODEL_ROUTING[config.provider][modelType];

  const startTime = Date.now();

  const url = buildApiUrl(config, "chat", modelName);
  const headers = buildHeaders(config);

  const body: Record<string, unknown> = {
    messages,
    max_tokens: options.maxTokens || 1500,
    temperature: options.temperature ?? 0.3,
  };

  // Only include model for OpenAI (Azure uses deployment in URL)
  if (config.provider === "openai") {
    body.model = modelName;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.error?.message || `${config.provider} Chat API error`,
      );
    }

    const data = await response.json();
    const latencyMs = Date.now() - startTime;

    return {
      content:
        data.choices[0]?.message?.content || "Unable to generate response.",
      metrics: {
        provider: config.provider,
        model: modelName,
        latencyMs,
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
        cached: false,
        timestamp: new Date(),
      },
    };
  } catch (error) {
    functions.logger.error(`${config.provider} Chat error:`, error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to generate response",
    );
  }
}

/**
 * Generate embeddings with provider abstraction
 */
export async function generateEmbedding(text: string | string[]): Promise<{
  embeddings: number[][];
  metrics: AIRequestMetrics;
}> {
  const config = getProviderConfig();
  const modelName = MODEL_ROUTING[config.provider].embedding;

  const startTime = Date.now();

  const url = buildApiUrl(config, "embeddings", modelName);
  const headers = buildHeaders(config);

  const input = Array.isArray(text) ? text : [text];

  const body: Record<string, unknown> = {
    input,
  };

  // Only include model for OpenAI
  if (config.provider === "openai") {
    body.model = modelName;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.error?.message || `${config.provider} Embeddings API error`,
      );
    }

    const data = await response.json();
    const latencyMs = Date.now() - startTime;

    return {
      embeddings: data.data.map(
        (item: { embedding: number[] }) => item.embedding,
      ),
      metrics: {
        provider: config.provider,
        model: modelName,
        latencyMs,
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: 0,
        totalTokens: data.usage?.total_tokens || 0,
        cached: false,
        timestamp: new Date(),
      },
    };
  } catch (error) {
    functions.logger.error(`${config.provider} Embeddings error:`, error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to generate embeddings",
    );
  }
}

/**
 * Quick summary using fast model
 */
export async function quickSummary(
  content: string,
  maxLength: number = 200,
): Promise<{
  summary: string;
  metrics: AIRequestMetrics;
}> {
  const { content: summary, metrics } = await chatCompletion(
    [
      {
        role: "system",
        content: `You are a concise summarizer. Summarize the following in ${maxLength} characters or less. Be direct and informative.`,
      },
      {
        role: "user",
        content,
      },
    ],
    {
      model: "chatFast",
      maxTokens: 300,
      temperature: 0.3,
    },
  );

  return { summary, metrics };
}

/**
 * Complex analysis using advanced model
 */
export async function advancedAnalysis(
  prompt: string,
  context: string,
): Promise<{
  analysis: string;
  metrics: AIRequestMetrics;
}> {
  const { content: analysis, metrics } = await chatCompletion(
    [
      {
        role: "system",
        content:
          "You are an expert analyst specializing in defense technology and counter-UAS systems. Provide thorough, well-reasoned analysis.",
      },
      {
        role: "user",
        content: `Context:\n${context}\n\n${prompt}`,
      },
    ],
    {
      model: "chatAdvanced",
      maxTokens: 3000,
      temperature: 0.5,
    },
  );

  return { analysis, metrics };
}

/**
 * AI Provider interface for LangChain integration
 */
export interface AIProvider {
  chat: (options: {
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
    temperature?: number;
    maxTokens?: number;
  }) => Promise<{
    content: string;
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  }>;
}

/**
 * Get AI provider with chat interface for LangChain integration
 */
export function getAIProvider(): AIProvider {
  return {
    async chat(options) {
      const { content, metrics } = await chatCompletion(options.messages, {
        model: "chat",
        maxTokens: options.maxTokens,
        temperature: options.temperature,
      });

      return {
        content,
        usage: {
          promptTokens: metrics.promptTokens,
          completionTokens: metrics.completionTokens,
          totalTokens: metrics.totalTokens,
        },
      };
    },
  };
}
