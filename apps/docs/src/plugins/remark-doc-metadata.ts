import type { Root } from "mdast";
import type { Transformer } from "unified";
import type { VFile } from "vfile";

interface VFileData {
  frontMatter?: Record<string, unknown>;
}

/**
 * Remark plugin that validates document frontmatter metadata
 * and provides console warnings for invalid values
 */
export function remarkDocMetadata(): Transformer<Root> {
  return (tree: Root, file: VFile) => {
    // Access frontmatter through vfile
    const frontmatter = (file.data as VFileData).frontMatter;

    if (!frontmatter) {
      return;
    }

    // Validate difficulty field
    if (frontmatter.difficulty) {
      const validDifficulties = [
        "beginner",
        "intermediate",
        "advanced",
        "expert",
      ];
      if (typeof frontmatter.difficulty !== "string") {
        console.warn(
          `[Doc Metadata] Invalid difficulty type in ${file.path}. Must be a string.`,
        );
      } else if (!validDifficulties.includes(frontmatter.difficulty)) {
        console.warn(
          `[Doc Metadata] Invalid difficulty level "${frontmatter.difficulty}" in ${file.path}. Must be one of: ${validDifficulties.join(", ")}`,
        );
      }
    }

    // Validate estimated_reading_time
    if (frontmatter.estimated_reading_time !== undefined) {
      if (
        typeof frontmatter.estimated_reading_time !== "number" ||
        frontmatter.estimated_reading_time < 1
      ) {
        console.warn(
          `[Doc Metadata] Invalid estimated_reading_time "${frontmatter.estimated_reading_time}" in ${file.path}. Must be a positive number.`,
        );
      }
    }

    // Validate points
    if (frontmatter.points !== undefined) {
      if (typeof frontmatter.points !== "number" || frontmatter.points < 0) {
        console.warn(
          `[Doc Metadata] Invalid points "${frontmatter.points}" in ${file.path}. Must be a non-negative number.`,
        );
      }
    }

    // Validate tags array
    if (frontmatter.tags && !Array.isArray(frontmatter.tags)) {
      console.warn(
        `[Doc Metadata] Invalid tags in ${file.path}. Tags must be an array of strings.`,
      );
    }

    // Validate prerequisites array
    if (
      frontmatter.prerequisites &&
      !Array.isArray(frontmatter.prerequisites)
    ) {
      console.warn(
        `[Doc Metadata] Invalid prerequisites in ${file.path}. Prerequisites must be an array of strings.`,
      );
    }

    // Optional: Log successful validation (disabled by default to reduce build verbosity)
    // Uncomment for debugging:
    // if (frontmatter.difficulty || frontmatter.estimated_reading_time || frontmatter.points) {
    //   console.log(`[Doc Metadata] ✓ Validated metadata for ${file.path?.split("/").pop() || "document"}`);
    // }
  };
}
