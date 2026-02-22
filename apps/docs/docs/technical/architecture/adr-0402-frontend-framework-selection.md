---
id: adr-0402-frontend-framework-selection
title: "ADR 0402: Frontend Framework Selection — Next.js + Docusaurus"
sidebar_label: "ADR 0402: Frontend Frameworks"
difficulty: intermediate
estimated_reading_time: 5
points: 20
tags:
  - technical
  - architecture
  - infrastructure
  - frontend
prerequisites: []
---

# ADR 0402: Frontend Framework Selection — Next.js + Docusaurus

**Date**: 2026-02-22 **Status**: Accepted (Implemented)

---

## Executive Summary

1. **Problem**: The platform needs both a marketing website (SEO-optimized,
   interactive, product catalog) and a documentation portal (versioned docs,
   search, gamification, Azure AD authentication).
2. **Decision**: Use Next.js 16 with static export for the marketing site and
   Docusaurus 3 for the documentation portal. Each is a separate app in the
   monorepo with shared packages.
3. **Trade-off**: Two separate frontend frameworks increase build complexity
   but let each site optimize for its primary use case (marketing conversion
   vs. documentation readability).

---

## Context

Phoenix Rooivalk needs two distinct web experiences:

| Requirement          | Marketing Site          | Docs Portal             |
| -------------------- | ----------------------- | ----------------------- |
| Primary goal         | Conversion, SEO         | Onboarding, reference   |
| Content type         | Dynamic pages, products | Markdown docs, ADRs     |
| Authentication       | Email/localStorage      | Azure Entra ID (B2C)    |
| Deployment           | Azure Static Web Apps   | Azure Static Web Apps   |
| Search               | N/A                     | Local + Algolia ready   |
| Gamification         | N/A                     | Reading progress, points|

---

## Decision

### Marketing: Next.js 16 (Static Export)

- **Static export** (`output: "export"`) for Azure SWA compatibility
- **React 19** with Server Components for metadata generation
- **`suppressHydrationWarning`** on `<html>` for theme hydration (ThemeContext
  sets CSS vars client-side)
- **WASM integration** via iframe embedding of the threat simulator demo
- **Tailwind CSS 4.1** + CSS Modules for component styling

### Docs: Docusaurus 3

- **Markdown-first** with MDX support for interactive components
- **Custom plugins**: `remark-doc-metadata`, `sidebar-phase-enricher`,
  `docusaurus-rag-indexer`
- **Azure Functions backend** for comments, user profiles, gamification
- **Azure Entra ID** for authentication
- **PWA offline support** with Mermaid diagram rendering
- **Azure Cosmos DB** for comment storage

### Shared Packages

Both apps consume from the monorepo workspace:

- `@phoenix-rooivalk/types` — shared TypeScript types
- `@phoenix-rooivalk/ui` — shared React components and design tokens
- `@phoenix-rooivalk/utils` — shared utility functions

---

## Consequences

### Positive

- Marketing site optimized for SEO and conversion
- Docs site optimized for content authoring and search
- Shared packages prevent code duplication
- Independent deployment schedules

### Negative

- Two build pipelines to maintain
- Shared component changes require testing in both apps
- Different auth systems (localStorage vs Azure Entra)

---

## Change Log

| Date       | Change              | Author   |
| ---------- | ------------------- | -------- |
| 2026-02-22 | Initial ADR created | AI Agent |
