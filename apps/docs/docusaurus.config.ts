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

// Onboarding configuration
const onboardingConfig = {
  enableSkipSignup: process.env.ENABLE_SKIP_SIGNUP !== "false", // Default: true
  enableSkipProfileCompletion:
    process.env.ENABLE_SKIP_PROFILE_COMPLETION !== "false", // Default: true
  requireProfileDetails: process.env.REQUIRE_PROFILE_DETAILS === "true", // Default: false
};

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
    onboardingConfig,
  },
  onBrokenLinks: onBrokenLinksConfig,
  onBrokenAnchors: onBrokenLinksConfig,
  headTags: [
    // Prevent flash of unstyled content - respects user theme preference
    {
      tagName: "style",
      attributes: {
        type: "text/css",
      },
      innerHTML:
        "html,body,#__docusaurus{min-height:100vh;transition:background-color 0.2s ease}html[data-theme='dark'],html[data-theme='dark'] body{background-color:#0f172a!important}html[data-theme='light'],html[data-theme='light'] body{background-color:#ffffff!important}",
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
    // Theme color for browser chrome - dark mode
    {
      tagName: "meta",
      attributes: {
        name: "theme-color",
        media: "(prefers-color-scheme: dark)",
        content: "#0f172a",
      },
    },
    // Theme color for browser chrome - light mode
    {
      tagName: "meta",
      attributes: {
        name: "theme-color",
        media: "(prefers-color-scheme: light)",
        content: "#ffffff",
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
    hooks: {
      onBrokenMarkdownLinks: onBrokenLinksConfig,
    },
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
        // Calendar - Project timeline and deadlines
        {
          to: "/calendar",
          label: "Calendar",
          position: "right",
          className: "navbar__link--calendar",
          "aria-label": "Project calendar and deadlines",
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
            {
              label: "Overview",
              to: "/docs/overview",
            },
            {
              label: "Features",
              to: "/docs/technical/technical-architecture",
            },
            {
              label: "Pricing",
              to: "/docs/business/roi-analysis",
            },
          ],
        },
        {
          title: "DOCUMENTATION",
          items: [
            {
              label: "Getting Started",
              to: "/docs/phoenix-rooivalk-documentation",
            },
            {
              label: "API Reference",
              to: "/docs/technical/integration/api-documentation",
            },
            {
              label: "Deployment Guide",
              to: "/docs/operations/deployment/deployment-guide",
            },
          ],
        },
        {
          title: "RESOURCES",
          items: [
            {
              label: "News",
              to: "/news",
            },
            {
              label: "Changelog",
              to: "/docs/resources/documentation-status",
            },
            {
              label: "Security and Compliance",
              to: "/docs/legal/compliance-framework",
            },
          ],
        },
        {
          title: "COMPANY",
          items: [
            {
              label: "About",
              href: "https://phoenixrooivalk.netlify.app",
            },
            {
              label: "Contact and Support",
              to: "/contact",
            },
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
    // Color mode - Support both light and dark themes
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

  // Add custom webpack config to handle pptxgenjs node: protocol imports
  plugins: [
    function customWebpackPlugin() {
      return {
        name: "custom-webpack-plugin",
        configureWebpack(config, isServer) {
          if (isServer) {
            return {};
          }

          // Access webpack from the config
          const webpack = require("webpack");

          return {
            plugins: [
              // Replace node: protocol imports with empty modules
              new webpack.NormalModuleReplacementPlugin(
                /^node:/,
                (resource: { request: string; context?: string }) => {
                  resource.request = resource.request.replace(/^node:/, "");
                },
              ),
              // Provide process polyfill for client-side code
              new webpack.ProvidePlugin({
                process: require.resolve("process/browser.js"),
              }),
            ],
            resolve: {
              fallback: {
                process: require.resolve("process/browser.js"),
                crypto: false,
                fs: false,
                https: false,
                http: false,
                stream: false,
                zlib: false,
                url: false,
                buffer: false,
              },
            },
          };
        },
      };
    },
  ],
};

export default config;
