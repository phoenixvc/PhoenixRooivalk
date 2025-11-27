/**
 * Document Indexer
 *
 * Handles indexing individual documents with embeddings.
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { generateEmbedding } from "../ai-provider";
import {
  BUILD_INDEX_CONFIG,
  CATEGORY_MAP,
  DocumentInput,
  DocumentIndexResult,
} from "./config";
import {
  generateContentHash,
  hashPath,
  parseFrontmatter,
  chunkDocument,
  pathToTitle,
} from "./chunking";

const db = admin.firestore();

/**
 * Check if document content has changed
 */
export async function hasContentChanged(
  docId: string,
  contentHash: string,
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
export async function indexDocument(
  doc: DocumentInput,
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
        batch.map((c) => c.text),
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
