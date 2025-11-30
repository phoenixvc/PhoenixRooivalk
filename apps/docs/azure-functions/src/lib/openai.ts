/**
 * Azure AI Foundry (Azure OpenAI) Client
 *
 * Provides AI capabilities for Azure Functions using Azure OpenAI Service.
 */

import { AzureOpenAI } from 'openai';

let azureClient: AzureOpenAI | null = null;

// Default deployment names (configurable via env vars)
const DEFAULT_CHAT_DEPLOYMENT = 'gpt-4';
const DEFAULT_EMBEDDING_DEPLOYMENT = 'text-embedding-3-small';

/**
 * Get Azure OpenAI client (singleton)
 */
export function getAzureOpenAIClient(): AzureOpenAI {
  if (!azureClient) {
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-08-01-preview';

    if (!endpoint) {
      throw new Error('AZURE_OPENAI_ENDPOINT not configured');
    }
    if (!apiKey) {
      throw new Error('AZURE_OPENAI_API_KEY not configured');
    }

    azureClient = new AzureOpenAI({
      endpoint,
      apiKey,
      apiVersion,
    });
  }
  return azureClient;
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
  }
): Promise<string> {
  const client = getAzureOpenAIClient();
  const deployment = options?.deployment || process.env.AZURE_OPENAI_CHAT_DEPLOYMENT || DEFAULT_CHAT_DEPLOYMENT;

  const completion = await client.chat.completions.create({
    model: deployment,
    max_tokens: options?.maxTokens || 2048,
    temperature: options?.temperature || 0.7,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  });

  return completion.choices[0]?.message?.content || '';
}

/**
 * Generate embeddings for text using Azure OpenAI
 */
export async function generateEmbeddings(
  text: string,
  deployment?: string
): Promise<number[]> {
  const client = getAzureOpenAIClient();
  const embeddingDeployment = deployment || process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT || DEFAULT_EMBEDDING_DEPLOYMENT;

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
  windowMs: number
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
