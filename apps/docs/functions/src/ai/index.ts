/**
 * AI Functions Module
 *
 * Exports all AI-related Cloud Functions for Phoenix Rooivalk Documentation.
 * All functions use AI Foundry (Azure) with OpenAI fallback via ai-provider.ts.
 *
 * Available Functions:
 * - analyzeCompetitors: Competitor research and analysis
 * - generateSWOT: SWOT analysis generation
 * - getReadingRecommendations: AI-powered reading suggestions
 * - suggestDocumentImprovements: Document improvement suggestions
 * - reviewDocumentImprovement: Admin review of suggestions
 * - getPendingImprovements: Get pending suggestions (admin)
 * - getMarketInsights: Market analysis and insights
 * - summarizeContent: Content summarization
 * - researchPerson: Generate fun facts about a user from LinkedIn
 */

// Competitor analysis
export { analyzeCompetitors } from "./competitor";

// SWOT analysis
export { generateSWOT } from "./swot";

// Market insights
export { getMarketInsights } from "./market";

// Document improvements
export {
  suggestDocumentImprovements,
  reviewDocumentImprovement,
  getPendingImprovements,
} from "./improvements";

// Content summary
export { summarizeContent } from "./summary";

// Reading recommendations
export { getReadingRecommendations } from "./recommendations";

// Person research (fun facts)
export { researchPerson } from "./research";

// Re-export rate limiting for use in RAG module
export { checkRateLimit, logUsage, RATE_LIMITS } from "./rate-limit";

// Re-export prompts for potential customization
export { PROMPTS, PHOENIX_CONTEXT } from "./prompts";
