/**
 * Reading Recommendations Prompt Template
 *
 * Version: 1.1.0
 * Last Updated: 2025-11-27
 * Changelog: Added semantic search support for better relevance
 */

import { PromptTemplate } from "../types";

export const RECOMMENDATIONS_PROMPT: PromptTemplate = {
  metadata: {
    id: "reading-recommendations",
    name: "Reading Recommendations",
    category: "recommendation",
    version: "1.1.0",
    description:
      "Suggests next articles based on reading history with semantic search",
    createdAt: "2025-11-27",
    author: "Phoenix AI Team",
    changelog: "Added semantic search for contextually relevant recommendations",
    recommendedModel: "chat",
    maxTokens: 1000,
    temperature: 0.5,
    usesRAG: true,
    tags: ["recommendation", "learning", "personalization"],
  },

  system: {
    base: `You are a documentation assistant for Phoenix Rooivalk, helping users navigate technical documentation about autonomous counter-drone systems. You understand learning paths and can recommend the most relevant next articles based on what the user has already read.`,

    contextMarker: "{{RAG_CONTEXT}}",
  },

  user: {
    template: `Based on the user's reading history, recommend the 3 most relevant articles to read next.

**Already read:**
{{readDocs}}

**Currently viewing:**
{{currentDocId}}

**Available unread articles:**
{{unreadDocs}}

Provide recommendations in this JSON format:
{
  "recommendations": [
    {
      "docId": "document-id",
      "reason": "Brief explanation why this is recommended next",
      "relevanceScore": 0.95
    }
  ],
  "learningPath": "Brief description of suggested learning path"
}

Consider:
1. Logical progression of topics
2. Prerequisites and dependencies
3. User's apparent interests based on reading history
4. Building comprehensive understanding`,

    requiredVariables: ["readDocs", "unreadDocs"],
    optionalVariables: {
      currentDocId: "Not specified",
    },
  },

  outputFormat: "json",

  outputSchema: {
    type: "object",
    properties: {
      recommendations: {
        type: "array",
        items: {
          type: "object",
          properties: {
            docId: { type: "string" },
            reason: { type: "string" },
            relevanceScore: { type: "number" },
          },
          required: ["docId", "reason", "relevanceScore"],
        },
      },
      learningPath: { type: "string" },
    },
    required: ["recommendations"],
  },
};
