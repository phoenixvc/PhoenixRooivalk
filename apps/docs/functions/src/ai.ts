/**
 * AI Cloud Functions for Phoenix Rooivalk Documentation
 *
 * Provides secure OpenAI API integration for:
 * - Competitor research and analysis
 * - SWOT analysis generation
 * - Reading recommendations based on user history
 * - Document improvement suggestions
 * - Content summarization
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

// Types for AI requests
interface CompetitorAnalysisRequest {
  competitors: string[];
  focusAreas?: string[];
}

interface SWOTRequest {
  topic: string;
  context?: string;
}

interface RecommendationRequest {
  userId: string;
  currentDocId?: string;
}

interface DocumentImprovementRequest {
  docId: string;
  docTitle: string;
  docContent: string;
  userId: string;
}

interface ContentSummaryRequest {
  content: string;
  maxLength?: number;
}

interface MarketInsightRequest {
  topic: string;
  industry?: string;
}

// OpenAI API configuration
const OPENAI_MODEL = "gpt-4o-mini"; // Cost-effective for most tasks
const OPENAI_MODEL_ADVANCED = "gpt-4o"; // For complex analysis

/**
 * Helper to call OpenAI API
 */
async function callOpenAI(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  options: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  } = {}
): Promise<string> {
  const apiKey = functions.config().openai?.key;

  if (!apiKey) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "OpenAI API key not configured. Set it using: firebase functions:config:set openai.key=YOUR_KEY"
    );
  }

  const model = options.model || OPENAI_MODEL;
  const maxTokens = options.maxTokens || 2000;
  const temperature = options.temperature ?? 0.7;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "OpenAI API error");
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "";
  } catch (error) {
    functions.logger.error("OpenAI API error:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to process AI request"
    );
  }
}

/**
 * Rate limiting helper
 */
async function checkAIRateLimit(
  userId: string,
  feature: string
): Promise<boolean> {
  const rateLimitRef = db
    .collection("ai_rate_limits")
    .doc(`${userId}_${feature}`);
  const doc = await rateLimitRef.get();

  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour window
  const maxRequests = 20; // 20 requests per hour per feature

  if (doc.exists) {
    const data = doc.data();
    const windowStart = data?.windowStart || 0;
    const count = data?.count || 0;

    if (now - windowStart < windowMs) {
      if (count >= maxRequests) {
        return false; // Rate limited
      }
      await rateLimitRef.update({ count: count + 1 });
    } else {
      // New window
      await rateLimitRef.set({ windowStart: now, count: 1 });
    }
  } else {
    await rateLimitRef.set({ windowStart: now, count: 1 });
  }

  return true;
}

/**
 * Competitor Analysis - Analyzes competitors in the defense drone market
 */
export const analyzeCompetitors = functions.https.onCall(
  async (data: CompetitorAnalysisRequest, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be authenticated to use AI features"
      );
    }

    const canProceed = await checkAIRateLimit(context.auth.uid, "competitor");
    if (!canProceed) {
      throw new functions.https.HttpsError(
        "resource-exhausted",
        "Rate limit exceeded. Try again later."
      );
    }

    const { competitors, focusAreas } = data;

    if (!competitors || competitors.length === 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "At least one competitor name required"
      );
    }

    const systemPrompt = `You are a defense industry analyst specializing in counter-drone systems and autonomous defense platforms. You work for Phoenix Rooivalk, a company developing an autonomous reusable kinetic interceptor for counter-UAS defense.

Phoenix Rooivalk's key differentiators:
- Reusable kinetic vehicle (RKV) system reduces cost-per-engagement
- Blockchain-verified chain of custody for accountability
- AI-powered autonomous targeting with human-in-the-loop options
- Designed for both military and critical infrastructure protection
- South African company with global market ambitions

Provide factual, objective analysis based on publicly available information. Focus on technical capabilities, market positioning, and strategic implications.`;

    const userPrompt = `Analyze the following competitors in the counter-drone/defense market:

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

Format the response in clear markdown with headers and bullet points.`;

    const response = await callOpenAI(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { model: OPENAI_MODEL_ADVANCED, maxTokens: 3000 }
    );

    // Log usage for analytics
    await db.collection("ai_usage").add({
      userId: context.auth.uid,
      feature: "competitor_analysis",
      competitors,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { analysis: response };
  }
);

/**
 * SWOT Analysis - Generate SWOT analysis for any topic
 */
export const generateSWOT = functions.https.onCall(
  async (data: SWOTRequest, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be authenticated to use AI features"
      );
    }

    const canProceed = await checkAIRateLimit(context.auth.uid, "swot");
    if (!canProceed) {
      throw new functions.https.HttpsError(
        "resource-exhausted",
        "Rate limit exceeded. Try again later."
      );
    }

    const { topic, context: additionalContext } = data;

    if (!topic) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Topic is required for SWOT analysis"
      );
    }

    const systemPrompt = `You are a strategic business analyst specializing in defense technology, autonomous systems, and emerging markets. You provide thorough, balanced SWOT analyses that consider technical, market, regulatory, and operational factors.

Context: Phoenix Rooivalk is developing autonomous reusable kinetic interceptors for counter-UAS defense, targeting both military and critical infrastructure protection markets globally.`;

    const userPrompt = `Generate a comprehensive SWOT analysis for: "${topic}"

${additionalContext ? `Additional context: ${additionalContext}` : ""}

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

For each point, provide specific, actionable insights. Format in clear markdown.`;

    const response = await callOpenAI(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { maxTokens: 2500 }
    );

    await db.collection("ai_usage").add({
      userId: context.auth.uid,
      feature: "swot_analysis",
      topic,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { swot: response };
  }
);

/**
 * Reading Recommendations - Suggest next articles based on user history
 */
export const getReadingRecommendations = functions.https.onCall(
  async (data: RecommendationRequest, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be authenticated to get recommendations"
      );
    }

    const { currentDocId } = data;
    const userId = context.auth.uid;

    // Get user's reading history
    const progressDoc = await db.collection("userProgress").doc(userId).get();
    const progress = progressDoc.data();

    if (!progress || !progress.docs) {
      return {
        recommendations: [],
        message: "Start reading to get personalized recommendations!",
      };
    }

    // Get all available documents metadata
    const docsMetaSnapshot = await db.collection("documentation_meta").get();
    const allDocs = docsMetaSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Calculate what user has read
    const readDocs = Object.entries(progress.docs)
      .filter(([_, data]: [string, any]) => data.completed)
      .map(([id]) => id);

    const unreadDocs = allDocs.filter((doc) => !readDocs.includes(doc.id));

    if (unreadDocs.length === 0) {
      return {
        recommendations: [],
        message: "Congratulations! You've read all available documentation.",
      };
    }

    const systemPrompt = `You are a documentation assistant for Phoenix Rooivalk, helping users navigate technical documentation about autonomous counter-drone systems. You understand learning paths and can recommend the most relevant next articles based on what the user has already read.`;

    const userPrompt = `Based on the user's reading history, recommend the 3 most relevant articles to read next.

**Already read:**
${readDocs.map((id) => `- ${id}`).join("\n") || "None yet"}

**Currently viewing:**
${currentDocId || "Not specified"}

**Available unread articles:**
${unreadDocs.map((doc: any) => `- ${doc.id}: ${doc.title || doc.id} (Category: ${doc.category || "General"})`).join("\n")}

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
4. Building comprehensive understanding`;

    const response = await callOpenAI(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { temperature: 0.5, maxTokens: 1000 }
    );

    try {
      // Parse JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed;
      }
    } catch (e) {
      functions.logger.warn("Failed to parse recommendations JSON");
    }

    return {
      recommendations: unreadDocs.slice(0, 3).map((doc: any) => ({
        docId: doc.id,
        reason: "Suggested based on your reading history",
        relevanceScore: 0.7,
      })),
      learningPath: "Continue exploring the documentation",
    };
  }
);

/**
 * Document Improvement - Generate improvement suggestions for documentation
 */
export const suggestDocumentImprovements = functions.https.onCall(
  async (data: DocumentImprovementRequest, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be authenticated to suggest improvements"
      );
    }

    const canProceed = await checkAIRateLimit(context.auth.uid, "improvement");
    if (!canProceed) {
      throw new functions.https.HttpsError(
        "resource-exhausted",
        "Rate limit exceeded. Try again later."
      );
    }

    const { docId, docTitle, docContent, userId } = data;

    if (!docContent || docContent.length < 100) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Document content is too short for analysis"
      );
    }

    // Truncate content if too long
    const truncatedContent =
      docContent.length > 10000 ? docContent.substring(0, 10000) + "..." : docContent;

    const systemPrompt = `You are a technical documentation expert specializing in defense technology, autonomous systems, and technical writing best practices. You review documentation for clarity, accuracy, completeness, and user experience.`;

    const userPrompt = `Review this documentation and suggest improvements:

**Document:** ${docTitle}
**Document ID:** ${docId}

**Content:**
${truncatedContent}

Provide improvement suggestions in this format:

## Summary
Brief overall assessment of the document quality.

## Clarity Improvements
- Specific suggestions to improve readability and understanding

## Technical Accuracy
- Any technical concerns or areas needing verification

## Missing Content
- Topics or details that should be added

## Structure Improvements
- Suggestions for better organization

## Specific Edits
Provide 2-3 specific text changes in this format:
\`\`\`
Original: "existing text"
Suggested: "improved text"
Reason: Why this change improves the document
\`\`\`

Be constructive and specific. Focus on high-impact improvements.`;

    const response = await callOpenAI(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { model: OPENAI_MODEL_ADVANCED, maxTokens: 2500 }
    );

    // Store the suggestion for admin review
    const suggestionRef = await db.collection("document_improvements").add({
      docId,
      docTitle,
      userId,
      userEmail: context.auth.token.email || null,
      suggestions: response,
      status: "pending", // pending, approved, rejected, implemented
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      reviewedAt: null,
      reviewedBy: null,
      reviewNotes: null,
    });

    await db.collection("ai_usage").add({
      userId: context.auth.uid,
      feature: "document_improvement",
      docId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      suggestionId: suggestionRef.id,
      suggestions: response,
      message: "Your suggestions have been submitted for admin review.",
    };
  }
);

/**
 * Market Insights - Generate market analysis and insights
 */
export const getMarketInsights = functions.https.onCall(
  async (data: MarketInsightRequest, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be authenticated to use AI features"
      );
    }

    const canProceed = await checkAIRateLimit(context.auth.uid, "market");
    if (!canProceed) {
      throw new functions.https.HttpsError(
        "resource-exhausted",
        "Rate limit exceeded. Try again later."
      );
    }

    const { topic, industry } = data;

    if (!topic) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Topic is required for market insights"
      );
    }

    const systemPrompt = `You are a market intelligence analyst specializing in defense technology, counter-drone systems, and autonomous platforms. You provide data-driven insights based on publicly available market research, industry reports, and news.

Context: Phoenix Rooivalk operates in the counter-UAS (C-UAS) market, developing autonomous reusable kinetic interceptors. Key markets include military defense, critical infrastructure protection, and border security.`;

    const userPrompt = `Provide market insights on: "${topic}"

${industry ? `Industry focus: ${industry}` : "Industry: Defense / Counter-UAS"}

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

Provide specific data points where available. Note any limitations in available data.`;

    const response = await callOpenAI(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { model: OPENAI_MODEL_ADVANCED, maxTokens: 3000 }
    );

    await db.collection("ai_usage").add({
      userId: context.auth.uid,
      feature: "market_insights",
      topic,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { insights: response };
  }
);

/**
 * Content Summary - Summarize long documents
 */
export const summarizeContent = functions.https.onCall(
  async (data: ContentSummaryRequest, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be authenticated to use AI features"
      );
    }

    const canProceed = await checkAIRateLimit(context.auth.uid, "summary");
    if (!canProceed) {
      throw new functions.https.HttpsError(
        "resource-exhausted",
        "Rate limit exceeded. Try again later."
      );
    }

    const { content, maxLength = 500 } = data;

    if (!content || content.length < 200) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Content is too short to summarize"
      );
    }

    const truncatedContent =
      content.length > 15000 ? content.substring(0, 15000) + "..." : content;

    const response = await callOpenAI(
      [
        {
          role: "system",
          content:
            "You are a technical writer who creates clear, concise summaries of complex documentation. Focus on key points and actionable information.",
        },
        {
          role: "user",
          content: `Summarize this content in approximately ${maxLength} words:\n\n${truncatedContent}`,
        },
      ],
      { temperature: 0.3, maxTokens: 1000 }
    );

    return { summary: response };
  }
);

/**
 * Admin function to review document improvement suggestions
 */
export const reviewDocumentImprovement = functions.https.onCall(
  async (
    data: {
      suggestionId: string;
      status: "approved" | "rejected" | "implemented";
      notes?: string;
    },
    context
  ) => {
    if (!context.auth?.token.admin) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only admins can review suggestions"
      );
    }

    const { suggestionId, status, notes } = data;

    if (!suggestionId || !status) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Suggestion ID and status required"
      );
    }

    const suggestionRef = db.collection("document_improvements").doc(suggestionId);
    const suggestion = await suggestionRef.get();

    if (!suggestion.exists) {
      throw new functions.https.HttpsError("not-found", "Suggestion not found");
    }

    await suggestionRef.update({
      status,
      reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
      reviewedBy: context.auth.uid,
      reviewNotes: notes || null,
    });

    // Notify the user who submitted the suggestion
    const suggestionData = suggestion.data();
    if (suggestionData?.userId) {
      await db.collection("notifications").add({
        userId: suggestionData.userId,
        type: "improvement_reviewed",
        title: `Your suggestion for "${suggestionData.docTitle}" was ${status}`,
        message: notes || `Your document improvement suggestion has been ${status}.`,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return { success: true, status };
  }
);

/**
 * Get pending document improvement suggestions (admin only)
 */
export const getPendingImprovements = functions.https.onCall(
  async (data: { limit?: number }, context) => {
    if (!context.auth?.token.admin) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only admins can view pending suggestions"
      );
    }

    const limit = data.limit || 20;

    const snapshot = await db
      .collection("document_improvements")
      .where("status", "==", "pending")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    const suggestions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { suggestions };
  }
);
