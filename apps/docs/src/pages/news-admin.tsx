/**
 * News Admin Page
 *
 * Admin interface for managing news ingestion, analytics,
 * and notification settings.
 */

import Layout from "@theme/Layout";
import React from "react";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { NewsAdminPanel } from "../components/News";

function AdminFallback(): React.ReactElement {
  return (
    <div style={{ textAlign: "center", padding: "2rem" }}>
      <h2>Unable to load admin panel</h2>
      <p>There was an error loading the news administration panel.</p>
      <button
        className="button button--primary"
        onClick={() => window.location.reload()}
      >
        Refresh Page
      </button>
    </div>
  );
}

export default function NewsAdminPage(): React.ReactElement {
  return (
    <Layout
      title="News Administration"
      description="Manage news ingestion, analytics, and notifications"
    >
      <main className="container margin-vert--lg">
        <ErrorBoundary componentName="News Admin" fallback={<AdminFallback />}>
          <NewsAdminPanel />
        </ErrorBoundary>
      </main>
    </Layout>
  );
}
