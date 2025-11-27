/**
 * Reading Recommendations AI Function
 *
 * Suggests next articles based on user reading history.
 * Now includes RAG semantic search for better relevance matching.
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { chatCompletion } from "../ai-provider";
import { searchDocumentsUnique, getRelatedDocuments } from "../rag/search";
import { PROMPTS } from "./prompts";

const db = admin.firestore();

interface RecommendationRequest {
  userId: string;
  currentDocId?: string;
}

/**
 * Get personalized reading recommendations
 * Uses RAG semantic search to find contextually relevant documents
 */
export const getReadingRecommendations = functions.https.onCall(
  async (data: RecommendationRequest, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be authenticated to get recommendations",
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
        ragEnabled: false,
      };
    }

    // Get all available documents metadata
    const docsMetaSnapshot = await db.collection("documentation_meta").get();
    const allDocs = docsMetaSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Calculate what user has read
    const readDocs = Object.entries(
      progress.docs as Record<string, { completed?: boolean }>,
    )
      .filter(([, docData]) => docData.completed)
      .map(([id]) => id);

    const unreadDocs = allDocs.filter(
      (doc: { id: string }) => !readDocs.includes(doc.id),
    );

    if (unreadDocs.length === 0) {
      return {
        recommendations: [],
        message: "Congratulations! You've read all available documentation.",
        ragEnabled: false,
      };
    }

    // RAG: Use semantic search to find related documents
    let semanticRecommendations: Array<{
      docId: string;
      title: string;
      reason: string;
      relevanceScore: number;
    }> = [];

    try {
      if (currentDocId) {
        // Find documents related to the current document
        const relatedDocs = await getRelatedDocuments(currentDocId, {
          topK: 5,
          excludeSelf: true,
        });

        semanticRecommendations = relatedDocs
          .filter((doc) => !readDocs.includes(doc.docId))
          .map((doc) => ({
            docId: doc.docId,
            title: doc.title,
            reason: `Related to current topic: ${doc.section}`,
            relevanceScore: Math.round(doc.score * 100) / 100,
          }));
      }

      // If we don't have enough recommendations, search based on reading history
      if (semanticRecommendations.length < 3 && readDocs.length > 0) {
        // Build a query from the user's recent reading
        const recentReadTitles = readDocs
          .slice(-3)
          .map((id) => allDocs.find((d: { id: string }) => d.id === id))
          .filter((d): d is { id: string; title?: string } => d !== undefined)
          .map((d) => d.title || "")
          .filter(Boolean)
          .join(" ");

        if (recentReadTitles) {
          const searchResults = await searchDocumentsUnique(
            `Phoenix Rooivalk ${recentReadTitles}`,
            { topK: 5, minScore: 0.5 },
          );

          const additionalRecs = searchResults
            .filter(
              (doc) =>
                !readDocs.includes(doc.docId) &&
                !semanticRecommendations.some((r) => r.docId === doc.docId),
            )
            .map((doc) => ({
              docId: doc.docId,
              title: doc.title,
              reason: `Based on your reading interests: ${doc.section}`,
              relevanceScore: Math.round(doc.score * 100) / 100,
            }));

          semanticRecommendations.push(...additionalRecs);
        }
      }
    } catch (error) {
      // Log but don't fail - fall back to LLM recommendations
      functions.logger.warn("RAG search failed for recommendations:", error);
    }

    // If we have good semantic recommendations, return them directly
    if (semanticRecommendations.length >= 3) {
      return {
        recommendations: semanticRecommendations.slice(0, 5),
        learningPath:
          "Continue exploring documentation related to your interests",
        ragEnabled: true,
      };
    }

    // Fall back to LLM-based recommendations
    const { content } = await chatCompletion(
      [
        { role: "system", content: PROMPTS.recommendations.system },
        {
          role: "user",
          content: PROMPTS.recommendations.user(
            readDocs,
            currentDocId,
            unreadDocs as Array<{
              id: string;
              title?: string;
              category?: string;
            }>,
          ),
        },
      ],
      { model: "chat", maxTokens: 1000, temperature: 0.5 },
    );

    try {
      // Parse JSON response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          ...parsed,
          ragEnabled: false,
        };
      }
    } catch (e) {
      functions.logger.warn("Failed to parse recommendations JSON");
    }

    // Fallback response - combine semantic with random unread
    const fallbackRecs = [
      ...semanticRecommendations,
      ...unreadDocs
        .slice(0, 3 - semanticRecommendations.length)
        .map((doc: { id: string }) => ({
          docId: doc.id,
          reason: "Suggested based on your reading history",
          relevanceScore: 0.7,
        })),
    ];

    return {
      recommendations: fallbackRecs.slice(0, 5),
      learningPath: "Continue exploring the documentation",
      ragEnabled: semanticRecommendations.length > 0,
    };
  },
);
