/**
 * Index Documents Function
 *
 * Generates embeddings for documentation and stores them in Cosmos DB.
 * This enables semantic search over the documentation.
 *
 * Can be triggered:
 * 1. Manually via HTTP POST with document content
 * 2. Via timer to reindex all docs
 * 3. Via webhook when docs are updated
 */

import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { getContainer, upsertDocument } from "../lib/cosmos";
import { generateEmbeddings } from "../lib/openai";
import { validateAuthHeader } from "../lib/auth";

interface DocumentChunk {
  id: string;
  docId: string;
  title: string;
  section: string;
  content: string;
  category: string;
  url: string;
  embedding: number[];
  indexedAt: string;
}

interface IndexRequest {
  documents: Array<{
    id: string;
    title: string;
    content: string;
    category?: string;
    url?: string;
  }>;
  chunkSize?: number;
  overlap?: number;
}

/**
 * Split text into chunks for embedding
 */
function chunkText(
  text: string,
  chunkSize: number = 1000,
  overlap: number = 200,
): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));

    // Move start, accounting for overlap
    start = end - overlap;
    if (start >= text.length - overlap) break;
  }

  return chunks;
}

/**
 * Extract sections from markdown content
 */
function extractSections(
  content: string,
): Array<{ heading: string; content: string }> {
  const sections: Array<{ heading: string; content: string }> = [];
  const lines = content.split("\n");

  let currentHeading = "Introduction";
  let currentContent: string[] = [];

  for (const line of lines) {
    const headingMatch = line.match(/^#{1,3}\s+(.+)$/);

    if (headingMatch) {
      // Save previous section
      if (currentContent.length > 0) {
        sections.push({
          heading: currentHeading,
          content: currentContent.join("\n").trim(),
        });
      }

      currentHeading = headingMatch[1];
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }

  // Save last section
  if (currentContent.length > 0) {
    sections.push({
      heading: currentHeading,
      content: currentContent.join("\n").trim(),
    });
  }

  return sections;
}

/**
 * Index a single document
 */
async function indexDocument(
  doc: IndexRequest["documents"][0],
  chunkSize: number,
  overlap: number,
  context: InvocationContext,
): Promise<number> {
  const sections = extractSections(doc.content);
  let chunksIndexed = 0;

  for (const section of sections) {
    if (section.content.length < 50) continue; // Skip tiny sections

    const chunks = chunkText(section.content, chunkSize, overlap);

    for (let i = 0; i < chunks.length; i++) {
      const chunkId = `${doc.id}_${section.heading.toLowerCase().replace(/\s+/g, "-")}_${i}`;
      const chunkContent = chunks[i];

      try {
        // Generate embedding
        const embedding = await generateEmbeddings(
          `${doc.title} - ${section.heading}\n\n${chunkContent}`,
        );

        const chunk: DocumentChunk = {
          id: chunkId,
          docId: doc.id,
          title: doc.title,
          section: section.heading,
          content: chunkContent,
          category: doc.category || "general",
          url: doc.url || "",
          embedding,
          indexedAt: new Date().toISOString(),
        };

        await upsertDocument("doc_embeddings", chunk);
        chunksIndexed++;

        context.log(`Indexed chunk: ${chunkId}`);
      } catch (error) {
        context.error(`Failed to index chunk ${chunkId}:`, error);
      }

      // Rate limit: wait 100ms between embeddings
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return chunksIndexed;
}

/**
 * HTTP handler for manual indexing
 */
async function httpHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  // Require admin authentication for indexing
  const authResult = await validateAuthHeader(
    request.headers.get("authorization"),
  );
  if (!authResult.valid) {
    return {
      status: 401,
      jsonBody: { error: "Unauthorized", code: "unauthenticated" },
    };
  }

  if (!authResult.isAdmin) {
    return {
      status: 403,
      jsonBody: { error: "Admin access required", code: "permission-denied" },
    };
  }

  try {
    const body = (await request.json()) as IndexRequest;
    const { documents, chunkSize = 1000, overlap = 200 } = body;

    if (!documents || !Array.isArray(documents)) {
      return {
        status: 400,
        jsonBody: {
          error: "documents array is required",
          code: "invalid-argument",
        },
      };
    }

    context.log(`Indexing ${documents.length} documents...`);

    let totalChunks = 0;
    const results: Array<{ docId: string; chunks: number; status: string }> =
      [];

    for (const doc of documents) {
      try {
        const chunks = await indexDocument(doc, chunkSize, overlap, context);
        totalChunks += chunks;
        results.push({ docId: doc.id, chunks, status: "success" });
      } catch (error) {
        context.error(`Failed to index doc ${doc.id}:`, error);
        results.push({ docId: doc.id, chunks: 0, status: "failed" });
      }
    }

    return {
      status: 200,
      jsonBody: {
        message: `Indexed ${totalChunks} chunks from ${documents.length} documents`,
        results,
      },
    };
  } catch (error) {
    context.error("Indexing error:", error);
    return {
      status: 500,
      jsonBody: { error: "Indexing failed", code: "internal" },
    };
  }
}

/**
 * Delete all embeddings for a document
 */
async function deleteDocumentEmbeddings(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const authResult = await validateAuthHeader(
    request.headers.get("authorization"),
  );
  if (!authResult.valid) {
    return { status: 401, jsonBody: { error: "Unauthorized" } };
  }

  if (!authResult.isAdmin) {
    return { status: 403, jsonBody: { error: "Admin access required" } };
  }

  try {
    const { docId } = (await request.json()) as { docId: string };

    if (!docId) {
      return { status: 400, jsonBody: { error: "docId is required" } };
    }

    const container = getContainer("doc_embeddings");

    // Query and delete all chunks for this doc
    const { resources } = await container.items
      .query({
        query: "SELECT c.id FROM c WHERE c.docId = @docId",
        parameters: [{ name: "@docId", value: docId }],
      })
      .fetchAll();

    let deleted = 0;
    for (const item of resources) {
      await container.item(item.id, item.id).delete();
      deleted++;
    }

    return {
      status: 200,
      jsonBody: { message: `Deleted ${deleted} chunks for document ${docId}` },
    };
  } catch (error) {
    context.error("Delete error:", error);
    return { status: 500, jsonBody: { error: "Delete failed" } };
  }
}

/**
 * Get indexing stats
 */
async function getStats(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    const container = await getContainer("doc_embeddings");

    // Get total count
    const { resources: countResult } = await container.items
      .query({ query: "SELECT VALUE COUNT(1) FROM c" })
      .fetchAll();

    // Get docs count
    const { resources: docsResult } = await container.items
      .query({ query: "SELECT DISTINCT VALUE c.docId FROM c" })
      .fetchAll();

    // Get categories
    const { resources: categoriesResult } = await container.items
      .query({ query: "SELECT DISTINCT VALUE c.category FROM c" })
      .fetchAll();

    return {
      status: 200,
      jsonBody: {
        totalChunks: countResult[0] || 0,
        totalDocs: docsResult.length,
        categories: categoriesResult,
      },
    };
  } catch (error) {
    context.error("Stats error:", error);
    return { status: 500, jsonBody: { error: "Failed to get stats" } };
  }
}

// Register endpoints
app.http("indexDocuments", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "index/documents",
  handler: httpHandler,
});

app.http("deleteDocumentIndex", {
  methods: ["DELETE"],
  authLevel: "anonymous",
  route: "index/documents",
  handler: deleteDocumentEmbeddings,
});

app.http("indexStats", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "index/stats",
  handler: getStats,
});
