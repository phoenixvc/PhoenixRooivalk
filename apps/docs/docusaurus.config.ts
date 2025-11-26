/* eslint-env node */
import { resolve } from "path";

import type * as Preset from "@docusaurus/preset-classic";
import type { Config } from "@docusaurus/types";
import { themes as prismThemes } from "prism-react-renderer";
import { remarkDocMetadata } from "./src/plugins/remark-doc-metadata";

// Node.js environment declarations
declare const process: {
  env: Record<string, string | undefined>;
};
declare const __dirname: string;

const envName =
  process.env.ENV_NAME ||
  process.env.DEPLOY_CONTEXT ||
  process.env.CONTEXT ||
  "local";
const envBranch =
  process.env.BRANCH ||
  process.env.GITHUB_HEAD_REF ||
  process.env.GITHUB_REF_NAME ||
  "";
const envBadge =
  envName === "production"
    ? "prod"
    : envBranch
      ? `${envName}:${envBranch}`
      : envName;
const envClass =
  envName === "production"
    ? "navbar-env-badge"
    : "navbar-env-badge navbar-env-badge--preview";

const marketingUrl =
  process.env.MARKETING_URL || "https://phoenixrooivalk.netlify.app";

const config: Config = {
  title: "Phoenix Rooivalk Documentation",
  tagline: "Autonomous Counter-UAS Defense Platform",
  favicon: "img/favicon.ico",
  url: "https://docs-phoenixrooivalk.netlify.app",
  baseUrl: "/",
  organizationName: "JustAGhosT",
  projectName: "PhoenixRooivalk",
  onBrokenLinks: "warn",
  onBrokenMarkdownLinks: "warn",
  headTags: [
    {
      tagName: "meta",
      attributes: {
        name: "keywords",
        content:
          "counter-drone, counter-UAS, autonomous defense, blockchain, security, drone interception, AI, machine learning",
      },
    },
    {
      tagName: "meta",
      attributes: {
        property: "og:type",
        content: "website",
      },
    },
    {
      tagName: "meta",
      attributes: {
        property: "og:title",
        content: "Phoenix Rooivalk - Autonomous Counter-UAS Defense Platform",
      },
    },
    {
      tagName: "meta",
      attributes: {
        property: "og:description",
        content:
          "Comprehensive documentation for the world's most advanced autonomous counter-UAS defense platform.",
      },
    },
    {
      tagName: "meta",
      attributes: {
        name: "twitter:card",
        content: "summary_large_image",
      },
    },
  ],
  markdown: {
    format: "md",
    mermaid: true,
  },
  themes: [
    "@docusaurus/theme-mermaid",
    [
      "@easyops-cn/docusaurus-search-local",
      {
        hashed: true,
        language: ["en"],
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
        docsRouteBasePath: "/docs",
        indexBlog: false,
        searchBarShortcutHint: true,
      },
    ],
  ],
  i18n: { defaultLocale: "en", locales: ["en"] },
  presets: [
    [
      "classic",
      {
        docs: {
          routeBasePath: "docs",
          sidebarPath: resolve(__dirname, "./sidebars.ts"),
          // Enable "Edit this page" links to GitHub
          editUrl:
            "https://github.com/JustAGhosT/PhoenixRooivalk/edit/main/apps/docs/",
          // Show last updated timestamps from git
          showLastUpdateTime: true,
          showLastUpdateAuthor: true,
          // Enable breadcrumbs for navigation
          breadcrumbs: true,
          remarkPlugins: [remarkDocMetadata],
          rehypePlugins: [],
        },
        blog: false,
        theme: { customCss: resolve(__dirname, "./src/css/custom.css") },
      } satisfies Preset.Options,
    ],
  ],
  themeConfig: {
    // Enhanced navbar with Phoenix Rooivalk branding
    navbar: {
      title: "Phoenix Rooivalk",
      logo: {
        alt: "Phoenix Rooivalk Logo",
        src: "img/logo.svg",
        srcDark: "img/logo.svg",
        width: 40,
        height: 40,
      },
      items: [
        // Primary navigation - Documentation home
        {
          type: "doc",
          docId: "phoenix-rooivalk-documentation",
          position: "left",
          label: "Documentation",
        },
        // Key audience-focused dropdowns (consolidated)
        {
          type: "dropdown",
          label: "For Investors",
          position: "left",
          items: [
            {
              label: "Executive Summary",
              to: "/docs/executive/executive-summary",
            },
            {
              label: "Investor Summary",
              to: "/docs/executive/investor-executive-summary",
            },
            {
              label: "Pitch Deck",
              to: "/docs/executive/phoenix-rooivalk-pitch-deck",
            },
            {
              label: "Market Analysis",
              to: "/docs/business/market-analysis",
            },
            {
              label: "ROI Analysis",
              to: "/docs/business/roi-analysis",
            },
          ],
        },
        {
          type: "dropdown",
          label: "For Engineers",
          position: "left",
          items: [
            {
              label: "Technical Architecture",
              to: "/docs/technical/technical-architecture",
            },
            {
              label: "API Documentation",
              to: "/docs/technical/integration/api-documentation",
            },
            {
              label: "Blockchain Architecture",
              to: "/docs/technical/blockchain/blockchain-architecture",
            },
            {
              label: "System Architecture",
              to: "/docs/technical/system-architecture",
            },
            {
              label: "Glossary",
              to: "/docs/technical/glossary",
            },
          ],
        },
        {
          type: "dropdown",
          label: "For Operations",
          position: "left",
          items: [
            {
              label: "Deployment Guide",
              to: "/docs/operations/deployment/deployment-guide",
            },
            {
              label: "Operations Manual",
              to: "/docs/operations/operations-manual",
            },
            {
              label: "Training Materials",
              to: "/docs/operations/training/training-materials",
            },
            {
              label: "Compliance Framework",
              to: "/docs/legal/compliance-framework",
            },
          ],
        },
        // GitHub repository link
        {
          href: "https://github.com/JustAGhosT/PhoenixRooivalk",
          label: "GitHub",
          position: "right",
          "aria-label": "GitHub repository",
        },
        // Environment badge (only show in non-production)
        ...(envBadge && envName !== "production"
          ? [
              {
                to: "#",
                label: envBadge,
                position: "right",
                className: envClass,
              } as const,
            ]
          : []),
      ],
    },
    // Enhanced footer with role-based navigation
    footer: {
      style: "dark",
      links: [
        {
          title: "For Executives",
          items: [
            {
              label: "Executive Summary",
              to: "/docs/executive/executive-summary",
            },
            {
              label: "Investor Summary",
              to: "/docs/executive/investor-executive-summary",
            },
            {
              label: "Market Analysis",
              to: "/docs/business/market-analysis",
            },
            {
              label: "ROI Analysis",
              to: "/docs/business/roi-analysis",
            },
          ],
        },
        {
          title: "For Engineers",
          items: [
            {
              label: "Technical Architecture",
              to: "/docs/technical/technical-architecture",
            },
            {
              label: "API Documentation",
              to: "/docs/technical/integration/api-documentation",
            },
            {
              label: "Blockchain Architecture",
              to: "/docs/technical/blockchain/blockchain-architecture",
            },
            {
              label: "Glossary",
              to: "/docs/technical/glossary",
            },
          ],
        },
        {
          title: "For Operations",
          items: [
            {
              label: "Deployment Guide",
              to: "/docs/operations/deployment/deployment-guide",
            },
            {
              label: "Operations Manual",
              to: "/docs/operations/operations-manual",
            },
            {
              label: "Training Materials",
              to: "/docs/operations/training/training-materials",
            },
            {
              label: "Compliance Framework",
              to: "/docs/legal/compliance-framework",
            },
          ],
        },
        {
          title: "Resources",
          items: [
            {
              label: "Main Website",
              href: "https://phoenixrooivalk.netlify.app",
            },
            {
              label: "Documentation Status",
              to: "/docs/resources/documentation-status",
            },
            {
              label: "Downloads",
              to: "/docs/resources/downloads",
            },
            {
              label: "GitHub Repository",
              href: "https://github.com/JustAGhosT/PhoenixRooivalk",
            },
            {
              label: "Request Access",
              href: "https://github.com/JustAGhosT/PhoenixRooivalk/blob/main/ACCESS.md",
            },
          ],
        },
      ],
      copyright: `© 2025 Phoenix Rooivalk. All rights reserved. Built with ❤️ for global defense security.`,
    },
    // Enhanced color mode
    colorMode: {
      defaultMode: "dark",
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    // Enhanced prism theme with additional languages
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: [
        "rust",
        "bash",
        "json",
        "yaml",
        "solidity",
        "hcl",
        "toml",
        "python",
        "typescript",
        "go",
      ],
    },
    // Enhanced announcement bar
    announcementBar: {
      id: "phoenix-rooivalk-announcement",
      content:
        "🚀 Phoenix Rooivalk: Revolutionary SAE Level 4 Autonomous Counter-UAS Defense Platform",
      backgroundColor: "rgb(249, 115, 22)",
      textColor: "rgb(15, 23, 42)",
      isCloseable: true,
    },
    // Enhanced table of contents
    tableOfContents: {
      minHeadingLevel: 2,
      maxHeadingLevel: 4,
    },
    // Enhanced docs
    docs: {
      sidebar: {
        hideable: true, // cspell:ignore hideable
        autoCollapseCategories: true,
      },
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
