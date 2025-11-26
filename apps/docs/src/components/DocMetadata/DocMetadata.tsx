import React from "react";
import Link from "@docusaurus/Link";
import type { DocFrontmatter } from "../../types/frontmatter";
import { DIFFICULTY_CONFIG } from "../../types/frontmatter";
import styles from "./DocMetadata.module.css";

export interface DocMetadataProps {
  frontmatter: DocFrontmatter;
}

/**
 * Displays document metadata including difficulty, reading time, points, and prerequisites
 */
export const DocMetadata: React.FC<DocMetadataProps> = ({ frontmatter }) => {
  const { difficulty, estimated_reading_time, points, tags, prerequisites } =
    frontmatter;

  // Don't render if no metadata is present
  if (
    !difficulty &&
    !estimated_reading_time &&
    !points &&
    (!tags || tags.length === 0) &&
    (!prerequisites || prerequisites.length === 0)
  ) {
    return null;
  }

  return (
    <div
      className={styles.docMetadata}
      role="complementary"
      aria-label="Document metadata"
    >
      <div className={styles.metadataGrid}>
        {difficulty && (
          <div className={styles.metadataItem}>
            <span
              className={styles.difficultyBadge}
              style={{
                backgroundColor: DIFFICULTY_CONFIG[difficulty].color,
              }}
              aria-label={`Difficulty: ${DIFFICULTY_CONFIG[difficulty].label}`}
            >
              <span aria-hidden="true">
                {DIFFICULTY_CONFIG[difficulty].emoji}
              </span>
              <span>{DIFFICULTY_CONFIG[difficulty].label}</span>
            </span>
          </div>
        )}

        {estimated_reading_time && (
          <div className={styles.metadataItem}>
            <span
              className={styles.readingTime}
              aria-label={`Estimated reading time: ${estimated_reading_time} minutes`}
            >
              <span aria-hidden="true">📖</span>
              <span>{estimated_reading_time} min read</span>
            </span>
          </div>
        )}

        {points && (
          <div className={styles.metadataItem}>
            <span
              className={styles.points}
              aria-label={`Points awarded: ${points}`}
            >
              <span aria-hidden="true">⭐</span>
              <span>{points} points</span>
            </span>
          </div>
        )}
      </div>

      {tags && tags.length > 0 && (
        <div className={styles.tagsContainer} role="list" aria-label="Tags">
          {tags.map((tag) => (
            <span key={tag} className={styles.tag} role="listitem">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {prerequisites && prerequisites.length > 0 && (
        <div
          className={styles.prerequisites}
          role="region"
          aria-label="Prerequisites"
        >
          <strong>📋 Prerequisites:</strong>
          <ul>
            {prerequisites.map((prereq) => (
              <li key={prereq}>
                <Link to={`/docs/${prereq}`}>{prereq}</Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
