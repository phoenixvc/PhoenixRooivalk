---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
---

# TypeScript/JavaScript Coding Standards

- Strict mode TypeScript — avoid `any`, prefer `unknown` + type narrowing
- Functional components with hooks (no class components)
- Named exports preferred over default exports
- CSS Modules for component styling (dark tactical theme)
- WCAG AA+ accessibility: ARIA labels, keyboard navigation, 4.5:1 contrast
- ESLint security plugin enabled — no `dangerouslySetInnerHTML`, no `eval`
- Cross-package imports use workspace protocol:
  `"@phoenix-rooivalk/types": "workspace:*"`
- Path aliases: `@/*` maps to `./src/*` in marketing app
- Next.js marketing is static export (`output: "export"`) — no SSR, no API
  routes, no server components
- Docusaurus reads env vars at **build time** only — they get embedded into
  static JS bundles
