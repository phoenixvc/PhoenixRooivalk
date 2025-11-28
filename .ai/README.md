# AI IDE Assistant Rules

This directory contains configuration files for AI-powered IDE assistants.

## Files

- **continuerules** — Rules and context for Continue IDE extension
- **cursorrules** — Rules and context for Cursor IDE
- **windsurfrules** — Rules and context for Windsurf IDE

## Purpose

These files provide project-specific instructions and context to AI assistants, helping them:
- Understand the project structure and architecture
- Follow coding standards and best practices
- Make appropriate suggestions for this specific codebase
- Maintain consistency with existing patterns

## Usage

AI IDE assistants automatically detect and use these files when they exist in the repository. No manual configuration is required.

## Editing

When updating these files:
1. Keep instructions clear and specific
2. Include relevant project structure information
3. Document coding standards and conventions
4. Update when project architecture changes significantly

## Architecture Decision Records (ADRs)

All AI assistants are instructed to reference the ADR template when creating or restructuring ADRs:

```
apps/docs/docs/technical/architecture/adr-0000-template-and-guide.md
```

This ensures consistent ADR structure across all contributors (human and AI).
