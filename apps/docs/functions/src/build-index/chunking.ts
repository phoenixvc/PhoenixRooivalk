/**
 * Document Chunking Utilities
 *
 * Handles parsing frontmatter and chunking documents for embedding generation.
 */

import * as crypto from "crypto";
import { BUILD_INDEX_CONFIG } from "./config";

/**
 * Generate content hash for change detection
 */
export function generateContentHash(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

/**
 * Generate consistent document ID from path
 */
export function hashPath(path: string): string {
  return crypto.createHash("md5").update(path).digest("hex").slice(0, 12);
}

/**
 * Parse frontmatter from markdown
 */
export function parseFrontmatter(content: string): {
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
export function chunkDocument(
  content: string,
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
 * Convert path to readable title
 */
export function pathToTitle(path: string): string {
  return path
    .replace(/^\/docs\//, "")
    .replace(/\//g, " > ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}
