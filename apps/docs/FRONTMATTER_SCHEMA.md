# Documentation Frontmatter Schema

This document defines the frontmatter metadata fields supported in Phoenix
Rooivalk documentation files.

## Overview

Phoenix Rooivalk documentation supports gamification and enhanced metadata
through frontmatter fields. These fields are validated by a remark plugin during
the build process and can be consumed by React components.

## Schema Definition

### Core Docusaurus Fields

```yaml
id: string # Unique identifier for the document
title: string # Page title
sidebar_label: string # Label shown in sidebar
description: string # Page description for SEO
```

### Gamification Fields

```yaml
difficulty: "beginner" | "intermediate" | "advanced" | "expert"
# Indicates the complexity level of the content

estimated_reading_time: number
# Reading time in minutes (must be positive integer)

points: number
# Gamification points awarded for reading (must be non-negative integer)

tags: string[]
# Array of tags for categorization
# Example: ["business", "counter-uas", "technical"]

prerequisites: string[]
# Array of document IDs that should be read first
# Example: ["executive-summary", "system-overview"]
```

## Validation

The `remarkDocMetadata` plugin validates frontmatter during the build process:

- **difficulty**: Must be one of: beginner, intermediate, advanced, expert
- **estimated_reading_time**: Must be a positive number
- **points**: Must be a non-negative number
- **tags**: Must be an array of strings
- **prerequisites**: Must be an array of strings (document IDs)

Invalid values will produce console warnings during build without failing the
build.

## Example

```markdown
---
id: cuas-sandbox-2026-application
title: CUAS Sandbox 2026 Application Draft
sidebar_label: CUAS 2026 Application
difficulty: intermediate
estimated_reading_time: 8
points: 15
tags:
  - business
  - counter-uas
prerequisites:
  - executive-summary
---

# Your Content Here
```

## TypeScript Types

TypeScript types are defined in `src/types/frontmatter.ts`:

```typescript
export interface DocFrontmatter {
  id?: string;
  title?: string;
  sidebar_label?: string;
  description?: string;
  difficulty?: "beginner" | "intermediate" | "advanced" | "expert";
  estimated_reading_time?: number;
  points?: number;
  tags?: string[];
  prerequisites?: string[];
}
```

## Component Integration

### DocMetadata Component

The `DocMetadata` component (`src/components/DocMetadata`) displays formatted
metadata:

- **Difficulty badge**: Color-coded badge with emoji
- **Reading time**: Estimated reading time with book emoji
- **Points**: Gamification points with star emoji
- **Tags**: Hashtag-style tags
- **Prerequisites**: List of prerequisite documents with links

### Usage in Components

```typescript
import { DocMetadata } from "@site/src/components/DocMetadata";
import type { DocFrontmatter } from "@site/src/types/frontmatter";

// In your component
<DocMetadata frontmatter={frontMatter as DocFrontmatter} />
```

## Configuration

The remark plugin is configured in `docusaurus.config.ts`:

```typescript
import { remarkDocMetadata } from "./src/plugins/remark-doc-metadata";

// ...
docs: {
  remarkPlugins: [remarkDocMetadata],
  // ...
}
```

## Future Enhancements

Potential future improvements:

1. **Automatic Reading Time**: Calculate reading time from word count
2. **Progress Tracking**: Store user progress through documentation
3. **Achievement System**: Award badges based on points earned
4. **Learning Paths**: Define structured learning paths using prerequisites
5. **Search Integration**: Filter by difficulty, tags, or points

## Related Files

- **Schema Types**: `src/types/frontmatter.ts`
- **Validation Plugin**: `src/plugins/remark-doc-metadata.ts`
- **Display Component**: `src/components/DocMetadata/`
- **MDX Integration**: `src/theme/MDXComponents.tsx`
- **Configuration**: `docusaurus.config.ts`

## Notes

- All gamification fields are optional
- The component gracefully handles missing metadata (won't render if no metadata
  present)
- Validation warnings don't fail the build to allow incremental adoption
- The schema can be extended in the future without breaking existing documents
