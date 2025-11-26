import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";
import * as React from "react";

import "../css/docs-landing.css";

interface CategoryLink {
  label: string;
  to: string;
}

interface Category {
  emoji: string;
  title: string;
  description: string;
  links: CategoryLink[];
  color: string;
}

export default function DocsLanding(): React.ReactElement {
  const categories: Category[] = [
    {
      emoji: "📊",
      title: "Executive",
      description:
        "High-level overviews, strategy, and business value for leadership and investors",
      links: [
        { label: "Executive Summary", to: "/docs/executive/executive-summary" },
        { label: "Global Strategy", to: "/docs/executive/global-strategy" },
        { label: "System Overview", to: "/docs/executive/system-overview" },
      ],
      color: "from-orange-500 to-amber-500",
    },
    {
      emoji: "💻",
      title: "Software & AI Technical",
      description:
        "Software architecture, AI/ML systems, blockchain, and integration",
      links: [
        {
          label: "Technical Architecture",
          to: "/docs/technical/technical-architecture",
        },
        {
          label: "System Architecture",
          to: "/docs/technical/system-architecture",
        },
        { label: "AI Benefits", to: "/docs/technical/ai-benefits" },
        {
          label: "Blockchain Integration",
          to: "/docs/technical/blockchain-integration",
        },
      ],
      color: "from-blue-500 to-cyan-500",
    },
    {
      emoji: "🔧",
      title: "Mechanical & Hardware",
      description:
        "Physical design, mechanical engineering, hardware specs, and manufacturing",
      links: [
        {
          label: "Mechanical Design",
          to: "/docs/technical/mechanical/mechanical-design-records",
        },
        {
          label: "Hardware Foundation",
          to: "/docs/technical/hardware-foundation",
        },
        {
          label: "RKV-M Specifications",
          to: "/docs/technical/hardware/rkv-m-specifications",
        },
      ],
      color: "from-green-500 to-emerald-500",
    },
    {
      emoji: "💼",
      title: "Business",
      description:
        "Market analysis, business model, competitive landscape, and growth strategy",
      links: [
        { label: "Market Analysis", to: "/docs/business/market-analysis" },
        { label: "Business Model", to: "/docs/business/business-model" },
        {
          label: "Competitive Analysis",
          to: "/docs/business/competitive-analysis",
        },
      ],
      color: "from-purple-500 to-pink-500",
    },
    {
      emoji: "⚖️",
      title: "Legal & Compliance",
      description:
        "Regulatory framework, ITAR compliance, and legal requirements",
      links: [
        {
          label: "Compliance Framework",
          to: "/docs/legal/compliance-framework",
        },
        { label: "Legal Framework", to: "/docs/legal/legal-framework" },
      ],
      color: "from-red-500 to-rose-500",
    },
    {
      emoji: "🚀",
      title: "Operations",
      description:
        "Deployment, maintenance, training, and operational procedures",
      links: [
        {
          label: "Operations Manual",
          to: "/docs/operations/operations-manual",
        },
        {
          label: "Deployment Guide",
          to: "/docs/operations/deployment/deployment-guide",
        },
        {
          label: "Manufacturing Strategy",
          to: "/docs/operations/manufacturing-strategy",
        },
      ],
      color: "from-yellow-500 to-orange-500",
    },
  ];

  return (
    <Layout
      title="Documentation Home"
      description="Phoenix Rooivalk Counter-UAS System Documentation"
    >
      <main className="docs-landing">
        <div className="docs-container">
          <div className="docs-hero">
            <h1>Phoenix Rooivalk Documentation</h1>
            <p>
              Comprehensive documentation for the world's most advanced
              autonomous counter-UAS defense platform. Explore technical
              specifications, business insights, and operational guides.
            </p>
            <div
              className="search-prompt"
              role="note"
              aria-label="Search shortcut: Press Control K or Command K to search documentation"
            >
              <span aria-hidden="true">🔍</span>
              <span>Press</span>
              <kbd aria-label="Control key">Ctrl</kbd>
              <kbd aria-label="K key">K</kbd>
              <span>to search documentation</span>
            </div>
          </div>

          <div className="categories-grid">
            {categories.map((category) => (
              <div key={category.title} className="category-card">
                <div className="category-header">
                  <div className="category-emoji" aria-hidden="true">
                    {category.emoji}
                  </div>
                  <h2 className="category-title">{category.title}</h2>
                </div>
                <p className="category-description">{category.description}</p>
                <ul className="category-links">
                  {category.links.map((link) => (
                    <li key={link.to}>
                      <Link to={link.to} className="category-link">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="quick-links">
            <h2>Popular Resources</h2>
            <div className="quick-links-grid">
              <Link
                to="/docs/executive/executive-summary"
                className="quick-link-btn"
              >
                📊 Executive Summary
              </Link>
              <Link
                to="/docs/technical/technical-architecture"
                className="quick-link-btn"
              >
                💻 Technical Architecture
              </Link>
              <Link
                to="/docs/business/market-analysis"
                className="quick-link-btn"
              >
                💼 Market Analysis
              </Link>
              <Link to="/contact" className="quick-link-btn secondary">
                📧 Contact Us
              </Link>
              <Link to="/" className="quick-link-btn secondary">
                🏠 Back to Home
              </Link>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}
