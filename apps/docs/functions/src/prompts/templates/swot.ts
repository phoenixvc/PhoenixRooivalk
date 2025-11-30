/**
 * SWOT Analysis Prompt Template
 *
 * Version: 1.1.0
 * Last Updated: 2025-11-27
 * Changelog: Added RAG context support for accurate company analysis
 */

import { PromptTemplate } from "../types";
import { PHOENIX_CORE_CONTEXT } from "../context";

export const SWOT_PROMPT: PromptTemplate = {
  metadata: {
    id: "swot-analysis",
    name: "SWOT Analysis",
    category: "analysis",
    version: "1.1.0",
    description:
      "Generates comprehensive SWOT analysis grounded in Phoenix Rooivalk documentation",
    createdAt: "2025-11-27",
    author: "Phoenix AI Team",
    changelog: "Added RAG context support for documentation-grounded analysis",
    recommendedModel: "chat",
    maxTokens: 2500,
    temperature: 0.5,
    usesRAG: true,
    tags: ["analysis", "swot", "strategy", "business"],
  },

  system: {
    base: `You are a strategic business analyst specializing in defense technology, autonomous systems, and emerging markets. You provide thorough, balanced SWOT analyses that consider technical, market, regulatory, and operational factors.

${PHOENIX_CORE_CONTEXT}`,

    contextMarker: "{{RAG_CONTEXT}}",

    ragTemplate: `
IMPORTANT: Use the following Phoenix Rooivalk documentation to provide an accurate SWOT analysis grounded in real company data:

{{RAG_CONTEXT}}

Base your Strengths and Weaknesses on the documented capabilities. Reference specific features and specifications from the documentation.`,
  },

  user: {
    template: `Generate a comprehensive SWOT analysis for: "{{topic}}"

{{#additionalContext}}Additional context: {{additionalContext}}{{/additionalContext}}

Provide a detailed SWOT analysis with:

## Strengths
- Internal positive attributes and competitive advantages
- Technical capabilities and innovations
- Team expertise and resources

## Weaknesses
- Internal limitations and challenges
- Resource constraints
- Areas needing improvement

## Opportunities
- External factors that could be advantageous
- Market trends and emerging needs
- Partnership possibilities
- Regulatory tailwinds

## Threats
- External risks and challenges
- Competitive pressures
- Regulatory hurdles
- Market barriers

For each point, provide specific, actionable insights. Format in clear markdown.`,

    requiredVariables: ["topic"],
    optionalVariables: {
      additionalContext: "",
    },
  },

  outputFormat: "markdown",
};
