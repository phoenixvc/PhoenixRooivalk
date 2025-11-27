/**
 * Prompt Management System
 *
 * Centralized prompt management for Phoenix Rooivalk AI features.
 *
 * Architecture:
 * - types.ts: Type definitions for prompts, metadata, and execution
 * - context.ts: Company context definitions for injection
 * - templates/: Individual prompt templates with versioning
 * - executor.ts: Prompt execution with RAG integration
 *
 * Usage:
 * ```typescript
 * import { getPromptTemplate, executePrompt } from './prompts';
 *
 * const template = getPromptTemplate('competitor-analysis');
 * const result = await executePrompt(template, {
 *   variables: { competitors: ['Company A', 'Company B'] },
 *   ragContext: documentContext,
 * });
 * ```
 */

// Type exports
export type {
  AIModel,
  PromptCategory,
  PromptMetadata,
  SystemPromptTemplate,
  UserPromptTemplate,
  PromptTemplate,
  PromptContext,
  PromptExecutionResult,
} from "./types";

// Context exports
export {
  PHOENIX_CORE_CONTEXT,
  PHOENIX_TECHNICAL_CONTEXT,
  PHOENIX_MARKET_CONTEXT,
  getContextForCategory,
  buildRAGContextSection,
} from "./context";

// Template exports
export {
  PROMPT_REGISTRY,
  getPromptTemplate,
  listPromptIds,
  getPromptsByCategory,
  COMPETITOR_PROMPT,
  SWOT_PROMPT,
  MARKET_PROMPT,
  RAG_QUERY_PROMPT,
  RECOMMENDATIONS_PROMPT,
} from "./templates";

// Legacy compatibility - export old PROMPTS object
// TODO: Migrate all usages to new template system
import { PHOENIX_CORE_CONTEXT } from "./context";

/**
 * @deprecated Use getPromptTemplate() instead
 * Legacy PROMPTS object for backwards compatibility
 */
export const PROMPTS = {
  competitor: {
    system: `You are a defense industry analyst specializing in counter-drone systems and autonomous defense platforms. You work for Phoenix Rooivalk.

${PHOENIX_CORE_CONTEXT}

Provide factual, objective analysis based on publicly available information. Focus on technical capabilities, market positioning, and strategic implications.`,

    user: (competitors: string[], focusAreas?: string[]) =>
      `Analyze the following competitors in the counter-drone/defense market:

Competitors: ${competitors.join(", ")}

${focusAreas ? `Focus areas: ${focusAreas.join(", ")}` : ""}

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
  },

  swot: {
    system: `You are a strategic business analyst specializing in defense technology, autonomous systems, and emerging markets. You provide thorough, balanced SWOT analyses that consider technical, market, regulatory, and operational factors.

${PHOENIX_CORE_CONTEXT}`,

    user: (topic: string, context?: string) =>
      `Generate a comprehensive SWOT analysis for: "${topic}"

${context ? `Additional context: ${context}` : ""}

Provide a detailed SWOT analysis with:

## Strengths
- Internal positive attributes and competitive advantages

## Weaknesses
- Internal limitations and challenges

## Opportunities
- External factors that could be advantageous

## Threats
- External risks and challenges

For each point, provide specific, actionable insights. Format in clear markdown.`,
  },

  market: {
    system: `You are a market intelligence analyst specializing in defense technology, counter-drone systems, and autonomous platforms.

${PHOENIX_CORE_CONTEXT}`,

    user: (topic: string, industry?: string) =>
      `Provide market insights on: "${topic}"

${industry ? `Industry focus: ${industry}` : "Industry: Defense / Counter-UAS"}

Include market overview, key players, regional analysis, technology trends, and opportunities for Phoenix Rooivalk.`,
  },

  improvement: {
    system: `You are a technical documentation expert specializing in defense technology, autonomous systems, and technical writing best practices.`,

    user: (docId: string, docTitle: string, docContent: string) =>
      `Review this documentation and suggest improvements:

**Document:** ${docTitle}
**Document ID:** ${docId}

**Content:**
${docContent}

Provide improvement suggestions including clarity, technical accuracy, missing content, and structure.`,
  },

  summary: {
    system: `You are a technical writer who creates clear, concise summaries of complex documentation.`,

    user: (content: string, maxLength: number) =>
      `Summarize this content in approximately ${maxLength} words:\n\n${content}`,
  },

  research: {
    system: `You are a professional researcher helping to create engaging user profiles. Generate interesting, professional fun facts about a person based on their name and LinkedIn profile.`,

    user: (firstName: string, lastName: string, linkedInUrl: string) =>
      `Research and generate fun facts about:

Name: ${firstName} ${lastName}
LinkedIn: ${linkedInUrl}

Generate a JSON response with facts array and summary.`,
  },

  recommendations: {
    system: `You are a documentation assistant for Phoenix Rooivalk, helping users navigate technical documentation.`,

    user: (
      readDocs: string[],
      currentDocId: string | undefined,
      unreadDocs: Array<{ id: string; title?: string; category?: string }>,
    ) => `Based on the user's reading history, recommend the 3 most relevant articles to read next.

**Already read:**
${readDocs.map((id) => `- ${id}`).join("\n") || "None yet"}

**Currently viewing:**
${currentDocId || "Not specified"}

**Available unread articles:**
${unreadDocs.map((doc) => `- ${doc.id}: ${doc.title || doc.id} (Category: ${doc.category || "General"})`).join("\n")}

Provide recommendations in JSON format with docId, reason, and relevanceScore.`,
  },
};

/**
 * @deprecated Use PHOENIX_CORE_CONTEXT instead
 */
export const PHOENIX_CONTEXT = PHOENIX_CORE_CONTEXT;
