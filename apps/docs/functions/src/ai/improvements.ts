/**
 * Document Improvement AI Functions
 *
 * Suggests improvements and manages improvement workflow.
 * Now includes RAG to find related documents for cross-referencing.
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { chatCompletion } from "../ai-provider";
import { searchDocuments, SearchResult } from "../rag/search";
import { checkRateLimit, logUsage } from "./rate-limit";
import { PROMPTS } from "./prompts";

const db = admin.firestore();

interface DocumentImprovementRequest {
  docId: string;
  docTitle: string;
  docContent: string;
  userId: string;
}

/**
 * Build context string from search results
 */
function buildRelatedDocsContext(results: SearchResult[]): string {
  if (results.length === 0) {
    return "";
  }

  return results
    .map(
      (r, i) =>
        `[Related Doc ${i + 1}: ${r.title} - ${r.section}]\n${r.content.substring(0, 300)}`,
    )
    .join("\n\n---\n\n");
}

/**
 * Generate improvement suggestions for a document
 * Uses RAG to find related documents for cross-referencing and consistency
 */
export const suggestDocumentImprovements = functions.https.onCall(
  async (data: DocumentImprovementRequest, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be authenticated to suggest improvements",
      );
    }

    const canProceed = await checkRateLimit(context.auth.uid, "improvement");
    if (!canProceed) {
      throw new functions.https.HttpsError(
        "resource-exhausted",
        "Rate limit exceeded. Try again later.",
      );
    }

    const { docId, docTitle, docContent } = data;

    if (!docContent || docContent.length < 100) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Document content is too short for analysis",
      );
    }

    // Truncate content if too long
    const truncatedContent =
      docContent.length > 10000
        ? docContent.substring(0, 10000) + "..."
        : docContent;

    // RAG: Search for related documents to enable cross-referencing
    let relatedDocsContext = "";
    let relatedDocs: Array<{ title: string; section: string }> = [];

    try {
      // Extract key topics from the document title
      const searchQuery = `${docTitle} Phoenix Rooivalk documentation`;

      const ragResults = await searchDocuments(searchQuery, {
        topK: 4,
        minScore: 0.6,
      });

      // Filter out the current document
      const filteredResults = ragResults.filter((r) => r.docId !== docId);

      if (filteredResults.length > 0) {
        relatedDocsContext = buildRelatedDocsContext(filteredResults);
        relatedDocs = filteredResults.map((r) => ({
          title: r.title,
          section: r.section,
        }));
      }
    } catch (error) {
      // Log but don't fail - continue without related docs context
      functions.logger.warn(
        "RAG search failed for document improvements:",
        error,
      );
    }

    // Build enhanced system prompt with related documents
    const systemPrompt = relatedDocsContext
      ? `${PROMPTS.improvement.system}

RELATED DOCUMENTATION FOR CROSS-REFERENCE:
${relatedDocsContext}

When suggesting improvements, consider:
1. Consistency with the related documents above
2. Opportunities to add cross-references to related topics
3. Missing information that exists in related documents
4. Terminology consistency across the documentation`
      : PROMPTS.improvement.system;

    const { content, metrics } = await chatCompletion(
      [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: PROMPTS.improvement.user(docId, docTitle, truncatedContent),
        },
      ],
      { model: "chatAdvanced", maxTokens: 2500 },
    );

    // Store the suggestion for admin review
    const suggestionRef = await db.collection("document_improvements").add({
      docId,
      docTitle,
      userId: context.auth.uid,
      userEmail: context.auth.token.email || null,
      suggestions: content,
      relatedDocs,
      status: "pending", // pending, approved, rejected, implemented
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      reviewedAt: null,
      reviewedBy: null,
      reviewNotes: null,
    });

    await logUsage(context.auth.uid, "document_improvement", {
      docId,
      provider: metrics.provider,
      model: metrics.model,
      tokens: metrics.totalTokens,
      ragSourcesUsed: relatedDocs.length,
    });

    return {
      suggestionId: suggestionRef.id,
      suggestions: content,
      relatedDocs,
      message: "Your suggestions have been submitted for admin review.",
      ragEnabled: relatedDocsContext.length > 0,
    };
  },
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
    context,
  ) => {
    if (!context.auth?.token.admin) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only admins can review suggestions",
      );
    }

    const { suggestionId, status, notes } = data;

    if (!suggestionId || !status) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Suggestion ID and status required",
      );
    }

    const suggestionRef = db
      .collection("document_improvements")
      .doc(suggestionId);
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
        message:
          notes || `Your document improvement suggestion has been ${status}.`,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return { success: true, status };
  },
);

/**
 * Get pending document improvement suggestions (admin only)
 */
export const getPendingImprovements = functions.https.onCall(
  async (data: { limit?: number }, context) => {
    if (!context.auth?.token.admin) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only admins can view pending suggestions",
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
  },
);
