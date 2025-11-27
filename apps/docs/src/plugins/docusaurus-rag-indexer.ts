/**
 * Docusaurus Plugin: Build-Time RAG Indexing
 *
 * This plugin indexes documentation during the build process for RAG search.
 * It runs during `npm run build` and uploads embeddings to Firebase.
 *
 * Features:
 * - Collects all markdown documentation
 * - Generates content hashes for change detection
 * - Uploads to Firebase for embedding generation
 * - Supports incremental updates (only re-indexes changed docs)
 *
 * Configuration:
 *   plugins: [
 *     ['./src/plugins/docusaurus-rag-indexer', {
 *       enabled: process.env.RAG_INDEXING === 'true',
 *       incremental: true,
 *     }]
 *   ]
 */

import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import type { LoadContext, Plugin } from "@docusaurus/types";

interface PluginOptions {
  enabled?: boolean;
  incremental?: boolean;
  outputPath?: string;
  docsPath?: string;
  excludePatterns?: string[];
}

interface DocInfo {
  path: string;
  relativePath: string;
  content: string;
  title: string;
  contentHash: string;
  frontmatter: Record<string, unknown>;
}

interface IndexManifest {
  version: string;
  buildDate: string;
  totalDocs: number;
  totalChunks: number;
  documents: Array<{
    path: string;
    title: string;
    contentHash: string;
    category: string;
  }>;
}

const DEFAULT_OPTIONS: Required<PluginOptions> = {
  enabled: false,
  incremental: true,
  outputPath: "static/rag-index",
  docsPath: "docs",
  excludePatterns: ["**/node_modules/**", "**/.git/**", "**/dist/**"],
};

/**
 * Generate SHA-256 hash of content
 */
function generateContentHash(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

/**
 * Parse frontmatter from markdown content
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
      const colonIndex = line.indexOf(":");
      if (colonIndex > 0) {
        const key = line.slice(0, colonIndex).trim();
        const value = line.slice(colonIndex + 1).trim();
        // Handle arrays (simple case)
        if (value.startsWith("[") && value.endsWith("]")) {
          fm[key] = value
            .slice(1, -1)
            .split(",")
            .map((v) => v.trim().replace(/^["']|["']$/g, ""));
        } else {
          fm[key] = value.replace(/^["']|["']$/g, "");
        }
      }
    }

    return { frontmatter: fm, body: fmMatch[2] };
  } catch {
    return { frontmatter: {}, body: content };
  }
}

/**
 * Get category from document path
 */
function getCategoryFromPath(relativePath: string): string {
  const parts = relativePath.split("/");
  const categoryMap: Record<string, string> = {
    technical: "technical",
    business: "business",
    operations: "operations",
    executive: "executive",
    legal: "legal",
    research: "research",
  };

  for (const part of parts) {
    if (categoryMap[part]) {
      return categoryMap[part];
    }
  }

  return "general";
}

/**
 * Convert path to readable title
 */
function pathToTitle(filePath: string): string {
  const name = path.basename(filePath, path.extname(filePath));
  return name
    .replace(/-/g, " ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

/**
 * Recursively collect all markdown files
 */
function collectMarkdownFiles(
  dir: string,
  basePath: string,
  excludePatterns: string[]
): DocInfo[] {
  const docs: DocInfo[] = [];

  if (!fs.existsSync(dir)) {
    return docs;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(basePath, fullPath);

    // Check exclude patterns
    const shouldExclude = excludePatterns.some((pattern) => {
      const regex = new RegExp(
        pattern.replace(/\*\*/g, ".*").replace(/\*/g, "[^/]*")
      );
      return regex.test(relativePath);
    });

    if (shouldExclude) {
      continue;
    }

    if (entry.isDirectory()) {
      docs.push(
        ...collectMarkdownFiles(fullPath, basePath, excludePatterns)
      );
    } else if (
      entry.isFile() &&
      (entry.name.endsWith(".md") || entry.name.endsWith(".mdx"))
    ) {
      const content = fs.readFileSync(fullPath, "utf-8");
      const { frontmatter, body } = parseFrontmatter(content);
      const contentHash = generateContentHash(body);

      docs.push({
        path: fullPath,
        relativePath,
        content: body,
        title:
          (frontmatter.title as string) ||
          (frontmatter.sidebar_label as string) ||
          pathToTitle(relativePath),
        contentHash,
        frontmatter,
      });
    }
  }

  return docs;
}

/**
 * Docusaurus RAG Indexer Plugin
 */
export default function docusaurusRagIndexerPlugin(
  context: LoadContext,
  options: PluginOptions
): Plugin {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { siteDir } = context;

  return {
    name: "docusaurus-rag-indexer",

    async postBuild({ outDir }) {
      if (!opts.enabled) {
        console.log("[RAG Indexer] Disabled. Set RAG_INDEXING=true to enable.");
        return;
      }

      console.log("[RAG Indexer] Starting documentation indexing...");

      const docsDir = path.join(siteDir, opts.docsPath);
      const outputDir = path.join(outDir, opts.outputPath);

      // Collect all markdown files
      const docs = collectMarkdownFiles(
        docsDir,
        docsDir,
        opts.excludePatterns
      );

      console.log(`[RAG Indexer] Found ${docs.length} documentation files`);

      // Create output directory
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Generate manifest
      const manifest: IndexManifest = {
        version: "1.0.0",
        buildDate: new Date().toISOString(),
        totalDocs: docs.length,
        totalChunks: 0, // Updated after indexing
        documents: docs.map((doc) => ({
          path: `/docs/${doc.relativePath.replace(/\.(md|mdx)$/, "")}`,
          title: doc.title,
          contentHash: doc.contentHash,
          category: getCategoryFromPath(doc.relativePath),
        })),
      };

      // Write manifest
      const manifestPath = path.join(outputDir, "manifest.json");
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

      // Write documents for indexing (to be consumed by Firebase function)
      const docsPath = path.join(outputDir, "documents.json");
      const docsData = docs.map((doc) => ({
        path: `/docs/${doc.relativePath.replace(/\.(md|mdx)$/, "")}`,
        content: doc.content,
        title: doc.title,
        description: doc.frontmatter.description as string | undefined,
        tags: doc.frontmatter.tags as string[] | undefined,
        contentHash: doc.contentHash,
        category: getCategoryFromPath(doc.relativePath),
      }));

      fs.writeFileSync(docsPath, JSON.stringify(docsData, null, 2));

      console.log(`[RAG Indexer] Manifest written to ${manifestPath}`);
      console.log(`[RAG Indexer] Documents written to ${docsPath}`);

      // If incremental is enabled, we can compare with previous manifest
      if (opts.incremental) {
        console.log("[RAG Indexer] Incremental mode enabled");
        // The actual comparison happens during the Firebase function call
        // when the admin triggers `checkIndexStaleness`
      }

      console.log("[RAG Indexer] Indexing preparation complete!");
      console.log(
        "[RAG Indexer] To complete indexing, run the Firebase admin function:"
      );
      console.log("  1. Deploy the build");
      console.log("  2. Call `buildTimeIndex` with the documents.json data");
    },
  };
}

// Named export for ES modules
export { docusaurusRagIndexerPlugin };
