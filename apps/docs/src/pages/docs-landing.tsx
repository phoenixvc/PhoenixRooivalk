import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";
import * as React from "react";

export default function DocsLanding(): React.ReactElement {
  const categories = [
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
      description: "Regulatory framework, ITAR compliance, and legal requirements",
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
      <style>{`
        .docs-landing {
          min-height: calc(100vh - 60px);
          background: linear-gradient(180deg, rgb(15, 23, 42) 0%, rgb(9, 10, 15) 100%);
          padding: 3rem 1.5rem;
          position: relative;
          overflow: hidden;
        }
        
        .docs-landing::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(249, 115, 22, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(249, 115, 22, 0.03) 1px, transparent 1px);
          background-size: 50px 50px;
          animation: grid-move 20s linear infinite;
          pointer-events: none;
        }
        
        @keyframes grid-move {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
        
        .docs-container {
          max-width: 1400px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }
        
        .docs-hero {
          text-align: center;
          margin-bottom: 4rem;
          animation: fade-in-up 0.8s ease-out;
        }
        
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .docs-hero h1 {
          font-size: 3.5rem;
          font-weight: 900;
          margin-bottom: 1rem;
          background: linear-gradient(135deg, rgb(249, 115, 22), rgb(251, 191, 36));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1.2;
        }
        
        .docs-hero p {
          font-size: 1.25rem;
          color: rgb(148, 163, 184);
          max-width: 800px;
          margin: 0 auto 2rem;
          line-height: 1.6;
        }
        
        .search-prompt {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: rgba(30, 41, 59, 0.8);
          border: 1px solid rgba(249, 115, 22, 0.3);
          border-radius: 8px;
          color: rgb(203, 213, 225);
          font-size: 0.95rem;
          backdrop-filter: blur(10px);
        }
        
        .search-prompt kbd {
          padding: 0.25rem 0.5rem;
          background: rgb(51, 65, 85);
          border-radius: 4px;
          font-size: 0.875rem;
          font-family: monospace;
        }
        
        .categories-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 2rem;
          margin-top: 2rem;
        }
        
        .category-card {
          background: rgba(30, 41, 59, 0.8);
          border: 1px solid rgba(51, 65, 85, 0.8);
          border-radius: 16px;
          padding: 2rem;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          backdrop-filter: blur(10px);
          animation: fade-in-up 0.8s ease-out;
          animation-fill-mode: both;
        }
        
        .category-card:nth-child(1) { animation-delay: 0.1s; }
        .category-card:nth-child(2) { animation-delay: 0.2s; }
        .category-card:nth-child(3) { animation-delay: 0.3s; }
        .category-card:nth-child(4) { animation-delay: 0.4s; }
        .category-card:nth-child(5) { animation-delay: 0.5s; }
        .category-card:nth-child(6) { animation-delay: 0.6s; }
        
        .category-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, var(--gradient-from), var(--gradient-to));
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .category-card:hover::before {
          opacity: 1;
        }
        
        .category-card:hover {
          transform: translateY(-8px);
          border-color: rgba(249, 115, 22, 0.5);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }
        
        .category-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        
        .category-emoji {
          font-size: 3rem;
          line-height: 1;
        }
        
        .category-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: rgb(242, 244, 246);
          margin: 0;
        }
        
        .category-description {
          color: rgb(148, 163, 184);
          margin-bottom: 1.5rem;
          line-height: 1.6;
        }
        
        .category-links {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .category-link {
          display: flex;
          align-items: center;
          padding: 0.75rem 1rem;
          background: rgba(15, 23, 42, 0.6);
          border-radius: 8px;
          color: rgb(203, 213, 225);
          text-decoration: none;
          transition: all 0.2s ease;
          border: 1px solid transparent;
        }
        
        .category-link::before {
          content: '→';
          margin-right: 0.5rem;
          color: rgb(249, 115, 22);
          transition: transform 0.2s ease;
        }
        
        .category-link:hover {
          background: rgba(249, 115, 22, 0.1);
          border-color: rgba(249, 115, 22, 0.3);
          color: rgb(249, 115, 22);
          text-decoration: none;
          transform: translateX(4px);
        }
        
        .category-link:hover::before {
          transform: translateX(4px);
        }
        
        .quick-links {
          margin-top: 4rem;
          padding: 2rem;
          background: rgba(30, 41, 59, 0.6);
          border: 1px solid rgba(51, 65, 85, 0.6);
          border-radius: 16px;
          text-align: center;
        }
        
        .quick-links h2 {
          font-size: 1.75rem;
          color: rgb(242, 244, 246);
          margin-bottom: 1.5rem;
        }
        
        .quick-links-grid {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 1rem;
        }
        
        .quick-link-btn {
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, rgb(249, 115, 22), rgb(251, 146, 60));
          color: rgb(15, 23, 42);
          border-radius: 8px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s ease;
          border: none;
        }
        
        .quick-link-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(249, 115, 22, 0.4);
          color: rgb(15, 23, 42);
          text-decoration: none;
        }
        
        .quick-link-btn.secondary {
          background: rgba(51, 65, 85, 0.8);
          color: rgb(203, 213, 225);
        }
        
        .quick-link-btn.secondary:hover {
          background: rgba(71, 85, 105, 0.8);
          color: rgb(242, 244, 246);
        }
        
        @media (max-width: 768px) {
          .docs-hero h1 {
            font-size: 2.5rem;
          }
          
          .docs-hero p {
            font-size: 1.1rem;
          }
          
          .categories-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
          
          .category-card {
            padding: 1.5rem;
          }
          
          .quick-links-grid {
            flex-direction: column;
            align-items: stretch;
          }
        }
        
        /* Gradient color variables for each card */
        .category-card:nth-child(1) {
          --gradient-from: rgb(249, 115, 22);
          --gradient-to: rgb(251, 191, 36);
        }
        .category-card:nth-child(2) {
          --gradient-from: rgb(59, 130, 246);
          --gradient-to: rgb(6, 182, 212);
        }
        .category-card:nth-child(3) {
          --gradient-from: rgb(34, 197, 94);
          --gradient-to: rgb(16, 185, 129);
        }
        .category-card:nth-child(4) {
          --gradient-from: rgb(168, 85, 247);
          --gradient-to: rgb(236, 72, 153);
        }
        .category-card:nth-child(5) {
          --gradient-from: rgb(239, 68, 68);
          --gradient-to: rgb(251, 113, 133);
        }
        .category-card:nth-child(6) {
          --gradient-from: rgb(234, 179, 8);
          --gradient-to: rgb(249, 115, 22);
        }
      `}</style>

      <main className="docs-landing">
        <div className="docs-container">
          <div className="docs-hero">
            <h1>Phoenix Rooivalk Documentation</h1>
            <p>
              Comprehensive documentation for the world's most advanced
              autonomous counter-UAS defense platform. Explore technical
              specifications, business insights, and operational guides.
            </p>
            <div className="search-prompt">
              <span>🔍</span>
              <span>Press</span>
              <kbd>Ctrl</kbd>
              <kbd>K</kbd>
              <span>to search documentation</span>
            </div>
          </div>

          <div className="categories-grid">
            {categories.map((category) => (
              <div key={category.title} className="category-card">
                <div className="category-header">
                  <div className="category-emoji">{category.emoji}</div>
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
