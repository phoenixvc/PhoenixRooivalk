/**
 * DocItem Content Wrapper
 *
 * Wraps document content with ProtectedContent component to enforce
 * authentication and show teaser mode for non-authenticated users.
 * ErrorBoundary ensures auth issues don't crash the documentation.
 */

import React from "react";
import Content from "@theme-original/DocItem/Content";
import type ContentType from "@theme/DocItem/Content";
import type { WrapperProps } from "@docusaurus/types";
import { ProtectedContent } from "../../../components/Auth";
import { ErrorBoundary } from "../../../components/ErrorBoundary";

type Props = WrapperProps<typeof ContentType>;

export default function ContentWrapper(props: Props): React.ReactElement {
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
        <Content {...props} />
      </ProtectedContent>
    </ErrorBoundary>
  );
}
