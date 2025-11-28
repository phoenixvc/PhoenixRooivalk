/**
 * Support Page
 *
 * Provides support resources, FAQs, and contact options.
 */

import Layout from "@theme/Layout";
import React from "react";
import { SupportPanel } from "../components/Support";

export default function SupportPage(): React.ReactElement {
  return (
    <Layout
      title="Support"
      description="Get help with Phoenix Rooivalk - FAQs, documentation, and contact our support team"
    >
      <main className="container margin-vert--lg">
        <SupportPanel showContactForm={true} />
      </main>
    </Layout>
  );
}
