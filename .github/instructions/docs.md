---
patterns:
  - apps/docs/**
---

# Documentation Site Instructions

This Docusaurus application hosts comprehensive technical, business, and operations documentation.

## Technology Stack

- **Framework**: Docusaurus (static site generator)
- **Language**: Markdown with MDX support
- **Styling**: CSS Modules + Custom CSS
- **Plugins**: Search, versions, internationalization ready

## Development Commands

```bash
# Start development server (port 3000)
pnpm --filter docs start

# Build static site
pnpm --filter docs build

# Serve production build locally
pnpm --filter docs serve
```

## Documentation Structure

```
apps/docs/docs/
├── executive/          # Executive summaries and pitch materials
├── business/           # Business plans and market analysis
├── technical/          # Technical architecture and specifications
│   ├── architecture/   # ADRs and system design
│   ├── api/           # API documentation
│   └── deployment/    # Deployment guides
├── legal/             # Legal and compliance
├── operations/        # Operations manuals
└── funding/           # Funding opportunities
```

## Content Guidelines

### Documentation Standards

1. **Clear Headings** - Use hierarchical heading structure (H1 → H6)
2. **Code Examples** - Include runnable examples with proper syntax highlighting
3. **Diagrams** - Use Mermaid diagrams for architecture and flows
4. **Cross-References** - Link related documentation
5. **Version Information** - Note when features were added/changed

### Markdown Style
```markdown
# Page Title (H1 - only one per page)

Brief introduction paragraph.

## Main Section (H2)

Content with **bold** and *italic* emphasis.

### Subsection (H3)

- Bullet points
- With clear items
- In logical order

#### Details (H4)

Detailed content...

## Code Examples

\`\`\`typescript
// TypeScript example
function example(): void {
  console.log('Example');
}
\`\`\`

## Diagrams

\`\`\`mermaid
graph TD
    A[Start] --> B[Process]
    B --> C[End]
\`\`\`
```

### Writing Style

1. **Be Concise** - Get to the point quickly
2. **Be Specific** - Use concrete examples
3. **Be Clear** - Avoid jargon unless defined
4. **Be Consistent** - Follow existing patterns
5. **Be Complete** - Provide full context

### Target Audiences

- **Executive** - High-level summaries, business value, ROI
- **Business** - Market analysis, competitive landscape, strategy
- **Technical** - Architecture, API specs, implementation details
- **Operations** - Deployment guides, runbooks, troubleshooting
- **Legal** - Compliance, licensing, regulatory frameworks

## Architecture Decision Records (ADRs)

### Template Location
Always reference: `apps/docs/docs/technical/architecture/adr-0000-template-and-guide.md`

### ADR Structure
```markdown
# ADR-XXXX: Title

**Status**: [Proposed | Accepted | Deprecated | Superseded]  
**Date**: YYYY-MM-DD  
**Deciders**: [Names]  
**Technical Story**: [Link to issue/PR]

## Executive Summary

**Problem**: One sentence problem statement
**Decision**: One sentence decision
**Trade-off**: One sentence key trade-off

## Context and Problem Statement

[Detailed context...]

## Decision Drivers

- [Driver 1]
- [Driver 2]

## Considered Options

1. Option 1
2. Option 2
3. Option 3

## Decision Outcome

Chosen option: "[option]", because [justification].

### Positive Consequences

- [Benefit 1]
- [Benefit 2]

### Negative Consequences

- [Drawback 1]
- [Drawback 2]

## Pros and Cons of the Options

### Option 1
- **Good**, because [reason]
- **Bad**, because [reason]
- **Neutral**, if [circumstance]

[Repeat for other options]

## Links

- [Related ADR](link)
- [Reference](link)
```

### ADR Numbering

- **0001-0099**: Core System Architecture
- **0100-0199**: Security & Compliance
- **0200-0299**: Blockchain & Evidence
- **0300-0399**: AI/ML Architecture
- **D001-D999**: Development Decisions

## MDX Features

### Custom Components
```mdx
import { Callout } from '@site/src/components/Callout';

<Callout type="warning">
  This is an important warning message.
</Callout>
```

### Admonitions
```markdown
:::note
This is a note.
:::

:::tip
This is a tip.
:::

:::warning
This is a warning.
:::

:::danger
This is a danger alert.
:::

:::info
This is an info box.
:::
```

## Navigation and Sidebars

### Sidebar Configuration
Edit `apps/docs/sidebars.js` to manage navigation structure.

### Frontmatter
```markdown
---
sidebar_position: 1
title: Custom Page Title
description: Page description for SEO
keywords: [keyword1, keyword2]
---
```

## Assets and Media

### Images
- Store in `apps/docs/static/img/`
- Reference with `/img/filename.png`
- Use descriptive alt text
- Optimize file sizes (WebP preferred)

### Downloads
- Store in `apps/docs/static/downloads/`
- Link with `/downloads/filename.pdf`

## Build and Deploy

- **Build Output**: `apps/docs/build/` (static files)
- **Deploy Target**: Netlify
- **Build Command**: `pnpm -C apps/docs build`
- **Environment Variables**: Set in Netlify dashboard
  - `MARKETING_URL` - URL to marketing site (build-time)

## Quality Checks

Before committing documentation:

- [ ] Spelling checked (cspell)
- [ ] Markdown linted (markdownlint)
- [ ] Links verified (broken links check)
- [ ] Code examples tested
- [ ] Build succeeds locally
- [ ] Navigation structure updated if needed

## Common Issues

1. **Broken Links** - Use relative paths, avoid hardcoded URLs
2. **Image Loading** - Check file paths and case sensitivity
3. **Build Failures** - Check MDX syntax, frontmatter validity
4. **Search Not Working** - Rebuild search index

## Special Considerations

- **Sensitive Information** - Some docs contain restricted content
- **Access Control** - Partner-only content clearly marked
- **Export Compliance** - Technical specs may have export restrictions
- **Version Management** - Use Docusaurus versioning for major releases
