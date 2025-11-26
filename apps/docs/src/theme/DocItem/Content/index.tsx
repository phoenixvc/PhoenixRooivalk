/**
 * DocItem Content Wrapper
 *
 * Wraps document content with ProtectedContent component to enforce
 * authentication and show teaser mode for non-authenticated users.
 */

import React from "react";
import Content from "@theme-original/DocItem/Content";
import type ContentType from "@theme/DocItem/Content";
import type { WrapperProps } from "@docusaurus/types";
import { ProtectedContent } from "../../../components/Auth";

type Props = WrapperProps<typeof ContentType>;

export default function ContentWrapper(props: Props): React.ReactElement {
  return (
    <ProtectedContent>
      <Content {...props} />
    </ProtectedContent>
  );
}
