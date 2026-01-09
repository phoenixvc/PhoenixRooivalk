/**
 * Sidebar Phase Enricher Plugin
 *
 * This plugin enriches sidebar items with phase metadata from doc frontmatter.
 * It creates a mapping of docId -> phases that can be used by the
 * swizzled DocSidebarItem component.
 */

import type { LoadContext, Plugin } from "@docusaurus/types";
import type { PluginOptions } from "@docusaurus/plugin-content-docs";
import * as fs from "fs";
import * as path from "path";

// Phase type definition
type Phase = "seed" | "series-a" | "series-b" | "series-c" | "scale";

interface DocPhaseMap {
  [docId: string]: Phase[];
}

/**
 * Extract frontmatter from markdown/mdx content
 */
function extractFrontmatter(content: string): Record<string, unknown> | null {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    return null;
  }

  const frontmatterText = frontmatterMatch[1];
  const frontmatter: Record<string, unknown> = {};

  // Simple YAML parsing for phase field
  const lines = frontmatterText.split("\n");
  let currentKey = "";
  let isInArray = false;
  let arrayValues: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Check for array item
    if (trimmed.startsWith("- ") && isInArray) {
      arrayValues.push(
        trimmed
          .slice(2)
          .trim()
          .replace(/^["']|["']$/g, ""),
      );
      continue;
    }

    // Check for key-value pair
    const kvMatch = trimmed.match(/^(\w+):\s*(.*)/);
    if (kvMatch) {
      // Save previous array if any
      if (isInArray && currentKey) {
        frontmatter[currentKey] = arrayValues;
        arrayValues = [];
        isInArray = false;
      }

      const [, key, value] = kvMatch;
      currentKey = key;

      if (!value) {
        // Start of array
        isInArray = true;
      } else if (value.startsWith("[") && value.endsWith("]")) {
        // Inline array
        const items = value
          .slice(1, -1)
          .split(",")
          .map((s) => s.trim().replace(/^["']|["']$/g, ""));
        frontmatter[key] = items;
      } else {
        frontmatter[key] = value.replace(/^["']|["']$/g, "");
      }
    }
  }

  // Save final array if any
  if (isInArray && currentKey) {
    frontmatter[currentKey] = arrayValues;
  }

  return frontmatter;
}

/**
 * Scan docs directory and build phase map
 */
function buildPhaseMap(docsDir: string): DocPhaseMap {
  const phaseMap: DocPhaseMap = {};

  function scanDirectory(dir: string, prefix: string = "") {
    if (!fs.existsSync(dir)) {
      return;
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        scanDirectory(fullPath, `${prefix}${entry.name}/`);
      } else if (entry.name.endsWith(".md") || entry.name.endsWith(".mdx")) {
        try {
          const content = fs.readFileSync(fullPath, "utf-8");
          const frontmatter = extractFrontmatter(content);

          if (frontmatter) {
            // Get docId from frontmatter or filename
            const docId =
              (frontmatter.id as string) ||
              `${prefix}${entry.name.replace(/\.(md|mdx)$/, "")}`;

            // Get phase array
            const phase = frontmatter.phase;
            if (Array.isArray(phase) && phase.length > 0) {
              phaseMap[docId] = phase as Phase[];
            }
          }
        } catch (error) {
          // Ignore read errors
        }
      }
    }
  }

  scanDirectory(docsDir);
  return phaseMap;
}

/**
 * Plugin that generates phase metadata for sidebar items
 */
export default function sidebarPhaseEnricherPlugin(
  context: LoadContext,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _options: PluginOptions,
): Plugin {
  return {
    name: "sidebar-phase-enricher",

    async contentLoaded({ actions }) {
      const { setGlobalData } = actions;

      // Build phase map from docs directory
      const docsDir = path.join(context.siteDir, "docs");
      const phaseMap = buildPhaseMap(docsDir);

      // Store in global data for client-side access
      setGlobalData({ phaseMap });
    },
  };
}
