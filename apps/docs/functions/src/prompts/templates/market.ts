/**
 * Market Insights Prompt Template
 *
 * Version: 1.1.0
 * Last Updated: 2025-11-27
 * Changelog: Added RAG context support for company-grounded market analysis
 */

import { PromptTemplate } from "../types";
import { PHOENIX_CORE_CONTEXT } from "../context";

export const MARKET_PROMPT: PromptTemplate = {
  metadata: {
    id: "market-insights",
    name: "Market Insights",
    category: "analysis",
    version: "1.1.0",
    description:
      "Generates market analysis grounded in Phoenix Rooivalk positioning",
    createdAt: "2025-11-27",
    author: "Phoenix AI Team",
    changelog: "Added RAG context support for company-specific market insights",
    recommendedModel: "chatAdvanced",
    maxTokens: 3000,
    temperature: 0.5,
    usesRAG: true,
    tags: ["analysis", "market", "business", "intelligence"],
  },

  system: {
    base: `You are a market intelligence analyst specializing in defense technology, counter-drone systems, and autonomous platforms. You provide data-driven insights based on publicly available market research, industry reports, and news.

${PHOENIX_CORE_CONTEXT}`,

    contextMarker: "{{RAG_CONTEXT}}",

    ragTemplate: `
IMPORTANT: Use the following Phoenix Rooivalk documentation to provide market insights grounded in the company's actual positioning and capabilities:

{{RAG_CONTEXT}}

Reference Phoenix Rooivalk's documented market position and competitive advantages when discussing market opportunities and trends.`,
  },

  user: {
    template: `Provide market insights on: "{{topic}}"

{{#industry}}Industry focus: {{industry}}{{/industry}}
{{^industry}}Industry: Defense / Counter-UAS{{/industry}}

Include:

## Market Overview
- Current market size and growth projections
- Key market drivers and trends

## Key Players
- Major companies and their market positions
- Recent significant developments

## Regional Analysis
- Geographic market distribution
- Emerging markets and opportunities

## Technology Trends
- Emerging technologies and innovations
- R&D focus areas

## Regulatory Landscape
- Key regulations affecting the market
- Certification requirements

## Investment & M&A Activity
- Recent funding rounds and acquisitions
- Investment trends

## Opportunities for Phoenix Rooivalk
- Specific market opportunities
- Strategic recommendations

Provide specific data points where available. Note any limitations in available data.`,

    requiredVariables: ["topic"],
    optionalVariables: {
      industry: "Defense / Counter-UAS",
    },
  },

  outputFormat: "markdown",
};
