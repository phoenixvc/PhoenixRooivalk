/**
 * News Page
 *
 * Displays industry news with RAG-based retrieval and
 * personalization based on user profiles.
 */

import Layout from "@theme/Layout";
import React from "react";
import { NewsPanel } from "../components/News";

export default function NewsPage(): React.ReactElement {
  return (
    <Layout
      title="Industry News"
      description="Stay updated with the latest counter-drone and defense technology news, personalized for your role and interests"
    >
      <main className="container margin-vert--lg">
        <NewsPanel showTabs={true} defaultTab="feed" maxItems={20} />
      </main>
    </Layout>
  );
}
