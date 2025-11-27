/**
 * Build-Time Indexing Cloud Functions
 *
 * Provides Cloud Functions for build-time document indexing.
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { logMetrics } from "../monitoring";
import {
  BUILD_INDEX_CONFIG,
  DocumentInput,
  DocumentIndexResult,
  BuildIndexStatus,
  StalenessResult,
} from "./config";
import { generateContentHash, hashPath } from "./chunking";
import { indexDocument } from "./indexer";

const db = admin.firestore();

/**
 * Build-time indexing function
 * Called during Docusaurus build or manually by admin
 */
export const buildTimeIndex = functions
  .runWith({ timeoutSeconds: 540, memory: "2GB" })
  .https.onCall(async (data, context) => {
    // Admin only
    if (!context.auth?.token.admin) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Admin access required"
      );
    }

    const { docs, buildId: providedBuildId } = data;

    if (!Array.isArray(docs)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "docs must be an array of { path, content, title }"
      );
    }

    // Generate build ID
    const buildId =
      providedBuildId ||
      `build-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Initialize build status
    const buildStatus: BuildIndexStatus = {
      buildId,
      status: "running",
      startedAt: admin.firestore.Timestamp.now(),
      totalDocs: docs.length,
      indexed: 0,
      unchanged: 0,
      failed: 0,
      totalChunks: 0,
      totalTokens: 0,
      errors: [],
    };

    await db
      .collection(BUILD_INDEX_CONFIG.buildIndexCollection)
      .doc(buildId)
      .set(buildStatus);

    const startTime = Date.now();

    try {
      // Process documents with concurrency limit
      const results: DocumentIndexResult[] = [];

      for (let i = 0; i < docs.length; i += BUILD_INDEX_CONFIG.maxConcurrent) {
        const batch = docs.slice(i, i + BUILD_INDEX_CONFIG.maxConcurrent);
        const batchResults = await Promise.all(
          batch.map((doc: DocumentInput) => indexDocument(doc))
        );
        results.push(...batchResults);

        // Update progress
        const indexed = results.filter((r) => r.status === "indexed").length;
        const unchanged = results.filter(
          (r) => r.status === "unchanged"
        ).length;
        const failed = results.filter((r) => r.status === "failed").length;

        await db
          .collection(BUILD_INDEX_CONFIG.buildIndexCollection)
          .doc(buildId)
          .update({
            indexed,
            unchanged,
            failed,
          });
      }

      // Calculate final stats
      const indexed = results.filter((r) => r.status === "indexed");
      const unchanged = results.filter((r) => r.status === "unchanged");
      const failed = results.filter((r) => r.status === "failed");

      const finalStatus: Partial<BuildIndexStatus> = {
        status: failed.length === docs.length ? "failed" : "completed",
        completedAt: admin.firestore.Timestamp.now(),
        indexed: indexed.length,
        unchanged: unchanged.length,
        failed: failed.length,
        totalChunks: indexed.reduce((sum, r) => sum + (r.chunksCreated || 0), 0),
        totalTokens: indexed.reduce((sum, r) => sum + (r.tokensUsed || 0), 0),
        errors: failed.map((r) => `${r.path}: ${r.error}`),
      };

      await db
        .collection(BUILD_INDEX_CONFIG.buildIndexCollection)
        .doc(buildId)
        .update(finalStatus);

      // Log metrics
      await logMetrics("build_time_index", {
        buildId,
        totalDocs: docs.length,
        indexed: indexed.length,
        unchanged: unchanged.length,
        failed: failed.length,
        latencyMs: Date.now() - startTime,
        totalTokens: finalStatus.totalTokens,
      });

      functions.logger.info(`Build indexing complete: ${buildId}`, finalStatus);

      return {
        buildId,
        ...finalStatus,
        results: results.map((r) => ({
          path: r.path,
          status: r.status,
          chunksCreated: r.chunksCreated,
        })),
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";

      await db
        .collection(BUILD_INDEX_CONFIG.buildIndexCollection)
        .doc(buildId)
        .update({
          status: "failed",
          completedAt: admin.firestore.Timestamp.now(),
          errors: [errorMsg],
        });

      throw new functions.https.HttpsError(
        "internal",
        `Build indexing failed: ${errorMsg}`
      );
    }
  });

/**
 * Get build index status
 */
export const getBuildIndexStatus = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Authentication required"
      );
    }

    const { buildId } = data;

    if (buildId) {
      const doc = await db
        .collection(BUILD_INDEX_CONFIG.buildIndexCollection)
        .doc(buildId)
        .get();

      if (!doc.exists) {
        throw new functions.https.HttpsError("not-found", "Build not found");
      }

      return doc.data();
    }

    // Return latest builds
    const builds = await db
      .collection(BUILD_INDEX_CONFIG.buildIndexCollection)
      .orderBy("startedAt", "desc")
      .limit(10)
      .get();

    return builds.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }
);

/**
 * Check which documents need re-indexing
 */
export const checkIndexStaleness = functions.https.onCall(
  async (data, context) => {
    if (!context.auth?.token.admin) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Admin access required"
      );
    }

    const { docs } = data;

    if (!Array.isArray(docs)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "docs must be an array of { path, content }"
      );
    }

    const results: StalenessResult[] = [];

    for (const doc of docs) {
      const contentHash = generateContentHash(doc.content);
      const metaDoc = await db
        .collection(BUILD_INDEX_CONFIG.metadataCollection)
        .doc(hashPath(doc.path))
        .get();

      if (!metaDoc.exists) {
        results.push({
          path: doc.path,
          status: "new",
          newHash: contentHash,
        });
      } else {
        const existingHash = metaDoc.data()?.contentHash;
        results.push({
          path: doc.path,
          status: existingHash === contentHash ? "current" : "stale",
          currentHash: existingHash,
          newHash: contentHash,
        });
      }
    }

    const stale = results.filter((r) => r.status === "stale");
    const newDocs = results.filter((r) => r.status === "new");
    const current = results.filter((r) => r.status === "current");

    return {
      summary: {
        total: results.length,
        stale: stale.length,
        new: newDocs.length,
        current: current.length,
        needsReindex: stale.length + newDocs.length,
      },
      documents: results,
    };
  }
);
