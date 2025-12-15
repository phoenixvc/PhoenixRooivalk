/**
 * DocItem Content Wrapper
 *
 * Wraps document content with ProtectedContent component to enforce
 * authentication and show teaser mode for non-authenticated users.
 * ErrorBoundary ensures auth issues don't crash the documentation.
 * Also adds:
 * - InlineComments for Google Docs-style text selection commenting
 * - CommentSection at the bottom of each doc page
 */

import React from "react";
import Content from "@theme-original/DocItem/Content";
import type ContentType from "@theme/DocItem/Content";
import type { WrapperProps } from "@docusaurus/types";
import { useDoc } from "@docusaurus/plugin-content-docs/client";
import { ProtectedContent } from "../../../components/Auth";
import { ErrorBoundary } from "../../../components/ErrorBoundary";
import { CommentSection } from "../../../components/Comments";
import { InlineComments } from "../../../components/InlineComments";

type Props = WrapperProps<typeof ContentType>;

export default function ContentWrapper(props: Props): React.ReactElement {
  // Get document metadata for comments
  const { metadata } = useDoc();
  const pageId = metadata.id || metadata.slug || "";
  const pageTitle = metadata.title || "";

  return (
    <ErrorBoundary
      fallback={
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <h3>Unable to load content</h3>
          <p>Please refresh the page or try again later.</p>
        </div>
      }
    >
      <ProtectedContent>
        {/* Inline Comments - Google Docs style text selection */}
        <ErrorBoundary fallback={<Content {...props} />}>
          <InlineComments pageId={pageId} pageTitle={pageTitle}>
            <Content {...props} />
          </InlineComments>
        </ErrorBoundary>

        {/* Bottom Comments Section */}
        <ErrorBoundary
          fallback={
            <div
              style={{ padding: "1rem", textAlign: "center", color: "#666" }}
            >
              <p>Comments are temporarily unavailable.</p>
            </div>
          }
        >
          <CommentSection pageId={pageId} pageTitle={pageTitle} />
        </ErrorBoundary>
      </ProtectedContent>
    </ErrorBoundary>
  );
}
