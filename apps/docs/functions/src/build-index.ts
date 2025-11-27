/**
 * Build-Time Indexing Module
 *
 * Generates document embeddings during the build process to:
 * 1. Reduce runtime latency (no on-demand embedding generation)
 * 2. Detect content changes via content hashing
 * 3. Enable incremental updates (only re-embed changed docs)
 *
 * Usage:
 * - Called by Docusaurus build plugin
 * - Can also be triggered manually via admin function
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as crypto from "crypto";
import { generateEmbedding } from "./ai-provider";
import { logMetrics } from "./monitoring";

const db = admin.firestore();

// Build-time indexing configuration
export const BUILD_INDEX_CONFIG = {
  // Collections
  embeddingsCollection: "doc_embeddings",
  metadataCollection: "doc_metadata",
  buildIndexCollection: "build_index_status",

  // Chunking
  chunkSize: 500, // Target tokens per chunk
  chunkOverlap: 50, // Overlap between chunks
  maxChunkChars: 2000, // Max characters per chunk

  // Batch processing
  batchSize: 20, // Embeddings per batch
  maxConcurrent: 3, // Max concurrent batches
};

// Category mapping based on path
const CATEGORY_MAP: Record<string, string> = {
  technical: "technical",
  business: "business",
  operations: "operations",
  executive: "executive",
  legal: "legal",
  research: "research",
};

/**
 * Document input for indexing
 */
export interface DocumentInput {
  path: string;
  content: string;
  title?: string;
  description?: string;
  tags?: string[];
}

/**
 * Index result for a single document
 */
export interface DocumentIndexResult {
  path: string;
  status: "indexed" | "unchanged" | "failed";
  chunksCreated?: number;
  tokensUsed?: number;
  contentHash?: string;
  error?: string;
}

/**
 * Build index status
 */
export interface BuildIndexStatus {
  buildId: string;
  status: "running" | "completed" | "failed";
  startedAt: admin.firestore.Timestamp;
  completedAt?: admin.firestore.Timestamp;
  totalDocs: number;
  indexed: number;
  unchanged: number;
  failed: number;
  totalChunks: number;
  totalTokens: number;
  errors: string[];
}

/**
 * Generate content hash for change detection
 */
export function generateContentHash(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

/**
 * Generate consistent document ID from path
 */
function hashPath(path: string): string {
  return crypto.createHash("md5").update(path).digest("hex").slice(0, 12);
}

/**
 * Parse frontmatter from markdown
 */
function parseFrontmatter(content: string): {
  frontmatter: Record<string, unknown>;
  body: string;
} {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (!fmMatch) {
    return { frontmatter: {}, body: content };
  }

  try {
    const fm: Record<string, unknown> = {};
    const lines = fmMatch[1].split("\n");

    for (const line of lines) {
      const [key, ...valueParts] = line.split(":");
      if (key && valueParts.length) {
        const value = valueParts.join(":").trim();
        fm[key.trim()] = value.replace(/^["']|["']$/g, "");
      }
    }

    return { frontmatter: fm, body: fmMatch[2] };
  } catch {
    return { frontmatter: {}, body: content };
  }
}

/**
 * Chunk document into smaller pieces with overlap
 */
function chunkDocument(
  content: string,
  overlap: number
): Array<{ text: string; section: string }> {
  const chunks: Array<{ text: string; section: string }> = [];

  // Split by headers first
  const sections = content.split(/(?=^#{1,3}\s)/m);

  for (const section of sections) {
    if (!section.trim()) continue;

    // Extract section heading
    const headingMatch = section.match(/^#{1,3}\s+(.+)/);
    const sectionName = headingMatch ? headingMatch[1].trim() : "Content";

    // Split large sections by paragraphs
    const paragraphs = section.split(/\n\n+/);
    let currentChunk = "";

    for (const para of paragraphs) {
      const cleanPara = para.trim();
      if (!cleanPara) continue;

      // If adding this paragraph exceeds max size, save current chunk
      if (
        currentChunk &&
        (currentChunk + "\n\n" + cleanPara).length >
          BUILD_INDEX_CONFIG.maxChunkChars
      ) {
        chunks.push({
          text: currentChunk.trim(),
          section: sectionName,
        });

        // Start new chunk with overlap
        const words = currentChunk.split(/\s+/);
        const overlapWords = words.slice(-overlap);
        currentChunk = overlapWords.join(" ") + "\n\n" + cleanPara;
      } else {
        currentChunk = currentChunk
          ? currentChunk + "\n\n" + cleanPara
          : cleanPara;
      }
    }

    // Don't forget the last chunk
    if (currentChunk.trim()) {
      chunks.push({
        text: currentChunk.trim(),
        section: sectionName,
      });
    }
  }

  return chunks;
}

/**
 * Check if document content has changed
 */
async function hasContentChanged(
  docId: string,
  contentHash: string
): Promise<boolean> {
  const metaDoc = await db
    .collection(BUILD_INDEX_CONFIG.metadataCollection)
    .doc(hashPath(docId))
    .get();

  if (!metaDoc.exists) {
    return true;
  }

  const existingHash = metaDoc.data()?.contentHash;
  return existingHash !== contentHash;
}

/**
 * Index a single document
 */
async function indexDocument(
  doc: DocumentInput
): Promise<DocumentIndexResult> {
  const contentHash = generateContentHash(doc.content);

  try {
    // Check if content has changed
    const changed = await hasContentChanged(doc.path, contentHash);

    if (!changed) {
      return {
        path: doc.path,
        status: "unchanged",
        contentHash,
      };
    }

    // Parse frontmatter
    const { frontmatter, body } = parseFrontmatter(doc.content);

    // Chunk document
    const chunks = chunkDocument(body, BUILD_INDEX_CONFIG.chunkOverlap);

    if (chunks.length === 0) {
      return {
        path: doc.path,
        status: "indexed",
        chunksCreated: 0,
        tokensUsed: 0,
        contentHash,
      };
    }

    // Generate embeddings in batches
    const allEmbeddings: number[][] = [];
    let totalTokens = 0;

    for (let i = 0; i < chunks.length; i += BUILD_INDEX_CONFIG.batchSize) {
      const batch = chunks.slice(i, i + BUILD_INDEX_CONFIG.batchSize);
      const { embeddings, metrics } = await generateEmbedding(
        batch.map((c) => c.text)
      );
      allEmbeddings.push(...embeddings);
      totalTokens += metrics.totalTokens || 0;
    }

    // Determine category from path
    const pathParts = doc.path.split("/");
    const categoryKey = pathParts.find((p) => CATEGORY_MAP[p]) || "general";
    const category = CATEGORY_MAP[categoryKey] || "general";

    // Delete existing chunks
    const existingChunks = await db
      .collection(BUILD_INDEX_CONFIG.embeddingsCollection)
      .where("docId", "==", doc.path)
      .get();

    if (!existingChunks.empty) {
      const deleteBatch = db.batch();
      existingChunks.docs.forEach((d) => deleteBatch.delete(d.ref));
      await deleteBatch.commit();
    }

    // Store new chunks
    const now = admin.firestore.FieldValue.serverTimestamp();
    const writeBatch = db.batch();

    chunks.forEach((chunk, index) => {
      const chunkId = `${hashPath(doc.path)}-${index}`;
      const ref = db
        .collection(BUILD_INDEX_CONFIG.embeddingsCollection)
        .doc(chunkId);

      writeBatch.set(ref, {
        docId: doc.path,
        chunkId,
        title:
          doc.title ||
          (frontmatter.title as string | undefined) ||
          pathToTitle(doc.path),
        section: chunk.section,
        content: chunk.text,
        embedding: allEmbeddings[index],
        metadata: {
          category,
          wordCount: chunk.text.split(/\s+/).length,
          charCount: chunk.text.length,
          chunkIndex: index,
          totalChunks: chunks.length,
        },
        contentHash,
        indexedAt: now,
      });
    });

    await writeBatch.commit();

    // Update document metadata
    await db
      .collection(BUILD_INDEX_CONFIG.metadataCollection)
      .doc(hashPath(doc.path))
      .set({
        docId: doc.path,
        title:
          doc.title ||
          (frontmatter.title as string | undefined) ||
          pathToTitle(doc.path),
        description:
          doc.description ||
          (frontmatter.description as string | undefined) ||
          "",
        category,
        tags: doc.tags || (frontmatter.tags as string[]) || [],
        wordCount: body.split(/\s+/).length,
        chunkCount: chunks.length,
        contentHash,
        lastIndexed: now,
        frontmatter,
      });

    return {
      path: doc.path,
      status: "indexed",
      chunksCreated: chunks.length,
      tokensUsed: totalTokens,
      contentHash,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    functions.logger.error(`Failed to index ${doc.path}:`, error);
    return {
      path: doc.path,
      status: "failed",
      error: errorMsg,
      contentHash,
    };
  }
}

/**
 * Convert path to readable title
 */
function pathToTitle(path: string): string {
  return path
    .replace(/^\/docs\//, "")
    .replace(/\//g, " > ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

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
      providedBuildId || `build-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

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
        const unchanged = results.filter((r) => r.status === "unchanged").length;
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

      throw new functions.https.HttpsError("internal", `Build indexing failed: ${errorMsg}`);
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

    const results: Array<{
      path: string;
      status: "stale" | "current" | "new";
      currentHash?: string;
      newHash: string;
    }> = [];

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
