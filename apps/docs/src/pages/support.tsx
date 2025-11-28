/**
 * Support Page
 *
 * Provides support resources, FAQs, and contact options.
 */

import Layout from "@theme/Layout";
import React from "react";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { SupportPanel } from "../components/Support";

function SupportFallback(): React.ReactElement {
  return (
    <div className="support-error-fallback" style={{ textAlign: "center", padding: "2rem" }}>
      <h2>Unable to load support</h2>
      <p>We're having trouble loading the support center. Please try again later.</p>
      <p>
        For urgent inquiries, email us at{" "}
        <a href="mailto:support@phoenixrooivalk.com">support@phoenixrooivalk.com</a>
      </p>
      <button
        className="button button--primary"
        onClick={() => window.location.reload()}
      >
        Refresh Page
      </button>
    </div>
  );
}

export default function SupportPage(): React.ReactElement {
  return (
    <Layout
      title="Support"
      description="Get help with Phoenix Rooivalk - FAQs, documentation, and contact our support team"
    >
      <main className="container margin-vert--lg">
        <ErrorBoundary componentName="Support Center" fallback={<SupportFallback />}>
          <SupportPanel showContactForm={true} />
        </ErrorBoundary>
      </main>
    </Layout>
  );
}
