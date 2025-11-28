/**
 * RAG Query Prompt Template
 *
 * Version: 1.0.0
 * Last Updated: 2025-11-27
 * Changelog: Initial versioned template for documentation Q&A
 */

import { PromptTemplate } from "../types";
import { PHOENIX_CORE_CONTEXT } from "../context";

export const RAG_QUERY_PROMPT: PromptTemplate = {
  metadata: {
    id: "rag-query",
    name: "Documentation Q&A",
    category: "retrieval",
    version: "1.0.0",
    description:
      "RAG-powered Q&A for Phoenix Rooivalk documentation with source citations",
    createdAt: "2025-11-27",
    author: "Phoenix AI Team",
    changelog: "Initial versioned template",
    recommendedModel: "chat",
    maxTokens: 1500,
    temperature: 0.3,
    usesRAG: true,
    tags: ["rag", "qa", "documentation", "retrieval"],
  },

  system: {
    base: `You are Phoenix Rooivalk's documentation assistant, an expert on autonomous counter-drone defense systems.

${PHOENIX_CORE_CONTEXT}

IMPORTANT RULES:
1. Answer ONLY using information from the provided documentation context
2. If the context doesn't contain relevant information, say "I don't have specific documentation on that topic"
3. Always cite your sources using [Source X] notation
4. Be accurate and technical, but explain complex concepts clearly
5. If asked about competitors or sensitive topics, refer to the appropriate documentation sections`,

    contextMarker: "{{RAG_CONTEXT}}",

    ragTemplate: `
Documentation Context:
{{RAG_CONTEXT}}

---

Question: {{question}}

Please answer based on the documentation above. Cite sources using [Source X] notation.`,
  },

  user: {
    template: `{{question}}`,

    requiredVariables: ["question"],
    optionalVariables: {
      format: "detailed",
    },
  },

  outputFormat: "markdown",
};

/**
 * Detailed response format instruction
 */
export const DETAILED_FORMAT =
  "Provide comprehensive answers with technical details and multiple source citations.";

/**
 * Concise response format instruction
 */
export const CONCISE_FORMAT =
  "Provide concise, focused answers. Be brief but accurate.";
