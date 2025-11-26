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
  title: "PhoenixRooivalk Docs",
  favicon: "img/favicon.ico",
  url: "https://docs-phoenixrooivalk.netlify.app",
  baseUrl: "/",
  organizationName: "JustAGhosT",
  projectName: "PhoenixRooivalk",
  onBrokenLinks: "warn",
  onBrokenMarkdownLinks: "warn",
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
        {
          type: "doc",
          docId: "phoenix-rooivalk-documentation",
          position: "left",
          label: "Documentation",
        },
        {
          to: "/your-progress",
          label: "Your Progress",
          position: "left",
          className: "navbar__link--progress",
        },
        {
          type: "dropdown",
          label: "Executive",
          position: "left",
          items: [
            {
              label: "Executive Summary",
              to: "/docs/executive/executive-summary",
            },
            {
              label: "Global Strategy",
              to: "/docs/executive/global-strategy",
            },
          ],
        },
        {
          type: "dropdown",
          label: "Technical",
          position: "left",
          items: [
            {
              label: "Technical Architecture",
              to: "/docs/technical/technical-architecture",
            },
            {
              label: "System Architecture",
              to: "/docs/technical/system-architecture",
            },
          ],
        },
        {
          type: "dropdown",
          label: "Business",
          position: "left",
          items: [
            {
              label: "Market Analysis",
              to: "/docs/business/market-analysis",
            },
            {
              label: "Business Model",
              to: "/docs/business/business-model",
            },
          ],
        },
        {
          type: "dropdown",
          label: "Operations",
          position: "left",
          items: [
            {
              label: "Manufacturing Strategy",
              to: "/docs/operations/manufacturing-strategy",
            },
          ],
        },
        // Cross-link to marketing site
        ...(marketingUrl && marketingUrl !== "https://"
          ? [
              {
                href: marketingUrl,
                label: "Website",
                position: "right",
              } as const,
            ]
          : []),
        // GitHub repository links
        {
          type: "dropdown",
          label: "GitHub",
          position: "right",
          items: [
            {
              href: "https://github.com/JustAGhosT/PhoenixRooivalk",
              label: "PhoenixRooivalk",
            },
            {
              href: "https://github.com/justaghost/cognitive-mesh",
              label: "Cognitive Mesh",
            },
          ],
        },
        // Environment badge (build-time)
        {
          href: "https://github.com/JustAGhosT/PhoenixRooivalk/blob/main/ACCESS.md",
          label: "Request Access",
          position: "right",
        },
        ...(envBadge
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
    // Enhanced footer
    footer: {
      style: "dark",
      links: [
        {
          title: "Documentation",
          items: [
            {
              label: "Executive Summary",
              to: "/docs/executive/executive-summary",
            },
            {
              label: "Technical Architecture",
              to: "/docs/technical/technical-architecture",
            },
            {
              label: "Market Analysis",
              to: "/docs/business/market-analysis",
            },
          ],
        },
        {
          title: "Resources",
          items: [
            {
              label: "Your Progress",
              to: "/your-progress",
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
        {
          title: "Operations",
          items: [
            {
              label: "Manufacturing Strategy",
              to: "/docs/operations/manufacturing-strategy",
            },
            {
              label: "System Architecture",
              to: "/docs/technical/system-architecture",
            },
            {
              label: "Business Model",
              to: "/docs/business/business-model",
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
    // Enhanced prism theme
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ["rust", "bash", "json", "yaml"],
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
