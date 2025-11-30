/**
 * Azure AI Foundry (Azure OpenAI) Client
 *
 * Provides AI capabilities for Azure Functions using Azure OpenAI Service.
 *
 * Environment Variables (in order of precedence):
 * - AZURE_AI_ENDPOINT / AZURE_OPENAI_ENDPOINT - Azure OpenAI endpoint URL
 * - AZURE_AI_API_KEY / AZURE_OPENAI_API_KEY - API key for authentication
 * - AZURE_AI_DEPLOYMENT_NAME / AZURE_OPENAI_CHAT_DEPLOYMENT - Chat model deployment
 * - AZURE_AI_EMBEDDING_DEPLOYMENT / AZURE_OPENAI_EMBEDDING_DEPLOYMENT - Embedding model
 * - AZURE_ENTRA_AUTHORITY - Azure Entra ID authority for token-based auth (optional)
 */

import { AzureOpenAI } from "openai";
import { DefaultAzureCredential } from "@azure/identity";

let azureClient: AzureOpenAI | null = null;

// Default deployment names (configurable via env vars)
const DEFAULT_CHAT_DEPLOYMENT = "gpt-4";
const DEFAULT_EMBEDDING_DEPLOYMENT = "text-embedding-3-small";

/**
 * Get Azure AI configuration from environment variables
 * Supports both AZURE_AI_* and AZURE_OPENAI_* naming conventions
 */
function getAzureAIConfig() {
  // Endpoint: AZURE_AI_ENDPOINT takes precedence over AZURE_OPENAI_ENDPOINT
  const endpoint =
    process.env.AZURE_AI_ENDPOINT || process.env.AZURE_OPENAI_ENDPOINT;

  // API Key: AZURE_AI_API_KEY takes precedence
  const apiKey =
    process.env.AZURE_AI_API_KEY || process.env.AZURE_OPENAI_API_KEY;

  // Entra Authority for token-based auth
  const entraAuthority = process.env.AZURE_ENTRA_AUTHORITY;

  // API Version
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2024-10-21";

  // Deployment names
  const chatDeployment =
    process.env.AZURE_AI_DEPLOYMENT_NAME ||
    process.env.AZURE_OPENAI_CHAT_DEPLOYMENT ||
    DEFAULT_CHAT_DEPLOYMENT;

  const embeddingDeployment =
    process.env.AZURE_AI_EMBEDDING_DEPLOYMENT ||
    process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT ||
    DEFAULT_EMBEDDING_DEPLOYMENT;

  return {
    endpoint,
    apiKey,
    entraAuthority,
    apiVersion,
    chatDeployment,
    embeddingDeployment,
  };
}

/**
 * Get Azure OpenAI client (singleton)
 * Supports both API key and Azure Entra ID (Managed Identity) authentication
 */
export function getAzureOpenAIClient(): AzureOpenAI {
  if (!azureClient) {
    const config = getAzureAIConfig();

    if (!config.endpoint) {
      throw new Error(
        "Azure AI endpoint not configured. Set AZURE_AI_ENDPOINT or AZURE_OPENAI_ENDPOINT",
      );
    }

    // Use Azure Entra ID (Managed Identity) if no API key provided
    if (!config.apiKey && config.entraAuthority) {
      const credential = new DefaultAzureCredential();
      azureClient = new AzureOpenAI({
        endpoint: config.endpoint,
        apiVersion: config.apiVersion,
        azureADTokenProvider: async () => {
          const token = await credential.getToken(
            "https://cognitiveservices.azure.com/.default",
          );
          return token.token;
        },
      });
    } else if (config.apiKey) {
      // Use API key authentication
      azureClient = new AzureOpenAI({
        endpoint: config.endpoint,
        apiKey: config.apiKey,
        apiVersion: config.apiVersion,
      });
    } else {
      throw new Error(
        "Azure AI authentication not configured. Set AZURE_AI_API_KEY or AZURE_ENTRA_AUTHORITY for managed identity",
      );
    }
  }
  return azureClient;
}

/**
 * Get the configured chat deployment name
 */
export function getChatDeployment(): string {
  return getAzureAIConfig().chatDeployment;
}

/**
 * Get the configured embedding deployment name
 */
export function getEmbeddingDeployment(): string {
  return getAzureAIConfig().embeddingDeployment;
}

/**
 * Generate chat completion using Azure OpenAI
 */
export async function generateCompletion(
  systemPrompt: string,
  userPrompt: string,
  options?: {
    deployment?: string;
    maxTokens?: number;
    temperature?: number;
  },
): Promise<string> {
  const client = getAzureOpenAIClient();
  const deployment = options?.deployment || getChatDeployment();

  const completion = await client.chat.completions.create({
    model: deployment,
    max_tokens: options?.maxTokens || 2048,
    temperature: options?.temperature || 0.7,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  return completion.choices[0]?.message?.content || "";
}

/**
 * Generate embeddings for text using Azure OpenAI
 */
export async function generateEmbeddings(
  text: string,
  deployment?: string,
): Promise<number[]> {
  const client = getAzureOpenAIClient();
  const embeddingDeployment = deployment || getEmbeddingDeployment();

  const response = await client.embeddings.create({
    model: embeddingDeployment,
    input: text,
  });

  return response.data[0].embedding;
}

/**
 * Rate limiting helper
 */
const rateLimits = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const limit = rateLimits.get(key);

  if (!limit || now > limit.resetAt) {
    rateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (limit.count >= maxRequests) {
    return false;
  }

  limit.count++;
  return true;
}
