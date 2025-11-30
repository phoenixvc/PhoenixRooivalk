/**
 * OpenAI Client
 *
 * Provides AI capabilities for Azure Functions.
 */

import OpenAI from 'openai';

let openaiClient: OpenAI | null = null;

/**
 * Get OpenAI client (singleton)
 */
export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

/**
 * Generate chat completion
 */
export async function generateCompletion(
  systemPrompt: string,
  userPrompt: string,
  options?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  }
): Promise<string> {
  const client = getOpenAIClient();

  const completion = await client.chat.completions.create({
    model: options?.model || 'gpt-4-turbo-preview',
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
 * Generate embeddings for text
 */
export async function generateEmbeddings(
  text: string,
  model: string = 'text-embedding-3-small'
): Promise<number[]> {
  const client = getOpenAIClient();

  const response = await client.embeddings.create({
    model,
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
