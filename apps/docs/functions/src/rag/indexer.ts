/**
 * RAG Indexer for Phoenix Rooivalk Documentation
 *
 * Handles document indexing:
 * - Chunks documents into manageable pieces
 * - Generates embeddings using OpenAI
 * - Stores embeddings in Firestore
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as crypto from "crypto";

const db = admin.firestore();

// RAG Configuration
export const RAG_CONFIG = {
  embeddingModel: "text-embedding-3-small",
  embeddingDimensions: 1536,
  chunkSize: 500, // Target tokens per chunk
  chunkOverlap: 50, // Overlap between chunks
  maxChunkChars: 2000, // Max characters per chunk
  batchSize: 20, // Embeddings per batch (OpenAI limit)
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
 * Call OpenAI Embeddings API
 */
async function getEmbeddings(texts: string[]): Promise<number[][]> {
  const apiKey = functions.config().openai?.key;

  if (!apiKey) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "OpenAI API key not configured",
    );
  }

  try {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: RAG_CONFIG.embeddingModel,
        input: texts,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "OpenAI Embeddings API error");
    }

    const data = await response.json();
    return data.data.map((item: { embedding: number[] }) => item.embedding);
  } catch (error) {
    functions.logger.error("OpenAI Embeddings error:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to generate embeddings",
    );
  }
}

/**
 * Generate consistent hash for document ID
 */
function hashString(str: string): string {
  return crypto.createHash("md5").update(str).digest("hex").slice(0, 12);
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
 * Chunk document into smaller pieces
 */
function chunkDocument(
  content: string,
  _targetSize: number,
  overlap: number,
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
        (currentChunk + "\n\n" + cleanPara).length > RAG_CONFIG.maxChunkChars
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
 * Index a single document
 */
export async function indexDocumentInternal(
  docId: string,
  content: string,
  metadata: {
    title: string;
    category: string;
    description?: string;
    tags?: string[];
  },
): Promise<{ chunksCreated: number; tokensUsed: number }> {
  // Parse frontmatter if present
  const { frontmatter, body } = parseFrontmatter(content);

  // Split into chunks
  const chunks = chunkDocument(
    body,
    RAG_CONFIG.chunkSize,
    RAG_CONFIG.chunkOverlap,
  );

  if (chunks.length === 0) {
    functions.logger.warn(`No chunks generated for ${docId}`);
    return { chunksCreated: 0, tokensUsed: 0 };
  }

  // Generate embeddings in batches
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < chunks.length; i += RAG_CONFIG.batchSize) {
    const batch = chunks.slice(i, i + RAG_CONFIG.batchSize);
    const embeddings = await getEmbeddings(batch.map((c) => c.text));
    allEmbeddings.push(...embeddings);
  }

  // Estimate tokens used (rough approximation)
  const totalChars = chunks.reduce((sum, c) => sum + c.text.length, 0);
  const estimatedTokens = Math.ceil(totalChars / 4);

  // Delete existing chunks for this document
  const existingChunks = await db
    .collection("doc_embeddings")
    .where("docId", "==", docId)
    .get();

  if (!existingChunks.empty) {
    const deleteBatch = db.batch();
    existingChunks.docs.forEach((doc) => deleteBatch.delete(doc.ref));
    await deleteBatch.commit();
  }

  // Store new chunks
  const writeBatch = db.batch();
  const now = admin.firestore.FieldValue.serverTimestamp();

  chunks.forEach((chunk, index) => {
    const chunkId = `${hashString(docId)}-${index}`;
    const ref = db.collection("doc_embeddings").doc(chunkId);

    writeBatch.set(ref, {
      docId,
      chunkId,
      title:
        metadata.title ||
        (frontmatter.title as string | undefined) ||
        "Untitled",
      section: chunk.section,
      content: chunk.text,
      embedding: allEmbeddings[index],
      metadata: {
        category:
          metadata.category ||
          (frontmatter.category as string | undefined) ||
          "general",
        wordCount: chunk.text.split(/\s+/).length,
        charCount: chunk.text.length,
        chunkIndex: index,
        totalChunks: chunks.length,
      },
      indexedAt: now,
      docUpdatedAt: now,
    });
  });

  await writeBatch.commit();

  // Update document metadata
  await db
    .collection("doc_metadata")
    .doc(hashString(docId))
    .set({
      docId,
      title:
        metadata.title ||
        (frontmatter.title as string | undefined) ||
        "Untitled",
      description:
        metadata.description ||
        (frontmatter.description as string | undefined) ||
        "",
      category:
        metadata.category ||
        (frontmatter.category as string | undefined) ||
        "general",
      tags: metadata.tags || (frontmatter.tags as string[] | undefined) || [],
      wordCount: body.split(/\s+/).length,
      chunkCount: chunks.length,
      lastIndexed: now,
      frontmatter,
    });

  functions.logger.info(
    `Indexed ${docId}: ${chunks.length} chunks, ~${estimatedTokens} tokens`,
  );

  return { chunksCreated: chunks.length, tokensUsed: estimatedTokens };
}

/**
 * Get title from path
 */
function pathFromId(docId: string): string {
  return docId
    .replace(/^\/docs\//, "")
    .replace(/\//g, " > ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

/**
 * Admin function to index all documentation
 */
export const indexAllDocumentation = functions
  .runWith({ timeoutSeconds: 540, memory: "1GB" })
  .https.onCall(async (data, context) => {
    // Admin only
    if (!context.auth?.token.admin) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Admin access required",
      );
    }

    const { docs } = data;

    if (!Array.isArray(docs)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "docs must be an array of { path, content, title }",
      );
    }

    const results = {
      indexed: 0,
      failed: 0,
      totalChunks: 0,
      totalTokens: 0,
      errors: [] as string[],
    };

    for (const doc of docs) {
      try {
        // Determine category from path
        const pathParts = doc.path.split("/");
        const categoryKey =
          pathParts.find((p: string) => CATEGORY_MAP[p]) || "general";
        const category = CATEGORY_MAP[categoryKey] || "general";

        const { chunksCreated, tokensUsed } = await indexDocumentInternal(
          doc.path,
          doc.content,
          {
            title: doc.title || pathFromId(doc.path),
            category,
          },
        );

        results.indexed++;
        results.totalChunks += chunksCreated;
        results.totalTokens += tokensUsed;
      } catch (error) {
        results.failed++;
        results.errors.push(`${doc.path}: ${error}`);
      }
    }

    functions.logger.info("Indexing complete:", results);

    return results;
  });

/**
 * Reindex a single document
 */
export const reindexDocument = functions.https.onCall(async (data, context) => {
  if (!context.auth?.token.admin) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Admin access required",
    );
  }

  const { path, content, title, category } = data;

  if (!path || !content) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "path and content are required",
    );
  }

  const result = await indexDocumentInternal(path, content, {
    title,
    category,
  });

  return result;
});

/**
 * Delete document from index
 */
export const deleteFromIndex = functions.https.onCall(async (data, context) => {
  if (!context.auth?.token.admin) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Admin access required",
    );
  }

  const { docId } = data;

  if (!docId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "docId is required",
    );
  }

  // Delete chunks
  const chunks = await db
    .collection("doc_embeddings")
    .where("docId", "==", docId)
    .get();

  const batch = db.batch();
  chunks.docs.forEach((doc) => batch.delete(doc.ref));

  // Delete metadata
  const metaRef = db.collection("doc_metadata").doc(hashString(docId));
  batch.delete(metaRef);

  await batch.commit();

  return { deleted: chunks.size };
});

/**
 * Get index statistics
 */
export const getIndexStats = functions.https.onCall(async (_data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required",
    );
  }

  const chunksSnapshot = await db.collection("doc_embeddings").count().get();
  const docsSnapshot = await db.collection("doc_metadata").count().get();

  // Get category distribution
  const metaDocs = await db.collection("doc_metadata").get();
  const categories: Record<string, number> = {};

  metaDocs.docs.forEach((doc) => {
    const category = doc.data().category || "general";
    categories[category] = (categories[category] || 0) + 1;
  });

  return {
    totalChunks: chunksSnapshot.data().count,
    totalDocuments: docsSnapshot.data().count,
    categories,
  };
});
