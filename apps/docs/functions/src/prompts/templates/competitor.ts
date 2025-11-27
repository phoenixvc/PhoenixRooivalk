/**
 * Competitor Analysis Prompt Template
 *
 * Version: 1.1.0
 * Last Updated: 2025-11-27
 * Changelog: Added RAG context support for grounded analysis
 */

import { PromptTemplate } from "../types";
import { PHOENIX_CORE_CONTEXT } from "../context";

export const COMPETITOR_PROMPT: PromptTemplate = {
  metadata: {
    id: "competitor-analysis",
    name: "Competitor Analysis",
    category: "analysis",
    version: "1.1.0",
    description:
      "Analyzes competitors in the counter-drone/defense market with Phoenix Rooivalk context",
    createdAt: "2025-11-27",
    author: "Phoenix AI Team",
    changelog: "Added RAG context support for documentation-grounded analysis",
    recommendedModel: "chatAdvanced",
    maxTokens: 3000,
    temperature: 0.5,
    usesRAG: true,
    tags: ["analysis", "competitor", "defense", "market"],
  },

  system: {
    base: `You are a defense industry analyst specializing in counter-drone systems and autonomous defense platforms. You work for Phoenix Rooivalk.

${PHOENIX_CORE_CONTEXT}

Provide factual, objective analysis based on publicly available information. Focus on technical capabilities, market positioning, and strategic implications.`,

    contextMarker: "{{RAG_CONTEXT}}",

    ragTemplate: `
IMPORTANT: Use the following Phoenix Rooivalk documentation to provide accurate comparisons. Reference specific capabilities from this context:

{{RAG_CONTEXT}}

When comparing competitors, highlight how Phoenix Rooivalk's documented capabilities compare to each competitor's offerings.`,
  },

  user: {
    template: `Analyze the following competitors in the counter-drone/defense market:

Competitors: {{competitors}}

{{#focusAreas}}Focus areas: {{focusAreas}}{{/focusAreas}}

Provide a detailed competitive analysis including:
1. **Company Overview** - Brief background and market position
2. **Product Portfolio** - Key products and capabilities
3. **Technical Approach** - How their technology works
4. **Strengths** - What they do well
5. **Weaknesses** - Potential vulnerabilities or gaps
6. **Market Position** - Target customers, regions, contracts
7. **Threat Level** - How they compare to Phoenix Rooivalk
8. **Opportunities** - Where Phoenix Rooivalk can differentiate

Format the response in clear markdown with headers and bullet points.`,

    requiredVariables: ["competitors"],
    optionalVariables: {
      focusAreas: "",
    },
  },

  outputFormat: "markdown",
};
