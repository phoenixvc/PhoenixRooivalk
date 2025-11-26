/**
 * Root Component Wrapper
 * Provides AuthContext to the entire Docusaurus application
 */

import React, { ReactNode } from "react";
import { AuthProvider } from "../contexts/AuthContext";

interface RootProps {
  children: ReactNode;
}

export default function Root({ children }: RootProps): React.ReactElement {
  return <AuthProvider>{children}</AuthProvider>;
}
