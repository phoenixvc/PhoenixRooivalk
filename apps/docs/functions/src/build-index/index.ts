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

// Configuration and types
export {
  BUILD_INDEX_CONFIG,
  CATEGORY_MAP,
  DocumentInput,
  DocumentIndexResult,
  BuildIndexStatus,
  StalenessResult,
} from "./config";

// Chunking utilities
export {
  generateContentHash,
  hashPath,
  parseFrontmatter,
  chunkDocument,
  pathToTitle,
} from "./chunking";

// Indexer
export { hasContentChanged, indexDocument } from "./indexer";

// Cloud Functions
export {
  buildTimeIndex,
  getBuildIndexStatus,
  checkIndexStaleness,
} from "./functions";
