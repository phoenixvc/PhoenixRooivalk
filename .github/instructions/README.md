# Path-Specific Copilot Instructions

This directory contains specialized instructions for GitHub Copilot coding agent that apply to specific paths in the repository.

## Overview

Path-specific instructions complement the main `.github/copilot-instructions.md` file by providing focused guidance for different areas of the codebase. These instructions are automatically applied when working on files matching the specified patterns.

## Instruction Files

### 📱 [marketing.md](./marketing.md)
**Patterns**: `apps/marketing/**`

Specialized instructions for the Next.js 14 marketing website:
- Next.js App Router patterns
- CSS Modules styling
- Accessibility requirements (WCAG AA+)
- Component architecture
- Performance optimization
- Static site generation

### 📚 [docs.md](./docs.md)
**Patterns**: `apps/docs/**`

Specialized instructions for the Docusaurus documentation site:
- Markdown/MDX writing guidelines
- Documentation structure and organization
- ADR (Architecture Decision Records) templates
- Diagrams and visual aids
- Navigation and sidebars
- Content quality standards

### 🦀 [rust.md](./rust.md)
**Patterns**: `crates/**`, `apps/api/**`, `apps/keeper/**`, `apps/evidence-cli/**`

Specialized instructions for Rust development:
- Rust coding conventions
- Error handling patterns
- Async programming with Tokio
- Blockchain integration
- Testing strategies
- Performance optimization
- Clippy configuration

## How Path-Specific Instructions Work

### Instruction Precedence
1. **Personal Instructions** (highest priority)
2. **Path-Specific Instructions** (this directory)
3. **Repository Instructions** (`.github/copilot-instructions.md`)
4. **Organization Instructions** (lowest priority)

### Pattern Matching
Instructions use YAML frontmatter to define which paths they apply to:

```yaml
---
patterns:
  - apps/marketing/**
  - packages/ui/**
---
```

Patterns use glob syntax:
- `**` matches any number of directories
- `*` matches any characters in a filename
- `?` matches a single character

### Multiple Matches
When multiple instruction files match a path, all applicable instructions are combined and applied.

## Creating New Instructions

To add instructions for a new area:

1. Create a new `.md` file in this directory
2. Add YAML frontmatter with `patterns:` array
3. Write clear, specific instructions for that area
4. Include:
   - Technology stack overview
   - Development commands
   - Coding standards
   - Common patterns
   - Testing guidelines
   - Common issues and solutions

### Template Structure

```markdown
---
patterns:
  - path/to/code/**
---

# Area Name Instructions

Brief description of what this area covers.

## Technology Stack

List key technologies and frameworks.

## Development Commands

\`\`\`bash
# Common commands
\`\`\`

## Coding Standards

Specific standards for this area.

## Examples

Concrete code examples showing best practices.

## Common Issues

Known problems and solutions.
```

## Best Practices

1. **Be Specific** - Focus on area-specific guidance, not general advice
2. **Provide Examples** - Show concrete code examples
3. **Keep Updated** - Update instructions when patterns change
4. **Avoid Conflicts** - Don't contradict main copilot-instructions.md
5. **Cross-Reference** - Link to related documentation

## Maintenance

### When to Update

Update path-specific instructions when:
- Adding new major features or patterns
- Technology stack changes (framework upgrades, new libraries)
- Coding standards evolve
- Common issues emerge
- Architecture decisions affect implementation patterns

### Review Checklist

Before committing changes:
- [ ] YAML frontmatter is valid
- [ ] Patterns match intended paths
- [ ] No conflicts with main instructions
- [ ] Examples are tested and accurate
- [ ] Links are valid
- [ ] Markdown is properly formatted

## Usage Examples

### Working on Marketing Component
When editing `apps/marketing/src/components/Hero.tsx`, Copilot will apply:
1. Main repository instructions (general project standards)
2. Marketing-specific instructions (Next.js, CSS Modules, accessibility)

### Writing Documentation
When editing `apps/docs/docs/technical/architecture/adr-0123-new-feature.md`, Copilot will apply:
1. Main repository instructions (general project standards)
2. Docs-specific instructions (ADR template, Markdown style, structure)

### Developing Rust Crate
When editing `crates/evidence/src/lib.rs`, Copilot will apply:
1. Main repository instructions (general project standards)
2. Rust-specific instructions (error handling, documentation, testing)

## Resources

- **Main Instructions**: [../.github/copilot-instructions.md](../copilot-instructions.md)
- **GitHub Copilot Best Practices**: https://gh.io/copilot-coding-agent-tips
- **Copilot Custom Instructions Guide**: https://docs.github.com/en/copilot/customizing-copilot/adding-custom-instructions-for-github-copilot

## Troubleshooting

### Instructions Not Applied
1. Check YAML frontmatter syntax
2. Verify pattern matches target path
3. Clear Copilot cache (restart IDE)
4. Check file naming (must be `.md`)

### Conflicting Instructions
1. Review instruction precedence
2. Check for contradicting guidance
3. Make path patterns more specific
4. Consolidate common guidance to main instructions

---

**Note**: These instructions enhance GitHub Copilot's understanding of your codebase. They work best when combined with clear issue descriptions and well-structured code.
