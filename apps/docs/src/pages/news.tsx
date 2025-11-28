/**
 * News Page
 *
 * Displays industry news with RAG-based retrieval and
 * personalization based on user profiles.
 */

import Layout from "@theme/Layout";
import React from "react";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { NewsPanel } from "../components/News";

function NewsFallback(): React.ReactElement {
  return (
    <div className="news-error-fallback" style={{ textAlign: "center", padding: "2rem" }}>
      <h2>Unable to load news</h2>
      <p>We're having trouble loading the news feed. Please try again later.</p>
      <button
        className="button button--primary"
        onClick={() => window.location.reload()}
      >
        Refresh Page
      </button>
    </div>
  );
}

export default function NewsPage(): React.ReactElement {
  return (
    <Layout
      title="Industry News"
      description="Stay updated with the latest counter-drone and defense technology news, personalized for your role and interests"
    >
      <main className="container margin-vert--lg">
        <ErrorBoundary componentName="News Feed" fallback={<NewsFallback />}>
          <NewsPanel showTabs={true} defaultTab="feed" maxItems={20} />
        </ErrorBoundary>
      </main>
    </Layout>
  );
}
