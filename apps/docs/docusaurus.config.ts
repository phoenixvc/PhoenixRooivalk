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

// Allow override of broken links behavior via environment variable
// DOCUSAURUS_BROKEN_LINKS: 'warn' (default), 'throw' (fail build), 'ignore' (skip)
const onBrokenLinksConfig =
  (process.env.DOCUSAURUS_BROKEN_LINKS as
    | "ignore"
    | "log"
    | "warn"
    | "throw") || "warn";

const marketingUrl =
  process.env.MARKETING_URL || "https://phoenixrooivalk.netlify.app";

// Azure Entra ID configuration from environment variables (exposed to client via customFields)
const azureConfig = {
  tenantId: process.env.AZURE_ENTRA_TENANT_ID || "",
  clientId: process.env.AZURE_ENTRA_CLIENT_ID || "",
  authority: process.env.AZURE_ENTRA_AUTHORITY || "",
  redirectUri: process.env.AZURE_ENTRA_REDIRECT_URI || "",
  postLogoutRedirectUri: process.env.AZURE_ENTRA_POST_LOGOUT_REDIRECT_URI || "",
  scopes: process.env.AZURE_ENTRA_SCOPES || "openid profile email User.Read",
  functionsBaseUrl: process.env.AZURE_FUNCTIONS_BASE_URL || "",
  appInsightsConnectionString:
    process.env.AZURE_APP_INSIGHTS_CONNECTION_STRING || "",
};

// Cloud provider selection: 'azure' | 'offline'
const cloudProvider = process.env.CLOUD_PROVIDER || "azure";

const config: Config = {
  title: "Phoenix Rooivalk Documentation",
  tagline: "Autonomous Counter-UAS Defense Platform",
  favicon: "img/favicon.svg",
  url: "https://docs-phoenixrooivalk.netlify.app",
  baseUrl: "/",
  organizationName: "JustAGhosT",
  projectName: "PhoenixRooivalk",
  // Custom fields exposed to client-side code via useDocusaurusContext()
  customFields: {
    azureConfig,
    cloudProvider,
  },
  onBrokenLinks: onBrokenLinksConfig,
  // Note: onBrokenMarkdownLinks is deprecated in Docusaurus v4
  // It should be migrated to markdown.preprocessor in the future
  onBrokenMarkdownLinks: onBrokenLinksConfig,
  onBrokenAnchors: onBrokenLinksConfig,
  headTags: [
    // Prevent flash of unstyled content - set background immediately
    {
      tagName: "style",
      attributes: {
        type: "text/css",
      },
      innerHTML:
        "html,body,#__docusaurus{background-color:rgb(15,23,42)!important;min-height:100vh}",
    },
    // Apple touch icon for iOS
    {
      tagName: "link",
      attributes: {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href: "/img/apple-touch-icon.svg",
      },
    },
    // Theme color for browser chrome
    {
      tagName: "meta",
      attributes: {
        name: "theme-color",
        content: "#0f172a",
      },
    },
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
    format: "detect",
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
        // News - Industry updates
        {
          to: "/news",
          label: "News",
          position: "right",
          className: "navbar__link--news",
          "aria-label": "Industry news",
        },
        // Support - Help and FAQ
        {
          to: "/support",
          label: "Support",
          position: "right",
          className: "navbar__link--support",
          "aria-label": "Get help and support",
        },
        // Login link
        {
          to: "/login",
          label: "Login",
          position: "right",
          className: "navbar__link--login",
          "aria-label": "Sign in to your account",
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
    footer: {
      style: "dark",
      links: [
        {
          title: "PLATFORM",
          items: [
            { label: "Overview", to: "/docs/overview" },
            { label: "Features", to: "/docs/technical/technical-architecture" },
            { label: "Pricing", to: "/docs/business/roi-analysis" },
          ],
        },
        {
          title: "DOCUMENTATION",
          items: [
            { label: "Getting Started", to: "/docs/phoenix-rooivalk-documentation" },
            { label: "API Reference", to: "/docs/technical/integration/api-documentation" },
            { label: "Deployment Guide", to: "/docs/operations/deployment/deployment-guide" },
          ],
        },
        {
          title: "RESOURCES",
          items: [
            { label: "News", to: "/news" },
            { label: "Changelog", to: "/docs/resources/documentation-status" },
            { label: "Security and Compliance", to: "/docs/legal/compliance-framework" },
          ],
        },
        {
          title: "COMPANY",
          items: [
            { label: "About", href: "https://phoenixrooivalk.netlify.app" },
            { label: "Contact and Support", to: "/contact" },
            {
              label: "GitHub",
              href: "https://github.com/JustAGhosT/PhoenixRooivalk",
              className: "footer__link-social footer__link-github",
            },
            {
              label: "LinkedIn",
              href: "https://linkedin.com/company/phoenix-rooivalk",
              className: "footer__link-social footer__link-linkedin",
            },
            {
              label: "X / Twitter",
              href: "https://x.com/phoenixrooivalk",
              className: "footer__link-social footer__link-twitter",
            },
          ],
        },
      ],
      copyright: `© 2025 Phoenix Rooivalk. All rights reserved.`,
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
