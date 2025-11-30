/**
 * Indexing Service
 *
 * Business logic for document indexing and embedding generation.
 */

import * as crypto from "crypto";
import { generateEmbeddings } from "../lib/openai";
import { getContainer, queryDocuments, upsertDocument } from "../lib/cosmos";

/**
 * Document chunk for embedding storage
 */
export interface DocumentChunk {
  id: string;
  docId: string;
  title: string;
  section: string;
  content: string;
  category: string;
  url: string;
  embedding: number[];
  indexedAt: string;
  contentHash: string;
  chunkIndex: number;
  totalChunks: number;
}

/**
 * Document metadata
 */
export interface DocumentMetadata {
  id: string;
  docId: string;
  title: string;
  category: string;
  url: string;
  totalChunks: number;
  indexedAt: string;
  contentHash: string;
}

/**
 * Indexing result
 */
export interface IndexingResult {
  docId: string;
  chunksIndexed: number;
  status: "success" | "failed" | "skipped";
  error?: string;
}

/**
 * Indexing Service class
 */
export class IndexingService {
  /**
   * Generate content hash for change detection
   */
  generateContentHash(content: string): string {
    return crypto.createHash("sha256").update(content).digest("hex");
  }

  /**
   * Generate document ID from path
   */
  hashPath(path: string): string {
    return crypto.createHash("md5").update(path).digest("hex").slice(0, 12);
  }

  /**
   * Split text into chunks with overlap
   */
  chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      chunks.push(text.slice(start, end));
      start = end - overlap;
      if (start >= text.length - overlap) break;
    }

    return chunks;
  }

  /**
   * Extract sections from markdown content
   */
  extractSections(content: string): Array<{ heading: string; content: string }> {
    const sections: Array<{ heading: string; content: string }> = [];
    const lines = content.split("\n");

    let currentHeading = "Introduction";
    let currentContent: string[] = [];

    for (const line of lines) {
      const headingMatch = line.match(/^#{1,3}\s+(.+)$/);

      if (headingMatch) {
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
  async indexDocument(doc: {
    id: string;
    title: string;
    content: string;
    category?: string;
    url?: string;
  }): Promise<IndexingResult> {
    const sections = this.extractSections(doc.content);
    let chunksIndexed = 0;
    const contentHash = this.generateContentHash(doc.content);

    // Check if already indexed with same content
    const existing = await queryDocuments<DocumentMetadata>(
      "doc_metadata",
      "SELECT * FROM c WHERE c.docId = @docId",
      [{ name: "@docId", value: doc.id }],
    );

    if (existing.length > 0 && existing[0].contentHash === contentHash) {
      return { docId: doc.id, chunksIndexed: 0, status: "skipped" };
    }

    const totalChunks: DocumentChunk[] = [];

    for (const section of sections) {
      if (section.content.length < 50) continue;

      const chunks = this.chunkText(section.content);

      for (let i = 0; i < chunks.length; i++) {
        const chunkContent = chunks[i];
        const chunkId = `${doc.id}_${section.heading.toLowerCase().replace(/\s+/g, "-")}_${i}`;

        try {
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
            contentHash,
            chunkIndex: i,
            totalChunks: chunks.length,
          };

          totalChunks.push(chunk);
          chunksIndexed++;

          // Rate limit: wait between embeddings
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Failed to index chunk ${chunkId}:`, error);
        }
      }
    }

    // Save all chunks
    for (const chunk of totalChunks) {
      await upsertDocument("doc_embeddings", chunk);
    }

    // Save metadata
    await upsertDocument("doc_metadata", {
      id: doc.id,
      docId: doc.id,
      title: doc.title,
      category: doc.category || "general",
      url: doc.url || "",
      totalChunks: chunksIndexed,
      indexedAt: new Date().toISOString(),
      contentHash,
    });

    return { docId: doc.id, chunksIndexed, status: "success" };
  }

  /**
   * Index multiple documents
   */
  async indexDocuments(
    documents: Array<{
      id: string;
      title: string;
      content: string;
      category?: string;
      url?: string;
    }>,
  ): Promise<{
    totalChunks: number;
    results: IndexingResult[];
  }> {
    let totalChunks = 0;
    const results: IndexingResult[] = [];

    for (const doc of documents) {
      try {
        const result = await this.indexDocument(doc);
        totalChunks += result.chunksIndexed;
        results.push(result);
      } catch (error) {
        results.push({
          docId: doc.id,
          chunksIndexed: 0,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return { totalChunks, results };
  }

  /**
   * Delete document embeddings
   */
  async deleteDocumentEmbeddings(docId: string): Promise<number> {
    const container = getContainer("doc_embeddings");

    const chunks = await queryDocuments<{ id: string }>(
      "doc_embeddings",
      "SELECT c.id FROM c WHERE c.docId = @docId",
      [{ name: "@docId", value: docId }],
    );

    let deleted = 0;
    for (const chunk of chunks) {
      try {
        await container.item(chunk.id, chunk.id).delete();
        deleted++;
      } catch {
        // Ignore delete errors
      }
    }

    // Delete metadata
    try {
      const metadataContainer = getContainer("doc_metadata");
      await metadataContainer.item(docId, docId).delete();
    } catch {
      // Ignore
    }

    return deleted;
  }

  /**
   * Get indexing stats
   */
  async getStats(): Promise<{
    totalChunks: number;
    totalDocs: number;
    categories: string[];
  }> {
    const countResult = await queryDocuments<{ count: number }>(
      "doc_embeddings",
      "SELECT VALUE COUNT(1) FROM c",
    );

    const docsResult = await queryDocuments<{ docId: string }>(
      "doc_embeddings",
      "SELECT DISTINCT VALUE c.docId FROM c",
    );

    const categoriesResult = await queryDocuments<{ category: string }>(
      "doc_embeddings",
      "SELECT DISTINCT VALUE c.category FROM c",
    );

    return {
      totalChunks: (countResult as unknown as number[])[0] || 0,
      totalDocs: docsResult.length,
      categories: categoriesResult as unknown as string[],
    };
  }
}

/**
 * Singleton instance
 */
export const indexingService = new IndexingService();
