/**
 * Reading Recommendations AI Function
 *
 * Suggests next articles based on user reading history.
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { chatCompletion } from "../ai-provider";
import { PROMPTS } from "./prompts";

const db = admin.firestore();

interface RecommendationRequest {
  userId: string;
  currentDocId?: string;
}

/**
 * Get personalized reading recommendations
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
    const readDocs = Object.entries(progress.docs as Record<string, { completed?: boolean }>)
      .filter(([, docData]) => docData.completed)
      .map(([id]) => id);

    const unreadDocs = allDocs.filter(
      (doc: { id: string }) => !readDocs.includes(doc.id)
    );

    if (unreadDocs.length === 0) {
      return {
        recommendations: [],
        message: "Congratulations! You've read all available documentation.",
      };
    }

    const { content } = await chatCompletion(
      [
        { role: "system", content: PROMPTS.recommendations.system },
        {
          role: "user",
          content: PROMPTS.recommendations.user(
            readDocs,
            currentDocId,
            unreadDocs as Array<{ id: string; title?: string; category?: string }>
          ),
        },
      ],
      { model: "chat", maxTokens: 1000, temperature: 0.5 }
    );

    try {
      // Parse JSON response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed;
      }
    } catch (e) {
      functions.logger.warn("Failed to parse recommendations JSON");
    }

    // Fallback response
    return {
      recommendations: unreadDocs
        .slice(0, 3)
        .map((doc: { id: string }) => ({
          docId: doc.id,
          reason: "Suggested based on your reading history",
          relevanceScore: 0.7,
        })),
      learningPath: "Continue exploring the documentation",
    };
  }
);
